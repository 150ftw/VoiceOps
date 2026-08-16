from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel


class ToolResult(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    requires_approval: bool = False
    approval_payload: Optional[Dict[str, Any]] = None


class BaseTool(ABC):
    name: str
    description: str
    is_write_action: bool = False
    parameters_schema: Dict[str, Any]

    @abstractmethod
    async def execute(self, context: Dict[str, Any], **kwargs) -> ToolResult:
        """Execute the tool with given arguments and runtime context."""
        pass

    def get_openai_tool_schema(self) -> Dict[str, Any]:
        """Convert tool definition to standard OpenAI / JSON function calling format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters_schema,
            },
        }
