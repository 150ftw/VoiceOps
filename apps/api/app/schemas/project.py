import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class RepositoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    repo_full_name: str
    github_repo_id: int
    default_branch: str
    is_active: bool
    metadata_json: Dict[str, Any] = {}
    created_at: datetime


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    default_branch: str = "main"


class ProjectCreate(ProjectBase):
    workspace_id: uuid.UUID
    repository_full_name: Optional[str] = None
    github_repo_id: Optional[int] = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    repository: Optional[RepositoryResponse] = None
    created_at: datetime
    updated_at: datetime


class RepositoryConnectRequest(BaseModel):
    repo_full_name: str
    github_repo_id: int
    default_branch: str = "main"
