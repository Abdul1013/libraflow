"""
Recommendation Engine — Day 17 (enhanced)

Two-signal hybrid pipeline:
  Signal A — Collaborative Filtering (CF)
    Find users who share borrowed books with the current user (co-borrowers),
    then score books those users read but the current user hasn't.
    Weight: 60 % of final score when co-borrowers exist.

  Signal B — Category Popularity
    Books most borrowed system-wide in the user's favourite category.
    Weight: 40 % when blended with CF; 100 % cold-start fallback.

Cold-start: no history → globally most-borrowed books.
"""
from __future__ import annotations

from collections import Counter
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.recommendation import RecommendationRead
from app.models.transaction import Transaction


# ── Collaborative Filtering helper ────────────────────────────────────────────

async def _cf_scores(
    db: AsyncSession,
    borrowed_ids: set[UUID],
    user_id: UUID,
    fetch_limit: int,
) -> dict[UUID, int]:
    """
    Item-based CF: return {book_id: co_borrow_count} for books that
    co-borrowers read but the current user hasn't.
    """
    if not borrowed_ids:
        return {}

    # Users who share at least one borrowed book
    co_stmt = (
        select(Transaction.user_id)
        .where(Transaction.book_id.in_(list(borrowed_ids)))
        .where(Transaction.user_id != user_id)
        .distinct()
    )
    co_ids = [row.user_id for row in (await db.execute(co_stmt)).all()]

    if not co_ids:
        return {}

    # Count how often co-borrowers borrowed each unseen book
    freq_stmt = (
        select(Transaction.book_id, func.count(Transaction.id).label("co_count"))
        .where(Transaction.user_id.in_(co_ids))
        .where(Transaction.book_id.notin_(list(borrowed_ids)))
        .group_by(Transaction.book_id)
        .order_by(func.count(Transaction.id).desc())
        .limit(fetch_limit)
    )
    return {row.book_id: row.co_count for row in (await db.execute(freq_stmt)).all()}


# ── Public interface ──────────────────────────────────────────────────────────

async def get_recommendations(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 5,
) -> list[RecommendationRead]:
    # ── Step 1: borrow history ────────────────────────────────────────────────
    hist_rows = (await db.execute(
        select(Transaction.book_id, Book.category)
        .join(Book, Transaction.book_id == Book.id)
        .where(Transaction.user_id == user_id)
    )).all()

    borrowed_ids: set[UUID] = {r.book_id for r in hist_rows}

    fav_category: str | None = None
    if hist_rows:
        fav_category = Counter(r.category for r in hist_rows).most_common(1)[0][0]

    # ── Step 2: collaborative filtering signal ────────────────────────────────
    cf = await _cf_scores(db, borrowed_ids, user_id, limit * 4)

    if cf:
        # Fetch Book objects + global popularity for CF candidates
        pop_col = func.count(Transaction.id).label("pop_count")
        rows = (await db.execute(
            select(Book, pop_col)
            .outerjoin(Transaction, Transaction.book_id == Book.id)
            .where(Book.id.in_(list(cf.keys())))
            .group_by(Book.id)
        )).all()

        max_cf  = max(cf.values()) or 1
        max_pop = max((pop for _, pop in rows), default=1) or 1

        scored = sorted(
            [
                (book, pop, round(0.6 * (cf[book.id] / max_cf) + 0.4 * (pop / max_pop), 4))
                for book, pop in rows
            ],
            key=lambda x: x[2],
            reverse=True,
        )[:limit]

        return [
            RecommendationRead(
                **book.model_dump(),
                reason="Colleagues also borrowed",
                confidence=max(0.10, score),
                borrow_count=pop,
            )
            for book, pop, score in scored
        ]

    # ── Step 3: category-popularity fallback ─────────────────────────────────
    pop_col = func.count(Transaction.id).label("borrow_count")
    base = (
        select(Book, pop_col)
        .outerjoin(Transaction, Transaction.book_id == Book.id)
        .group_by(Book.id)
        .order_by(pop_col.desc())
        .limit(limit * 4)
    )
    if fav_category:
        base = base.where(func.lower(Book.category) == fav_category.lower())

    rows = (await db.execute(base)).all()
    candidates = [(b, c) for b, c in rows if b.id not in borrowed_ids][:limit]

    if not candidates:
        return []

    max_count = max(c for _, c in candidates) or 1
    reason = f"Popular in {fav_category}" if fav_category else "Most borrowed overall"

    return [
        RecommendationRead(
            **book.model_dump(),
            reason=reason,
            confidence=round(0.10 + 0.90 * (count / max_count), 4),
            borrow_count=count,
        )
        for book, count in candidates
    ]
