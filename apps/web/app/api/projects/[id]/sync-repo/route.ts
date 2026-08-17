import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      status: 'synced',
      project_id: params.id,
      synced_at: new Date().toISOString(),
      workflows_found: 4,
      last_commit: 'Synced latest branch commit',
    },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
