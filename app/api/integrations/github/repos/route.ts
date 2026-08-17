import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPOS = [
  {
    id: 1,
    name: 'VoiceOps',
    full_name: '150ftw/VoiceOps',
    private: false,
    default_branch: 'main',
    html_url: 'https://github.com/150ftw/VoiceOps',
    description: 'Agentic Voice-Based DevOps Engineer Monorepo',
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'EcoInsight',
    full_name: '150ftw/EcoInsight',
    private: false,
    default_branch: 'main',
    html_url: 'https://github.com/150ftw/EcoInsight',
    description: 'Professional Economic Intelligence Engine',
    updated_at: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { repositories: REPOS },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
