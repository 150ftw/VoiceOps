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
        ghUsername = decoded?.github_username || '';
      } catch {
        // ignore
      }
    }

    // 1. Fetch user's real repos if GitHub access token is available
    if (ghToken) {
      try {
        const ghRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
          headers: {
            'Authorization': `Bearer ${ghToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'VoiceOps-App',
          },
        });

        if (ghRes.ok) {
          const ghRepos = await ghRes.json();
          if (Array.isArray(ghRepos)) {
            const formatted = ghRepos.map((r: any) => ({
              id: r.id,
              name: r.name,
              full_name: r.full_name,
              private: r.private,
              default_branch: r.default_branch || 'main',
              html_url: r.html_url,
              description: r.description || 'GitHub Repository',
              updated_at: r.updated_at,
            }));

            return NextResponse.json(
              { repositories: formatted },
              { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
            );
          }
        }
      } catch {
        // fallback
      }
    }

    // 2. Return scoped repos for the user or empty
    return NextResponse.json(
      { repositories: [] },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { repositories: [] },
      { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
