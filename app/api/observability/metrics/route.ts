import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      total_conversations: 42,
      total_tool_calls: 189,
      avg_latency_ms: 320,
      active_incidents: 0,
      system_health: 'healthy',
      success_rate: 98.4,
      voice_accuracy: 99.1,
      total_approvals: 16,
      p95_latency_ms: 450,
      p99_latency_ms: 680,
    },
    { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
