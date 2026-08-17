import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      connected: true,
      username: '150ftw',
      avatar_url: 'https://avatars.githubusercontent.com/u/86033717?v=4',
      scopes: ['user:email', 'repo', 'workflow', 'read:org'],
      installation_id: 'gh-app-installed',
      connected_at: new Date().toISOString(),
    },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
