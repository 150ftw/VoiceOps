# VoiceOps API & WebSocket Reference

## REST API Endpoints

Base URL: `http://localhost:8000/api/v1`

### Authentication (`/auth`)
- `POST /auth/register`: Create user account and personal workspace.
  ```json
  { "email": "user@example.com", "password": "...", "full_name": "Shivam Sharma" }
  ```
- `POST /auth/login`: Authenticate and receive access token + refresh cookie.
- `POST /auth/refresh`: Refresh expired access token.
- `POST /auth/logout`: Invalidate session cookie.
- `GET /auth/me`: Get current user profile and workspaces.

### Workspaces & Projects (`/workspaces`, `/projects`)
- `GET /workspaces`: List accessible workspaces.
- `POST /workspaces`: Create workspace.
- `GET /workspaces/{id}/members`: List members and roles.
- `POST /workspaces/{id}/members`: Invite member with role (`owner`, `admin`, `developer`, `viewer`).
- `GET /projects?workspace_id=...`: List projects in workspace.
- `POST /projects`: Create project.
- `POST /projects/{id}/repositories/connect`: Link GitHub repository.

### GitHub Integrations (`/integrations`)
- `GET /integrations/github/auth-url?workspace_id=...`: Generate OAuth authorization URL.
- `POST /integrations/github/callback`: Exchange OAuth authorization code.
- `POST /integrations/github/connect-token`: Connect Personal Access Token.
- `GET /integrations/github/repositories`: List available repositories.
- `GET /integrations/github/status`: Check integration status.

### Conversations (`/conversations`)
- `GET /conversations?project_id=...`: List conversations.
- `POST /conversations`: Create conversation.
- `GET /conversations/{id}`: Get conversation details, state, and messages.
- `POST /conversations/{id}/messages`: Post text message and run agent turn.

### Documents & RAG (`/documents`)
- `GET /documents?project_id=...`: List knowledge base documents.
- `POST /documents/upload`: Multipart upload (`.md`, `.txt`, `.pdf`).
- `DELETE /documents/{id}`: Delete document and vector chunks.

### Approvals (`/approvals`)
- `GET /approvals?conversation_id=...`: List approvals.
- `POST /approvals/{id}/respond`: `{ "action": "approve" | "reject" }`.

### Observability (`/observability`)
- `GET /observability/metrics?workspace_id=...`: Aggregated system metrics.
- `GET /observability/audit-logs?workspace_id=...`: Immutable security audit logs.
- `GET /health`: Database, Redis, and service health check.

---

## WebSocket API (`/ws/v1/conversations/{conversation_id}`)

### Client-to-Server Events
- `user.audio.chunk`: `{ "type": "user.audio.chunk", "data": "<base64_audio>" }`
- `user.text.message`: `{ "type": "user.text.message", "content": "..." }`
- `user.interrupt`: `{ "type": "user.interrupt" }`
- `user.approval.response`: `{ "type": "user.approval.response", "approval_id": "...", "decision": "approved" | "rejected" }`

### Server-to-Client Events
- `user.transcript.final`: `{ "type": "user.transcript.final", "text": "..." }`
- `agent.state.changed`: `{ "type": "agent.state.changed", "state": "thinking" | "executing_tool" | "speaking" | "idle" }`
- `agent.activity.step`: `{ "type": "agent.activity.step", "id": "...", "label": "...", "status": "running" | "completed" | "failed" }`
- `agent.tool.started`: `{ "type": "agent.tool.started", "tool": "...", "args": {...} }`
- `agent.tool.completed`: `{ "type": "agent.tool.completed", "tool": "...", "summary": "..." }`
- `agent.approval.required`: `{ "type": "agent.approval.required", "approval_id": "...", "action_type": "...", "description": "...", "payload": {...} }`
- `agent.audio.chunk`: `{ "type": "agent.audio.chunk", "data": "<base64_audio_stream>" }`
- `agent.response.completed`: `{ "type": "agent.response.completed", "text": "...", "message_id": "..." }`
- `agent.sources`: `{ "type": "agent.sources", "sources": [...] }`
- `agent.error`: `{ "type": "agent.error", "code": "...", "message": "..." }`
