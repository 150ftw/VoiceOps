import { NextRequest, NextResponse } from 'next/server';
import { inMemoryDocs } from '@/lib/docs-data';

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

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('project_id');
  
  const docs = projectId
    ? inMemoryDocs.filter((d) => !d.project_id || d.project_id === projectId || d.project_id === 'proj-voiceops-core')
    : inMemoryDocs;

  return NextResponse.json(docs, {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
