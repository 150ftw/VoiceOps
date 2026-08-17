import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
  try {
    let code: string | null = null;
    try {
      const body = await req.json();
      code = body?.code;
    } catch {
      // Body might be empty or query param
    }

    if (!code) {
      code = req.nextUrl.searchParams.get('code');
    }

    if (!code) {
      return NextResponse.json(
        { detail: 'Authorization code is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23livqbvm2o1wqn6oE';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || '5b1875c49fe2b5bfa78baf9ac28e6d2bd112de46';

    // 1. Direct GitHub Token Exchange
    let tokenData: any = {};
    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'VoiceOps-App',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });
      tokenData = await tokenRes.json();
    } catch (fetchErr: any) {
      console.error('Failed to contact GitHub OAuth servers:', fetchErr);
      return NextResponse.json(
        { detail: 'Failed to contact GitHub OAuth servers. Please try again.' },
        { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const ghAccessToken = tokenData?.access_token;

    if (!ghAccessToken) {
      return NextResponse.json(
        { detail: tokenData?.error_description || 'The GitHub authorization code is incorrect or has expired. Please sign in again.' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // 2. Fetch User Profile
    let userData: any = {};
    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${ghAccessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'VoiceOps-App',
        },
      });
      userData = await userRes.json();
    } catch {
      userData = {};
    }

    let email = userData?.email;

    // Fetch private email if not public
    if (!email && ghAccessToken) {
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

    const userId = userData?.id || 'github-user';
    const userName = userData?.name || userData?.login || 'Developer';
    const avatarUrl = userData?.avatar_url || `https://avatars.githubusercontent.com/u/${userData?.id || '9919'}?v=4`;
    const userEmail = email || (userData?.login ? `${userData.login}@users.noreply.github.com` : 'user@voiceops.dev');
    const githubUsername = userData?.login || 'github-user';

    // 3. Construct Secure User Session & Token
    const userSession = {
      id: `gh-user-${userId}`,
      email: userEmail,
      full_name: userName,
      avatar_url: avatarUrl,
      github_username: githubUsername,
      github_token: ghAccessToken,
      workspaces: [
        {
          id: `ws-${userId}`,
          name: `${userName}'s Workspace`,
          slug: `${githubUsername}-workspace`,
          role: 'owner',
        },
      ],
    };

    const tokenPayload = {
      sub: userSession.id,
      email: userEmail,
      name: userName,
      github_username: githubUsername,
      avatar_url: avatarUrl,
      github_token: ghAccessToken,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    };

    const encodedToken = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    return NextResponse.json(
      {
        access_token: encodedToken,
        token_type: 'bearer',
        user: userSession,
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('GitHub OAuth App Route Exception:', error);
    return NextResponse.json(
      { detail: error.message || 'Authentication failed. Please try again.' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
