import asyncio
import io
import zipfile
from typing import Any, Dict, List, Optional
import httpx
from app.core.logging import logger
from app.github.log_parser import LogParser


class GitHubAPIError(Exception):
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details or {}


class GitHubClient:
    """Async GitHub REST API Client with resilient error handling and rate-limit backoff."""

    BASE_URL = "https://api.github.com"

    def __init__(self, token: Optional[str] = None):
        self.token = token

    def _get_headers(self, custom_token: Optional[str] = None) -> Dict[str, str]:
        token = custom_token or self.token
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "VoiceOps-DevOps-Assistant/1.0",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def _request(
        self,
        method: str,
        path: str,
        token: Optional[str] = None,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        retries: int = 2,
    ) -> Any:
        url = f"{self.BASE_URL}{path}" if not path.startswith("http") else path
        headers = self._get_headers(token)

        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                    response = await client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        params=params,
                        json=json_data,
                    )

                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", 2 ** attempt))
                        logger.warning("GitHub rate limited, backing off", retry_after=retry_after)
                        if attempt < retries:
                            await asyncio.sleep(retry_after)
                            continue
                        raise GitHubAPIError("GitHub API rate limit exceeded", status_code=429)

                    if response.status_code == 404:
                        raise GitHubAPIError(f"Resource not found on GitHub: {path}", status_code=404)

                    if response.status_code == 401:
                        raise GitHubAPIError("Invalid or expired GitHub OAuth token", status_code=401)

                    if response.status_code == 403:
                        msg = response.json().get("message", "Access forbidden by GitHub")
                        raise GitHubAPIError(f"GitHub access forbidden: {msg}", status_code=403)

                    if response.status_code >= 400:
                        err_json = {}
                        try:
                            err_json = response.json()
                        except Exception:
                            pass
                        raise GitHubAPIError(
                            f"GitHub API error: {response.status_code} - {err_json.get('message', response.text)}",
                            status_code=response.status_code,
                            details=err_json,
                        )

                    if response.headers.get("content-type", "").startswith("application/json"):
                        return response.json()
                    return response.content

            except httpx.RequestError as e:
                logger.error("GitHub network request error", error=str(e), path=path, attempt=attempt)
                if attempt < retries:
                    await asyncio.sleep(1 * (attempt + 1))
                    continue
                raise GitHubAPIError(f"Unable to reach GitHub: {str(e)}", status_code=503)

    # --------------------------------------------------------------------------
    # Repositories & Commits
    # --------------------------------------------------------------------------
    async def list_user_repositories(self, token: str) -> List[Dict[str, Any]]:
        """List repositories accessible to the authenticated user."""
        return await self._request("GET", "/user/repos?sort=updated&per_page=50", token=token)

    async def get_repository(self, token: str, owner: str, repo: str) -> Dict[str, Any]:
        """Get repository metadata."""
        return await self._request("GET", f"/repos/{owner}/{repo}", token=token)

    async def list_branches(self, token: str, owner: str, repo: str) -> List[Dict[str, Any]]:
        """List branches for a repository."""
        return await self._request("GET", f"/repos/{owner}/{repo}/branches", token=token)

    async def list_commits(
        self, token: str, owner: str, repo: str, branch: Optional[str] = None, limit: int = 15
    ) -> List[Dict[str, Any]]:
        """List recent commits."""
        params = {"per_page": limit}
        if branch:
            params["sha"] = branch
        return await self._request("GET", f"/repos/{owner}/{repo}/commits", token=token, params=params)

    async def get_commit(self, token: str, owner: str, repo: str, sha: str) -> Dict[str, Any]:
        """Get detailed commit data with file diffs."""
        return await self._request("GET", f"/repos/{owner}/{repo}/commits/{sha}", token=token)

    async def compare_commits(
        self, token: str, owner: str, repo: str, base_sha: str, head_sha: str
    ) -> Dict[str, Any]:
        """Compare two commits or branches to inspect diffs and changed files."""
        return await self._request("GET", f"/repos/{owner}/{repo}/compare/{base_sha}...{head_sha}", token=token)

    async def get_file_content(
        self, token: str, owner: str, repo: str, path: str, ref: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get file content (base64 encoded) from repository."""
        params = {}
        if ref:
            params["ref"] = ref
        return await self._request("GET", f"/repos/{owner}/{repo}/contents/{path}", token=token, params=params)

    # --------------------------------------------------------------------------
    # Workflows & CI/CD Logs
    # --------------------------------------------------------------------------
    async def list_workflow_runs(
        self,
        token: str,
        owner: str,
        repo: str,
        branch: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """List recent GitHub Actions workflow runs."""
        params = {"per_page": limit}
        if branch:
            params["branch"] = branch
        if status:
            params["status"] = status
        return await self._request("GET", f"/repos/{owner}/{repo}/actions/runs", token=token, params=params)

    async def get_workflow_run(self, token: str, owner: str, repo: str, run_id: int) -> Dict[str, Any]:
        """Get details for a specific workflow run."""
        return await self._request("GET", f"/repos/{owner}/{repo}/actions/runs/{run_id}", token=token)

    async def get_workflow_jobs(self, token: str, owner: str, repo: str, run_id: int) -> Dict[str, Any]:
        """Get jobs and steps for a specific workflow run."""
        return await self._request("GET", f"/repos/{owner}/{repo}/actions/runs/{run_id}/jobs", token=token)

    async def get_workflow_logs(
        self, token: str, owner: str, repo: str, run_id: int
    ) -> Dict[str, Any]:
        """
        Download and extract logs for a workflow run, isolating failure sections.
        """
        try:
            # First, check jobs for failure steps
            jobs_data = await self.get_workflow_jobs(token, owner, repo, run_id)
            jobs = jobs_data.get("jobs", [])
            failed_job_info = []

            for job in jobs:
                if job.get("conclusion") == "failure":
                    failed_steps = [
                        {"name": s.get("name"), "number": s.get("number"), "conclusion": s.get("conclusion")}
                        for s in job.get("steps", [])
                        if s.get("conclusion") == "failure"
                    ]
                    failed_job_info.append({
                        "job_id": job.get("id"),
                        "job_name": job.get("name"),
                        "failed_steps": failed_steps,
                    })

            # Attempt to download log zip archive
            raw_zip_bytes = await self._request(
                "GET", f"/repos/{owner}/{repo}/actions/runs/{run_id}/logs", token=token
            )
            
            combined_logs = ""
            if isinstance(raw_zip_bytes, bytes):
                try:
                    with zipfile.ZipFile(io.BytesIO(raw_zip_bytes)) as z:
                        for filename in z.namelist():
                            if filename.endswith(".txt"):
                                content = z.read(filename).decode("utf-8", errors="replace")
                                combined_logs += f"\n--- LOG FILE: {filename} ---\n" + content
                except Exception as zip_err:
                    logger.warning("Could not unzip workflow log archive", error=str(zip_err))

            # Run log parser to extract concise error window
            parsed = LogParser.extract_failure_summary(combined_logs)

            return {
                "run_id": run_id,
                "failed_jobs": failed_job_info,
                "diagnostic_summary": parsed.get("summary"),
                "error_lines": parsed.get("error_lines"),
                "total_log_lines": parsed.get("total_lines"),
            }

        except GitHubAPIError as e:
            logger.error("Failed to retrieve workflow logs", error=str(e), run_id=run_id)
            return {
                "run_id": run_id,
                "failed_jobs": [],
                "diagnostic_summary": f"Could not retrieve logs from GitHub: {str(e)}",
                "error_lines": [],
                "total_log_lines": 0,
            }

    # --------------------------------------------------------------------------
    # Issues & Pull Requests (Read & Write)
    # --------------------------------------------------------------------------
    async def list_pull_requests(
        self, token: str, owner: str, repo: str, state: str = "open", limit: int = 10
    ) -> List[Dict[str, Any]]:
        """List pull requests."""
        params = {"state": state, "per_page": limit}
        return await self._request("GET", f"/repos/{owner}/{repo}/pulls", token=token, params=params)

    async def get_pull_request(self, token: str, owner: str, repo: str, pr_number: int) -> Dict[str, Any]:
        """Get pull request details."""
        return await self._request("GET", f"/repos/{owner}/{repo}/pulls/{pr_number}", token=token)

    async def list_issues(
        self, token: str, owner: str, repo: str, state: str = "open", limit: int = 10
    ) -> List[Dict[str, Any]]:
        """List repository issues."""
        params = {"state": state, "per_page": limit}
        return await self._request("GET", f"/repos/{owner}/{repo}/issues", token=token, params=params)

    async def create_issue(
        self, token: str, owner: str, repo: str, title: str, body: str, labels: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a new GitHub issue (Write Action)."""
        payload = {"title": title, "body": body}
        if labels:
            payload["labels"] = labels
        return await self._request("POST", f"/repos/{owner}/{repo}/issues", token=token, json_data=payload)

    async def create_pull_request(
        self, token: str, owner: str, repo: str, title: str, head: str, base: str, body: str
    ) -> Dict[str, Any]:
        """Create a new Pull Request (Write Action)."""
        payload = {"title": title, "head": head, "base": base, "body": body}
        return await self._request("POST", f"/repos/{owner}/{repo}/pulls", token=token, json_data=payload)

    async def create_issue_comment(
        self, token: str, owner: str, repo: str, issue_number: int, body: str
    ) -> Dict[str, Any]:
        """Post a comment on an issue or PR (Write Action)."""
        payload = {"body": body}
        return await self._request("POST", f"/repos/{owner}/{repo}/issues/{issue_number}/comments", token=token, json_data=payload)
