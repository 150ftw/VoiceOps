import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: str
    content: str
    audio_url: Optional[str] = None
    metadata_json: Dict[str, Any] = {}
    created_at: datetime


class MessageCreate(BaseModel):
    content: str
    audio_url: Optional[str] = None


class ConversationStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    active_repo: Optional[str] = None
    active_workflow_id: Optional[int] = None
    active_run_id: Optional[int] = None
    active_pr_id: Optional[int] = None
    active_issue_id: Optional[int] = None
    intent: Optional[str] = None
    entities_json: Dict[str, Any] = {}
    summary: Optional[str] = None
    last_tool_results_json: Dict[str, Any] = {}
    updated_at: datetime


class ConversationCreate(BaseModel):
    project_id: uuid.UUID
    title: Optional[str] = "New DevOps Investigation"


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    state: Optional[ConversationStateResponse] = None
    messages: Optional[List[MessageResponse]] = None
