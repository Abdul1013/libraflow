from uuid import UUID
from fastapi import APIRouter, HTTPException, status

from app.core.deps import AdminUser, CurrentUser, DBSession, LibrarianUser
from app.models.user import UserCreate, UserRead, UserUpdate
from app.services.user_service import (
    create_user,
    get_user_by_id,
    list_users,
    update_user,
)

router = APIRouter()


@router.get("", response_model=list[UserRead])
async def get_all_users(_: LibrarianUser, db: DBSession) -> list[UserRead]:
    users = await list_users(db)
    return [UserRead.model_validate(u) for u in users]


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_new_user(payload: UserCreate, _: AdminUser, db: DBSession) -> UserRead:
    user = await create_user(db, payload)
    return UserRead.model_validate(user)


@router.get("/me", response_model=UserRead)
async def get_my_profile(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: UUID, _: LibrarianUser, db: DBSession) -> UserRead:
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserRead.model_validate(user)


@router.patch("/{user_id}", response_model=UserRead)
async def patch_user(
    user_id: UUID,
    data: UserUpdate,
    current_user: CurrentUser,
    db: DBSession,
) -> UserRead:
    # Users can edit themselves; admins can edit anyone
    if current_user.role != "ADMIN" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    user = await update_user(db, user_id, data)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserRead.model_validate(user)
