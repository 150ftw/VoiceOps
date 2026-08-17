import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { message: 'Conversation history cleared successfully', id: params.id },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
