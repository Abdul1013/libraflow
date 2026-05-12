from fastapi import APIRouter, Query

from app.core.deps import DBSession, LibrarianUser
from app.models.analytics import AnalyticsSummary, OverdueTrendPoint
from app.services.analytics_service import get_overdue_trend, get_summary

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
async def analytics_summary(_: LibrarianUser, db: DBSession) -> AnalyticsSummary:
    """Live KPI counts for the admin dashboard."""
    return await get_summary(db)


@router.get("/overdue-trend", response_model=list[OverdueTrendPoint])
async def overdue_trend(
    _: LibrarianUser,
    db: DBSession,
    days: int = Query(default=14, ge=1, le=90),
) -> list[OverdueTrendPoint]:
    """Daily overdue book counts for the last `days` days."""
    return await get_overdue_trend(db, days=days)
