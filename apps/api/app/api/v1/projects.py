import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, get_project_with_access, require_workspace_role
from app.models.project import Project
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    RepositoryConnectRequest,
    RepositoryResponse,
)
from app.services.audit_service import AuditService
from app.services.github_service import GitHubService
from app.services.project_service import ProjectService
from app.services.repo_ingestion_service import RepoIngestionService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    workspace_id: uuid.UUID,
    _member=Depends(require_workspace_role(["owner", "admin", "developer", "viewer"])),
    db: AsyncSession = Depends(get_db),
):
    """List all projects in a given workspace."""
    projects = await ProjectService.list_projects(db, workspace_id)
    return projects


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project in a workspace and auto-ingest its repository into pgvector."""
    role_checker = require_workspace_role(["owner", "admin", "developer"])
    await role_checker(data.workspace_id, current_user, db)

    project = await ProjectService.create_project(db, data)
    await AuditService.log_action(
        db=db,
        workspace_id=project.workspace_id,
        user_id=current_user.id,
        action="CREATE_PROJECT",
        resource_type="project",
        resource_id=str(project.id),
        details={"name": project.name, "slug": project.slug},
    )

    # Ingest repository files & documents into pgvector
    if data.repository_full_name:
        token = await GitHubService.get_workspace_github_token(db, project.workspace_id)
        await RepoIngestionService.ingest_repository(
            db=db,
            project_id=project.id,
            repo_full_name=data.repository_full_name,
            token=token,
            default_branch=data.default_branch or "main",
        )

    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project: Project = Depends(get_project_with_access),
):
    """Get project details and linked repository."""
    return project


@router.post("/{project_id}/sync-repo")
async def sync_and_index_repository(
    project: Project = Depends(get_project_with_access),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Scan and index all files, documentation, and workflows in the linked GitHub repository into pgvector."""
    if not project.repository or not project.repository.repo_full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No repository linked to this project to sync",
        )

    token = await GitHubService.get_workspace_github_token(db, project.workspace_id)
    result = await RepoIngestionService.ingest_repository(
        db=db,
        project_id=project.id,
        repo_full_name=project.repository.repo_full_name,
        token=token,
        default_branch=project.default_branch or "main",
    )
    return result


@router.post("/{project_id}/repositories/connect", response_model=RepositoryResponse)
async def connect_repository(
    data: RepositoryConnectRequest,
    project: Project = Depends(get_project_with_access),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Connect a GitHub repository to the project and index its files into pgvector."""
    repo = await ProjectService.connect_repository(db, project.id, data)
    await AuditService.log_action(
        db=db,
        workspace_id=project.workspace_id,
        user_id=current_user.id,
        action="CONNECT_REPOSITORY",
        resource_type="repository",
        resource_id=str(repo.id),
        details={"repo_full_name": repo.repo_full_name, "github_repo_id": repo.github_repo_id},
    )

    token = await GitHubService.get_workspace_github_token(db, project.workspace_id)
    await RepoIngestionService.ingest_repository(
        db=db,
        project_id=project.id,
        repo_full_name=repo.repo_full_name,
        token=token,
        default_branch=data.default_branch or "main",
    )

    return repo
