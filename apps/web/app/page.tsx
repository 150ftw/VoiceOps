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
  Volume2,
  VolumeX,
  Code2,
  Workflow,
  Search,
  KeyRound,
  ExternalLink,
  ChevronDown,
  Globe,
  Boxes,
  Sliders,
  Shield,
  Unlink,
  Server,
} from 'lucide-react';
import { apiRequest, clearAuthToken, getAuthToken } from '@/lib/api-client';
import { SeniorHeroVisual } from '@/components/landing/senior-hero-visual';

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'diff' | 'rag' | 'approval'>('diagnosis');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [mockApprovalDone, setMockApprovalDone] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("Why did my latest deployment to production fail?");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    if (isPlayingVoice) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingVoice(false);
      return;
    }

    setIsPlayingVoice(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "I analyzed workflow run 1245 for demo-app. The Docker build failed due to Python 3.13 bcrypt incompatibility. Would you like me to open a pull request to patch it?"
      );
      utterance.rate = 1.05;
      utterance.onend = () => setIsPlayingVoice(false);
      utterance.onerror = () => setIsPlayingVoice(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const interactivePrompts = [
    {
      title: "Pipeline Failure",
      query: "Why did my latest deployment to production fail?",
      tab: "diagnosis" as const,
    },
    {
      title: "Commit Comparison",
      query: "What changed between the last passing and failed build?",
      tab: "diff" as const,
    },
    {
      title: "Runbook Search",
      query: "Search documentation for Docker compilation procedures",
      tab: "rag" as const,
    },
    {
      title: "Trigger Patch PR",
      query: "Prepare an approved PR to downgrade Docker base image",
      tab: "approval" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden font-sans antialiased">
      {/* High-End 3D Perspective Wave Grid & Radial Lighting */}
      <SeniorHeroVisual />

      {/* Floating Header Navigation */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="h-16 rounded-2xl bg-[#060A14]/80 backdrop-blur-xl border border-white/[0.08] px-5 flex items-center justify-between shadow-2xl shadow-black/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg glow-indigo">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight text-white">
                VoiceOps
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                2.0
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
            <a href="#console-preview" className="hover:text-white transition-colors">
              Studio Console
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/150ftw/VoiceOps"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition-colors border border-white/5"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/workspace"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg glow-indigo transition-all transform hover:-translate-y-0.5"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Workspace</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
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
      <section className="relative pt-16 pb-12 px-6 max-w-6xl mx-auto text-center space-y-7 z-10">
        {/* Shimmer Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] shadow-2xl text-slate-300 text-xs font-medium backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200">Autonomous DevOps Voice Intelligence</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-indigo-400 font-mono text-[11px]">pgvector Memory &bull; Whisper v3</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
          Talk to your infrastructure. <br />
          <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            Fix CI/CD in seconds.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
          VoiceOps listens, traverses full GitHub repository trees, isolates build error stack traces, and prepares cryptographically approved fixes &mdash; without touching a terminal.
        </p>

        {/* Dual Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/workspace"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl glow-indigo transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 border border-indigo-400/30"
          >
            <Mic className="w-4 h-4" />
            <span>Launch Live Voice Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={toggleMockVoice}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2.5 backdrop-blur-md ${
              isPlayingVoice
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-xl glow-rose'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200 hover:text-white'
            }`}
          >
            {isPlayingVoice ? (
              <>
                <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>Playing AI Voice Synthesis...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-indigo-400 fill-current" />
                <span>Hear AI Voice Response</span>
              </>
            )}
          </button>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-4xl mx-auto w-full">
          <div className="p-4 rounded-2xl bg-[#060A14] border border-white/[0.06] shadow-xl text-left">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Voice Latency</p>
            <p className="text-base font-extrabold text-cyan-300 mt-0.5 font-mono">~180 ms</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Streaming STT &bull; Whisper v3</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#060A14] border border-white/[0.06] shadow-xl text-left">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Vector Memory</p>
            <p className="text-base font-extrabold text-indigo-300 mt-0.5 font-mono">1536-dim</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Supabase pgvector HNSW</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#060A14] border border-white/[0.06] shadow-xl text-left">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Context Window</p>
            <p className="text-base font-extrabold text-purple-300 mt-0.5 font-mono">1M Tokens</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Gemini 1.5 Pro &bull; Multi-Model</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#060A14] border border-white/[0.06] shadow-xl text-left">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">Guardrail Safety</p>
            <p className="text-base font-extrabold text-emerald-300 mt-0.5 font-mono">Enforced</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Cryptographic 1-click Approval</p>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Interactive Prompts:</span>
          {interactivePrompts.map((p) => (
            <button
              key={p.title}
              onClick={() => {
                setSelectedPrompt(p.query);
                setActiveTab(p.tab);
                const el = document.getElementById('console-preview');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1 rounded-xl bg-white/[0.03] hover:bg-indigo-500/20 hover:border-indigo-500/40 border border-white/[0.06] text-slate-300 hover:text-white transition-all text-xs font-mono"
            >
              {p.title} &rarr;
            </button>
          ))}
        </div>
      </section>

      {/* Interactive DevOps Studio Console Simulation */}
      <section id="console-preview" className="py-12 px-6 max-w-5xl mx-auto relative z-10">
        <div className="rounded-3xl bg-[#060A14] border border-white/[0.08] shadow-2xl overflow-hidden">
          {/* macOS Terminal Window Header */}
          <div className="px-5 py-3.5 bg-[#03060E] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-semibold text-slate-200">VoiceOps Studio Session</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-indigo-400">150ftw/demo-app (main)</span>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-white/5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('diagnosis')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'diagnosis'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Log Diagnostics
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'diff'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Diff Comparison
              </button>
              <button
                onClick={() => setActiveTab('rag')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'rag'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Runbook RAG
              </button>
              <button
                onClick={() => setActiveTab('approval')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'approval'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Security Guardrail
              </button>
            </div>
          </div>

          {/* Console Simulation Body */}
          <div className="p-6 space-y-6">
            {/* User Prompt Simulation */}
            <div className="flex justify-end">
              <div className="flex items-start gap-2.5 max-w-lg">
                <div className="p-3.5 rounded-2xl bg-indigo-600 text-white text-xs font-mono leading-relaxed shadow-lg">
                  &ldquo;{selectedPrompt}&rdquo;
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                  You
                </div>
              </div>
            </div>

            {/* AI Agent Telemetry Steps */}
            <div className="space-y-2 font-mono text-xs max-w-2xl">
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Analyzed GitHub Actions workflow run #1245 (Docker Build &amp; Deploy)</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Isolated stack trace error in pip install -r requirements.txt (Line 14)</span>
              </div>
            </div>

            {/* Tab 1: Diagnostics */}
            {activeTab === 'diagnosis' && (
              <div className="p-4 rounded-2xl bg-[#03060E] border border-white/[0.06] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Root Cause Isolated: Python 3.13 / bcrypt Dependency Mismatch</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Exit Code: 1</span>
                </div>
                <div className="bg-[#05070D] p-3 rounded-xl border border-white/5 text-[11px] space-y-1 text-slate-300 leading-relaxed">
                  <p className="text-slate-500"># Workflow Run #1245 &bull; Job: docker_build</p>
                  <p className="text-rose-400 font-bold">
                    ERROR: Failed building wheel for bcrypt (Legacy C-extension build failed)
                  </p>
                  <p className="text-slate-400">
                    &bull; Python 3.13 removed deprecated Py_UNICODE APIs used in bcrypt &lt; 4.0.0
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    &bull; Recommended Fix: Pin python:3.11-slim base image or upgrade bcrypt &gt;= 4.1.2
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Diff Comparison */}
            {activeTab === 'diff' && (
              <div className="p-4 rounded-2xl bg-[#03060E] border border-white/[0.06] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-indigo-300 font-bold">
                    <GitPullRequest className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Proposed Patch Diff &bull; Dockerfile</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">+1 / -1 lines</span>
                </div>
                <div className="bg-[#05070D] p-3 rounded-xl border border-white/5 text-[11px] space-y-1 font-mono leading-relaxed">
                  <p className="text-slate-500">@@ -1,3 +1,3 @@</p>
                  <p className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    - FROM python:3.13-rc-slim AS base
                  </p>
                  <p className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                    + FROM python:3.11-slim AS base
                  </p>
                  <p className="text-slate-400 px-2">  WORKDIR /app</p>
                  <p className="text-slate-400 px-2">  COPY requirements.txt .</p>
                </div>
              </div>
            )}

            {/* Tab 3: RAG Runbook */}
            {activeTab === 'rag' && (
              <div className="p-4 rounded-2xl bg-[#03060E] border border-white/[0.06] space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5 font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>pgvector Runbook Match &bull; 94.2% Similarity</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Runbook ID: DOC-204</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 leading-relaxed">
                  <p className="font-bold text-white">Docker Build Standards &bull; Production Runbook</p>
                  <p className="text-slate-300 text-[11px]">
                    &ldquo;All microservices deployed to AWS EKS production cluster must pin LTS Python 3.11 runtimes. Python 3.13 Release Candidate base images are strictly prohibited in production.&rdquo;
                  </p>
                  <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
                    <span>Source: /docs/runbooks/docker_standards.md</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Security Approval */}
            {activeTab === 'approval' && (
              <div className="p-4 rounded-2xl bg-[#03060E] border border-indigo-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cryptographic Developer Approval Required</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                    Pending Confirmation
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  VoiceOps wants to open a pull request <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">patch/fix-python-base-image</code> on <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">150ftw/demo-app</code>.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setMockApprovalDone(true)}
                    disabled={mockApprovalDone}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      mockApprovalDone
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{mockApprovalDone ? 'Pull Request #42 Created!' : 'Approve & Create PR'}</span>
                  </button>

                  {!mockApprovalDone && (
                    <button
                      onClick={() => setSelectedPrompt("Why did my latest deployment to production fail?")}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-white/10 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="capabilities" className="py-16 px-6 max-w-6xl mx-auto space-y-10 relative z-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Built for High-Stakes Incident Response
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Engineered from ground up with real-time streaming voice, vector knowledge retrieval, and cryptographic safety guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-[#060A14] border border-white/[0.06] shadow-xl space-y-4 hover:border-indigo-500/30 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white">Streaming Voice with Interruption</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full-duplex WebSocket architecture allows you to speak naturally and interrupt AI reasoning whenever needed &mdash; just like chatting with a senior teammate on Slack huddles.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-[#060A14] border border-white/[0.06] shadow-xl space-y-4 hover:border-cyan-500/30 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white">pgvector Semantic Runbooks</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Indexes PDF, Markdown, and text architecture documents into 1536-dimensional embeddings for grounded responses with citations.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-[#060A14] border border-white/[0.06] shadow-xl space-y-4 hover:border-emerald-500/30 transition-all group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white">Cryptographic Safety Guardrails</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero unauthorized repository writes or deployments. Dangerous actions require explicit human confirmation and are recorded in immutable audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Multi-Model Multi-Orchestrator Section */}
      <section id="architecture" className="py-16 px-6 max-w-6xl mx-auto space-y-10 relative z-10">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Multi-Model AI Orchestrator
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Seamlessly switch between leading frontier models tailored for large codebase traversal and function execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#060A14] border border-cyan-500/20 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Gemini 1.5 Pro</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              1,000,000 token context window for massive multi-file AST traversal and monolithic workflow logs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#060A14] border border-emerald-500/20 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">GPT-4o</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Omni-architecture with high-precision tool calling for automated pull request synthesis.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#060A14] border border-amber-500/20 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Claude 3.5 Sonnet</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              State-of-the-art code diff analysis and deep semantic syntax diagnostics.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#060A14] border border-purple-500/20 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">DeepSeek R1</span>
              <span className="w-2 h-2 rounded-full bg-purple-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Deep reasoning chains for race conditions and distributed microservice failures.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-16 px-6 max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about VoiceOps architecture, safety, and integration.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "How does VoiceOps connect to my GitHub repository?",
              a: "VoiceOps uses official GitHub OAuth 2.0 with minimal required permissions. It reads file structures, workflow run logs, and commit trees on demand, caching semantic embeddings in Supabase pgvector.",
            },
            {
              q: "Can the AI execute dangerous code or delete branches automatically?",
              a: "Never. All mutation actions (such as opening pull requests, creating issues, or re-triggering workflows) are gated by our cryptographic Approval Manager and require explicit confirmation in the studio.",
            },
            {
              q: "Can I use VoiceOps completely hands-free with microphone audio?",
              a: "Yes! VoiceOps features full streaming voice STT and instant TTS playback. You can speak naturally, and interrupt the agent at any point with the microphone orb.",
            },
            {
              q: "How do I add my own team runbooks and documentation?",
              a: "Navigate to the Knowledge Base page and drag-and-drop your team's Markdown, PDF, or text documents. They are automatically chunked and indexed into pgvector for grounded retrieval.",
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#060A14] border border-white/[0.06] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-200 hover:text-white"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04] pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#010204] py-12 px-6 relative z-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>VoiceOps</span>
            <span className="text-slate-600 font-normal">&bull; Autonomous DevOps Engineering</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/workspace" className="hover:text-white transition-colors">
              Workspace
            </Link>
            <Link href="/projects" className="hover:text-white transition-colors">
              Projects
            </Link>
            <a
              href="https://github.com/150ftw/VoiceOps"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>

          <p className="text-[11px] font-mono text-slate-600">
            &copy; 2026 VoiceOps Monorepo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
