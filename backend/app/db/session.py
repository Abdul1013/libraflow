from typing import AsyncGenerator
from urllib.parse import urlparse, urlunparse, urlencode, parse_qs
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings

# asyncpg handles SSL via connect_args, not query params — strip pg-specific ones
_ASYNCPG_UNSUPPORTED_PARAMS = {"sslmode", "channel_binding"}


def _make_async_url(url: str) -> tuple[str, bool]:
    """Convert URL to asyncpg driver format. Returns (clean_url, needs_ssl)."""
    parsed = urlparse(url.replace("postgres://", "postgresql://"))
    needs_ssl = "sslmode=require" in url

    qs = {k: v for k, v in parse_qs(parsed.query).items()
          if k not in _ASYNCPG_UNSUPPORTED_PARAMS}

    clean = urlunparse(parsed._replace(
        scheme="postgresql+asyncpg",
        query=urlencode(qs, doseq=True),
    ))
    return clean, needs_ssl


_db_url, _db_ssl = _make_async_url(settings.DATABASE_URL)

engine = create_async_engine(
    _db_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    connect_args={"ssl": True} if _db_ssl else {},
)

_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def create_db_and_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with _session_factory() as session:
        yield session
