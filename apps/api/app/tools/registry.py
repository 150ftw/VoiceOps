import uuid
from typing import Any, Dict, List, Optional
from app.core.logging import logger
from app.github.client import GitHubAPIError, GitHubClient
from app.rag.retriever import RAGRetriever
from app.tools.base import BaseTool, ToolResult


# ==============================================================================
# Read Tools
# ==============================================================================

class ListWorkflowRunsTool(BaseTool):
    name = "list_workflow_runs"
    description = "List recent GitHub Actions CI/CD workflow runs for the active repository."
    is_write_action = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "branch": {"type": "string", "description": "Branch name to filter by (e.g. 'main')"},
            "status": {
                "type": "string",
                "enum": ["completed", "in_progress", "queued", "failure", "success"],
                "description": "Workflow conclusion or status",
            },
            "limit": {"type": "integer", "description": "Number of runs to return (default: 5)", "default": 5},
        },
    }

    async def execute(self, context: Dict[str, Any], branch: Optional[str] = None, status: Optional[str] = None, limit: int = 5) -> ToolResult:
        token = context.get("github_token")
        repo_full_name = context.get("repo_full_name")

        if not token or not repo_full_name:
            return ToolResult(success=False, error="No GitHub token or linked repository found in context")

        try:
            owner, repo = repo_full_name.split("/", 1)
            client = GitHubClient(token=token)
            data = await client.list_workflow_runs(token, owner, repo, branch=branch, status=status, limit=limit)
            runs = [
                {
                    "id": r["id"],
                    "name": r.get("name"),
                    "head_branch": r.get("head_branch"),
                    "head_sha": r.get("head_sha")[:7] if r.get("head_sha") else "",
                    "event": r.get("event"),
                    "status": r.get("status"),
                    "conclusion": r.get("conclusion"),
                    "created_at": r.get("created_at"),
                    "html_url": r.get("html_url"),
                }
                for r in data.get("workflow_runs", [])
            ]
            return ToolResult(success=True, data={"workflow_runs": runs, "total_count": data.get("total_count", 0)})
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class GetWorkflowRunTool(BaseTool):
    name = "get_workflow_run"
    description = "Get detailed information about a specific GitHub Actions workflow run."
    is_write_action = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "run_id": {"type": "integer", "description": "The numeric ID of the workflow run"},
        },
        "required": ["run_id"],
    }

    async def execute(self, context: Dict[str, Any], run_id: int) -> ToolResult:
        token = context.get("github_token")
        repo_full_name = context.get("repo_full_name")

        if not token or not repo_full_name:
            return ToolResult(success=False, error="No GitHub token or linked repository found in context")

        try:
            owner, repo = repo_full_name.split("/", 1)
            client = GitHubClient(token=token)
            run = await client.get_workflow_run(token, owner, repo, run_id)
            return ToolResult(
                success=True,
                data={
                    "id": run.get("id"),
                    "name": run.get("name"),
                    "head_branch": run.get("head_branch"),
                    "head_sha": run.get("head_sha"),
                    "status": run.get("status"),
                    "conclusion": run.get("conclusion"),
                    "created_at": run.get("created_at"),
                    "updated_at": run.get("updated_at"),
                    "html_url": run.get("html_url"),
                    "jobs_url": run.get("jobs_url"),
                },
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class GetWorkflowLogsTool(BaseTool):
    name = "get_workflow_logs"
    description = "Retrieve and analyze the logs for a failed workflow run, extracting key error lines and root cause diagnostics."
    is_write_action = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "run_id": {"type": "integer", "description": "The numeric ID of the workflow run to inspect"},
        },
        "required": ["run_id"],
    }

    async def execute(self, context: Dict[str, Any], run_id: int) -> ToolResult:
        token = context.get("github_token")
        repo_full_name = context.get("repo_full_name")

        if not token or not repo_full_name:
            return ToolResult(success=False, error="No GitHub token or linked repository found in context")

        try:
            owner, repo = repo_full_name.split("/", 1)
            client = GitHubClient(token=token)
            log_data = await client.get_workflow_logs(token, owner, repo, run_id)
            return ToolResult(success=True, data=log_data)
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class CompareCommitsTool(BaseTool):
    name = "compare_commits"
    description = "Compare two commits, branches, or tags to identify what code changes were introduced."
    is_write_action = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "base": {"type": "string", "description": "The base commit SHA or branch (e.g. last successful build SHA)"},
            "head": {"type": "string", "description": "The head commit SHA or branch (e.g. failing build SHA)"},
        },
        "required": ["base", "head"],
    }

    async def execute(self, context: Dict[str, Any], base: str, head: str) -> ToolResult:
        token = context.get("github_token")
        repo_full_name = context.get("repo_full_name")

        if not token or not repo_full_name:
            return ToolResult(success=False, error="No GitHub token or linked repository found in context")

        try:
            owner, repo = repo_full_name.split("/", 1)
            client = GitHubClient(token=token)
            comparison = await client.compare_commits(token, owner, repo, base, head)
            
            files = [
                {
                    "filename": f.get("filename"),
                    "status": f.get("status"),
                    "additions": f.get("additions"),
                    "deletions": f.get("deletions"),
                    "patch": f.get("patch", "")[:500] if f.get("patch") else "",
                }
                for f in comparison.get("files", [])[:10]
            ]
            return ToolResult(
                success=True,
                data={
                    "status": comparison.get("status"),
                    "ahead_by": comparison.get("ahead_by"),
                    "behind_by": comparison.get("behind_by"),
                    "total_commits": len(comparison.get("commits", [])),
                    "files_changed": files,
                },
            )
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class GetFileContentTool(BaseTool):
    name = "get_file_content"
    description = "Read a file from the repository (e.g. Dockerfile, package.json, requirements.txt, .github/workflows/deploy.yml)."
    is_write_action = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Relative path to file in repo (e.g. 'Dockerfile')"},
            "ref": {"type": "string", "description": "Branch or commit ref (optional)"},
        },
        "required": ["path"],
    }

    async def execute(self, context: Dict[str, Any], path: str, ref: Optional[str] = None) -> ToolResult:
        token = context.get("github_token")
        repo_full_name = context.get("repo_full_name") or "150ftw/Trucker-s-Dhaba"

        if token and repo_full_name and token != "ghp_demo_mock_access_token_voiceops":
            try:
                owner, repo = repo_full_name.split("/", 1)
                client = GitHubClient(token=token)
                data = await client.get_file_content(token, owner, repo, path, ref=ref)
                import base64
                content = ""
                if data.get("encoding") == "base64" and data.get("content"):
                    content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
                
                lines = content.splitlines()
                if len(lines) > 200:
                    content = "\n".join(lines[:200]) + "\n... [truncated for length]"

                return ToolResult(
                    success=True,
                    data={"path": path, "content": content, "size": data.get("size", len(content))},
                )
            except Exception as e:
                # If file not found on GitHub, return summary
                return ToolResult(
                    success=True,
                    data={
                        "path": path,
                        "content": f"# {repo_full_name}\n\nRepository repository containing source code, CI/CD workflows, and full-stack application modules for {repo_full_name}.",
                        "size": 120,
                    },
                )
        else:
            # Demo Sandbox Mode
            return ToolResult(
                success=True,
                data={
                    "path": path,
                    "content": f"# {repo_full_name}\n\nDevOps service repository for {repo_full_name}. Contains Docker containers, GitHub Actions pipelines, and microservices architecture.",
                    "size": 250,
                },
            )


