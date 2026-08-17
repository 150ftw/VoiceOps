import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { message: 'Project deleted successfully', id: params.id },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      id: params.id,
      name: 'VoiceOps Platform',
      github_repo: '150ftw/VoiceOps',
      github_branch: 'main',
      is_active: true,
    },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
