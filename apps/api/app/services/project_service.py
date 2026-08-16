import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.repository import Repository
from app.models.integration import Integration
from app.schemas.project import ProjectCreate, RepositoryConnectRequest


class ProjectService:
    @staticmethod
    async def list_projects(
        db: AsyncSession, workspace_id: uuid.UUID
    ) -> List[Project]:
        """List all projects in a workspace including linked repository info."""
        stmt = (
            select(Project)
            .options(selectinload(Project.repository))
            .where(Project.workspace_id == workspace_id)
            .order_by(Project.created_at.desc())
        )
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def create_project(
        db: AsyncSession, data: ProjectCreate
    ) -> Project:
        """Create a new project and optionally link a repository."""
        stmt = select(Project).where(
            Project.workspace_id == data.workspace_id,
            Project.slug == data.slug.lower().strip(),
        )
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A project with this slug already exists in this workspace",
            )

        project = Project(
            workspace_id=data.workspace_id,
            name=data.name.strip(),
            slug=data.slug.lower().strip(),
            description=data.description,
            default_branch=data.default_branch,
        )
        db.add(project)
        await db.flush()

        # If repo provided at creation
        if data.repository_full_name and data.github_repo_id:
            # Check for existing active GitHub integration in this workspace
            stmt_int = select(Integration).where(
                Integration.workspace_id == data.workspace_id,
                Integration.provider == "github",
            )
            res_int = await db.execute(stmt_int)
            integration = res_int.scalars().first()

            repo = Repository(
                project_id=project.id,
                integration_id=integration.id if integration else None,
                repo_full_name=data.repository_full_name.strip(),
                github_repo_id=data.github_repo_id,
                default_branch=data.default_branch,
            )
            db.add(repo)

        await db.commit()
        
        # Reload with repository
        stmt_reload = (
            select(Project)
            .options(selectinload(Project.repository))
            .where(Project.id == project.id)
        )
        res_reload = await db.execute(stmt_reload)
        return res_reload.scalar_one()

    @staticmethod
    async def connect_repository(
        db: AsyncSession, project_id: uuid.UUID, data: RepositoryConnectRequest
    ) -> Repository:
        """Connect or update the GitHub repository for a project."""
        stmt_p = select(Project).where(Project.id == project_id)
        res_p = await db.execute(stmt_p)
        project = res_p.scalar_one_or_none()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )

        # Check for GitHub integration
        stmt_int = select(Integration).where(
            Integration.workspace_id == project.workspace_id,
            Integration.provider == "github",
        )
        res_int = await db.execute(stmt_int)
        integration = res_int.scalars().first()

        stmt_repo = select(Repository).where(Repository.project_id == project_id)
        res_repo = await db.execute(stmt_repo)
        repo = res_repo.scalar_one_or_none()

        if repo:
            repo.repo_full_name = data.repo_full_name.strip()
            repo.github_repo_id = data.github_repo_id
            repo.default_branch = data.default_branch
            repo.integration_id = integration.id if integration else None
            repo.is_active = True
        else:
            repo = Repository(
                project_id=project_id,
                integration_id=integration.id if integration else None,
                repo_full_name=data.repo_full_name.strip(),
                github_repo_id=data.github_repo_id,
                default_branch=data.default_branch,
                is_active=True,
            )
            db.add(repo)

        await db.commit()
        await db.refresh(repo)
        return repo