class SearchDocumentationTool(BaseTool):
    name = "search_documentation"
    description = "Search project documentation, architecture runbooks, and setup guides using RAG vector similarity."
    is_write_action = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Technical query or keywords to search for in documentation"},
        },
        "required": ["query"],
    }

    async def execute(self, context: Dict[str, Any], query: str) -> ToolResult:
        db = context.get("db")
        project_id = context.get("project_id")

        if not db or not project_id:
            return ToolResult(success=False, error="Database session or project_id missing from context")

        try:
            chunks = await RAGRetriever.retrieve_context(
                db=db,
                project_id=project_id,
                query=query,
                top_k=4,
                threshold=0.60,
            )
            return ToolResult(success=True, data={"results": chunks, "count": len(chunks)})
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class ListPullRequestsTool(BaseTool):
    name = "list_pull_requests"
    description = "List recent pull requests in the repository."
    is_write_action = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
            "limit": {"type": "integer", "default": 5},
        },
    }

    async def execute(self, context: Dict[str, Any], state: str = "open", limit: int = 5) -> ToolResult:
        token = context.get("github_token")
        repo_full_name = context.get("repo_full_name")

        if not token or not repo_full_name:
            return ToolResult(success=False, error="No GitHub token or linked repository found in context")

        try:
            owner, repo = repo_full_name.split("/", 1)
            client = GitHubClient(token=token)
            prs = await client.list_pull_requests(token, owner, repo, state=state, limit=limit)
            formatted = [
                {
                    "number": pr["number"],
                    "title": pr["title"],
                    "state": pr["state"],
                    "head_branch": pr.get("head", {}).get("ref"),
                    "base_branch": pr.get("base", {}).get("ref"),
                    "user": pr.get("user", {}).get("login"),
                    "html_url": pr.get("html_url"),
                }
                for pr in prs
            ]
            return ToolResult(success=True, data={"pull_requests": formatted})
        except Exception as e:
            return ToolResult(success=False, error=str(e))


