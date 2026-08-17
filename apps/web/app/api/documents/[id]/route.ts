import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { message: 'Document deleted successfully', id: params.id },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
