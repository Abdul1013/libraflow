import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id:             Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id:        uuid.UUID           = Field(foreign_key="users.id",        index=True)
    transaction_id: uuid.UUID           = Field(foreign_key="transactions.id", index=True)
    email_address:  str                 # snapshot of recipient email at send time
    book_title:     str                 # snapshot of book title at send time
    type:           str                 = Field(default="OVERDUE_ALERT")
    email_sent:     bool                = Field(default=False)
    sent_at:        datetime            = Field(default_factory=datetime.utcnow)


class NotificationRead(SQLModel):
    id:             uuid.UUID
    user_id:        uuid.UUID
    transaction_id: uuid.UUID
    email_address:  str
    book_title:     str
    type:           str
    email_sent:     bool
    sent_at:        datetime
