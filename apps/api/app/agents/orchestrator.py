import json
import time
import uuid
from typing import Any, Callable, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.approval_manager import ApprovalManager
from app.agents.llm_provider import BaseLLMProvider, get_llm_provider
from app.agents.prompts import VOICEOPS_SYSTEM_PROMPT
from app.agents.state_manager import ConversationStateManager
from app.core.logging import logger
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.project import Project
from app.models.repository import Repository
from app.models.tool_call import ToolCall
from app.services.github_service import GitHubService
from app.tools.registry import tool_registry


class AgentOrchestrator:
    """Coordinates stateful multi-turn DevOps investigation, tool execution, and safe approval flows."""

    def __init__(self, llm_provider: Optional[BaseLLMProvider] = None):
        self.llm = llm_provider or get_llm_provider()

    async def process_user_turn(
        self,
        db: AsyncSession,
        conversation_id: uuid.UUID,
        user_message: str,
        audio_url: Optional[str] = None,
        event_callback: Optional[Callable[[str, Dict[str, Any]], Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process incoming user input through the stateful agent loop.
        Calls optional event_callback(event_type, payload) for live streaming.
        """
        # Helper to safely emit events
        async def emit(event_type: str, payload: Dict[str, Any]):
            if event_callback:
                try:
                    await event_callback(event_type, payload)
                except Exception as cb_err:
                    logger.debug("Event callback error", error=str(cb_err))

        await emit("agent.state.changed", {"state": "thinking"})

        # Load conversation & project
        stmt_conv = (
            select(Conversation)
            .options(selectinload(Conversation.project).selectinload(Project.repository))
            .where(Conversation.id == conversation_id)
        )
        res_conv = await db.execute(stmt_conv)
        conv = res_conv.scalar_one_or_none()
        if not conv:
            raise ValueError(f"Conversation {conversation_id} not found")

        project = conv.project
        repo = project.repository if project else None
        repo_full_name = repo.repo_full_name if repo else None

        # Fetch GitHub token
        github_token = None
        if project:
            github_token = await GitHubService.get_project_github_token(db, project.id)

        # Load state
        state = await ConversationStateManager.get_or_create_state(db, conversation_id)
        if repo_full_name and not state.active_repo:
            state.active_repo = repo_full_name
            await db.commit()

        # Save user message to database
        user_msg_record = Message(
            conversation_id=conversation_id,
            sender_type="user",
            content=user_message,
            audio_url=audio_url,
        )
        db.add(user_msg_record)
        await db.commit()

        # Build execution context for tools
        context = {
            "db": db,
            "project_id": project.id if project else None,
            "repo_full_name": state.active_repo or repo_full_name,
            "github_token": github_token,
            "conversation_id": conversation_id,
        }

        # Build prompt history
        stmt_msgs = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        res_msgs = await db.execute(stmt_msgs)
        past_msgs = res_msgs.scalars().all()

        messages_payload: List[Dict[str, Any]] = [
            {
                "role": "system",
                "content": (
                    f"{VOICEOPS_SYSTEM_PROMPT}\n\n"
                    f"CURRENT PROJECT CONTEXT:\n"
                    f"- Project Name: {project.name if project else 'Unknown'}\n"
                    f"- Linked GitHub Repository: {state.active_repo or repo_full_name or 'None connected'}\n"
                    f"- Active Workflow Run ID: {state.active_run_id or 'None'}\n"
                    f"- Active PR: {state.active_pr_id or 'None'}\n"
                    f"- Active Issue: {state.active_issue_id or 'None'}\n"
                ),
            }
        ]

        for m in past_msgs[-10:]:  # Keep recent history
            role = "user" if m.sender_type == "user" else "assistant"
            messages_payload.append({"role": role, "content": m.content})

        tools_schema = tool_registry.get_openai_tools()
        max_turns = 5
        turn_count = 0
        final_text = ""
        citations: List[Dict[str, Any]] = []
        pending_approval_data = None

        while turn_count < max_turns:
            turn_count += 1
            response = await self.llm.generate_response(messages_payload, tools=tools_schema)

            if not response.tool_calls:
                final_text = response.content or "Investigation complete."
                break

            # Handle tool calls
            for tc in response.tool_calls:
                tool_name = tc.name
                tool_args = tc.arguments
                tool_inst = tool_registry.get_tool(tool_name)

                label = f"Calling tool: {tool_name}"
                if tool_name == "list_workflow_runs":
                    label = "Inspecting recent CI/CD workflow runs"
                elif tool_name == "get_workflow_logs":
                    label = f"Analyzing failure logs for run #{tool_args.get('run_id')}"
                elif tool_name == "search_documentation":
                    label = f"Searching documentation for '{tool_args.get('query')}'"
                elif tool_name == "compare_commits":
                    label = f"Comparing commit diffs ({tool_args.get('base', '')[:7]}...{tool_args.get('head', '')[:7]})"
                elif tool_name == "create_issue":
                    label = f"Preparing issue: {tool_args.get('title')}"

                await emit("agent.activity.step", {"id": tc.id, "label": label, "status": "running"})
                await emit("agent.tool.started", {"tool": tool_name, "args": tool_args})

                if not tool_inst:
                    tool_output = {"error": f"Tool '{tool_name}' not found"}
                else:
                    start_time = time.time()
                    tool_result = await tool_inst.execute(context, **tool_args)
                    exec_time = int((time.time() - start_time) * 1000)

                    if tool_result.requires_approval:
                        # Write action requiring human approval
                        approval, tc_rec = await ApprovalManager.create_pending_approval(
                            db=db,
                            conversation_id=conversation_id,
                            tool_name=tool_name,
                            tool_args=tool_args,
                            approval_payload=tool_result.approval_payload or {},
                        )
                        pending_approval_data = {
                            "approval_id": str(approval.id),
                            "action_type": approval.action_type,
                            "description": approval.description,
                            "payload": approval.payload_json,
                        }
                        await emit("agent.activity.step", {"id": tc.id, "label": f"{label} (Requires Approval)", "status": "pending"})
                        await emit("agent.approval.required", pending_approval_data)

                        final_text = (
                            f"I have prepared the following action:\n"
                            f"**{approval.description}**\n\n"
                            f"Please confirm whether you approve this action."
                        )
                        break

                    # Record successful or failed read tool call
                    tc_record = ToolCall(
                        conversation_id=conversation_id,
                        tool_name=tool_name,
                        arguments_json=tool_args,
                        result_json=tool_result.data if tool_result.success else None,
                        status="success" if tool_result.success else "failed",
                        execution_time_ms=exec_time,
                        error_message=tool_result.error,
                    )
                    db.add(tc_record)
                    await db.commit()

                    if tool_result.success:
                        tool_output = tool_result.data
                        await emit("agent.activity.step", {"id": tc.id, "label": label, "status": "completed"})
                        await emit("agent.tool.completed", {"tool": tool_name, "summary": "Success"})
                        
                        # Collect RAG citations if applicable
                        if tool_name == "search_documentation" and isinstance(tool_output, dict):
                            for r in tool_output.get("results", []):
                                citations.append(r)
                                
                        # Update state pointers if discovered
                        if tool_name == "get_workflow_logs" and "run_id" in tool_args:
                            state.active_run_id = tool_args["run_id"]
                    else:
                        tool_output = {"error": tool_result.error}
                        await emit("agent.activity.step", {"id": tc.id, "label": label, "status": "failed"})
                        await emit("agent.error", {"code": "TOOL_ERROR", "message": tool_result.error})

                # Feed tool result back to LLM context
                messages_payload.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tool_name,
                    "content": json.dumps(tool_output),
                })

            if pending_approval_data:
                break

        # Save assistant message to database
        agent_msg_record = Message(
            conversation_id=conversation_id,
            sender_type="agent",
            content=final_text,
            metadata_json={"sources": citations, "pending_approval": pending_approval_data},
        )
        db.add(agent_msg_record)
        await db.commit()

        if citations:
            await emit("agent.sources", {"sources": citations})

        await emit("agent.response.completed", {"text": final_text, "message_id": str(agent_msg_record.id)})
        await emit("agent.state.changed", {"state": "idle"})

        return {
            "message_id": str(agent_msg_record.id),
            "content": final_text,
            "citations": citations,
            "pending_approval": pending_approval_data,
        }
