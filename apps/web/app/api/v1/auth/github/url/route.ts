import { NextResponse } from 'next/server';

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

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23livqbvm2o1wqn6oE';
  const scope = 'user:email,repo,workflow,read:org';
  const auth_url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.json(
    {
      configured: true,
      auth_url,
      demo_available: true,
    },
    {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    }
  );
}
