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

    if (token) {
      try {
        let decoded: any = null;
        if (token.includes('.')) {
          const parts = token.split('.');
          decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        } else {
          decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
        }

        if (decoded && (decoded.sub || decoded.email || decoded.name || decoded.github_username)) {
          const userName = decoded.name || decoded.github_username || 'Developer';
          const userEmail = decoded.email || `${decoded.github_username || 'dev'}@users.noreply.github.com`;
          const avatarUrl = decoded.avatar_url || 'https://avatars.githubusercontent.com/u/9919?v=4';
          const userId = decoded.sub || 'user-default';
          const ghUsername = decoded.github_username || 'developer';

          return NextResponse.json(
            {
              id: userId,
              email: userEmail,
              full_name: userName,
              github_username: ghUsername,
              avatar_url: avatarUrl,
              workspaces: [
                {
                  id: `ws-${userId}`,
                  name: `${userName}'s Workspace`,
                  slug: `${ghUsername}-workspace`,
                  role: 'owner',
                },
              ],
            },
            {
              status: 200,
              headers: { 'Access-Control-Allow-Origin': '*' },
            }
          );
        }
      } catch {
        // Fallthrough
      }
    }

    return NextResponse.json(
      { detail: 'Authentication required' },
      {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || 'Failed to resolve user session' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
