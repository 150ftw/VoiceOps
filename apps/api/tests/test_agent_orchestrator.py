import uuid
import pytest
from app.agents.llm_provider import MockLLMProvider
from app.agents.orchestrator import AgentOrchestrator
from app.models.conversation import Conversation
from app.models.project import Project
from app.models.repository import Repository
from app.models.workspace import Workspace


@pytest.mark.asyncio
async def test_agent_orchestrator_mock_turn(test_db_session):
    ws = Workspace(name="Test WS", slug="test-ws", owner_id=uuid.uuid4())
    test_db_session.add(ws)
    await test_db_session.flush()

    proj = Project(workspace_id=ws.id, name="Demo App", slug="demo-app")
    test_db_session.add(proj)
    await test_db_session.flush()

    repo = Repository(
        project_id=proj.id,
        repo_full_name="voiceops/demo-app",
        github_repo_id=999,
        default_branch="main",
    )
    test_db_session.add(repo)
    await test_db_session.flush()

    conv = Conversation(project_id=proj.id, title="Test Turn")
    test_db_session.add(conv)
    await test_db_session.commit()

    events_emitted = []

    async def mock_event_cb(ev_type: str, payload: dict):
        events_emitted.append((ev_type, payload))

    orchestrator = AgentOrchestrator(llm_provider=MockLLMProvider())

    result = await orchestrator.process_user_turn(
        db=test_db_session,
        conversation_id=conv.id,
        user_message="Why did the deployment fail?",
        event_callback=mock_event_cb,
    )

    assert result["content"] is not None
    assert "workflow run (#1245)" in result["content"]
    assert any(e[0] == "agent.state.changed" for e in events_emitted)
    assert any(e[0] == "agent.response.completed" for e in events_emitted)
