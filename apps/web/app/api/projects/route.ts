import { NextRequest, NextResponse } from 'next/server';
import { inMemoryProjects } from '@/lib/projects-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const wsQuery = req.nextUrl.searchParams.get('workspace_id');
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    let userId = '';
    if (token) {
      try {
        let decoded: any = null;
        if (token.includes('.')) {
          const parts = token.split('.');
          decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        } else {
          decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
        }
        userId = decoded?.sub || '';
      } catch {
        // ignore
      }
    }

    const filtered = inMemoryProjects.filter((p) => {
      if (wsQuery && (p.workspace_id === wsQuery || p.workspace_id === 'ws-primary-default')) return true;
      if (userId && (p.workspace_id === `ws-${userId}` || p.workspace_id === 'ws-primary-default')) return true;
      return true; // Return all projects for this workspace session
    });

    return NextResponse.json(filtered, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    return NextResponse.json(inMemoryProjects, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repoFullName = body.repository_full_name || body.github_repo || body.repo_full_name || '';
    const parts = repoFullName.split('/');
    const repoOwner = parts.length > 1 ? parts[0] : 'github';
    const repoName = parts.length > 1 ? parts[1] : repoFullName;
    const defaultBranch = body.default_branch || 'main';

    const newProj = {
      id: `proj-${Date.now()}`,
      workspace_id: body.workspace_id || 'ws-primary-default',
      name: body.name || repoName || 'New Project',
      slug: (body.slug || body.name || repoName || 'new-project').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: body.description || `Connected GitHub Repository ${repoFullName}`,
      github_repo: repoFullName,
      github_branch: defaultBranch,
      default_branch: defaultBranch,
      repository: repoFullName ? {
        id: body.github_repo_id || Date.now(),
        repo_full_name: repoFullName,
        repo_name: repoName,
        repo_owner: repoOwner,
        default_branch: defaultBranch,
        is_private: Boolean(body.is_private),
      } : undefined,
      is_active: true,
      last_synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    inMemoryProjects.unshift(newProj);

    return NextResponse.json(newProj, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to create project' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
