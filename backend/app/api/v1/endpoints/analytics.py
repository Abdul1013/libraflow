from fastapi import APIRouter, Query

from app.core.deps import DBSession, LibrarianUser
from app.models.analytics import AnalyticsSummary, BorrowingTrendPoint, CategoryStat, OverdueTrendPoint
from app.services.analytics_service import (
    get_borrowing_trend,
    get_category_stats,
    get_overdue_trend,
    get_summary,
)

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
async def analytics_summary(_: LibrarianUser, db: DBSession) -> AnalyticsSummary:
    return await get_summary(db)


@router.get("/overdue-trend", response_model=list[OverdueTrendPoint])
async def overdue_trend(
    _: LibrarianUser,
    db: DBSession,
    days: int = Query(default=14, ge=1, le=90),
) -> list[OverdueTrendPoint]:
    return await get_overdue_trend(db, days=days)


@router.get("/borrowing-trend", response_model=list[BorrowingTrendPoint])
async def borrowing_trend(
    _: LibrarianUser,
    db: DBSession,
    days: int = Query(default=30, ge=1, le=90),
) -> list[BorrowingTrendPoint]:
    return await get_borrowing_trend(db, days=days)


@router.get("/category-stats", response_model=list[CategoryStat])
async def category_stats(_: LibrarianUser, db: DBSession) -> list[CategoryStat]:
    return await get_category_stats(db)
