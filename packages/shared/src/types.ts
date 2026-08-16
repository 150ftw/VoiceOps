/**
 * Shared Type Definitions between VoiceOps Frontend and Backend
 */

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  role?: UserRole;
  created_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description?: string | null;
  default_branch: string;
  repository?: Repository | null;
  created_at: string;
}

export interface Repository {
  id: string;
  project_id: string;
  repo_full_name: string;
  github_repo_id: number;
  default_branch: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  status: 'active' | 'archived';
  state?: ConversationState | null;
  messages?: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  audio_url?: string | null;
  metadata?: {
    sources?: CitationSource[];
    tool_calls?: string[];
    [key: string]: any;
  };
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface ConversationState {
  id: string;
  conversation_id: string;
  active_repo?: string | null;
  active_workflow_id?: number | null;
  active_run_id?: number | null;
  active_pr_id?: number | null;
  active_issue_id?: number | null;
  intent?: string | null;
  entities: Record<string, any>;
  summary?: string | null;
  last_tool_results?: Record<string, any>;
  updated_at: string;
}

export interface CitationSource {
  document_id: string;
  title?: string;
  document_title?: string;
  filename: string;
  chunk_index: number;
  similarity: number;
  content_excerpt?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface AgentActivityStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  detail?: string;
  timestamp?: string;
}

export interface PendingApproval {
  id: string;
  conversation_id?: string;
  tool_call_id?: string;
  action_type: 'create_issue' | 'create_pull_request' | 'retry_workflow' | 'modify_file' | string;
  description: string;
  payload: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expires_at?: string;
  created_at?: string;
}

export interface DocumentItem {
  id: string;
  project_id: string;
  title: string;
  filename: string;
  file_type: 'md' | 'txt' | 'pdf';
  file_size: number;
  status: 'pending' | 'processing' | 'indexed' | 'failed';
  error_message?: string | null;
  chunks_count?: number;
  created_at: string;
}

export interface WorkflowRunSummary {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  event: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  actor: {
    login: string;
    avatar_url: string;
  };
}

export interface ObservabilityMetrics {
  total_requests: number;
  total_conversations: number;
  total_tool_calls: number;
  tool_success_rate: number;
  avg_latency_ms: number;
  active_sessions: number;
}
