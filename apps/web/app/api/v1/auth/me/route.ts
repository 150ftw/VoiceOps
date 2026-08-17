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

        if (decoded && (decoded.sub || decoded.email)) {
          const userName = decoded.name || 'Shivam Sharma';
          return NextResponse.json(
            {
              id: decoded.sub || 'user-default',
              email: decoded.email || 'ss18244646@gmail.com',
              full_name: userName,
              avatar_url: decoded.avatar_url || 'https://avatars.githubusercontent.com/u/86033717?v=4',
              workspaces: [
                {
                  id: 'ws-primary-default',
                  name: `${userName}'s Workspace`,
                  slug: 'voiceops-primary-workspace',
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
      {
        id: 'user-7c7b8f5d',
        email: 'ss18244646@gmail.com',
        full_name: 'Shivam Sharma',
        avatar_url: 'https://avatars.githubusercontent.com/u/86033717?v=4',
        workspaces: [
          {
            id: 'ws-primary-default',
            name: "Shivam Sharma's Workspace",
            slug: 'shivam-workspace',
            role: 'owner',
          },
        ],
      },
      {
        status: 200,
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
