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
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import DeclarativeBase
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


# Choose Database URL
active_db_url = settings.DATABASE_URL
if settings.USE_SQLITE_FALLBACK:
    active_db_url = "sqlite+aiosqlite:///./voiceops.db"

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
        logger.info("Database schema initialized successfully")
    except Exception as e:
        logger.warning("Database schema auto-init skipped or existing", error=str(e))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error("Database session rollback due to exception", error=str(e))
            raise
        finally:
            await session.close()
