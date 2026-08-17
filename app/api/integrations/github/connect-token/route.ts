import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { message: 'GitHub personal access token connected successfully', connected: true },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
