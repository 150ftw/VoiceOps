import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from app.core.database import get_db
from app.main import app


@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["app"] == "VoiceOps"


@pytest.mark.asyncio
async def test_auth_and_protected_routes(test_db_session):
    async def override_get_db():
        yield test_db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register
        email = f"testuser_{uuid.uuid4().hex[:6]}@example.com"
        reg_res = await ac.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "Password12345!",
                "full_name": "Test DevOps User",
            },
        )
        assert reg_res.status_code == 201
        token_data = reg_res.json()
        token = token_data["access_token"]
        assert token is not None

        # Call /me with Bearer token
        me_res = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        user_info = me_res.json()
        assert user_info["email"] == email
        assert len(user_info["workspaces"]) >= 1

        workspace_id = user_info["workspaces"][0]["id"]

        # Create Project
        proj_res = await ac.post(
            "/api/v1/projects",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "workspace_id": workspace_id,
                "name": "Production Microservice",
                "slug": f"prod-service-{uuid.uuid4().hex[:4]}",
                "description": "Critical checkout service",
                "default_branch": "main",
                "repository_full_name": "acme/checkout-service",
                "github_repo_id": 888123,
            },
        )
        assert proj_res.status_code == 201
        proj_data = proj_res.json()
        assert proj_data["name"] == "Production Microservice"

        # List Projects
        list_proj = await ac.get(
            f"/api/v1/projects?workspace_id={workspace_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert list_proj.status_code == 200
        assert len(list_proj.json()) >= 1

    app.dependency_overrides.clear()
