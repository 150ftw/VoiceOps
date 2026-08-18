import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let inMemoryConversations: any[] = [];

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id');
  const filtered = projectId
    ? inMemoryConversations.filter((c) => c.project_id === projectId)
    : inMemoryConversations;

  return NextResponse.json(filtered, {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newConv = {
      id: `conv-${Date.now()}`,
      project_id: body.project_id || 'proj-voiceops-core',
      user_id: 'gh-user-86033717',
      title: body.title || 'New VoiceOps Session',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    inMemoryConversations.unshift(newConv);
    return NextResponse.json(newConv, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to create conversation' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
