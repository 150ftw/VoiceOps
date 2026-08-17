import { NextRequest, NextResponse } from 'next/server';
import { inMemoryDocs } from '@/lib/docs-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = inMemoryDocs.findIndex((d) => d.id === params.id);
  if (index !== -1) {
    inMemoryDocs.splice(index, 1);
  }

  return NextResponse.json(
    { message: 'Document deleted successfully', id: params.id },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
