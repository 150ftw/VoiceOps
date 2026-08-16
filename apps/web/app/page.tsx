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
  LogOut,
  LayoutDashboard,
  Github,
  Play,
  Check,
  ChevronRight,
  Cpu,
  Radio,
  FileCode2,
  GitPullRequest,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest, clearAuthToken, getAuthToken } from '@/lib/api-client';

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'diff' | 'rag' | 'approval'>('diagnosis');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [mockApprovalDone, setMockApprovalDone] = useState(false);

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

  const toggleMockVoice = () => {
    setIsPlayingVoice(!isPlayingVoice);
    if (!isPlayingVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "I analyzed workflow run 1245. The Docker build failed due to Python 3.13 bcrypt incompatibility. Shall I open a GitHub issue with the patch?"
      );
      utterance.rate = 1.05;
      utterance.onend = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden font-sans">
      {/* Ambient Backdrop Mesh Lights */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[650px] h-[550px] bg-gradient-to-br from-indigo-600/18 via-purple-600/12 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[-5%] w-[550px] h-[550px] bg-gradient-to-bl from-cyan-500/15 via-indigo-600/10 to-transparent rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[600px] h-[500px] bg-gradient-to-tr from-emerald-500/10 via-indigo-900/15 to-transparent rounded-full blur-[150px]" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Floating Glass Navbar */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="h-16 rounded-2xl bg-[#0c121e]/85 backdrop-blur-xl border border-white/10 px-5 flex items-center justify-between shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg glow-indigo">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                VoiceOps
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                v1.0
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
            <a href="#console-preview" className="hover:text-white transition-colors">
              Live Console
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a 
              href="https://github.com/150ftw/VoiceOps" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/overview"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-colors border border-white/5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/workspace"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg glow-indigo transition-all transform hover:-translate-y-0.5"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Open Workspace</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md glow-indigo transition-all transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-6xl mx-auto text-center space-y-7">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-lg text-slate-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Live Agentic DevOps Intelligence</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-indigo-400 font-mono text-[11px]">pgvector + Whisper v3</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          DevOps at the <br />
          <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            speed of voice.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
          Inspect broken CI/CD pipelines, pinpoint stack trace root causes, query architecture runbooks with pgvector, and safely execute approved GitHub actions — entirely hands-free.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <Link
            href="/workspace"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl glow-indigo transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Mic className="w-4 h-4" />
            <span>Launch Voice Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={toggleMockVoice}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2.5 ${
              isPlayingVoice
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-lg'
                : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isPlayingVoice ? (
              <>
                <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Playing Voice Feedback...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-indigo-400 fill-current" />
                <span>Hear AI Voice Demo</span>
              </>
            )}
          </button>
        </div>

        {/* Active Repos Banner Ticker */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 font-mono">
          <span className="text-slate-400">Supported Environments:</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-slate-300">GitHub Actions</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-slate-300">Docker & K8s</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-slate-300">Supabase pgvector</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-slate-300">Next.js & FastAPI</span>
        </div>
      </section>

      {/* Interactive Studio Console Simulation */}
      <section id="console-preview" className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="rounded-3xl bg-[#0B101D] border border-slate-700/70 shadow-2xl shadow-black/90 overflow-hidden ring-1 ring-white/10">
          {/* Console Header Bar */}
          <div className="px-5 py-3.5 bg-slate-950/90 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 font-medium">
                VoiceOps Interactive Console &bull; <code className="text-indigo-300">150ftw/demo-app</code>
              </span>
            </div>

            {/* Interactive Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/5 text-[11px] font-medium">
              <button
                onClick={() => setActiveTab('diagnosis')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'diagnosis'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Log Diagnostics
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'diff'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Diff Comparison
              </button>
              <button
                onClick={() => setActiveTab('rag')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'rag'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Runbook RAG
              </button>
              <button
                onClick={() => setActiveTab('approval')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'approval'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Security Guardrail
              </button>
            </div>
          </div>

          {/* Interactive Content View */}
          <div className="p-6 sm:p-8 space-y-6">
            {activeTab === 'diagnosis' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* User query */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    You
                  </div>
                  <div className="p-3.5 rounded-2xl bg-indigo-600 text-white text-xs max-w-lg leading-relaxed shadow-md">
                    &ldquo;VoiceOps, why did the latest deployment pipeline fail?&rdquo;
                  </div>
                </div>

                {/* Agent activity step */}
                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/5 space-y-2 font-mono text-xs">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Analyzed GitHub Actions run #1245 (Docker Build & Deploy)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Isolated stack trace error in <code>pip install -r requirements.txt</code></span>
                  </div>
                </div>

                {/* Agent response card */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 glow-indigo">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 max-w-2xl space-y-3 leading-relaxed">
                    <p className="font-medium text-slate-100">
                      The build failed during containerized dependency compilation:
                    </p>
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 font-mono text-[11px] text-rose-300">
                      TypeError: bcrypt==3.2.0 is incompatible with Python 3.13 runtime (Missing C-extension wheels).
                    </div>
                    <p className="text-slate-300">
                      <strong>Root Cause:</strong> The base image in <code>Dockerfile</code> was bumped to Python 3.13 without upgrading pinned requirements.<br />
                      <strong>Recommended Fix:</strong> Upgrade <code>bcrypt &ge; 4.0.0</code> or revert base image to <code>python:3.11-slim</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'diff' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-white/5">
                    <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Commit Diff: e49fa12 (Passing) &rarr; a19b882 (Failed)</span>
                    </span>
                    <span className="text-slate-500">File: Dockerfile</span>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900/90 font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto">
                    <span className="text-rose-400">- FROM python:3.11-slim</span>
                    {'\n'}
                    <span className="text-emerald-400">+ FROM python:3.13-slim</span>
                    {'\n'}
                    <span>  WORKDIR /app</span>
                    {'\n'}
                    <span>  COPY requirements.txt .</span>
                    {'\n'}
                    <span>  RUN pip install --no-cache-dir -r requirements.txt</span>
                  </pre>
                  <p className="text-xs text-slate-400 pt-1">
                    VoiceOps detected that commit <code>a19b882</code> broke compatibility with <code>requirements.txt</code>.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'rag' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>Supabase pgvector Retrieval &bull; Similarity: 94.2%</span>
                    </span>
                    <span className="text-slate-500">devops_runbook.md</span>
                  </div>
                  <blockquote className="border-l-2 border-cyan-500 pl-3 py-1 text-xs text-slate-300 italic bg-cyan-500/[0.04] rounded-r-lg">
                    &ldquo;When Docker builds encounter C-extension compilation crashes, ensure base Python runtime matches binary wheel specifications before deployment.&rdquo;
                  </blockquote>
                  <p className="text-xs text-slate-400">
                    VoiceOps automatically cross-references runbooks in pgvector to provide verified remediation steps.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'approval' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                        Security Guardrail: Action Requires Approval
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      POST /repos/150ftw/demo-app/issues
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    VoiceOps prepared a new GitHub Issue: <strong>Fix Python 3.13 bcrypt incompatibility in Dockerfile</strong>
                  </p>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => setMockApprovalDone(true)}
                      disabled={mockApprovalDone}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                        mockApprovalDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white glow-indigo'
                      }`}
                    >
                      {mockApprovalDone ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>✓ Action Executed on GitHub</span>
                        </>
                      ) : (
                        <span>Approve & Execute</span>
                      )}
                    </button>
                    <button
                      onClick={() => setMockApprovalDone(false)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Showcase */}
      <section id="capabilities" className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Mission-Critical DevOps
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            A stateful agentic system connected directly to your repositories, CI/CD runners, and vector knowledge base.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Feature 1 */}
          <div className="p-7 rounded-3xl bg-[#0c121e] border border-white/10 hover:border-indigo-500/40 transition-all space-y-3.5 shadow-xl group">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Streaming Voice AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time voice capture with live Web Audio visualizer, near-instant Whisper transcription, speech synthesis, and natural barge-in interruption.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-3xl bg-[#0c121e] border border-white/10 hover:border-cyan-500/40 transition-all space-y-3.5 shadow-xl group">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">CI/CD Log Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated log extraction, ANSI stripping, stack trace isolation, and diff comparisons to pinpoint the exact broken lines.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-3xl bg-[#0c121e] border border-white/10 hover:border-emerald-500/40 transition-all space-y-3.5 shadow-xl group">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">pgvector Repository Memory</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically ingests full codebases, manifests, Dockerfiles, and runbooks into Supabase pgvector for sub-second semantic retrieval.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-3xl bg-[#0c121e] border border-white/10 hover:border-amber-500/40 transition-all space-y-3.5 shadow-xl group">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Human-in-the-Loop Guardrails</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero unauthorized write actions. Creating issues, opening PRs, or retrying workflows requires explicit developer cryptographic approval.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 rounded-3xl bg-[#0c121e] border border-white/10 hover:border-rose-500/40 transition-all space-y-3.5 shadow-xl group">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">AES-128 Encrypted Secrets</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              GitHub OAuth tokens and credentials are encrypted at rest using AES-128-CBC and never exposed to the frontend or LLM prompts.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 rounded-3xl bg-[#0c121e] border border-white/10 hover:border-purple-500/40 transition-all space-y-3.5 shadow-xl group">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Multi-Model Orchestrator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Switch seamlessly between Google Gemini 1.5 Pro, OpenAI GPT-4o, Claude 3.5 Sonnet, and DeepSeek R1 for specialized reasoning.
            </p>
          </div>
        </div>
      </section>

      {/* System Architecture Flow */}
      <section id="architecture" className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="p-8 rounded-3xl bg-[#0c121e] border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Full-Duplex VoiceOps Architecture</h3>
              <p className="text-xs text-slate-400">Deterministic tool execution with real-time audio pipeline</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 space-y-2">
              <div className="text-indigo-400 font-mono font-bold">01 &bull; Input</div>
              <p className="font-semibold text-slate-200">Voice Streaming</p>
              <p className="text-[11px] text-slate-400">Whisper v3 / Web Speech</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 space-y-2">
              <div className="text-cyan-400 font-mono font-bold">02 &bull; Agent</div>
              <p className="font-semibold text-slate-200">Orchestration Loop</p>
              <p className="text-[11px] text-slate-400">Gemini &bull; GPT-4o &bull; Claude</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 space-y-2">
              <div className="text-emerald-400 font-mono font-bold">03 &bull; Context</div>
              <p className="font-semibold text-slate-200">pgvector RAG</p>
              <p className="text-[11px] text-slate-400">Supabase 1536-dim chunks</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/5 space-y-2">
              <div className="text-amber-400 font-mono font-bold">04 &bull; Guardrail</div>
              <p className="font-semibold text-slate-200">Approved Execution</p>
              <p className="text-[11px] text-slate-400">GitHub REST API Write</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-indigo-900/30 to-slate-950 border border-indigo-500/30 shadow-2xl space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to debug your infrastructure with voice?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Connect your GitHub repositories in seconds and experience real-time AI DevOps investigations.
          </p>
          <div className="pt-2">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl glow-indigo transition-all transform hover:-translate-y-0.5"
            >
              <Mic className="w-4 h-4" />
              <span>Get Started Now &mdash; It&apos;s Free</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} VoiceOps &bull; Next-Gen Voice DevOps Assistant &bull; Built with Next.js, FastAPI, pgvector, and Supabase.</p>
      </footer>
    </div>
  );
}
