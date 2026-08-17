import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    let ghToken = '';
    let ghUsername = '';
    let avatarUrl = 'https://avatars.githubusercontent.com/u/9919?v=4';

    if (token) {
      try {
        let decoded: any = null;
        if (token.includes('.')) {
          const parts = token.split('.');
          decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        } else {
          decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
        }
        ghToken = decoded?.github_token || '';
        ghUsername = decoded?.github_username || decoded?.name || '';
        avatarUrl = decoded?.avatar_url || avatarUrl;
      } catch {
        // ignore
      }
    }

    const isConnected = Boolean(ghToken || ghUsername);

    return NextResponse.json(
      {
        connected: isConnected,
        username: ghUsername || 'Developer',
        avatar_url: avatarUrl,
        scopes: ['user:email', 'repo', 'workflow', 'read:org'],
        installation_id: 'gh-app-installed',
        connected_at: new Date().toISOString(),
      },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch {
    return NextResponse.json(
      {
        connected: false,
        username: 'Developer',
        scopes: [],
      },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
