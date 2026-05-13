import uuid
from typing import Optional
from sqlmodel import SQLModel, Field


class Book(SQLModel, table=True):
    __tablename__ = "books"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(index=True)
    author: str = Field(index=True)
    isbn: str = Field(unique=True, index=True)
    category: str = Field(index=True)
    total_copies: int = Field(ge=1)
    available_copies: int = Field(ge=0)
    shelf_location: str
    cover_url: Optional[str] = None
    description: Optional[str] = None


class BookCreate(SQLModel):
    title: str
    author: str
    isbn: str
    category: str
    total_copies: int = Field(ge=1)
    shelf_location: str
    cover_url: Optional[str] = None
    description: Optional[str] = None


class BookRead(SQLModel):
    id: uuid.UUID
    title: str
    author: str
    isbn: str
    category: str
    total_copies: int
    available_copies: int
    shelf_location: str
    cover_url: Optional[str]
    description: Optional[str]


class BookSearchResult(BookRead):
    """BookRead extended with fuzzy-search metadata."""
    score:       float = 1.0   # relevance score 0–1; 1.0 for catalogue listing (no query)
    match_field: str   = "title"  # "title" | "author" | "isbn"
    is_fuzzy:    bool  = False    # True when match is approximate (typo recovery)


class BookUpdate(SQLModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    total_copies: Optional[int] = Field(default=None, ge=1)
    shelf_location: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None


class TrendingBook(BookRead):
    """BookRead extended with trending metadata."""
    borrow_count:     int  # borrows within the trend window
    trend_period_days: int  # window size (e.g. 30)
