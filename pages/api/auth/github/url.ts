import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23livqbvm2o1wqn6oE';
  const scope = 'user:email,repo,workflow,read:org';
  const auth_url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scope)}`;

  return res.status(200).json({
    configured: true,
    auth_url,
    demo_available: true,
  });
}
