import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization || '';
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
          return res.status(200).json({
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
          });
        }
      } catch {
        // fallthrough
      }
    }

    return res.status(200).json({
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
    });
  } catch (error: any) {
    return res.status(500).json({ detail: error.message || 'Failed to resolve user session' });
  }
}
