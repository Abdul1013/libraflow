from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import AnalyticsSummary, OverdueTrendPoint
from app.models.book import Book
from app.models.transaction import Transaction
from app.models.user import User


async def get_summary(db: AsyncSession) -> AnalyticsSummary:
    total_books   = await db.scalar(select(func.count(Book.id))) or 0
    active_loans  = await db.scalar(
        select(func.count(Transaction.id)).where(Transaction.status == "BORROWED")
    ) or 0
    overdue_count = await db.scalar(
        select(func.count(Transaction.id)).where(Transaction.status == "OVERDUE")
    ) or 0
    member_count  = await db.scalar(
        select(func.count(User.id)).where(User.is_active == True)  # noqa: E712
    ) or 0

    return AnalyticsSummary(
        total_books=total_books,
        active_loans=active_loans,
        overdue_count=overdue_count,
        member_count=member_count,
    )


async def get_overdue_trend(
    db: AsyncSession,
    days: int = 14,
) -> list[OverdueTrendPoint]:
    """
    Returns daily overdue counts for the last `days` days.
    Counts transactions whose status is OVERDUE and whose due_date
    falls within the window — each represents a day a book went overdue.
    """
    since = datetime.utcnow() - timedelta(days=days)

    stmt = (
        select(
            func.date(Transaction.due_date).label("day"),
            func.count(Transaction.id).label("count"),
        )
        .where(Transaction.status == "OVERDUE")
        .where(Transaction.due_date >= since)
        .group_by(func.date(Transaction.due_date))
        .order_by(func.date(Transaction.due_date))
    )
    rows = (await db.execute(stmt)).all()
    return [OverdueTrendPoint(date=str(row.day), count=row.count) for row in rows]
