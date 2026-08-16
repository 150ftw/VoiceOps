import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    status: str
    ip_address: Optional[str] = None
    details_json: Dict[str, Any] = {}
    created_at: datetime


class MetricsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_requests: int
    total_conversations: int
    total_tool_calls: int
    tool_success_rate: float
    avg_latency_ms: float
    active_sessions: int
