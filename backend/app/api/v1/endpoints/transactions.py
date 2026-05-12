from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser, DBSession, LibrarianUser
from app.models.transaction import TransactionCreate, TransactionRead
from app.services.circulation_service import (
    borrow_book,
    get_all_transactions,
    get_user_transactions,
    mark_overdue,
    return_book,
)

router = APIRouter()


@router.get("", response_model=list[TransactionRead])
async def list_all_transactions(
    _: LibrarianUser,
    db: DBSession,
    status: Optional[str] = Query(default=None, description="Filter: BORROWED | RETURNED | OVERDUE"),
) -> list[TransactionRead]:
    txs = await get_all_transactions(db, status_filter=status)
    return [TransactionRead.model_validate(tx) for tx in txs]


@router.get("/me", response_model=list[TransactionRead])
async def my_transactions(current_user: CurrentUser, db: DBSession) -> list[TransactionRead]:
    txs = await get_user_transactions(db, current_user.id)
    return [TransactionRead.model_validate(tx) for tx in txs]


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def borrow(
    payload: TransactionCreate,
    current_user: CurrentUser,
    db: DBSession,
) -> TransactionRead:
    tx = await borrow_book(db, current_user.id, payload)
    return TransactionRead.model_validate(tx)


@router.patch("/{transaction_id}/return", response_model=TransactionRead)
async def return_borrowed_book(
    transaction_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
) -> TransactionRead:
    tx = await return_book(db, transaction_id, current_user.id)
    return TransactionRead.model_validate(tx)


@router.post("/admin/mark-overdue", status_code=status.HTTP_200_OK)
async def trigger_mark_overdue(_: LibrarianUser, db: DBSession) -> dict:
    count = await mark_overdue(db)
    return {"updated": count, "message": f"{count} transaction(s) marked as OVERDUE"}
