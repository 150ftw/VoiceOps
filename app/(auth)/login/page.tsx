'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import logoImg from '@/public/logo.png';
import {
  Zap,
  Lock,
  Mail,
  Loader2,
  ExternalLink,
  Github,
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest, setAuthToken } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (data.access_token) {
        setAuthToken(data.access_token);
        router.push('/overview');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsGitHubLoading(true);
    setError(null);
    try {
      const urlData = await apiRequest('/auth/github/url').catch(() => null);
      if (urlData?.configured && urlData?.auth_url) {
        window.location.href = urlData.auth_url;
      } else {
        setShowConfigModal(true);
        setIsGitHubLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'GitHub login failed.');
      setIsGitHubLoading(false);
    }
  };

  const handleSaveConfigAndRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) return;

    setIsConfiguring(true);
    try {
      const res = await apiRequest('/auth/github/configure', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
        }),
      });

      if (res?.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save GitHub credentials');
      setIsConfiguring(false);
    }
  };

  const handleContinueSandbox = async () => {
    setIsGitHubLoading(true);
    setShowConfigModal(false);
    try {
      const data = await apiRequest('/auth/github/login', {
        method: 'POST',
        body: JSON.stringify({ demo_user: true }),
      });
      if (data.access_token) {
        setAuthToken(data.access_token);
        router.push('/overview');
      }
    } catch (err: any) {
      setError(err.message || 'Sandbox login failed.');
    } finally {
      setIsGitHubLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030206] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Ambient Radial Matrix Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.08)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none -top-24 -left-24 animate-pulse-subtle" />
      <div className="absolute w-[450px] h-[450px] bg-fuchsia-600/10 rounded-full blur-[140px] pointer-events-none -bottom-24 -right-24" />

      {/* Top Floating Back Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-xs text-slate-400 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-full bg-[#090514]/80 border border-purple-500/20 backdrop-blur-md"
        >
          <span>←</span>
          <span className="uppercase tracking-wider">Back to Terminal</span>
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#07040f]/90 border border-purple-500/25 rounded-3xl p-8 sm:p-10 shadow-[0_0_80px_rgba(147,51,234,0.18)] backdrop-blur-2xl relative z-10 space-y-6 overflow-hidden">
        {/* Top Laser Rim Glow */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-75" />

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group">
            <div className="relative">
              <div className="absolute -inset-4 bg-purple-600/30 rounded-full blur-xl group-hover:bg-purple-500/50 transition-all duration-500" />
              <Image
                src={logoImg}
                alt="VoiceOps Logo"
                priority
                className="relative w-14 h-14 mx-auto object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.8)] group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Sign in to VoiceOps
            </h1>
            <p className="text-[11px] font-mono text-purple-300/80 uppercase tracking-widest">
              Voice-Powered Autonomous DevOps
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2">
            <span className="text-rose-400">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* GitHub OAuth Button */}
        <button
          type="button"
          onClick={handleGitHubLogin}
          disabled={isGitHubLoading}
          className="w-full py-3 px-4 rounded-xl bg-[#0b0716] hover:bg-[#130b24] border border-purple-500/25 hover:border-purple-400/60 text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.99] disabled:opacity-60 group cursor-pointer"
        >
          {isGitHubLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          ) : (
            <svg className="w-4 h-4 fill-current text-white group-hover:text-purple-300 transition-colors" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          )}
          <span>Continue with GitHub</span>
        </button>

        {/* Laser Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />
          <span className="text-[10px] uppercase tracking-widest text-purple-300/60 font-mono">
            or continue with email
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
              01 // Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full bg-[#0b0716] border border-purple-500/20 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-xl pl-10 pr-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-300">
                02 // Master Password
              </label>
              <span className="font-mono text-[10px] text-purple-400/80 hover:text-purple-300 cursor-pointer">
                Forgot?
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0b0716] border border-purple-500/20 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 rounded-xl pl-10 pr-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:brightness-110 active:scale-[0.99] text-white font-mono text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="font-bold">Sign In ↗</span>
            )}
          </button>
        </form>

        {/* Footer Switcher */}
        <div className="text-center font-mono text-xs text-slate-400 pt-2 border-t border-purple-500/15">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-purple-300 hover:text-white font-bold transition-colors">
            Create Account →
          </Link>
        </div>
      </div>

      {/* Security & Compliance Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8 font-mono text-[10px] text-slate-500 uppercase tracking-widest z-10">
        <span>🔒 AES-256 ENCRYPTED</span>
        <span>•</span>
        <span>⚡ PGVECTOR RAG READY</span>
        <span>•</span>
        <span>🛡️ AIR-GAPPED DIFFS</span>
      </div>

      {/* GitHub OAuth Setup Modal (if not configured yet) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-white">
                <Github className="w-5 h-5" />
                <h2 className="text-sm font-bold">Connect Real GitHub OAuth</h2>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                To redirect users to the official GitHub login page, register a GitHub OAuth application:
              </p>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-white/5 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Homepage URL:</span>
                  <span className="text-indigo-300">http://localhost:3000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Authorization Callback URL:</span>
                  <span className="text-indigo-300">http://localhost:3000/callback/github</span>
                </div>
              </div>
              <a
                href="https://github.com/settings/applications/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                <span>Create GitHub OAuth App on GitHub Settings</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveConfigAndRedirect} className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">GitHub Client ID</label>
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Iv1.xxxxxxxxxxxx"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">GitHub Client Secret</label>
                <input
                  type="password"
                  required
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleContinueSandbox}
                  className="text-[11px] text-slate-400 hover:text-indigo-300 underline"
                >
                  Or test with Instant Demo User &rarr;
                </button>

                <button
                  type="submit"
                  disabled={isConfiguring || !clientId.trim() || !clientSecret.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md glow-indigo transition-all"
                >
                  {isConfiguring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save & Open GitHub Login</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
