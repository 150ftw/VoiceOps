import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_workspace_role
from app.core.config import settings
from app.github.client import GitHubClient
from app.models.integration import Integration
from app.models.user import User
from app.schemas.integration import GitHubRepoItem, IntegrationResponse
from app.services.audit_service import AuditService
from app.services.github_service import GitHubService

router = APIRouter(prefix="/integrations", tags=["Integrations"])


class DirectTokenConnectRequest(BaseModel):
    token: str


class OAuthCallbackRequest(BaseModel):
    code: str
    workspace_id: uuid.UUID


@router.get("/github/auth-url")
async def get_github_auth_url(
    workspace_id: uuid.UUID,
    _member=Depends(require_workspace_role(["owner", "admin"])),
):
    """Generate GitHub OAuth 2.0 authorization URL."""
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GITHUB_CLIENT_ID is not configured in backend environment",
        )
    
    scope = "repo,workflow,read:org"
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&scope={scope}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&state={workspace_id}"
    )
    return {"auth_url": url}


@router.post("/github/connect-token", response_model=IntegrationResponse)
async def connect_direct_github_token(
    workspace_id: uuid.UUID,
    data: DirectTokenConnectRequest,
    current_user: User = Depends(get_current_user),
    _member=Depends(require_workspace_role(["owner", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Connect GitHub using a Personal Access Token / Fine-grained token."""
    try:
        integration = await GitHubService.connect_direct_token(db, workspace_id, data.token)
        await AuditService.log_action(
            db=db,
            workspace_id=workspace_id,
            user_id=current_user.id,
            action="CONNECT_GITHUB_INTEGRATION",
            resource_type="integration",
            resource_id=str(integration.id),
            details={"provider": "github", "auth_type": "pat"},
        )
        return integration
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect GitHub: {str(e)}",
        )


@router.post("/github/callback", response_model=IntegrationResponse)
async def github_oauth_callback(
    data: OAuthCallbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth redirect code and store encrypted access token."""
    role_checker = require_workspace_role(["owner", "admin"])
    await role_checker(data.workspace_id, current_user, db)

    try:
        integration = await GitHubService.exchange_oauth_code(db, data.workspace_id, data.code)
        await AuditService.log_action(
            db=db,
            workspace_id=data.workspace_id,
            user_id=current_user.id,
            action="CONNECT_GITHUB_OAUTH",
            resource_type="integration",
            resource_id=str(integration.id),
            details={"provider": "github"},
        )
        return integration
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth exchange failed: {str(e)}",
        )


@router.get("/github/repositories", response_model=List[GitHubRepoItem])
async def list_github_repositories(
    workspace_id: uuid.UUID,
    _member=Depends(require_workspace_role(["owner", "admin", "developer"])),
    db: AsyncSession = Depends(get_db),
):
    """List all accessible GitHub repositories for the connected integration."""
    token = await GitHubService.get_workspace_github_token(db, workspace_id)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub is not connected for this workspace",
        )

    client = GitHubClient(token=token)
    try:
        repos = await client.list_user_repositories(token)
        results = []
        for r in repos:
            results.append(
                GitHubRepoItem(
                    id=r["id"],
                    name=r["name"],
                    full_name=r["full_name"],
                    private=r["private"],
                    html_url=r["html_url"],
                    description=r.get("description"),
                    default_branch=r.get("default_branch", "main"),
                    updated_at=r.get("updated_at"),
                )
            )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch repositories from GitHub: {str(e)}",
        )


@router.get("/github/status")
async def get_github_integration_status(
    workspace_id: uuid.UUID,
    _member=Depends(require_workspace_role(["owner", "admin", "developer", "viewer"])),
    db: AsyncSession = Depends(get_db),
):
    """Check if GitHub integration is active and valid."""
    stmt = select(Integration).where(
        Integration.workspace_id == workspace_id,
        Integration.provider == "github",
    )
    res = await db.execute(stmt)
    integration = res.scalars().first()

    if not integration:
        return {"connected": False}

    token = await GitHubService.get_workspace_github_token(db, workspace_id)
    if not token:
        return {"connected": False}

    return {
        "connected": True,
        "provider": "github",
        "scopes": integration.scopes,
        "metadata": integration.metadata_json,
        "updated_at": integration.updated_at,
    }


@router.delete("/github/disconnect")
async def disconnect_github(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    _member=Depends(require_workspace_role(["owner", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    """Remove GitHub integration for the workspace."""
    stmt = select(Integration).where(
        Integration.workspace_id == workspace_id,
        Integration.provider == "github",
    )
    res = await db.execute(stmt)
    integration = res.scalars().first()

    if integration:
        await db.delete(integration)
        await db.commit()
        await AuditService.log_action(
            db=db,
            workspace_id=workspace_id,
            user_id=current_user.id,
            action="DISCONNECT_GITHUB_INTEGRATION",
            resource_type="integration",
            resource_id=str(integration.id),
            details={"provider": "github"},
        )

    return {"message": "GitHub integration disconnected successfully"}
