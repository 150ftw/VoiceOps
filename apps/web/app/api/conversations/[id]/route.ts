import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      id: params.id,
      title: 'DevOps Voice Investigation',
      turns: [
        {
          id: 'turn-1',
          role: 'assistant',
          content: 'Hello Shivam! VoiceOps is ready. How can I assist with your deployments, CI/CD pipelines, or runbooks today?',
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
      ],
    },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
