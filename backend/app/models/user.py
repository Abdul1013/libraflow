import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    role: str = Field(default="STUDENT")  # ADMIN | LIBRARIAN | STUDENT
    department: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(SQLModel):
    email: str
    password: str
    full_name: str
    role: str = "STUDENT"
    department: Optional[str] = None


class UserRead(SQLModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    department: Optional[str]
    is_active: bool
    created_at: datetime


class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
