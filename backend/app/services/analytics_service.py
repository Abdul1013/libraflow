from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import AnalyticsSummary, BorrowingTrendPoint, CategoryStat, OverdueTrendPoint
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
    total_returned = await db.scalar(
        select(func.count(Transaction.id)).where(Transaction.status == "RETURNED")
    ) or 0
    month_start    = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    books_added_month = await db.scalar(
        select(func.count(Book.id))
    ) or 0  # Books table has no created_at; use total as proxy for now

    return AnalyticsSummary(
        total_books=total_books,
        active_loans=active_loans,
        overdue_count=overdue_count,
        member_count=member_count,
        total_returned=total_returned,
        books_added_month=books_added_month,
    )


async def get_borrowing_trend(
    db: AsyncSession,
    days: int = 30,
) -> list[BorrowingTrendPoint]:
    """Daily new borrow counts for the last `days` days."""
    since = datetime.utcnow() - timedelta(days=days)
    stmt = (
        select(
            func.date(Transaction.borrowed_at).label("day"),
            func.count(Transaction.id).label("count"),
        )
        .where(Transaction.borrowed_at >= since)
        .group_by(func.date(Transaction.borrowed_at))
        .order_by(func.date(Transaction.borrowed_at))
    )
    rows = (await db.execute(stmt)).all()
    return [BorrowingTrendPoint(date=str(row.day), count=row.count) for row in rows]


async def get_category_stats(db: AsyncSession) -> list[CategoryStat]:
    """Books per category + total loans per category."""
    book_stmt = (
        select(Book.category, func.count(Book.id).label("book_count"))
        .group_by(Book.category)
        .order_by(func.count(Book.id).desc())
    )
    book_rows = (await db.execute(book_stmt)).all()

    loan_stmt = (
        select(Book.category, func.count(Transaction.id).label("loan_count"))
        .join(Transaction, Transaction.book_id == Book.id)
        .group_by(Book.category)
    )
    loan_rows = {row.category: row.loan_count for row in (await db.execute(loan_stmt)).all()}

    return [
        CategoryStat(
            category=row.category,
            book_count=row.book_count,
            loan_count=loan_rows.get(row.category, 0),
        )
        for row in book_rows
    ]


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
