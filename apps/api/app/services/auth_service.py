import uuid
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
    encrypt_secret,
)
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.integration import Integration
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    @staticmethod
    async def register(
        db: AsyncSession, data: RegisterRequest
    ) -> Tuple[User, TokenResponse, str]:
        """Register a new user, create default workspace, and issue tokens."""
        stmt = select(User).where(User.email == data.email.lower().strip())
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists",
            )

        hashed_pw = get_password_hash(data.password)
        new_user = User(
            email=data.email.lower().strip(),
            hashed_password=hashed_pw,
            full_name=data.full_name.strip(),
        )
        db.add(new_user)
        await db.flush()

        # Create default personal workspace
        slug = f"{data.full_name.lower().replace(' ', '-')[:20]}-{uuid.uuid4().hex[:6]}"
        default_workspace = Workspace(
            name=f"{data.full_name}'s Workspace",
            slug=slug,
            owner_id=new_user.id,
        )
        db.add(default_workspace)
        await db.flush()

        # Add member role as owner
        member = WorkspaceMember(
            workspace_id=default_workspace.id,
            user_id=new_user.id,
            role="owner",
        )
        db.add(member)
        await db.flush()

        # Auto-provision default starter DevOps project
        from app.models.project import Project
        from app.models.repository import Repository

        starter_proj = Project(
            workspace_id=default_workspace.id,
            name="Demo Microservices App",
            slug=f"demo-app-{uuid.uuid4().hex[:4]}",
            description="Starter DevOps investigation repository",
            default_branch="main",
        )
        db.add(starter_proj)
        await db.flush()

        starter_repo = Repository(
            project_id=starter_proj.id,
            repo_full_name="voiceops/demo-app",
            github_repo_id=987654,
            default_branch="main",
            is_active=True,
        )
        db.add(starter_repo)

        await db.commit()
        await db.refresh(new_user)

        access_token = create_access_token(new_user.id)
        refresh_token = create_refresh_token(new_user.id)
        token_resp = TokenResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        return new_user, token_resp, refresh_token

    @staticmethod
    async def login(
        db: AsyncSession, data: LoginRequest
    ) -> Tuple[User, TokenResponse, str]:
        """Authenticate user by email/password and return tokens."""
        stmt = (
            select(User)
            .options(selectinload(User.workspace_memberships))
            .where(User.email == data.email.lower().strip())
        )
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        token_resp = TokenResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        return user, token_resp, refresh_token

    @staticmethod
    async def github_login(
        db: AsyncSession,
        code: Optional[str] = None,
        demo_user: bool = False,
    ) -> Tuple[User, TokenResponse, str]:
        """
        Authenticate or register a user via GitHub OAuth.
        Stores encrypted GitHub token in workspace integrations.
        """
        import httpx

        gh_email = None
        gh_name = None
        gh_avatar = None
        gh_token = None

        if code and settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET and not demo_user:
            # 1. Exchange OAuth code for GitHub token
            token_url = "https://github.com/login/oauth/access_token"
            headers = {"Accept": "application/json"}
            data = {
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(token_url, headers=headers, json=data)
                token_data = resp.json()
                gh_token = token_data.get("access_token")

                if not gh_token:
                    err_desc = token_data.get("error_description", "Failed to exchange GitHub OAuth code")
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_desc)

                # 2. Fetch User Profile
                user_resp = await client.get(
                    "https://api.github.com/user",
                    headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/json"},
                )
                user_data = user_resp.json()
                gh_name = user_data.get("name") or user_data.get("login") or "GitHub User"
                gh_avatar = user_data.get("avatar_url")
                gh_email = user_data.get("email")

                # 3. Fetch User Emails if email is private
                if not gh_email:
                    emails_resp = await client.get(
                        "https://api.github.com/user/emails",
                        headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/json"},
                    )
                    emails_data = emails_resp.json()
                    if isinstance(emails_data, list):
                        primary = next((e for e in emails_data if e.get("primary") and e.get("verified")), None)
                        if primary:
                            gh_email = primary.get("email")
                        elif emails_data:
                            gh_email = emails_data[0].get("email")
        else:
            # Sandbox / Demo GitHub Login (for portfolio review)
            gh_name = "GitHub Developer"
            gh_email = "dev.github@voiceops.io"
            gh_avatar = "https://avatars.githubusercontent.com/u/9919?v=4"
            gh_token = "ghp_demo_mock_access_token_voiceops"

        if not gh_email:
            gh_email = f"github_user_{uuid.uuid4().hex[:6]}@voiceops.io"

        # Check if user already exists
        stmt = (
            select(User)
            .options(selectinload(User.workspace_memberships))
            .where(User.email == gh_email.lower().strip())
        )
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                email=gh_email.lower().strip(),
                full_name=gh_name,
                avatar_url=gh_avatar,
                is_active=True,
            )
            db.add(user)
            await db.flush()

            # Create default personal workspace
            slug = f"{gh_name.lower().replace(' ', '-')[:20]}-{uuid.uuid4().hex[:6]}"
            default_workspace = Workspace(
                name=f"{gh_name}'s Workspace",
                slug=slug,
                owner_id=user.id,
            )
            db.add(default_workspace)
            await db.flush()
        else:
            if gh_avatar and user.avatar_url != gh_avatar:
                user.avatar_url = gh_avatar
                await db.flush()

            # Add member role as owner
            member = WorkspaceMember(
                workspace_id=default_workspace.id,
                user_id=user.id,
                role="owner",
            )
            db.add(member)
            await db.flush()

            # Auto-provision starter DevOps project
            from app.models.project import Project
            from app.models.repository import Repository

            starter_proj = Project(
                workspace_id=default_workspace.id,
                name="Demo Microservices App",
                slug=f"demo-app-{uuid.uuid4().hex[:4]}",
                description="Starter DevOps investigation repository",
                default_branch="main",
            )
            db.add(starter_proj)
            await db.flush()

            starter_repo = Repository(
                project_id=starter_proj.id,
                repo_full_name="voiceops/demo-app",
                github_repo_id=987654,
                default_branch="main",
                is_active=True,
            )
            db.add(starter_repo)
            workspace_id = default_workspace.id
        else:
            # Existing user - get their primary workspace
            stmt_ws = select(Workspace).where(Workspace.owner_id == user.id)
            res_ws = await db.execute(stmt_ws)
            ws = res_ws.scalar_one_or_none()
            workspace_id = ws.id if ws else None

        # Store or update encrypted GitHub token in integrations table
        if workspace_id and gh_token:
            stmt_int = select(Integration).where(
                Integration.workspace_id == workspace_id,
                Integration.provider == "github",
            )
            res_int = await db.execute(stmt_int)
            existing_int = res_int.scalar_one_or_none()

            enc_token = encrypt_secret(gh_token)
            if existing_int:
                existing_int.encrypted_access_token = enc_token
                existing_int.metadata_json = {"auth_type": "oauth", "github_username": gh_name}
            else:
                new_int = Integration(
                    workspace_id=workspace_id,
                    provider="github",
                    encrypted_access_token=enc_token,
                    scopes="repo,workflow,read:org",
                    metadata_json={"auth_type": "oauth", "github_username": gh_name},
                )
                db.add(new_int)

        await db.commit()
        await db.refresh(user)

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        token_resp = TokenResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        return user, token_resp, refresh_token

    @staticmethod
    async def refresh_tokens(
        db: AsyncSession, refresh_token: str
    ) -> Tuple[TokenResponse, str]:
        """Validate refresh token and issue new token pair."""
        token_data = decode_token(refresh_token)
        if not token_data or token_data.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        user_id_str = token_data.get("sub")
        try:
            user_id = uuid.UUID(user_id_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token subject",
            )

        stmt = select(User).where(User.id == user_id, User.is_active == True)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        new_access = create_access_token(user.id)
        new_refresh = create_refresh_token(user.id)
        token_resp = TokenResponse(
            access_token=new_access,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        return token_resp, new_refresh
