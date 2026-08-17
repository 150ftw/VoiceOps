'use client';

import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  Github,
  CheckCircle2,
  Key,
  ShieldCheck,
  Loader2,
  RefreshCw,
  ExternalLink,
  Trash2,
  Check,
} from 'lucide-react';
import { Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';

export default function IntegrationsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [patToken, setPatToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleConnectPAT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !patToken.trim()) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      await apiRequest(`/integrations/github/connect-token?workspace_id=${workspace.id}`, {
        method: 'POST',
        body: JSON.stringify({ token: patToken.trim() }),
      });
      setPatToken('');
      await loadStatus(workspace.id);
      setMessage({ text: 'GitHub Personal Access Token connected successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to connect token. Please verify token permissions.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
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
          Connect your GitHub account to enable real-time workflow inspection, log diagnostics, and issue tracking.
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">GitHub Integration</h2>
                {status?.connected ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Connected ({status.metadata?.github_username || 'OAuth Account'})</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-800 px-2.5 py-0.5 rounded-full">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Grants read access to Action runs, CI/CD logs, commits, and write access (upon approval) for issues & PRs.
              </p>
            </div>
          </div>

          {status?.connected && (
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Disconnect</span>
            </button>
          )}
        </div>

        {/* Security Note */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center gap-3 text-xs text-slate-300">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>
            Credentials are encrypted at rest using AES-128-CBC (Fernet) and never returned to the browser or stored in plaintext.
          </span>
        </div>

        {/* Connect via Token Form */}
        <form onSubmit={handleConnectPAT} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-semibold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Connect GitHub Personal Access Token (or Fine-Grained Token)</span>
            </label>
            <input
              type="password"
              value={patToken}
              onChange={(e) => setPatToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <span className="block text-[11px] text-slate-500 mt-1">
              Required scopes: <code className="text-indigo-300">repo</code>, <code className="text-indigo-300">workflow</code>, <code className="text-indigo-300">read:org</code>.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !patToken.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md glow-indigo transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Encrypted Token</span>
            </button>

            <button
              type="button"
              onClick={handleOAuthConnect}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Connect with OAuth</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
