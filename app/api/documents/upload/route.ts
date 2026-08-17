import { NextRequest, NextResponse } from 'next/server';
import { inMemoryDocs } from '@/lib/docs-data';
import { DocumentItem } from '@voiceops/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const projectId = (formData.get('project_id') as string) || 'proj-voiceops-core';
    const title = (formData.get('title') as string) || file?.name || 'Uploaded Runbook';

    const ext = file?.name?.toLowerCase().split('.').pop();
    const fileType: 'md' | 'txt' | 'pdf' = ext === 'pdf' ? 'pdf' : ext === 'txt' ? 'txt' : 'md';
    const fileSize = file?.size || 16384;
    const chunksCount = Math.max(3, Math.floor(fileSize / 1200));

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      project_id: projectId,
      title,
      filename: file?.name || 'runbook.md',
      file_type: fileType,
      file_size: fileSize,
      status: 'indexed',
      chunks_count: chunksCount,
      created_at: new Date().toISOString(),
    };

    inMemoryDocs.unshift(newDoc);

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
