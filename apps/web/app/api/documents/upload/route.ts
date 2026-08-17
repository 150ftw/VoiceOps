import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || file?.name || 'Uploaded Runbook';

    const newDoc = {
      id: `doc-${Date.now()}`,
      project_id: 'proj-voiceops-core',
      title,
      source_type: file?.name?.endsWith('.pdf') ? 'pdf' : 'markdown',
      source_url: file?.name || 'uploaded_document',
      chunk_count: 6,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(newDoc, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Failed to upload document' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
