from fastapi import APIRouter, Cookie, HTTPException, Response, status
from pydantic import BaseModel

from app.core.deps import CurrentUser, DBSession
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import UserCreate, UserRead
from app.services.user_service import create_user, get_user_by_email

router = APIRouter()

_COOKIE_OPTS = dict(httponly=True, secure=True, samesite="none")
_ACCESS_MAX_AGE  = 15 * 60           # 15 min
_REFRESH_MAX_AGE = 7 * 24 * 3600     # 7 days


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(UserCreate):
    pass


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: DBSession) -> UserRead:
    user = await create_user(db, payload)
    return UserRead.model_validate(user)


@router.post("/login")
async def login(payload: LoginRequest, response: Response, db: DBSession) -> dict:
    user = await get_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token  = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie("access_token",  access_token,  max_age=_ACCESS_MAX_AGE,  **_COOKIE_OPTS)
    response.set_cookie("refresh_token", refresh_token, max_age=_REFRESH_MAX_AGE, **_COOKIE_OPTS)
    # Non-HTTP-only: readable by Next.js middleware for role-based route guarding
    response.set_cookie("user_role", user.role, max_age=_REFRESH_MAX_AGE, secure=True, samesite="none")

    return {
        "message": "Login successful",
        "user": UserRead.model_validate(user),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }


@router.post("/logout")
async def logout(response: Response) -> dict:
    # Must match the attributes used when setting — samesite/secure are required for browsers
    # to match and delete the cookie rather than ignoring the directive.
    response.delete_cookie("access_token",  httponly=True, secure=True, samesite="none")
    response.delete_cookie("refresh_token", httponly=True, secure=True, samesite="none")
    response.delete_cookie("user_role",     secure=True,  samesite="none")
    return {"message": "Logged out"}


@router.post("/refresh")
async def refresh_tokens(
    response: Response,
    db: DBSession,
    refresh_token: str | None = Cookie(default=None),
) -> dict:
    from jose import JWTError

    if refresh_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id: str = payload["sub"]
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    from app.services.user_service import get_user_by_id
    from uuid import UUID
    user = await get_user_by_id(db, UUID(user_id))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token(str(user.id), user.role)
    response.set_cookie("access_token", new_access, max_age=_ACCESS_MAX_AGE, **_COOKIE_OPTS)
    return {"message": "Token refreshed", "access_token": new_access}


@router.get("/me", response_model=UserRead)
async def me(current_user: CurrentUser) -> UserRead:
    return UserRead.model_validate(current_user)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DBSession,
) -> None:
    from app.core.security import hash_password
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    current_user.hashed_password = hash_password(payload.new_password)
    await db.commit()
