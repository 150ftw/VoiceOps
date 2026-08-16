import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_workspace_role
from app.models.user import User
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceMemberCreate,
    WorkspaceMemberResponse,
    WorkspaceResponse,
)
from app.services.audit_service import AuditService
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.get("", response_model=List[WorkspaceResponse])
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workspaces the authenticated user belongs to."""
    rows = await WorkspaceService.list_user_workspaces(db, current_user.id)
    results = []
    for ws, role in rows:
        resp = WorkspaceResponse.model_validate(ws)
        resp.role = role
        results.append(resp)
    return results


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new workspace."""
    ws = await WorkspaceService.create_workspace(db, current_user.id, data)
    await AuditService.log_action(
        db=db,
        workspace_id=ws.id,
        user_id=current_user.id,
        action="CREATE_WORKSPACE",
        resource_type="workspace",
        resource_id=str(ws.id),
        details={"name": ws.name, "slug": ws.slug},
    )
    resp = WorkspaceResponse.model_validate(ws)
    resp.role = "owner"
    return resp


@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse])
async def list_members(
    workspace_id: uuid.UUID,
    _member=Depends(require_workspace_role(["owner", "admin", "developer", "viewer"])),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a workspace."""
    members = await WorkspaceService.list_members(db, workspace_id)
    return members


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse)
async def invite_or_update_member(
    workspace_id: uuid.UUID,
    data: WorkspaceMemberCreate,
    current_user: User = Depends(get_current_user),
    _member=Depends(require_workspace_role(["owner", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Invite a new member or update role in the workspace (Admin/Owner only)."""
    member = await WorkspaceService.add_or_update_member(db, workspace_id, data)
    await AuditService.log_action(
        db=db,
        workspace_id=workspace_id,
        user_id=current_user.id,
        action="INVITE_OR_UPDATE_MEMBER",
        resource_type="workspace_member",
        resource_id=str(member.id),
        details={"target_email": data.email, "role": data.role},
    )
    return member
