import asyncio
import io
import json
import uuid
import httpx
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.database import Base, get_db
from app.main import app
from app.models import *
from app.schemas.auth import RegisterRequest, LoginRequest
from app.schemas.project import ProjectCreate
from app.schemas.conversation import ConversationCreate, MessageCreate
from app.schemas.approval import ApprovalDecisionRequest


async def run_system_verification():
    print("=" * 60)
    print("🔬 RUNNING END-TO-END SYSTEM VERIFICATION")
    print("=" * 60)

    # In-memory test db
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async def override_get_db():
        async with async_session() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        print("\n[1/8] 🩺 Checking /health endpoint...")
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("  ✓ Health check passed:", res.json())

        # 2. Registration
        print("\n[2/8] 👤 Testing User Registration & Workspace Provisioning...")
        email = f"dev_{uuid.uuid4().hex[:6]}@example.com"
        reg_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "Password123!",
                "full_name": "DevOps Engineer",
            },
        )
        assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
        auth_data = reg_res.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("  ✓ User registered & JWT issued:", email)

        # 3. User Profile
        print("\n[3/8] 🏢 Fetching User Profile & Workspaces...")
        me_res = await client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        user_info = me_res.json()
        assert len(user_info["workspaces"]) >= 1
        workspace_id = user_info["workspaces"][0]["id"]
        print(f"  ✓ Personal workspace verified: {workspace_id}")

        # 4. Project Creation & GitHub Repo Linking
        print("\n[4/8] 📦 Creating Project & Linking Repository...")
        proj_res = await client.post(
            "/api/v1/projects",
            headers=headers,
            json={
                "workspace_id": workspace_id,
                "name": "E-Commerce Checkout API",
                "slug": f"checkout-api-{uuid.uuid4().hex[:4]}",
                "description": "Payments and checkout service",
                "default_branch": "main",
                "repository_full_name": "acme/checkout-api",
                "github_repo_id": 998811,
            },
        )
        assert proj_res.status_code == 201, f"Project creation failed: {proj_res.text}"
        project_data = proj_res.json()
        project_id = project_data["id"]
        print(f"  ✓ Project created: {project_data['name']} (ID: {project_id})")

        # 5. RAG Document Upload & Indexing
        print("\n[5/8] 📚 Testing RAG Knowledge Base Document Ingestion...")
        doc_content = b"""# Production Deployment Runbook
## Required Environment Configuration
Production deployments require `DATABASE_URL`, `JWT_SECRET`, and `REDIS_URL`.

## Incident Response
In case of Docker build failures, verify Python version compatibility with dependencies.
"""
        files = {
            "file": ("runbook.md", io.BytesIO(doc_content), "text/markdown"),
        }
        data = {
            "project_id": str(project_id),
            "title": "Production Runbook",
        }
        doc_res = await client.post(
            "/api/v1/documents/upload",
            headers=headers,
            files=files,
            data=data,
        )
        assert doc_res.status_code == 201, f"Document upload failed: {doc_res.text}"
        doc_data = doc_res.json()
        print(f"  ✓ Runbook uploaded & indexed: {doc_data['title']} (Chunks: {doc_data['chunks_count']})")

        # 6. Conversation & Agent Turn Execution
        print("\n[6/8] 🤖 Testing Conversation Creation & Agent Turn Processing...")
        conv_res = await client.post(
            "/api/v1/conversations",
            headers=headers,
            json={
                "project_id": project_id,
                "title": "Diagnosis Session - Deployment Error",
            },
        )
        assert conv_res.status_code == 201
        conv_data = conv_res.json()
        conv_id = conv_data["id"]

        # Post user query to agent
        msg_res = await client.post(
            f"/api/v1/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": "Why did my deployment fail?"},
        )
        assert msg_res.status_code == 200, f"Message turn failed: {msg_res.text}"
        turn_response = msg_res.json()
        print("  ✓ Agent responded successfully:")
        print("    Content snippet:", turn_response["content"][:100], "...")

        # 7. Approvals Security Guardrail
        print("\n[7/8] 🛡️ Testing Action Approval Management...")
        app_list_res = await client.get(
            f"/api/v1/approvals?conversation_id={conv_id}",
            headers=headers,
        )
        assert app_list_res.status_code == 200
        print(f"  ✓ Approvals endpoint queried: {len(app_list_res.json())} pending approvals")

        # 8. Observability & Audit Logs
        print("\n[8/8] 📊 Testing Observability Metrics & Security Audit Logs...")
        metrics_res = await client.get(
            f"/api/v1/observability/metrics?workspace_id={workspace_id}",
            headers=headers,
        )
        assert metrics_res.status_code == 200
        metrics = metrics_res.json()
        print("  ✓ Metrics retrieved:", metrics)

        audit_res = await client.get(
            f"/api/v1/observability/audit-logs?workspace_id={workspace_id}",
            headers=headers,
        )
        assert audit_res.status_code == 200
        logs = audit_res.json()
        print(f"  ✓ Audit logs retrieved: {len(logs)} records logged")

    print("\n" + "=" * 60)
    print("✅ ALL 8/8 END-TO-END SUBSYSTEMS VERIFIED & WORKING PROPERLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_system_verification())
