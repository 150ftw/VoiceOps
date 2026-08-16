import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.orchestrator import AgentOrchestrator
from app.agents.state_manager import ConversationStateManager
from app.api.deps import get_current_user, get_db, get_project_with_access
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationStateResponse,
    MessageCreate,
    MessageResponse,
)

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations in a project."""
    await get_project_with_access(project_id, current_user, db)

    stmt = (
        select(Conversation)
        .options(
            selectinload(Conversation.state),
            selectinload(Conversation.messages),
        )
        .where(Conversation.project_id == project_id, Conversation.status == "active")
        .order_by(Conversation.updated_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new DevOps investigation conversation."""
    await get_project_with_access(data.project_id, current_user, db)

    conv = Conversation(
        project_id=data.project_id,
        user_id=current_user.id,
        title=data.title or "New DevOps Investigation",
    )
    db.add(conv)
    await db.flush()

    # Initialize state
    await ConversationStateManager.get_or_create_state(db, conv.id)
    await db.commit()
    await db.refresh(conv)

    # Reload with state and messages
    stmt_reload = (
        select(Conversation)
        .options(
            selectinload(Conversation.state),
            selectinload(Conversation.messages),
        )
        .where(Conversation.id == conv.id)
    )
    res_reload = await db.execute(stmt_reload)
    return res_reload.scalar_one()


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full conversation details, state, and message history."""
    stmt = (
        select(Conversation)
        .options(
            selectinload(Conversation.state),
            selectinload(Conversation.messages),
        )
        .where(Conversation.id == conversation_id)
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await get_project_with_access(conv.project_id, current_user, db)
    return conv


@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Archive or delete a conversation."""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await get_project_with_access(conv.project_id, current_user, db)
    conv.status = "archived"
    await db.commit()
    return {"message": "Conversation archived"}


@router.post("/{conversation_id}/messages")
async def post_message(
    conversation_id: uuid.UUID,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Post a user message and execute the agent turn synchronously."""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await get_project_with_access(conv.project_id, current_user, db)

    orchestrator = AgentOrchestrator()
    result = await orchestrator.process_user_turn(
        db=db,
        conversation_id=conversation_id,
        user_message=data.content,
        audio_url=data.audio_url,
    )
    return result


@router.delete("/{conversation_id}/messages")
@router.post("/{conversation_id}/clear")
async def clear_conversation_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all messages in a conversation and reset the session state."""
    from sqlalchemy import delete

    stmt = select(Conversation).where(Conversation.id == conversation_id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await get_project_with_access(conv.project_id, current_user, db)

    # Delete all messages for this conversation
    stmt_del = delete(Message).where(Message.conversation_id == conversation_id)
    await db.execute(stmt_del)
    await db.commit()

    return {"message": "Chat history cleared successfully"}

