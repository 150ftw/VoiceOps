import os
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.core.config import settings
from app.core.logging import logger


class LLMToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]


class LLMResponse(BaseModel):
    content: Optional[str] = None
    tool_calls: List[LLMToolCall] = []
    finish_reason: Optional[str] = None
    usage: Optional[Dict[str, int]] = None


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        """Generate response with optional structured tool calls."""
        pass


class OpenAILLMProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        try:
            resp = await self.client.chat.completions.create(**kwargs)
            choice = resp.choices[0]
            message = choice.message

            tool_calls = []
            if message.tool_calls:
                for tc in message.tool_calls:
                    try:
                        args = json.loads(tc.function.arguments)
                    except Exception:
                        args = {}
                    tool_calls.append(
                        LLMToolCall(
                            id=tc.id,
                            name=tc.function.name,
                            arguments=args,
                        )
                    )

            usage = None
            if resp.usage:
                usage = {
                    "prompt_tokens": resp.usage.prompt_tokens,
                    "completion_tokens": resp.usage.completion_tokens,
                    "total_tokens": resp.usage.total_tokens,
                }

            return LLMResponse(
                content=message.content,
                tool_calls=tool_calls,
                finish_reason=choice.finish_reason,
                usage=usage,
            )

        except Exception as e:
            logger.error("OpenAI API call failed", error=str(e))
            raise


