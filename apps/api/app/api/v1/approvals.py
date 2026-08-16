import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.approval_manager import ApprovalManager
from app.api.deps import get_current_user, get_db
from app.models.approval import Approval
from app.models.conversation import Conversation
from app.models.project import Project
from app.models.user import User
from app.schemas.approval import ApprovalDecisionRequest, ApprovalResponse
from app.services.audit_service import AuditService
from app.services.github_service import GitHubService

router = APIRouter(prefix="/approvals", tags=["Approvals & Human-in-the-Loop"])


@router.get("", response_model=List[ApprovalResponse])
async def list_approvals(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List pending and historical approval requests for a conversation."""
    stmt = (
        select(Approval)
        .where(Approval.conversation_id == conversation_id)
        .order_by(Approval.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/{approval_id}/respond")
async def respond_to_approval(
    approval_id: uuid.UUID,
    decision: ApprovalDecisionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a pending DevOps action."""
    stmt = select(Approval).where(Approval.id == approval_id)
    res = await db.execute(stmt)
    approval = res.scalar_one_or_none()

    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found")

    # Load conversation and project to build GitHub context
    stmt_conv = select(Conversation).where(Conversation.id == approval.conversation_id)
    res_conv = await db.execute(stmt_conv)
    conv = res_conv.scalar_one_or_none()
    
    token = None
    repo_full_name = None
    workspace_id = None
    if conv:
        stmt_proj = select(Project).where(Project.id == conv.project_id)
        res_proj = await db.execute(stmt_proj)
        proj = res_proj.scalar_one_or_none()
        if proj:
            workspace_id = proj.workspace_id
            token = await GitHubService.get_project_github_token(db, proj.id)
            repo_full_name = approval.payload_json.get("repository")

    execution_context = {
        "db": db,
        "github_token": token,
        "repo_full_name": repo_full_name,
        "user_id": current_user.id,
    }

    result = await ApprovalManager.resolve_approval(
        db=db,
        approval_id=approval_id,
        user_id=current_user.id,
        decision="approved" if decision.action == "approve" else "rejected",
        execution_context=execution_context,
    )

    if workspace_id:
        await AuditService.log_action(
            db=db,
            workspace_id=workspace_id,
            user_id=current_user.id,
            action=f"APPROVAL_{decision.action.upper()}",
            resource_type="approval",
            resource_id=str(approval_id),
            details={"action_type": approval.action_type, "decision": decision.action},
        )

    return result
