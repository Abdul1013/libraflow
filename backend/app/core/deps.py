from typing import Annotated
from uuid import UUID
from fastapi import Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_session
from app.models.user import User


async def _get_user_from_token(
    token: str,
    session: AsyncSession,
) -> User:
    from app.services.user_service import get_user_by_id

    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exc
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = await get_user_by_id(session, UUID(user_id))
    if user is None or not user.is_active:
        raise credentials_exc
    return user


async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> User:
    # Bearer token (cross-origin / Vercel → Render)
    auth_header = request.headers.get("Authorization", "")
    token: str | None = auth_header[7:] if auth_header.startswith("Bearer ") else None

    # Cookie fallback (local dev)
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return await _get_user_from_token(token, session)


def require_roles(*roles: str):
    """Factory that returns a dependency enforcing one of the given roles."""
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Required role: {' or '.join(roles)}",
            )
        return user
    return _check


# Convenience aliases
require_admin      = require_roles("ADMIN")
require_librarian  = require_roles("ADMIN", "LIBRARIAN")
require_student    = require_roles("ADMIN", "LIBRARIAN", "STUDENT")

# Type aliases for use in endpoint signatures
CurrentUser       = Annotated[User, Depends(get_current_user)]
AdminUser         = Annotated[User, Depends(require_admin)]
LibrarianUser     = Annotated[User, Depends(require_librarian)]
DBSession         = Annotated[AsyncSession, Depends(get_session)]
