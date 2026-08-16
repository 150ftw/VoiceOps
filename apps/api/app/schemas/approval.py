import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    tool_call_id: uuid.UUID
    action_type: str
    description: str
    payload_json: Dict[str, Any] = {}
    status: str
    approved_by_user_id: Optional[uuid.UUID] = None
    expires_at: datetime
    created_at: datetime
    updated_at: datetime


class ApprovalDecisionRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|approved|reject|rejected)$")