class MockLLMProvider(BaseLLMProvider):
    """
    Intelligent context-aware DevOps LLM provider for realistic sandbox investigations,
    tool execution, diff analysis, approval workflows, and RAG doc retrieval.
    """

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        user_messages = [m for m in messages if m.get("role") == "user"]
        last_msg = user_messages[-1].get("content", "").lower().strip() if user_messages else ""
        has_tool_result = any(m.get("role") == "tool" for m in messages)
        tool_results = [m for m in messages if m.get("role") == "tool"]

        # ----------------------------------------------------------------------
        # 1. GITHUB ISSUE / ACTION CREATION INTENT (Requires Human Approval)
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["issue", "ticket", "open an issue", "create an issue", "report bug"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_issue_approval_1",
                            name="create_issue",
                            arguments={
                                "title": "Fix Python 3.13 bcrypt incompatibility in Dockerfile",
                                "body": (
                                    "### Problem Description\n"
                                    "CI/CD Workflow #1245 (Docker Build & Deploy) failed during package installation.\n\n"
                                    "### Root Cause\n"
                                    "The Dockerfile base image was upgraded to Python 3.13, which is incompatible with `bcrypt==3.2.0` (C-extension wheel compilation failure).\n\n"
                                    "### Recommended Fix\n"
                                    "1. Upgrade `bcrypt` in `requirements.txt` to `>= 4.0.0`, OR\n"
                                    "2. Revert base image in `Dockerfile` to `python:3.11-slim`."
                                ),
                                "labels": ["bug", "ci-cd", "docker", "python"],
                            },
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content="I have prepared the GitHub issue with full root-cause details and submitted it for your security approval.",
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 2. PULL REQUEST / PATCH INTENT (Requires Human Approval)
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["pull request", " pr", "pr ", "patch", "fix pr"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_pr_approval_1",
                            name="create_pull_request",
                            arguments={
                                "title": "fix: downgrade Docker base image to python:3.11-slim",
                                "head": "fix/docker-python-version",
                                "base": "main",
                                "body": "Reverts base image from Python 3.13 back to Python 3.11 to restore bcrypt compatibility and passing builds.",
                            },
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content="I have prepared the pull request `fix: downgrade Docker base image to python:3.11-slim` for your review and approval.",
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 3. DIFF / WHAT CHANGED BETWEEN BUILDS INTENT
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["changed", "diff", "difference", "between", "commit", "changes"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_compare_diff_1",
                            name="compare_commits",
                            arguments={"base": "e49fa12", "head": "a19b882"},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=(
                        "I compared the last passing commit (`e49fa12`) with the failed commit (`a19b882`):\n\n"
                        "• **File Changed:** `Dockerfile`\n"
                        "• **Diff:** `- FROM python:3.11-slim` \n"
                        "          `+ FROM python:3.13-slim`\n\n"
                        "**Impact:** `requirements.txt` still pinned `bcrypt==3.2.0`. On Python 3.13, pip tried to build wheels from source without gcc/musl-dev tools, causing the build to crash."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 4. RAG / DOCUMENTATION SEARCH INTENT
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["search", "doc", "runbook", "guide", "kubernetes", "database", "procedure", "knowledge"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_rag_search_1",
                            name="search_documentation",
                            arguments={"query": last_msg},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                # Inspect tool output
                rag_content = ""
                if tool_results:
                    try:
                        data = json.loads(tool_results[0].get("content", "{}"))
                        results = data.get("results", [])
                        if results:
                            rag_content = f"Found relevant runbook '{results[0].get('document_title', 'Production Runbook')}':\n> \"{results[0].get('content_excerpt', '')}\"\n\n"
                    except Exception:
                        pass

                return LLMResponse(
                    content=(
                        f"{rag_content}"
                        "According to the DevOps Runbook, if a Docker build fails on C-extension compilation, verify that base image python headers match package versions or pin binary wheels in `requirements.txt`."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 5. RETRY WORKFLOW INTENT
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["retry", "re-run", "rerun", "restart"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_retry_workflow_1",
                            name="retry_workflow",
                            arguments={"run_id": 1245},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content="I have requested a re-run for workflow run #1245.",
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 6. PIPELINE / WORKFLOW STATUS CHECK
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["status", "pipeline", "workflows", "all runs", "list"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_list_runs_1",
                            name="list_workflow_runs",
                            arguments={"limit": 3},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=(
                        "Here is the latest GitHub Actions status for `voiceops/demo-app`:\n"
                        "• **Run #1245 (Docker Build & Deploy):** ❌ Failed (exit code 1)\n"
                        "• **Run #1244 (Integration Tests):** ✅ Passed (duration: 1m 42s)\n"
                        "• **Run #1243 (Lint & Typecheck):** ✅ Passed (duration: 35s)"
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 7. DEPLOYMENT FAILURE / ERROR INVESTIGATION (Default Fallback)
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["why", "fail", "error", "broken", "investigate", "crash"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_logs_analysis_1",
                            name="get_workflow_logs",
                            arguments={"run_id": 1245},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=(
                        "I analyzed the build logs for failed workflow run (#1245):\n\n"
                        "• **Failed Step:** `pip install -r requirements.txt` in Dockerfile (Line 14)\n"
                        "• **Error Trace:** `TypeError: bcrypt 3.2.0 is incompatible with Python 3.13 runtime`\n"
                        "• **Root Cause:** Base image upgraded to Python 3.13 without upgrading bcrypt.\n"
                        "• **Recommended Action:** Upgrade bcrypt to `>= 4.0.0` or revert to Python 3.11. Shall I open an issue or PR for this?"
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 8. GENERAL ASSISTANT GREETING & CAPABILITIES
        # ----------------------------------------------------------------------
        return LLMResponse(
            content=(
                "I am VoiceOps, your AI DevOps Engineer. I can inspect your GitHub Actions pipelines, "
                "diagnose build failure logs, compare commit diffs, search runbook documentation with pgvector, "
                "and prepare approved issues or PRs. What would you like to investigate?"
            ),
            finish_reason="stop",
        )


def get_llm_provider() -> BaseLLMProvider:
    """Factory function returning configured LLM provider."""
    if settings.OPENAI_API_KEY:
        return OpenAILLMProvider(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
        )
    logger.warning("No OPENAI_API_KEY provided, using MockLLMProvider")
    return MockLLMProvider()
