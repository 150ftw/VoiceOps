from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings
from app.core.logging import logger

redis_client: Optional[aioredis.Redis] = None


async def get_redis_pool() -> aioredis.Redis:
    """Get or initialize the global async Redis connection pool."""
    global redis_client
    if redis_client is None:
        try:
            redis_client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20,
            )
        except Exception as e:
            logger.error("Failed to connect to Redis", error=str(e))
            raise
    return redis_client


async def close_redis_pool():
    """Close the global async Redis connection pool."""
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None


class RateLimiter:
    """Sliding window or fixed window rate limiter using Redis."""

    @staticmethod
    async def is_rate_limited(key: str, limit: int, window_seconds: int = 60) -> bool:
        try:
            redis = await get_redis_pool()
            current_count = await redis.incr(key)
            if current_count == 1:
                await redis.expire(key, window_seconds)
            return current_count > limit
        except Exception as e:
            logger.warning("Rate limiter fallback on Redis failure", error=str(e))
            return False  # Fail open if Redis is unavailable in non-strict mode