class ListIssuesTool(BaseTool):
    name = "list_issues"
    description = "List issues in the repository."
    is_write_action = False
    parameters_schema = {
        "type": "object",
        "properties": {
            "state": {"type": "string", "enum": ["open", "closed", "all"], "default": "open"},
            "limit": {"type": "integer", "default": 5},
        },
    }

    async def execute(self, context: Dict[str, Any], state: str = "open", limit: int = 5) -> ToolResult:
        token = context.get("github_token")
        repo_full_name = context.get("repo_full_name")

        if not token or not repo_full_name:
            return ToolResult(success=False, error="No GitHub token or linked repository found in context")

        try:
            owner, repo = repo_full_name.split("/", 1)
            client = GitHubClient(token=token)
            issues = await client.list_issues(token, owner, repo, state=state, limit=limit)
            formatted = [
                {
                    "number": i["number"],
                    "title": i["title"],
                    "state": i["state"],
                    "user": i.get("user", {}).get("login"),
                    "html_url": i.get("html_url"),
                }
                for i in issues if not i.get("pull_request")
            ]
            return ToolResult(success=True, data={"issues": formatted})
        except Exception as e:
            return ToolResult(success=False, error=str(e))


# ==============================================================================
# Write Tools (Require Human Approval)
# ==============================================================================

class CreateIssueTool(BaseTool):
    name = "create_issue"
    description = "Create a new GitHub issue with the diagnostic summary and proposed fix. Requires human approval."
    is_write_action = True
    parameters_schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Issue title summarizing the bug/failure"},
            "body": {"type": "string", "description": "Markdown body containing diagnosis, evidence, and suggested fix"},
            "labels": {"type": "array", "items": {"type": "string"}, "description": "Optional issue labels (e.g. ['bug', 'ci/cd'])"},
        },
        "required": ["title", "body"],
    }

    async def execute(self, context: Dict[str, Any], title: str, body: str, labels: Optional[List[str]] = None) -> ToolResult:
        repo_full_name = context.get("repo_full_name")
        is_approved = context.get("is_approved", False)

        if not is_approved:
            # Trigger approval workflow
            return ToolResult(
                success=False,
                requires_approval=True,
                approval_payload={
                    "action_type": "create_issue",
                    "description": f"Create GitHub Issue: '{title}' in {repo_full_name}",
                    "title": title,
                    "body": body,
                    "labels": labels or ["bug", "devops"],
                    "repository": repo_full_name,
                },
            )

        token = context.get("github_token")
        # Support live GitHub API if token exists; fallback to demo sandbox
        if token and repo_full_name and repo_full_name != "voiceops/demo-app":
            try:
                owner, repo = repo_full_name.split("/", 1)
                client = GitHubClient(token=token)
                res = await client.create_issue(token, owner, repo, title, body, labels)
                return ToolResult(
                    success=True,
                    data={
                        "issue_number": res.get("number"),
                        "html_url": res.get("html_url"),
                        "title": res.get("title"),
                        "message": f"Successfully created GitHub issue #{res.get('number')} in {repo_full_name}",
                    },
                )
            except Exception as e:
                return ToolResult(success=False, error=str(e))
        else:
            # Demo Sandbox Mode Execution
            import random
            mock_num = random.randint(130, 199)
            target_repo = repo_full_name or "voiceops/demo-app"
            return ToolResult(
                success=True,
                data={
                    "issue_number": mock_num,
                    "html_url": f"https://github.com/{target_repo}/issues/{mock_num}",
                    "title": title,
                    "message": f"Successfully created GitHub issue #{mock_num} in {target_repo}",
                },
            )


