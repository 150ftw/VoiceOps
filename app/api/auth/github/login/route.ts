import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ detail: 'Authorization code is required' }, { status: 400 });
    }

    const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23livqbvm2o1wqn6oE';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || '5b1875c49fe2b5bfa78baf9ac28e6d2bd112de46';
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // 1. Try FastAPI Python backend if reachable (with fast 3s timeout)
    try {
      const backendRes = await fetch(`${backendUrl.replace(/\/$/, '')}/api/v1/auth/github/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: AbortSignal.timeout(3000),
      });

      if (backendRes.ok) {
        const backendData = await backendRes.json();
        if (backendData.access_token) {
          return NextResponse.json(backendData);
        }
      }
    } catch {
      // Backend is offline or not deployed on the same network — handle directly
    }

    // 2. Direct GitHub Token Exchange (Serverless fallback)
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const ghAccessToken = tokenData.access_token;

    if (!ghAccessToken) {
      return NextResponse.json(
        { detail: tokenData.error_description || 'Failed to exchange GitHub OAuth code' },
        { status: 400 }
      );
    }

    // 3. Fetch GitHub Profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${ghAccessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'VoiceOps-App',
      },
    });

    const userData = await userRes.json();
    let email = userData.email;

    // Fetch private email if not public
    if (!email) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${ghAccessToken}`,
            'Accept': 'application/json',
            'User-Agent': 'VoiceOps-App',
          },
        });
        const emailsData = await emailsRes.json();
        if (Array.isArray(emailsData)) {
          const primary = emailsData.find((e: any) => e.primary && e.verified);
          email = primary ? primary.email : emailsData[0]?.email;
        }
      } catch {
        // ignore
      }
    }

    const userName = userData.name || userData.login || 'Developer';
    const avatarUrl = userData.avatar_url || `https://avatars.githubusercontent.com/u/${userData.id}?v=4`;
    const userEmail = email || `${userData.login || 'user'}@github.com`;

    // 4. Construct VoiceOps Token & User Session Payload
    const userSession = {
      id: `gh-user-${userData.id}`,
      email: userEmail,
      full_name: userName,
      avatar_url: avatarUrl,
      github_username: userData.login,
      github_token: ghAccessToken,
      workspaces: [
        {
          id: `ws-${userData.id}`,
          name: `${userName}'s Workspace`,
          slug: `${(userData.login || 'dev').toLowerCase()}-workspace`,
          role: 'owner',
        },
      ],
    };

    // Use base64url encoded token containing session claims
    const tokenPayload = {
      sub: userSession.id,
      email: userEmail,
      name: userName,
      avatar_url: avatarUrl,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    };

    const encodedToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    return NextResponse.json({
      access_token: encodedToken,
      token_type: 'bearer',
      user: userSession,
    });
  } catch (error: any) {
    console.error('GitHub OAuth Login Route Error:', error);
    return NextResponse.json(
      { detail: error.message || 'Internal Server Error during GitHub authentication' },
      { status: 500 }
    );
  }
}
