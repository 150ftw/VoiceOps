import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { message: 'GitHub integration disconnected successfully', connected: false },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
