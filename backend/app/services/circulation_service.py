from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.book import Book
from app.models.transaction import Transaction, TransactionCreate


async def borrow_book(
    db: AsyncSession,
    user_id: UUID,
    payload: TransactionCreate,
) -> Transaction:
    # Lock the book row to prevent race conditions on available_copies
    result = await db.execute(
        select(Book).where(Book.id == payload.book_id).with_for_update()
    )
    book = result.scalar_one_or_none()

    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    if book.available_copies <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No copies available — all copies are currently on loan",
        )

    # Check the user doesn't already have this book borrowed
    existing = await db.execute(
        select(Transaction).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.book_id == payload.book_id,
                Transaction.status == "BORROWED",
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active loan for this book",
        )

    # Atomic: decrement available_copies and create transaction
    book.available_copies -= 1
    transaction = Transaction(
        user_id=user_id,
        book_id=payload.book_id,
        due_date=payload.due_date,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction


async def return_book(
    db: AsyncSession,
    transaction_id: UUID,
    user_id: UUID,
) -> Transaction:
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id).with_for_update()
    )
    transaction = result.scalar_one_or_none()

    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if transaction.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your transaction")

    if transaction.status == "RETURNED":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Book already returned")

    # Lock and increment book copies
    book_result = await db.execute(
        select(Book).where(Book.id == transaction.book_id).with_for_update()
    )
    book = book_result.scalar_one_or_none()
    if book:
        book.available_copies = min(book.available_copies + 1, book.total_copies)

    transaction.returned_at = datetime.now(timezone.utc)
    transaction.status = "RETURNED"
    await db.commit()
    await db.refresh(transaction)
    return transaction


async def get_user_transactions(db: AsyncSession, user_id: UUID) -> list[Transaction]:
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.borrowed_at.desc())
    )
    return list(result.scalars().all())


async def get_all_transactions(
    db: AsyncSession,
    status_filter: Optional[str] = None,
) -> list[Transaction]:
    stmt = select(Transaction).order_by(Transaction.borrowed_at.desc())
    if status_filter:
        stmt = stmt.where(Transaction.status == status_filter.upper())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def mark_overdue(db: AsyncSession) -> int:
    """Update BORROWED transactions past due_date to OVERDUE. Returns count updated."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.status == "BORROWED", Transaction.due_date < now)
        )
    )
    overdue = result.scalars().all()
    for tx in overdue:
        tx.status = "OVERDUE"
    await db.commit()
    return len(overdue)
