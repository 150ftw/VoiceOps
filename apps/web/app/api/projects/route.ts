import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PROJECTS = [
  {
    id: 'proj-voiceops-core',
    workspace_id: 'ws-primary-default',
    name: 'VoiceOps Platform',
    slug: 'voiceops-platform',
    description: 'Autonomous voice-based DevOps engineering monorepo',
    github_repo: '150ftw/VoiceOps',
    github_branch: 'main',
    is_active: true,
    last_synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

let inMemoryProjects = [...DEFAULT_PROJECTS];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    let userId = 'default-user';
    let ghUsername = 'developer';

    if (token) {
      try {
        let decoded: any = null;
        if (token.includes('.')) {
          const parts = token.split('.');
          decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        } else {
          decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
        }
        userId = decoded?.sub || userId;
        ghUsername = decoded?.github_username || ghUsername;
      } catch {
        // ignore
      }
    }

    const userProjects = inMemoryProjects.filter(
      (p) => p.workspace_id === `ws-${userId}` || p.workspace_id === 'ws-primary-default'
    );

    return NextResponse.json(userProjects, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    return NextResponse.json([], {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newProj = {
      id: `proj-${Date.now()}`,
      workspace_id: body.workspace_id || 'ws-primary-default',
      name: body.name || 'New Project',
      slug: (body.name || 'new-project').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: body.description || '',
      github_repo: body.github_repo || '150ftw/VoiceOps',
      github_branch: body.github_branch || 'main',
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
