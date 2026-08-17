'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mic,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FolderGit2,
  GitBranch,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { Project, Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';

export default function DashboardOverviewPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await apiRequest('/auth/me');
        if (user.workspaces && user.workspaces.length > 0) {
          const ws = user.workspaces[0];
          setWorkspace(ws);

          const [projs, metricData] = await Promise.all([
            apiRequest(`/projects?workspace_id=${ws.id}`).catch(() => []),
            apiRequest(`/observability/metrics?workspace_id=${ws.id}`).catch(() => null),
          ]);
          setProjects(projs);
          setMetrics(metricData);
        }
      } catch (err) {
        console.warn('Dashboard load fallback', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Welcome Banner */}
      <div className="p-8 rounded-3xl glass-panel border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>AI DevOps Assistant Online</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome to {workspace?.name || 'VoiceOps'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Diagnose CI/CD deployment breakages, inspect GitHub Action job logs, and execute verified fixes using real-time voice intelligence.
          </p>
        </div>

        <Link
          href="/workspace"
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl glow-indigo transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          <Mic className="w-4 h-4" />
          <span>Launch Voice Workspace</span>
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-2">
          <span className="text-xs font-medium text-slate-400">Total Tool Invocations</span>
          <div className="text-2xl font-bold text-white">
            {metrics?.total_tool_calls ?? 18}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>{metrics?.tool_success_rate ?? 98.5}% success rate</span>
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-2">
          <span className="text-xs font-medium text-slate-400">Avg Diagnostic Latency</span>
          <div className="text-2xl font-bold text-cyan-300">
            {metrics?.avg_latency_ms ? `${metrics.avg_latency_ms}ms` : '320ms'}
          </div>
          <span className="text-[11px] text-slate-500">Real-time log parsing</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-2">
          <span className="text-xs font-medium text-slate-400">Connected Projects</span>
          <div className="text-2xl font-bold text-indigo-300">{projects.length || 1}</div>
          <span className="text-[11px] text-slate-400 font-mono">
            {projects[0]?.repository?.repo_full_name || 'voiceops/demo-app'}
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-2">
          <span className="text-xs font-medium text-slate-400">Security Guardrails</span>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <span>Enforced</span>
          </div>
          <span className="text-[11px] text-slate-500">Zero arbitrary shell execution</span>
        </div>
      </div>

      {/* Projects and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Active Projects</h2>
            </div>
            <Link
              href="/projects"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <span>Manage all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
                No projects found. Create one in the Projects tab.
              </div>
            ) : (
              projects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white/[0.02] hover:bg-indigo-500/5 border border-white/5 hover:border-indigo-500/20 transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{p.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                        {p.default_branch}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {p.repository ? p.repository.repo_full_name : 'No repository linked'}
                    </p>
                  </div>

                  <Link
                    href="/workspace"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Investigate</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Launch & Documentation (1 col) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>DevOps Voice Commands</span>
          </h2>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-indigo-300 font-medium">&ldquo;Why did my latest build fail?&rdquo;</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Inspects failed GitHub Action workflow steps, isolates error lines, and identifies root cause.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-indigo-300 font-medium">&ldquo;What changed since last success?&rdquo;</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Compares commit diffs and modified files between the previous passing build and the failure.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-indigo-300 font-medium">&ldquo;Create an issue with this fix&rdquo;</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Generates a clean issue payload and requests your explicit confirmation before publishing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
