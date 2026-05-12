from fastapi import APIRouter, Query

from app.core.deps import CurrentUser, DBSession
from app.models.recommendation import RecommendationRead
from app.services.recommendation_service import get_recommendations

router = APIRouter()


@router.get("", response_model=list[RecommendationRead])
async def list_recommendations(
    current_user: CurrentUser,
    db: DBSession,
    limit: int = Query(default=5, ge=1, le=20),
) -> list[RecommendationRead]:
    """
    Return up to `limit` personalised book recommendations for the
    authenticated user based on their borrowing history.
    """
    return await get_recommendations(db, current_user.id, limit=limit)
