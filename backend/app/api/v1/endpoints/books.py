from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, status

from app.core.deps import CurrentUser, DBSession, LibrarianUser
from app.models.book import BookCreate, BookRead, BookSearchResult, BookUpdate, TrendingBook
from app.services.book_service import (
    create_book,
    delete_book,
    get_book,
    get_books,
    get_trending_books,
    update_book,
)

router = APIRouter()


@router.get("", response_model=list[BookSearchResult])
async def list_books(
    _: CurrentUser,
    db: DBSession,
    q: Optional[str] = Query(default=None, description="Search by title, author, or ISBN"),
    category: Optional[str] = Query(default=None),
) -> list[BookSearchResult]:
    return await get_books(db, query=q, category=category)


@router.post("", response_model=BookRead, status_code=status.HTTP_201_CREATED)
async def add_book(payload: BookCreate, _: LibrarianUser, db: DBSession) -> BookRead:
    book = await create_book(db, payload)
    return BookRead.model_validate(book)


@router.get("/trending", response_model=list[TrendingBook])
async def trending_books(
    _: CurrentUser,
    db: DBSession,
    days: int = Query(default=30, ge=1, le=365, description="Look-back window in days"),
    limit: int = Query(default=5, ge=1, le=20),
) -> list[TrendingBook]:
    return await get_trending_books(db, days=days, limit=limit)


@router.get("/{book_id}", response_model=BookRead)
async def get_single_book(book_id: UUID, _: CurrentUser, db: DBSession) -> BookRead:
    book = await get_book(db, book_id)
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return BookRead.model_validate(book)


@router.patch("/{book_id}", response_model=BookRead)
async def update_single_book(
    book_id: UUID,
    data: BookUpdate,
    _: LibrarianUser,
    db: DBSession,
) -> BookRead:
    book = await update_book(db, book_id, data)
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return BookRead.model_validate(book)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_single_book(book_id: UUID, _: LibrarianUser, db: DBSession) -> None:
    deleted = await delete_book(db, book_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
