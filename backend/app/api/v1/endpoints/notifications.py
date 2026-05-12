from fastapi import APIRouter, Query, status

from app.core.deps import DBSession, LibrarianUser
from app.models.notification import NotificationRead
from app.services.notification_service import notify_overdue_users
from sqlalchemy import select
from sqlmodel import Session

from app.models.notification import Notification

router = APIRouter()


@router.post("/send-overdue", status_code=status.HTTP_200_OK)
async def send_overdue_notifications(_: LibrarianUser, db: DBSession) -> dict:
    """
    Send overdue alert emails to all members with an OVERDUE transaction.
    Each transaction is notified at most once per calendar day.
    In dev mode (no RESEND_API_KEY), emails are logged only.
    """
    return await notify_overdue_users(db)


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    _: LibrarianUser,
    db: DBSession,
    limit: int = Query(default=50, ge=1, le=200),
) -> list[NotificationRead]:
    """Most recent notification records, newest first."""
    result = await db.execute(
        select(Notification).order_by(Notification.sent_at.desc()).limit(limit)
    )
    return [NotificationRead.model_validate(n) for n in result.scalars().all()]
