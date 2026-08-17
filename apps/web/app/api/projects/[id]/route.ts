import { NextRequest, NextResponse } from 'next/server';
import { inMemoryProjects } from '@/lib/projects-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = inMemoryProjects.findIndex((p) => p.id === params.id);
  if (index !== -1) {
    inMemoryProjects.splice(index, 1);
  }

  return NextResponse.json(
    { message: 'Project deleted successfully', id: params.id },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const proj = inMemoryProjects.find((p) => p.id === params.id);
  if (proj) {
    return NextResponse.json(proj, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  return NextResponse.json(
    {
      id: params.id,
      name: 'VoiceOps Platform',
      github_repo: '150ftw/VoiceOps',
      github_branch: 'main',
      default_branch: 'main',
      is_active: true,
    },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
