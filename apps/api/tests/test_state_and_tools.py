import uuid
import pytest
from app.agents.approval_manager import ApprovalManager
from app.agents.state_manager import ConversationStateManager
from app.github.log_parser import LogParser
from app.models.conversation import Conversation
from app.models.project import Project
from app.models.workspace import Workspace
from app.tools.registry import tool_registry


def test_log_parser():
    raw_logs = """
2026-08-16T14:30:00.000Z \x1B[32mStarting build\x1B[0m
2026-08-16T14:30:01.000Z Step 1: Python version 3.13.0
2026-08-16T14:30:02.000Z Step 2: pip install -r requirements.txt
2026-08-16T14:30:05.000Z Building wheel for bcrypt (pyproject.toml) ... error
2026-08-16T14:30:06.000Z error: subprocess-exited-with-error
2026-08-16T14:30:07.000Z TypeError: bcrypt incompatible with Python 3.13
2026-08-16T14:30:08.000Z Process completed with exit code 1
"""
    parsed = LogParser.extract_failure_summary(raw_logs)
    assert parsed["error_count"] >= 1
    assert any("TypeError: bcrypt incompatible with Python 3.13" in line for line in parsed["error_lines"])
    assert "\x1B[32m" not in "".join(parsed["error_lines"])


def test_tool_registry():
    all_tools = tool_registry.get_all_tools()
    assert len(all_tools) >= 8

    run_tool = tool_registry.get_tool("list_workflow_runs")
    assert run_tool is not None
    assert run_tool.is_write_action is False

    issue_tool = tool_registry.get_tool("create_issue")
    assert issue_tool is not None
    assert issue_tool.is_write_action is True

    schemas = tool_registry.get_openai_tools()
    assert len(schemas) == len(all_tools)
    assert all("function" in s for s in schemas)


@pytest.mark.asyncio
async def test_conversation_state_manager(test_db_session):
    ws = Workspace(name="WS", slug="ws-1", owner_id=uuid.uuid4())
    test_db_session.add(ws)
    await test_db_session.flush()

    proj = Project(workspace_id=ws.id, name="P1", slug="p1")
    test_db_session.add(proj)
    await test_db_session.flush()

    conv = Conversation(project_id=proj.id, title="Test Conv")
    test_db_session.add(conv)
    await test_db_session.flush()

    state = await ConversationStateManager.get_or_create_state(test_db_session, conv.id)
    assert state.conversation_id == conv.id

    # Update state
    updated = await ConversationStateManager.update_state(
        db=test_db_session,
        conversation_id=conv.id,
        active_repo="acme/service",
        active_run_id=1245,
        intent="diagnose_deployment",
        new_entities={"env": "prod"},
    )
    assert updated.active_repo == "acme/service"
    assert updated.active_run_id == 1245
    assert updated.intent == "diagnose_deployment"
    assert updated.entities_json.get("env") == "prod"
