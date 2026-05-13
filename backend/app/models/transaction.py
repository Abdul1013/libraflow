import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    book_id: uuid.UUID = Field(foreign_key="books.id", index=True)
    borrowed_at: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime
    returned_at: Optional[datetime] = None
    status: str = Field(default="BORROWED")  # BORROWED | RETURNED | OVERDUE


class TransactionCreate(SQLModel):
    book_id: uuid.UUID
    due_date: datetime


class TransactionRead(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    book_id: uuid.UUID
    borrowed_at: datetime
    due_date: datetime
    returned_at: Optional[datetime]
    status: str
