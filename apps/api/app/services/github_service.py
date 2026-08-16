import uuid
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.core.security import decrypt_secret, encrypt_secret
from app.github.client import GitHubClient
from app.models.integration import Integration
from app.models.project import Project
from app.models.repository import Repository


class GitHubService:
    @staticmethod
    async def get_workspace_github_token(
        db: AsyncSession, workspace_id: uuid.UUID
    ) -> Optional[str]:
        """Fetch and decrypt the active GitHub access token for a workspace."""
        stmt = select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider == "github",
        )
        res = await db.execute(stmt)
        integration = res.scalars().first()
        if not integration or not integration.encrypted_access_token:
            return None
        return decrypt_secret(integration.encrypted_access_token)

    @staticmethod
    async def get_project_github_token(
        db: AsyncSession, project_id: uuid.UUID
    ) -> Optional[str]:
        """Fetch and decrypt GitHub token for a project's workspace."""
        stmt = select(Project).where(Project.id == project_id)
        res = await db.execute(stmt)
        project = res.scalar_one_or_none()
        if not project:
            return None
        return await GitHubService.get_workspace_github_token(db, project.workspace_id)

    @staticmethod
    async def exchange_oauth_code(
        db: AsyncSession, workspace_id: uuid.UUID, code: str
    ) -> Integration:
        """Exchange temporary OAuth code for GitHub user access token."""
        url = "https://github.com/login/oauth/access_token"
        headers = {"Accept": "application/json"}
        data = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=data)
            token_data = response.json()

        access_token = token_data.get("access_token")
        if not access_token:
            err_msg = token_data.get("error_description", "Failed to retrieve access token from GitHub")
            raise RuntimeError(err_msg)

        encrypted_token = encrypt_secret(access_token)
        scopes = token_data.get("scope", "repo,workflow,read:org")

        stmt = select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider == "github",
        )
        res = await db.execute(stmt)
        integration = res.scalars().first()

        if integration:
            integration.encrypted_access_token = encrypted_token
            integration.scopes = scopes
            integration.metadata_json = {"token_type": token_data.get("token_type", "bearer")}
        else:
            integration = Integration(
                workspace_id=workspace_id,
                provider="github",
                encrypted_access_token=encrypted_token,
                scopes=scopes,
                metadata_json={"token_type": token_data.get("token_type", "bearer")},
            )
            db.add(integration)

        await db.commit()
        await db.refresh(integration)
        return integration

    @staticmethod
    async def connect_direct_token(
        db: AsyncSession, workspace_id: uuid.UUID, raw_token: str
    ) -> Integration:
        """Allow setting a GitHub Personal Access Token or fine-grained token for local dev/testing."""
        encrypted_token = encrypt_secret(raw_token.strip())
        
        # Test token validity by fetching user profile
        client = GitHubClient(token=raw_token.strip())
        try:
            user_data = await client._request("GET", "/user", token=raw_token.strip())
            login = user_data.get("login", "unknown")
        except Exception as e:
            raise ValueError(f"Invalid GitHub token: {str(e)}")

        stmt = select(Integration).where(
            Integration.workspace_id == workspace_id,
            Integration.provider == "github",
        )
        res = await db.execute(stmt)
        integration = res.scalars().first()

        if integration:
            integration.encrypted_access_token = encrypted_token
            integration.metadata_json = {"github_username": login, "auth_type": "pat"}
        else:
            integration = Integration(
                workspace_id=workspace_id,
                provider="github",
                encrypted_access_token=encrypted_token,
                scopes="repo,workflow,read:org",
                metadata_json={"github_username": login, "auth_type": "pat"},
            )
            db.add(integration)

        await db.commit()
        await db.refresh(integration)
        return integration
