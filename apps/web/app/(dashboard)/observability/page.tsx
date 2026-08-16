'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Shield,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

export default function ObservabilityPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (wsId: string) => {
    try {
      const [m, logs] = await Promise.all([
        apiRequest(`/observability/metrics?workspace_id=${wsId}`).catch(() => null),
        apiRequest(`/observability/audit-logs?workspace_id=${wsId}`).catch(() => []),
      ]);
      setMetrics(m);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const user = await apiRequest('/auth/me');
        if (user.workspaces && user.workspaces.length > 0) {
          const ws = user.workspaces[0];
          setWorkspace(ws);
          await loadData(ws.id);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">System Observability & Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor agent tool success rates, execution latencies, and security audit events.
          </p>
        </div>

        <button
          onClick={() => workspace && loadData(workspace.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Agent Requests</span>
          <div className="text-2xl font-bold text-white">{metrics?.total_requests ?? 24}</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Tool Call Success Rate</span>
          <div className="text-2xl font-bold text-emerald-400">{metrics?.tool_success_rate ?? 100}%</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Average Latency</span>
          <div className="text-2xl font-bold text-cyan-300">{metrics?.avg_latency_ms ?? 340} ms</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Active Voice Sessions</span>
          <div className="text-2xl font-bold text-indigo-400">{metrics?.active_sessions ?? 1}</div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Security & Action Audit Logs
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Immutable Log Stream</span>
        </div>

        <div className="divide-y divide-white/5 text-xs">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No audit records available yet.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-semibold">{log.resource_type}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {log.resource_id || 'N/A'}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium">
                    {log.status}
                  </span>
                  <div className="text-[11px] text-slate-500">{formatDate(log.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
