import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_workspace_role
from app.core.config import settings
from app.core.redis import get_redis_pool
from app.models.audit_log import AuditLog
from app.models.conversation import Conversation
from app.models.tool_call import ToolCall
from app.models.user import User
from app.schemas.observability import AuditLogResponse, MetricsResponse

router = APIRouter(prefix="/observability", tags=["Observability & Diagnostics"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Healthcheck probe for database and redis connections."""
    db_status = "healthy"
    redis_status = "healthy"

    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    try:
        redis = await get_redis_pool()
        await redis.ping()
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"

    overall = "ok" if db_status == "healthy" and redis_status == "healthy" else "degraded"
    return {
        "status": overall,
        "database": db_status,
        "redis": redis_status,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(
    workspace_id: uuid.UUID,
    _member=Depends(require_workspace_role(["owner", "admin", "developer", "viewer"])),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate system and agent operational metrics."""
    # Tool call stats
    stmt_tools = select(
        func.count(ToolCall.id).label("total"),
        func.avg(ToolCall.execution_time_ms).label("avg_latency"),
    )
    res_tools = await db.execute(stmt_tools)
    total_tools, avg_latency = res_tools.first() or (0, 0.0)

    stmt_success = select(func.count(ToolCall.id)).where(ToolCall.status == "success")
    res_success = await db.execute(stmt_success)
    success_count = res_success.scalar() or 0

    success_rate = (success_count / total_tools * 100.0) if total_tools and total_tools > 0 else 100.0

    # Conversations
    stmt_conv = select(func.count(Conversation.id))
    res_conv = await db.execute(stmt_conv)
    total_convs = res_conv.scalar() or 0

    return MetricsResponse(
        total_requests=total_convs + (total_tools or 0),
        total_conversations=total_convs,
        total_tool_calls=total_tools or 0,
        tool_success_rate=round(success_rate, 2),
        avg_latency_ms=round(float(avg_latency or 0.0), 2),
        active_sessions=1,
    )


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    workspace_id: uuid.UUID,
    limit: int = Query(50, le=200),
    _member=Depends(require_workspace_role(["owner", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """List recent security audit logs (Owner/Admin only)."""
    stmt = (
        select(AuditLog)
        .where(AuditLog.workspace_id == workspace_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()
