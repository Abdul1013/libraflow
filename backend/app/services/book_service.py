import re
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.book import Book, BookCreate, BookSearchResult, BookUpdate, TrendingBook
from app.models.transaction import Transaction
from app.services.search_service import fuzzy_rank, is_fuzzy_match


_ISBN_RE = re.compile(r"^(?:\d{9}[\dX]|\d{13})$")


def _normalise_isbn(isbn: str) -> str:
    return isbn.replace("-", "").replace(" ", "").upper()


def _validate_isbn(isbn: str) -> str:
    normalised = _normalise_isbn(isbn)
    if not _ISBN_RE.match(normalised):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"'{isbn}' is not a valid ISBN-10 or ISBN-13",
        )
    return normalised


async def get_books(
    db: AsyncSession,
    query: Optional[str] = None,
    category: Optional[str] = None,
) -> list[BookSearchResult]:
    """
    Hybrid search:
    - No query  → return all books sorted by title (catalogue mode).
    - With query → Stage 1 ILIKE pre-filter, then Stage 2 fuzzy re-rank
                   to catch typos that ILIKE misses entirely.
    """
    stmt = select(Book)

    if query:
        # Stage 1: broad DB pre-filter — intentionally permissive (1-char fuzzy window)
        q_db = f"%{query}%"
        stmt = stmt.where(
            or_(
                func.lower(Book.title).like(func.lower(q_db)),
                func.lower(Book.author).like(func.lower(q_db)),
                Book.isbn.like(q_db),
            )
        )

    if category:
        stmt = stmt.where(func.lower(Book.category) == category.lower())

    stmt = stmt.order_by(Book.title)
    db_result = await db.execute(stmt)
    candidates: list[Book] = list(db_result.scalars().all())

    if not query:
        # Catalogue mode — no scoring needed
        return [
            BookSearchResult.model_validate(b, from_attributes=True)
            for b in candidates
        ]

    # Stage 2: fuzzy re-rank on the ILIKE candidates
    ilike_scored = fuzzy_rank(candidates, query)
    ilike_ids    = {r.book.id for r in ilike_scored}

    # Stage 3: also score ALL books for typo recovery
    # (ILIKE misses "Algoritms" entirely; fuzzy catches it)
    all_result = await db.execute(select(Book).order_by(Book.title))
    all_books: list[Book] = list(all_result.scalars().all())
    typo_candidates = [b for b in all_books if b.id not in ilike_ids]
    typo_scored     = fuzzy_rank(typo_candidates, query)

    # Merge: ILIKE hits first (usually exact), then typo recoveries
    merged = ilike_scored + typo_scored
    merged.sort(key=lambda r: r.score, reverse=True)

    return [
        BookSearchResult(
            **r.book.model_dump(),
            score=r.score,
            match_field=r.match_field,
            is_fuzzy=is_fuzzy_match(r.score),
        )
        for r in merged
    ]


async def get_book(db: AsyncSession, book_id: UUID) -> Optional[Book]:
    result = await db.execute(select(Book).where(Book.id == book_id))
    return result.scalar_one_or_none()


async def create_book(db: AsyncSession, payload: BookCreate) -> Book:
    isbn = _validate_isbn(payload.isbn)

    existing = await db.execute(select(Book).where(Book.isbn == isbn))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A book with ISBN {isbn} already exists",
        )

    book = Book(
        **payload.model_dump(exclude={"isbn"}),
        isbn=isbn,
        available_copies=payload.total_copies,  # new book: all copies available
    )
    db.add(book)
    await db.commit()
    await db.refresh(book)
    return book


async def update_book(db: AsyncSession, book_id: UUID, data: BookUpdate) -> Optional[Book]:
    book = await get_book(db, book_id)
    if book is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    await db.commit()
    await db.refresh(book)
    return book


async def delete_book(db: AsyncSession, book_id: UUID) -> bool:
    book = await get_book(db, book_id)
    if book is None:
        return False
    await db.delete(book)
    await db.commit()
    return True


async def get_trending_books(
    db: AsyncSession,
    days: int = 30,
    limit: int = 5,
) -> list[TrendingBook]:
    """Books with the most borrows in the last `days` days."""
    since = datetime.utcnow() - timedelta(days=days)
    borrow_count_col = func.count(Transaction.id).label("borrow_count")

    stmt = (
        select(Book, borrow_count_col)
        .join(Transaction, Transaction.book_id == Book.id)
        .where(Transaction.borrowed_at >= since)
        .group_by(Book.id)
        .order_by(borrow_count_col.desc())
        .limit(limit)
    )
    rows = (await db.execute(stmt)).all()

    return [
        TrendingBook(**book.model_dump(), borrow_count=count, trend_period_days=days)
        for book, count in rows
    ]
