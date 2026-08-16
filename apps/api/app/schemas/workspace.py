import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.auth import UserResponse


class WorkspaceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    user: UserResponse
    role: str
    created_at: datetime


class WorkspaceMemberCreate(BaseModel):
    email: str
    role: str = Field(default="developer", pattern="^(owner|admin|developer|viewer)$")


class WorkspaceResponse(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    role: Optional[str] = None
    created_at: datetime
    updated_at: datetime
