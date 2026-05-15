"""
Notification Service — Day 19

Sends overdue alerts via Resend. When RESEND_API_KEY is absent (dev/test),
it logs the intent without making an API call so the rest of the pipeline
runs normally and notifications are still recorded in the DB.

Deduplication: a transaction is skipped if it already received a notification
today, preventing repeat emails when the endpoint is triggered multiple times.
"""
from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.book import Book
from app.models.notification import Notification
from app.models.transaction import Transaction
from app.models.user import User

logger = logging.getLogger(__name__)


# ── Email rendering ───────────────────────────────────────────────────────────

def _build_html(name: str, book_title: str, due_date: datetime) -> str:
    days_overdue = (datetime.utcnow() - due_date).days
    days_overdue = max(days_overdue, 1)
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F2F0EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:#245F73;padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-.3px;">
            LibraFlow <span style="color:#BBBDBC;">AI</span>
          </p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.7);font-size:12px;">
            Lead City University Library System
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#1a1a1a;">Hi {name},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
            Your borrowed copy of
            <strong style="color:#1a1a1a;">"{book_title}"</strong>
            is <strong style="color:#733E24;">{days_overdue} day{"s" if days_overdue != 1 else ""} overdue</strong>.
            Please return it to the library at your earliest convenience to avoid
            further penalties.
          </p>

          <!-- Due date chip -->
          <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="background:#FFF3EE;border:1px solid #F5C5A8;border-radius:8px;padding:12px 20px;">
              <p style="margin:0;font-size:12px;color:#733E24;font-weight:600;text-transform:uppercase;letter-spacing:.6px;">
                Due date
              </p>
              <p style="margin:4px 0 0;font-size:15px;color:#1a1a1a;font-weight:500;">
                {due_date.strftime("%d %B %Y")}
              </p>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;color:#666;line-height:1.6;">
            If you have already returned this book, please ignore this message.
            For questions, visit the library reception desk.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F2F0EF;padding:20px 32px;border-top:1px solid #e5e5e5;">
          <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
            This is an automated message from LibraFlow AI &mdash; Lead City University.<br>
            Please do not reply to this email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


# ── Email dispatch ────────────────────────────────────────────────────────────

async def _send_email(to: str, name: str, book_title: str, due_date: datetime) -> bool:
    if not settings.RESEND_API_KEY:
        logger.info("[DEV] Overdue email (no API key) → %s | %r", to, book_title)
        return True  # dev mode: treat as sent

    try:
        import resend  # imported here so missing package doesn't break the module
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from":    settings.FROM_EMAIL,
            "to":      [to],
            "subject": f"Library Notice: \"{book_title}\" is overdue",
            "html":    _build_html(name, book_title, due_date),
        })
        return True
    except Exception as exc:
        logger.error("Resend error for %s: %s", to, exc)
        return False


# ── Public interface ──────────────────────────────────────────────────────────

async def notify_overdue_users(db: AsyncSession) -> dict[str, int]:
    """
    Send overdue emails for all OVERDUE transactions not yet notified today.
    Returns {"sent": N, "skipped": M}.
    """
    rows = (await db.execute(
        select(Transaction, User, Book)
        .join(User, User.id == Transaction.user_id)
        .join(Book, Book.id == Transaction.book_id)
        .where(Transaction.status == "OVERDUE")
    )).all()

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    sent = skipped = 0

    for tx, user, book in rows:
        already = await db.scalar(
            select(func.count(Notification.id))
            .where(Notification.transaction_id == tx.id)
            .where(Notification.sent_at >= today_start)
        )
        if already:
            skipped += 1
            continue

        ok = await _send_email(user.email, user.full_name, book.title, tx.due_date)

        db.add(Notification(
            user_id=user.id,
            transaction_id=tx.id,
            email_address=user.email,
            book_title=book.title,
            email_sent=ok,
        ))
        sent += 1

    await db.commit()
    return {"sent": sent, "skipped": skipped}
