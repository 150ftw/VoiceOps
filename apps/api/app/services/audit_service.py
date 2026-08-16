import uuid
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.models.audit_log import AuditLog


class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        workspace_id: uuid.UUID,
        action: str,
        resource_type: str,
        user_id: Optional[uuid.UUID] = None,
        resource_id: Optional[str] = None,
        status: str = "success",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> Optional[AuditLog]:
        """Safely record an audit log entry in the database."""
        try:
            audit_entry = AuditLog(
                workspace_id=workspace_id,
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                status=status,
                ip_address=ip_address,
                user_agent=user_agent,
                details_json=details or {},
            )
            db.add(audit_entry)
            await db.commit()
            return audit_entry
        except Exception as e:
            logger.error("Failed to record audit log", error=str(e), action=action)
            await db.rollback()
            return None
