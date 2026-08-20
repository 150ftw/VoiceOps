'use client';

import React, { useEffect, useState } from 'react';
import {
  Github,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Trash2,
  Check,
  ArrowRight,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';
import Link from 'next/link';
import { Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';

export default function IntegrationsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadStatus = async (wsId: string) => {
    try {
      const data = await apiRequest(`/integrations/github/status?workspace_id=${wsId}`);
      setStatus(data);
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
          await loadStatus(ws.id);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleOAuthConnect = async () => {
    try {
      const urlData = await apiRequest('/auth/github/url').catch(() => null);
      if (urlData?.configured && urlData?.auth_url) {
        window.location.href = urlData.auth_url;
        return;
      }
    } catch {
      // ignore
    }

    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23livqbvm2o1wqn6oE';
    const redirectUri = `${window.location.origin}/callback/github`;
    const scope = 'user:email,repo,workflow,read:org';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const handleDisconnect = async () => {
    if (!workspace) return;
    if (!confirm('Are you sure you want to disconnect GitHub from this workspace?')) return;

    setIsDisconnecting(true);
    setMessage(null);
    try {
      await apiRequest(`/integrations/github/disconnect?workspace_id=${workspace.id}`, {
        method: 'DELETE',
      });
      await loadStatus(workspace.id);
      setMessage({ text: 'GitHub integration disconnected.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to disconnect integration', type: 'error' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">GitHub & Tool Integrations</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your GitHub connection to enable repository AST indexing, CI/CD telemetry, and automated DevOps operations.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4" /> : null}
          <span>{message.text}</span>
        </div>
      )}

      {/* GitHub Integration Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 shadow-md">
              <Github className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-white">GitHub OAuth Integration</h2>
                {status?.connected ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Connected ({status.metadata?.github_username || 'Active User'})</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-800 px-2.5 py-0.5 rounded-full">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                Provides secure access to Action workflows, CI/CD run logs, AST syntax trees, and pull request mutations upon cryptographic approval.
              </p>
            </div>
          </div>

          {status?.connected && (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 self-start"
            >
              {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Disconnect</span>
            </button>
          )}
        </div>

        {/* Security & Scopes Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-slate-500 text-[10px] font-mono uppercase block">Authentication</span>
            <p className="text-slate-200 font-semibold font-mono">OAuth 2.0 PKCE</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-slate-500 text-[10px] font-mono uppercase block">Authorized Scopes</span>
            <p className="text-indigo-300 font-mono text-[11px]">repo, workflow, read:org</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-slate-500 text-[10px] font-mono uppercase block">Security Guardrail</span>
            <p className="text-emerald-400 font-semibold flex items-center gap-1 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Write Strict</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.06]">
          {status?.connected ? (
            <>
              <Link
                href="/console/projects"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950 transition-all flex items-center gap-2 group"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Manage Connected Repositories</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <button
                onClick={handleOAuthConnect}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 border border-white/10 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Re-authenticate GitHub</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleOAuthConnect}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950 transition-all flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>Connect with GitHub (OAuth)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
