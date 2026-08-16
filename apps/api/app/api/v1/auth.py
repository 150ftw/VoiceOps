from typing import Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserWithWorkspacesResponse,
)
from app.services.auth_service import AuthService
from app.services.workspace_service import WorkspaceService

router = APIRouter(prefix="/auth", tags=["Authentication"])


class GitHubLoginRequest(BaseModel):
    code: Optional[str] = None
    demo_user: bool = False


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user, create a default workspace, and set refresh cookie."""
    user, token_resp, refresh_token = await AuthService.register(db, data)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )
    return token_resp


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate user with email and password."""
    user, token_resp, refresh_token = await AuthService.login(db, data)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )
    return token_resp


class GitHubConfigureRequest(BaseModel):
    client_id: str
    client_secret: str


@router.post("/github/configure")
async def configure_github_oauth(data: GitHubConfigureRequest):
    """Dynamically set GitHub OAuth client credentials."""
    settings.GITHUB_CLIENT_ID = data.client_id.strip()
    settings.GITHUB_CLIENT_SECRET = data.client_secret.strip()
    scope = "user:email,repo,workflow,read:org"
    auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&scope={scope}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
    )
    return {"configured": True, "auth_url": auth_url}


@router.get("/github/url")
async def get_github_auth_url():
    """Get GitHub OAuth Authorization URL or configuration status."""
    if not settings.GITHUB_CLIENT_ID:
        return {
            "configured": False,
            "auth_url": None,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
            "demo_available": True,
        }
    
    scope = "user:email,repo,workflow,read:org"
    auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&scope={scope}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
    )
    return {
        "configured": True,
        "auth_url": auth_url,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "demo_available": True,
    }


@router.post("/github/login", response_model=TokenResponse)
async def github_login(
    data: GitHubLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate or register a user using GitHub OAuth or one-click demo GitHub login."""
    user, token_resp, refresh_token = await AuthService.github_login(
        db, code=data.code, demo_user=data.demo_user
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )
    return token_resp


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    response: Response,
    refresh_token: str = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    """Issue a new access token using the HTTP-only refresh token."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie missing",
        )
    token_resp, new_refresh = await AuthService.refresh_tokens(db, refresh_token)
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
    )
    return token_resp


@router.post("/logout")
async def logout(response: Response):
    """Clear refresh cookie and terminate session."""
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserWithWorkspacesResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the profile and workspace list of the authenticated user."""
    workspaces_with_roles = await WorkspaceService.list_user_workspaces(db, current_user.id)
    ws_list = []
    for ws, role in workspaces_with_roles:
        ws_dict = {
            "id": ws.id,
            "name": ws.name,
            "slug": ws.slug,
            "owner_id": ws.owner_id,
            "role": role,
            "created_at": ws.created_at,
        }
        ws_list.append(ws_dict)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "workspaces": ws_list,
    }
