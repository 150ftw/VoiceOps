import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.schemas.workspace import WorkspaceCreate, WorkspaceMemberCreate


class WorkspaceService:
    @staticmethod
    async def list_user_workspaces(
        db: AsyncSession, user_id: uuid.UUID
    ) -> List[Tuple[Workspace, str]]:
        """List all workspaces the user is a member of, along with their role."""
        stmt = (
            select(Workspace, WorkspaceMember.role)
            .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
            .where(WorkspaceMember.user_id == user_id)
            .order_by(Workspace.created_at.desc())
        )
        res = await db.execute(stmt)
        return res.all()

    @staticmethod
    async def create_workspace(
        db: AsyncSession, user_id: uuid.UUID, data: WorkspaceCreate
    ) -> Workspace:
        """Create a new workspace and assign the creator as owner."""
        stmt = select(Workspace).where(Workspace.slug == data.slug.lower().strip())
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A workspace with this slug already exists",
            )

        workspace = Workspace(
            name=data.name.strip(),
            slug=data.slug.lower().strip(),
            owner_id=user_id,
        )
        db.add(workspace)
        await db.flush()

        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user_id,
            role="owner",
        )
        db.add(member)
        await db.commit()
        await db.refresh(workspace)
        return workspace

    @staticmethod
    async def list_members(
        db: AsyncSession, workspace_id: uuid.UUID
    ) -> List[WorkspaceMember]:
        """List all members of a workspace with user profiles."""
        stmt = (
            select(WorkspaceMember)
            .options(selectinload(WorkspaceMember.user))
            .where(WorkspaceMember.workspace_id == workspace_id)
            .order_by(WorkspaceMember.created_at.asc())
        )
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def add_or_update_member(
        db: AsyncSession,
        workspace_id: uuid.UUID,
        data: WorkspaceMemberCreate,
    ) -> WorkspaceMember:
        """Invite a user to a workspace by email with specified role."""
        stmt_user = select(User).where(User.email == data.email.lower().strip())
        res_user = await db.execute(stmt_user)
        target_user = res_user.scalar_one_or_none()

        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with email '{data.email}' not found. They must register first.",
            )

        stmt_member = select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == target_user.id,
        )
        res_member = await db.execute(stmt_member)
        existing_member = res_member.scalar_one_or_none()

        if existing_member:
            existing_member.role = data.role
            await db.commit()
            await db.refresh(existing_member)
            return existing_member

        new_member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=target_user.id,
            role=data.role,
        )
        db.add(new_member)
        await db.commit()
        await db.refresh(new_member)
        return new_member
