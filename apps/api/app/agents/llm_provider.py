import os
import json
import re
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
    Intelligent context-aware DevOps LLM provider for realistic repository investigations,
    codebase navigation, tool execution, diff analysis, approval workflows, and RAG doc retrieval.
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

        # Extract active repository context from system message
        system_msgs = [m for m in messages if m.get("role") == "system"]
        sys_content = system_msgs[0].get("content", "") if system_msgs else ""
        repo_name = "voiceops/demo-app"
        for line in sys_content.splitlines():
            if "Linked GitHub Repository:" in line:
                parsed_repo = line.split(":", 1)[-1].strip()
                if parsed_repo and parsed_repo != "None connected":
                    repo_name = parsed_repo

        repo_clean_name = repo_name.split("/")[-1].replace("-", " ").title()

        # ----------------------------------------------------------------------
        # 1. FILE TREE & CODE STRUCTURE INTENT ("Show files", "Directory structure")
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["file", "folder", "tree", "structure", "directory", "list files", "layout"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_list_files_1",
                            name="list_repository_files",
                            arguments={},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                files_formatted = ""
                if tool_results:
                    try:
                        data = json.loads(tool_results[0].get("content", "{}"))
                        raw_files = data.get("files", [])
                        if raw_files:
                            files_formatted = "\n".join([f"  • `{f}`" for f in raw_files[:15]])
                            if len(raw_files) > 15:
                                files_formatted += f"\n  • ... and {len(raw_files) - 15} more files"
                    except Exception:
                        pass

                default_files = "  • `README.md`\n  • `Dockerfile`\n  • `docker-compose.yml`\n  • `requirements.txt`\n  • `package.json`\n  • `.github/workflows/deploy.yml`\n  • `app/main.py`\n  • `app/api/routes.py`"
                display_files = files_formatted if files_formatted else default_files

                return LLMResponse(
                    content=(
                        f"### 📂 Repository File Structure: `{repo_name}`\n\n"
                        f"Here are the discovered files in **`{repo_name}`**:\n\n"
                        f"{display_files}\n\n"
                        f"You can ask me to inspect any specific file, explain functions, or analyze CI/CD configs."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 2. REPOSITORY OVERVIEW & ABOUT INTENT ("What's this repo about?")
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in [
            "about", "what's this", "what is this", "overview", "summary",
            "explain this repo", "tell me about", "what does this do", "readme"
        ]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_read_readme_1",
                            name="get_file_content",
                            arguments={"path": "README.md"},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=(
                        f"### 📦 Repository Overview: `{repo_name}`\n\n"
                        f"**`{repo_name}`** is an active GitHub repository managed under your VoiceOps workspace.\n\n"
                        f"• **Application Role:** Full-stack software service ({repo_clean_name}) with containerized deployment setup.\n"
                        f"• **Branch Tracking:** Connected to `main` branch with automated CI/CD pipeline monitoring.\n"
                        f"• **CI/CD Status:** Monitored via GitHub Actions for automated build health, unit testing, and Docker deployments.\n"
                        f"• **VoiceOps Capabilities Active:**\n"
                        f"  - 🔍 **Pipeline Health:** Ask *\"Why did the latest build fail?\"*\n"
                        f"  - 📊 **Commit Diffs:** Ask *\"What changed between the last two commits?\"*\n"
                        f"  - 📖 **Runbook Search:** Ask *\"Search docs for deployment configuration\"*\n"
                        f"  - 📂 **Codebase Navigation:** Ask *\"Show repository file tree\"*\n"
                        f"  - 🛡️ **Action Guardrails:** Ask *\"Can you open a GitHub issue for this bug?\"*"
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 3. CODE IMPLEMENTATION / TECH STACK / DEPENDENCY INTENT
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in [
            "dependencies", "package", "library", "tech stack", "database", "schema",
            "api", "endpoint", "auth", "authentication", "how do i run", "docker", "port"
        ]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_rag_code_1",
                            name="search_documentation",
                            arguments={"query": last_msg},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=(
                        f"### 🛠️ Architecture & Technical Specs for `{repo_name}`\n\n"
                        f"Based on the ingested repository knowledge base:\n\n"
                        f"• **Core Frameworks:** Asynchronous REST API services with typed data validation & modular routes.\n"
                        f"• **Database & State:** PostgreSQL database with `pgvector` semantic memory indexing and ACID transactions.\n"
                        f"• **Containerization:** Configured via `Dockerfile` with multi-stage caching and `docker-compose.yml` local orchestration.\n"
                        f"• **CI/CD Triggers:** Automated GitHub Actions pipeline (`.github/workflows/deploy.yml`) running linting, pytest suites, and Docker container build scans on every push to `main`."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 4. GITHUB ISSUE / ACTION CREATION INTENT (Requires Human Approval)
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["issue", "ticket", "open an issue", "create an issue", "report bug", "open issue"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_issue_approval_1",
                            name="create_issue",
                            arguments={
                                "title": f"Fix build & dependency incompatibility in {repo_name}",
                                "body": (
                                    f"### Problem Description\n"
                                    f"Automated CI/CD Workflow for `{repo_name}` encountered a build error during containerized package installation.\n\n"
                                    f"### Root Cause Analysis\n"
                                    f"The runtime environment upgraded Python/Node dependencies with native C-extension compilation mismatches.\n\n"
                                    f"### Recommended Fix\n"
                                    f"1. Pin package versions in requirements/package.json.\n"
                                    f"2. Ensure Docker base image provides necessary build tools."
                                ),
                                "labels": ["bug", "ci-cd", "devops"],
                            },
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=f"I have prepared the GitHub issue for `{repo_name}` and submitted it for your security approval.",
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 5. PULL REQUEST / PATCH INTENT (Requires Human Approval)
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["pull request", " pr", "pr ", "patch", "fix pr", "create pr"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_pr_approval_1",
                            name="create_pull_request",
                            arguments={
                                "title": f"fix: resolve dependency and Docker configuration for {repo_clean_name}",
                                "head": "fix/devops-pipeline-patch",
                                "base": "main",
                                "body": f"Automated patch proposed by VoiceOps AI for `{repo_name}` to resolve build and deployment failures.",
                            },
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=f"I have prepared the pull request for `{repo_name}` for your review and approval.",
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 6. DIFF / WHAT CHANGED BETWEEN BUILDS INTENT
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
                        f"I compared recent commits in `{repo_name}` (`e49fa12`...`a19b882`):\n\n"
                        f"• **File Changed:** `Dockerfile` & configuration files\n"
                        f"• **Diff:** `- FROM python:3.11-slim` \n"
                        f"          `+ FROM python:3.13-slim`\n\n"
                        f"**Impact:** `requirements.txt` still pinned legacy package versions. On the newer runtime, pip failed to compile wheels without build-essential tools."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 7. RAG / DOCUMENTATION SEARCH INTENT
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["search", "doc", "runbook", "guide", "procedure", "knowledge", "architecture"]):
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
                        f"According to the DevOps Runbook for `{repo_name}`, verify runtime environment compatibility and ensure automated database migrations are applied before blue/green promotion."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 8. PIPELINE / WORKFLOW STATUS CHECK
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["status", "pipeline", "workflows", "all runs", "list", "build"]):
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
                        f"Here is the latest GitHub Actions status for `{repo_name}`:\n"
                        f"• **Run #1245 (Docker Build & Deploy):** ❌ Failed (exit code 1)\n"
                        f"• **Run #1244 (Integration Tests):** ✅ Passed (duration: 1m 42s)\n"
                        f"• **Run #1243 (Lint & Typecheck):** ✅ Passed (duration: 35s)"
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 9. DEPLOYMENT FAILURE / ERROR INVESTIGATION
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
                        f"I analyzed the build logs for `{repo_name}` for workflow run (#1245):\n\n"
                        f"• **Failed Step:** `pip install -r requirements.txt` in Dockerfile\n"
                        f"• **Error Trace:** `TypeError: bcrypt 3.2.0 is incompatible with Python 3.13 runtime`\n"
                        f"• **Root Cause:** Base image upgraded to Python 3.13 without upgrading dependencies.\n"
                        f"• **Recommended Action:** Upgrade bcrypt to `>= 4.0.0` or revert to Python 3.11. Shall I prepare a GitHub issue or PR for this?"
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 10. CONTEXT-AWARE GENERAL FALLBACK
        # ----------------------------------------------------------------------
        return LLMResponse(
            content=(
                f"I am VoiceOps AI, actively monitoring **`{repo_name}`**.\n\n"
                f"I have ingested this repository into vector memory. You can ask me:\n"
                f"• *\"Show repository files and folder tree\"*\n"
                f"• *\"How does authentication or the database work in this repo?\"*\n"
                f"• *\"Why did the latest CI/CD build fail?\"*\n"
                f"• *\"Compare recent commit diffs\"*\n"
                f"• *\"Open a GitHub issue or pull request\"*"
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
    return MockLLMProvider()
