import os
import ssl
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    from sqlalchemy.types import UserDefinedType
    class Vector(UserDefinedType):
        def __init__(self, dim=1536):
            self.dim = dim
        def get_col_spec(self, **kw):
            return f"vector({self.dim})"

from app.core.config import settings
from app.core.logging import logger

# SQLite Compatibility for non-Postgres environments
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

@compiles(UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "TEXT"

@compiles(Vector, "sqlite")
def compile_vector_sqlite(type_, compiler, **kw):
    return "TEXT"


def get_engine_args(db_url: str) -> dict:
    """Prepare engine parameters depending on database provider (Supabase / Postgres / SQLite)."""
    engine_kwargs = {
        "echo": False,
        "future": True,
    }

    # If using Supabase or cloud Postgres with SSL
    if "supabase.co" in db_url or "pooler.supabase.com" in db_url or "ssl=require" in db_url or "sslmode=require" in db_url:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        engine_kwargs["connect_args"] = {"ssl": ssl_ctx}
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_size"] = 10
        engine_kwargs["max_overflow"] = 10
    elif db_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_size"] = 10
        engine_kwargs["max_overflow"] = 20

    return engine_kwargs


# Choose Database URL — always prefer Supabase/Postgres if configured
def _resolve_db_url() -> str:
    """
    Resolution priority:
    1. Explicit USE_SQLITE_FALLBACK=True  → SQLite (local dev without DB)
    2. Running on Vercel with no Supabase URL → SQLite
    3. DATABASE_URL contains supabase.co or postgres host → use it directly
    4. DATABASE_URL is a localhost postgres → still use it (real local Postgres)
    5. Otherwise → SQLite fallback
    """
    if settings.USE_SQLITE_FALLBACK:
        return "sqlite+aiosqlite:////tmp/voiceops.db"

    db_url = settings.DATABASE_URL

    # If URL points to Supabase or any cloud Postgres, always use it
    if "supabase.co" in db_url or "pooler.supabase.com" in db_url:
        return db_url

    # Non-localhost postgres (any cloud provider) — use it
    if db_url.startswith("postgresql") and "localhost" not in db_url and "127.0.0.1" not in db_url:
        return db_url

    # Vercel environment with no cloud DB → fall back to SQLite
    if os.getenv("VERCEL"):
        return "sqlite+aiosqlite:////tmp/voiceops.db"

    # Local postgres or local dev without a cloud DB
    # If DATABASE_URL is explicitly pointing to a local postgres, honour it
    if db_url.startswith("postgresql"):
        return db_url

    # Default: SQLite for pure local dev
    return "sqlite+aiosqlite:////tmp/voiceops.db"


active_db_url = _resolve_db_url()

engine: AsyncEngine = create_async_engine(
    active_db_url,
    **get_engine_args(active_db_url)
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def init_db_schema():
    """Initialize database tables if running against SQLite or fresh instance."""
    try:
        async with engine.begin() as conn:
            import app.models  # load models
            await conn.run_sync(Base.metadata.create_all)
        if hasattr(logger, "info"):
            logger.info("Database schema initialized successfully")
    except Exception as e:
        if hasattr(logger, "warning"):
            logger.warning(f"Database schema auto-init skipped or existing: {e}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            if hasattr(logger, "error"):
                logger.error(f"Database session rollback due to exception: {e}")
            raise
        finally:
            await session.close()
