'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mic,
  Zap,
  ShieldCheck,
  GitBranch,
  Terminal,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Bot,
  Activity,
  Layers,
  Database,
  Lock,
  User,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { apiRequest, clearAuthToken, getAuthToken } from '@/lib/api-client';

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (token) {
        try {
          const user = await apiRequest('/auth/me');
          setCurrentUser(user);
        } catch (_) {
          clearAuthToken();
        }
      }
      setIsLoadingUser(false);
    }
    checkAuth();
  }, []);

  const handleSignOut = () => {
    clearAuthToken();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg glow-indigo">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            VoiceOps
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">
            Capabilities
          </a>
          <a href="#demo" className="hover:text-white transition-colors">
            Voice Demo
          </a>
          <a href="#architecture" className="hover:text-white transition-colors">
            Architecture
          </a>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link
                href="/overview"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/workspace"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg glow-indigo transition-all transform hover:-translate-y-0.5"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors text-xs"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg glow-indigo transition-all transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Logged in Welcome Notification */}
      {currentUser && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {currentUser.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Welcome back, {currentUser.full_name}!</p>
                <p className="text-[11px] text-indigo-300/80">Your DevOps assistant is active and connected to Supabase.</p>
              </div>
            </div>
            <Link
              href="/workspace"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md glow-indigo transition-colors"
            >
              <span>Open Voice Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto text-center space-y-8 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -top-24 left-1/2 -translate-x-1/2 -z-10" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Gen Agentic DevOps Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Your voice-first <br />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            AI DevOps Engineer
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Investigate failed GitHub Actions workflows, analyze build logs, search architecture runbooks using RAG, and trigger safe, approved fixes through natural voice conversations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/workspace"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-2xl glow-indigo transition-all flex items-center justify-center gap-2.5"
          >
            <Mic className="w-5 h-5" />
            <span>Launch Live Voice Workspace</span>
          </Link>
          <Link
            href={currentUser ? "/overview" : "/login"}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{currentUser ? "Open Dashboard Overview" : "Developer Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Interactive Simulation / Live Demo Card */}
      <section id="demo" className="max-w-5xl mx-auto px-6 py-12">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">VoiceOps Session — investigation-1245</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Investigation
            </span>
          </div>

          <div className="space-y-4">
            {/* User turn */}
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-xs font-bold">You</div>
              <div className="p-4 rounded-2xl bg-indigo-600 text-white text-xs max-w-lg leading-relaxed shadow-md">
                &ldquo;Why did my latest deployment to production fail?&rdquo;
              </div>
            </div>

            {/* Agent Live Activity */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs text-slate-300 space-y-2 font-mono">
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Found latest failed workflow run: <strong>#1245 (Docker Build & Deploy)</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Extracted 18 lines of error logs from failed step: <code>pip install -r requirements.txt</code></span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compared with previous successful build SHA <code>e49fa12</code></span>
              </div>
            </div>

            {/* Agent response */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-bold text-white glow-indigo">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-5 rounded-2xl glass-panel border border-white/10 text-xs text-slate-200 max-w-xl space-y-3 leading-relaxed">
                <p>
                  I analyzed the logs for workflow run <strong>#1245</strong>. The failure occurred during the Docker build stage due to a Python version mismatch:
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-rose-300">
                  TypeError: bcrypt 3.2.0 is incompatible with Python 3.13 runtime.
                </div>
                <p>
                  <strong>Root Cause:</strong> The Dockerfile was updated to Python 3.13, while previous passing builds used Python 3.11.<br />
                  <strong>Recommended Fix:</strong> Upgrade bcrypt to &ge; 4.0.0 or revert base image to Python 3.11.
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between">
                  <span>Shall I open a GitHub issue with this diagnosis and patch recommendation?</span>
                  <span className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[10px]">
                    Requires Approval
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Engineered for Real-World DevOps</h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Not a toy chatbot — a robust, stateful agentic system connected directly to real developer tools and APIs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Streaming Voice AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time voice capture with live visualizer, near-instant Whisper transcription, ElevenLabs TTS, and full interruption handling.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">CI/CD Log Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated log extraction, ANSI stripping, stack trace isolation, and diff comparisons to pinpoint exact root causes.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">pgvector Documentation RAG</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingest runbooks, Markdown, and PDFs into PostgreSQL pgvector with hybrid similarity search and verifiable citation cards.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Human-in-the-Loop Approvals</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero unauthorized write actions. Creating issues, opening PRs, or retrying workflows requires cryptographic approval confirmation.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Encrypted Secret Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              GitHub OAuth tokens are encrypted at rest using AES-128-CBC and never exposed to the frontend or LLM prompts.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Stateful Agent Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains persistent conversation memory across turns, tracking active repos, workflow runs, intent, and entities.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} VoiceOps &bull; Built with Next.js, FastAPI, PostgreSQL, pgvector, Redis, and WebSockets.</p>
      </footer>
    </div>
  );
}
