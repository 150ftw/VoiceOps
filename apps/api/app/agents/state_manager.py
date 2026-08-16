import uuid
from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.models.conversation_state import ConversationState


class ConversationStateManager:
    @staticmethod
    async def get_or_create_state(
        db: AsyncSession, conversation_id: uuid.UUID
    ) -> ConversationState:
        """Fetch existing conversation state or initialize a new one."""
        stmt = select(ConversationState).where(ConversationState.conversation_id == conversation_id)
        res = await db.execute(stmt)
        state = res.scalar_one_or_none()

        if not state:
            state = ConversationState(
                conversation_id=conversation_id,
                entities_json={},
                last_tool_results_json={},
            )
            db.add(state)
            await db.commit()
            await db.refresh(state)

        return state

    @staticmethod
    async def update_state(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        active_repo: Optional[str] = None,
        active_workflow_id: Optional[int] = None,
        active_run_id: Optional[int] = None,
        active_pr_id: Optional[int] = None,
        active_issue_id: Optional[int] = None,
        intent: Optional[str] = None,
        new_entities: Optional[Dict[str, Any]] = None,
        summary: Optional[str] = None,
        last_tool_results: Optional[Dict[str, Any]] = None,
    ) -> ConversationState:
        """Update context entities and session state."""
        state = await ConversationStateManager.get_or_create_state(db, conversation_id)

        if active_repo is not None:
            state.active_repo = active_repo
        if active_workflow_id is not None:
            state.active_workflow_id = active_workflow_id
        if active_run_id is not None:
            state.active_run_id = active_run_id
        if active_pr_id is not None:
            state.active_pr_id = active_pr_id
        if active_issue_id is not None:
            state.active_issue_id = active_issue_id
        if intent is not None:
            state.intent = intent
        if summary is not None:
            state.summary = summary

        if new_entities:
            merged = dict(state.entities_json or {})
            merged.update(new_entities)
            state.entities_json = merged

        if last_tool_results:
            state.last_tool_results_json = last_tool_results

        await db.commit()
        await db.refresh(state)
        return state
