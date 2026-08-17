import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_DOCUMENTS = [
  {
    id: 'doc-1',
    project_id: 'proj-voiceops-core',
    title: 'Kubernetes Production Runbook',
    source_type: 'markdown',
    source_url: 'https://github.com/150ftw/VoiceOps/tree/main/docs/runbooks.md',
    chunk_count: 14,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'doc-2',
    project_id: 'proj-voiceops-core',
    title: 'GitHub Actions Deployment Guide',
    source_type: 'pdf',
    source_url: 'deploy-guide.pdf',
    chunk_count: 8,
    created_at: new Date(Date.now() - 43200000).toISOString(),
  },
];

let inMemoryDocs = [...DEFAULT_DOCUMENTS];

export async function GET(req: NextRequest) {
  return NextResponse.json(inMemoryDocs, {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
