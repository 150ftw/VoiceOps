import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AUDIT_LOGS = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    event: 'GITHUB_OAUTH_LOGIN',
    user: 'Shivam Sharma (150ftw)',
    actor_id: 'gh-user-86033717',
    status: 'SUCCESS',
    details: 'User authenticated via GitHub OAuth with full repository scopes',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 360000).toISOString(),
    event: 'CI_WORKFLOW_INSPECT',
    user: 'VoiceOps Agent',
    actor_id: 'agent-reAct',
    status: 'SUCCESS',
    details: 'Fetched workflow logs for 150ftw/VoiceOps commit d3aa15a',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    event: 'RAG_RUNBOOK_QUERY',
    user: 'VoiceOps Agent',
    actor_id: 'agent-reAct',
    status: 'SUCCESS',
    details: 'Semantic search on Kubernetes runbook with pgvector (similarity: 0.94)',
  },
];

export async function GET(req: NextRequest) {
  return NextResponse.json(AUDIT_LOGS, {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
