import datetime
from datetime import timezone
import uuid
from typing import Any, Dict, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.models.approval import Approval
from app.models.tool_call import ToolCall
from app.tools.registry import tool_registry


class ApprovalManager:
    @staticmethod
    async def create_pending_approval(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        tool_name: str,
        tool_args: Dict[str, Any],
        approval_payload: Dict[str, Any],
    ) -> Tuple[Approval, ToolCall]:
        """Create a ToolCall blocked by approval and record the pending Approval."""
        tool_call = ToolCall(
            conversation_id=conversation_id,
            tool_name=tool_name,
            arguments_json=tool_args,
            status="blocked_by_approval",
        )
        db.add(tool_call)
        await db.flush()

        now = datetime.datetime.now(timezone.utc)
        expires_at = now + datetime.timedelta(minutes=settings.APPROVAL_TOKEN_EXPIRE_MINUTES)

        approval = Approval(
            conversation_id=conversation_id,
            tool_call_id=tool_call.id,
            action_type=approval_payload.get("action_type", tool_name),
            description=approval_payload.get("description", f"Execute action {tool_name}"),
            payload_json=approval_payload,
            status="pending",
            expires_at=expires_at,
        )
        db.add(approval)
        await db.commit()
        await db.refresh(approval)
        await db.refresh(tool_call)

        return approval, tool_call

    @staticmethod
    async def resolve_approval(
        db: AsyncSession,
        approval_id: uuid.UUID,
        user_id: uuid.UUID,
        decision: str,  # 'approved' or 'rejected'
        execution_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Process user decision for a pending approval and execute the action if approved."""
        stmt = select(Approval).where(Approval.id == approval_id)
        res = await db.execute(stmt)
        approval = res.scalar_one_or_none()

        if not approval:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found")

        if approval.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approval request already resolved with status '{approval.status}'",
            )

        now = datetime.datetime.now(timezone.utc)
        if approval.expires_at < now:
            approval.status = "expired"
            await db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Approval request has expired")

        approval.approved_by_user_id = user_id
        approval.status = decision

        # Load linked tool call
        stmt_tc = select(ToolCall).where(ToolCall.id == approval.tool_call_id)
        res_tc = await db.execute(stmt_tc)
        tool_call = res_tc.scalar_one_or_none()

        execution_result = None

        if decision == "approved" and tool_call:
            tool = tool_registry.get_tool(tool_call.tool_name)
            if tool:
                ctx = execution_context or {}
                ctx["is_approved"] = True
                
                tool_res = await tool.execute(ctx, **tool_call.arguments_json)
                if tool_res.success:
                    tool_call.status = "success"
                    tool_call.result_json = tool_res.data
                    execution_result = tool_res.data
                else:
                    tool_call.status = "failed"
                    tool_call.error_message = tool_res.error
                    execution_result = {"error": tool_res.error}
            else:
                tool_call.status = "failed"
                tool_call.error_message = f"Tool '{tool_call.tool_name}' not found"

        elif decision == "rejected" and tool_call:
            tool_call.status = "failed"
            tool_call.error_message = "Action rejected by user"

        await db.commit()
        await db.refresh(approval)

        return {
            "approval_id": str(approval.id),
            "status": approval.status,
            "action_type": approval.action_type,
            "execution_result": execution_result,
        }