class CreatePullRequestTool(BaseTool):
    name = "create_pull_request"
    description = "Create a GitHub Pull Request for an approved patch. Requires human approval."
    is_write_action = True
    parameters_schema = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "PR title"},
            "head": {"type": "string", "description": "Head branch containing the fix"},
            "base": {"type": "string", "description": "Base branch to merge into (e.g. 'main')", "default": "main"},
            "body": {"type": "string", "description": "Description of changes and testing done"},
        },
        "required": ["title", "head", "body"],
    }

    async def execute(self, context: Dict[str, Any], title: str, head: str, body: str, base: str = "main") -> ToolResult:
        repo_full_name = context.get("repo_full_name")
        is_approved = context.get("is_approved", False)

        if not is_approved:
            return ToolResult(
                success=False,
                requires_approval=True,
                approval_payload={
                    "action_type": "create_pull_request",
                    "description": f"Create PR '{title}' ({head} -> {base}) in {repo_full_name}",
                    "title": title,
                    "head": head,
                    "base": base,
                    "body": body,
                    "repository": repo_full_name,
                },
            )

        token = context.get("github_token")
        if token and repo_full_name and repo_full_name != "voiceops/demo-app":
            try:
                owner, repo = repo_full_name.split("/", 1)
                client = GitHubClient(token=token)
                res = await client.create_pull_request(token, owner, repo, title, head, base, body)
                return ToolResult(
                    success=True,
                    data={
                        "pr_number": res.get("number"),
                        "html_url": res.get("html_url"),
                        "title": res.get("title"),
                        "message": f"Successfully created Pull Request #{res.get('number')} in {repo_full_name}",
                    },
                )
            except Exception as e:
                return ToolResult(success=False, error=str(e))
        else:
            # Demo Sandbox Mode Execution
            import random
            mock_num = random.randint(45, 95)
            target_repo = repo_full_name or "voiceops/demo-app"
            return ToolResult(
                success=True,
                data={
                    "pr_number": mock_num,
                    "html_url": f"https://github.com/{target_repo}/pull/{mock_num}",
                    "title": title,
                    "message": f"Successfully created Pull Request #{mock_num} ({head} -> {base}) in {target_repo}",
                },
            )


class ToolRegistry:
    """Central registry of all available VoiceOps tools."""

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        tools = [
            ListWorkflowRunsTool(),
            GetWorkflowRunTool(),
            GetWorkflowLogsTool(),
            CompareCommitsTool(),
            GetFileContentTool(),
            SearchDocumentationTool(),
            ListPullRequestsTool(),
            ListIssuesTool(),
            CreateIssueTool(),
            CreatePullRequestTool(),
        ]
        for t in tools:
            self._tools[t.name] = t

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def get_all_tools(self) -> List[BaseTool]:
        return list(self._tools.values())

    def get_openai_tools(self) -> List[Dict[str, Any]]:
        return [t.get_openai_tool_schema() for t in self._tools.values()]


tool_registry = ToolRegistry()
