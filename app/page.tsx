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
  Menu,
  X,
} from 'lucide-react';
import { apiRequest, clearAuthToken, getAuthToken } from '@/lib/api-client';
import { HeroBackground } from '@/components/landing/hero-background';
import Scanner from '@/components/landing/Scanner';

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'diff' | 'rag' | 'approval'>('diagnosis');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [mockApprovalDone, setMockApprovalDone] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("Why did my latest deployment to production fail?");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTelemetryBox, setShowTelemetryBox] = useState(true);

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
    <div className="min-h-screen bg-[#030206] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200 relative overflow-x-hidden font-sans antialiased">
      {/* Background Looping Ambient Video & Particle Sine Wavefield */}
      <HeroBackground />

      {/* React Bits WebGL Scanner Field Background */}
      <div className="absolute inset-0 h-[1000px] pointer-events-none z-0 overflow-hidden">
        <Scanner
          color1="#581C87"
          color2="#C084FC"
          color3="#FFFFFF"
          speed={0.45}
          sweepSpeed={0.3}
          sweepWidth={0.9}
          sweepFalloff={2.8}
          scale={1.4}
          frequency={2.2}
          ripple={0.22}
          bandDensity={11}
          lineSharpness={5.0}
          glow={0.38}
          scanDirection="vertical"
          colorSpread={0.7}
          brightness={1.0}
          contrast={1.15}
          softness={1.4}
          vignette={0.45}
          scanline={true}
          grain={true}
          grainIntensity={0.04}
          opacity={0.8}
          mouseInteraction={true}
          mouseRadius={0.5}
          mouseStrength={0.5}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030206]/40 via-transparent to-[#030206] pointer-events-none" />
      </div>

      {/* Editorial Luxury Header */}
      <header className="relative z-50 w-full px-6 sm:px-12 pt-6 flex items-center justify-between font-mono text-xs text-purple-200/80">
        {/* Left Actions */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 hover:text-white transition-colors group tracking-widest uppercase font-semibold"
          >
            <div className="flex flex-col gap-1 w-4">
              <span className="w-full h-0.5 bg-purple-300 group-hover:bg-white transition-colors" />
              <span className="w-3 h-0.5 bg-purple-300 group-hover:bg-white transition-colors" />
            </div>
            <span>Menu</span>
          </button>

          <a
            href="#console-preview"
            className="hidden sm:inline-block hover:text-white transition-colors tracking-widest uppercase"
          >
            Studio
          </a>
          <a
            href="#capabilities"
            className="hidden sm:inline-block hover:text-white transition-colors tracking-widest uppercase"
          >
            Capabilities
          </a>
        </div>

        {/* Center Logo in Rubik Glitch */}
        <Link
          href="/"
          className="text-lg sm:text-2xl font-glitch text-purple-200 hover:text-white tracking-widest transition-colors uppercase select-none"
        >
          VOICEOPS
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-block text-[11px] text-purple-400/80 uppercase tracking-widest font-mono">
            V2.0 &bull; LIVE
          </span>

          {currentUser ? (
            <Link
              href="/workspace"
              className="px-4 py-1.5 rounded-full bg-purple-200 hover:bg-white text-slate-950 font-bold tracking-wider text-[11px] uppercase transition-all shadow-lg glow-purple"
            >
              Workspace
            </Link>
          ) : (
            <Link
              href="/register"
              className="px-4 py-1.5 rounded-full bg-purple-200 hover:bg-white text-slate-950 font-bold tracking-wider text-[11px] uppercase transition-all shadow-lg glow-purple"
            >
              Get Started
            </Link>
          )}
        </div>
      </header>

      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#030206]/95 backdrop-blur-2xl p-8 flex flex-col justify-between animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <span className="text-xl font-glitch text-purple-300">VOICEOPS</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-purple-300 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6 font-syne text-2xl sm:text-4xl text-slate-200 max-w-lg mx-auto text-center">
            <Link
              href="/workspace"
              onClick={() => setIsMenuOpen(false)}
              className="block hover:text-purple-400 transition-colors"
            >
              Live Voice Workspace
            </Link>
            <Link
              href="/projects"
              onClick={() => setIsMenuOpen(false)}
              className="block hover:text-purple-400 transition-colors"
            >
              Repositories &amp; Projects
            </Link>
            <Link
              href="/knowledge"
              onClick={() => setIsMenuOpen(false)}
              className="block hover:text-purple-400 transition-colors"
            >
              pgvector Knowledge Base
            </Link>
            <a
              href="#architecture"
              onClick={() => setIsMenuOpen(false)}
              className="block hover:text-purple-400 transition-colors"
            >
              Architecture &amp; Security
            </a>
            <a
              href="https://github.com/150ftw/VoiceOps"
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:text-purple-400 transition-colors text-lg font-mono text-purple-400"
            >
              GitHub Repository &rarr;
            </a>
          </div>

          <div className="text-center font-mono text-xs text-purple-400/60">
            &copy; 2026 VoiceOps Autonomous DevOps Platform
          </div>
        </div>
      )}

      {/* Hero Section — Editorial Brutalist Showcase */}
      <section className="relative pt-20 pb-16 px-6 sm:px-12 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[75vh] text-center z-10 select-none">
        {/* Top Sub-Header */}
        <p className="font-mono text-xs sm:text-sm text-purple-300/90 tracking-[0.25em] uppercase mb-4">
          Autonomous DevOps Voice Engine
        </p>

        {/* Massive Centerpiece Display Headline in Rubik Glitch on separate lines */}
        <h1 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-glitch text-purple-200/95 tracking-[0.05em] sm:tracking-[0.14em] leading-[0.9] uppercase drop-shadow-[0_0_60px_rgba(168,85,247,0.4)] scale-y-95 my-2">
          VOICE <br />
          <span className="text-purple-300">OPS</span>
        </h1>

        {/* Secondary Subtitle */}
        <p className="font-mono text-xs sm:text-sm text-purple-300/80 max-w-xl mx-auto tracking-widest uppercase mt-4">
          Talk to your infrastructure. Fix CI/CD in seconds.
        </p>

        {/* Bottom 3-Column Editorial Metadata Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-16 pt-8 border-t border-purple-500/20 text-left font-mono text-[11px]">
          <div className="space-y-1">
            <p className="text-purple-400 font-bold uppercase tracking-wider">01 // INTELLIGENCE</p>
            <p className="text-slate-400 leading-relaxed uppercase">
              Gemini 1.5 Pro (1M Context) &bull; GPT-4o Omni Function Calling &bull; Deep Code AST
            </p>
          </div>

          <div className="space-y-1 md:text-center">
            <p className="text-purple-400 font-bold uppercase tracking-wider">02 // REAL-TIME VOICE</p>
            <p className="text-slate-400 leading-relaxed uppercase">
              180ms Latency &bull; Whisper v3 Streaming STT &bull; ElevenLabs Neural TTS
            </p>
          </div>

          <div className="space-y-1 md:text-right">
            <p className="text-purple-400 font-bold uppercase tracking-wider">03 // GUARDRAILS</p>
            <p className="text-slate-400 leading-relaxed uppercase">
              Cryptographic Human Confirmation &bull; Zero Unauthorized Repository Writes
            </p>
          </div>
        </div>

        {/* Floating Circular Interactive CTA & Audio Meter */}
        <div className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6 pt-12">
          {/* Bottom-Left Audio Level Waveform */}
          <div className="flex items-center gap-3 font-mono text-xs text-purple-300">
            <div className="flex items-end gap-1 h-5">
              <span className="w-1 bg-purple-400 animate-[wave_0.8s_ease-in-out_infinite] h-3 rounded-full" />
              <span className="w-1 bg-purple-300 animate-[wave_1.2s_ease-in-out_infinite_0.2s] h-5 rounded-full" />
              <span className="w-1 bg-purple-500 animate-[wave_0.9s_ease-in-out_infinite_0.4s] h-2 rounded-full" />
              <span className="w-1 bg-fuchsia-400 animate-[wave_1.1s_ease-in-out_infinite_0.1s] h-4 rounded-full" />
              <span className="w-1 bg-purple-300 animate-[wave_0.7s_ease-in-out_infinite_0.3s] h-3 rounded-full" />
            </div>
            <button
              onClick={toggleMockVoice}
              className="text-[11px] uppercase tracking-wider hover:text-white transition-colors"
            >
              {isPlayingVoice ? 'Synthesizing Audio...' : 'Play Audio Demo'}
            </button>
          </div>

          {/* Bottom-Right Circular Magnetic Button */}
          <Link
            href="/workspace"
            className="group relative w-36 h-36 rounded-full border border-purple-400/40 hover:border-purple-300 flex items-center justify-center text-center p-4 transition-all duration-300 hover:scale-105 hover:bg-purple-950/30 glow-purple"
          >
            <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-spin [animation-duration:12s] pointer-events-none" />
            <div className="space-y-1 font-mono text-[10px] uppercase tracking-widest text-purple-200 group-hover:text-white">
              <p>Launch</p>
              <p className="font-bold text-xs text-white">Studio ↗</p>
            </div>
          </Link>
        </div>

        {/* Bottom Left Cookies / Telemetry Brutalist Box */}
        {showTelemetryBox && (
          <div className="fixed bottom-6 left-6 z-40 w-72 p-4 rounded-2xl bg-[#090514]/95 border border-purple-500/30 backdrop-blur-xl shadow-2xl font-mono text-left animate-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300 pb-2 border-b border-purple-500/20">
              <span className="tracking-wider uppercase">SYSTEM TELEMETRY</span>
              <button
                onClick={() => setShowTelemetryBox(false)}
                className="hover:text-white text-purple-400 transition-colors"
              >
                [X]
              </button>
            </div>
            <p className="text-[10px] text-slate-300 mt-2 leading-relaxed uppercase">
              Streaming full-duplex WebSocket connected. 1536-dim embeddings synchronized.
            </p>
            <div className="pt-3 flex items-center justify-between">
              <Link
                href="/workspace"
                className="text-[10px] font-bold text-purple-200 hover:text-white underline uppercase tracking-wider"
              >
                CONNECT MIC &rarr;
              </Link>
              <span className="text-[9px] text-emerald-400">● 100% OPERATIONAL</span>
            </div>
          </div>
        )}
      </section>

      {/* Interactive DevOps Studio Console Simulation */}
      <section id="console-preview" className="py-16 px-6 max-w-5xl mx-auto relative z-10">
        <div className="rounded-3xl bg-[#080412] border border-purple-500/20 shadow-2xl overflow-hidden">
          {/* macOS Terminal Window Header */}
          <div className="px-5 py-3.5 bg-[#040209] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-semibold text-slate-200 font-mono">VoiceOps Studio Session</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-purple-400 font-mono">150ftw/demo-app (main)</span>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0f0821] border border-purple-500/20 text-xs font-medium font-mono">
              <button
                onClick={() => setActiveTab('diagnosis')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'diagnosis'
                    ? 'bg-purple-600 text-white shadow-md glow-purple'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                Diagnostics
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'diff'
                    ? 'bg-purple-600 text-white shadow-md glow-purple'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                Diff
              </button>
              <button
                onClick={() => setActiveTab('rag')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'rag'
                    ? 'bg-purple-600 text-white shadow-md glow-purple'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                Runbooks
              </button>
              <button
                onClick={() => setActiveTab('approval')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'approval'
                    ? 'bg-purple-600 text-white shadow-md glow-purple'
                    : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                Guardrails
              </button>
            </div>
          </div>

          {/* Console Simulation Body */}
          <div className="p-6 space-y-6">
            {/* User Prompt Simulation */}
            <div className="flex justify-end">
              <div className="flex items-start gap-2.5 max-w-lg">
                <div className="p-3.5 rounded-2xl bg-purple-600 text-white text-xs font-mono leading-relaxed shadow-lg glow-purple">
                  &ldquo;{selectedPrompt}&rdquo;
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0 font-mono">
                  You
                </div>
              </div>
            </div>

            {/* AI Agent Telemetry Steps */}
            <div className="space-y-2 font-mono text-xs max-w-2xl">
              <div className="flex items-center gap-2 text-purple-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Analyzed GitHub Actions workflow run #1245 (Docker Build &amp; Deploy)</span>
              </div>
              <div className="flex items-center gap-2 text-purple-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Isolated stack trace error in pip install -r requirements.txt (Line 14)</span>
              </div>
            </div>

            {/* Tab 1: Diagnostics */}
            {activeTab === 'diagnosis' && (
              <div className="p-4 rounded-2xl bg-[#040209] border border-purple-500/20 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Root Cause: Python 3.13 / bcrypt Dependency Mismatch</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Exit Code: 1</span>
                </div>
                <div className="bg-[#070310] p-3 rounded-xl border border-purple-500/15 text-[11px] space-y-1 text-slate-300 leading-relaxed">
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
              <div className="p-4 rounded-2xl bg-[#040209] border border-purple-500/20 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                    <span>Proposed Patch Diff &bull; Dockerfile</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">+1 / -1 lines</span>
                </div>
                <div className="bg-[#070310] p-3 rounded-xl border border-purple-500/15 text-[11px] space-y-1 font-mono leading-relaxed">
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
              <div className="p-4 rounded-2xl bg-[#040209] border border-purple-500/20 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5 font-mono">
                  <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Database className="w-3.5 h-3.5 text-purple-400" />
                    <span>pgvector Runbook Match &bull; 94.2% Similarity</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Runbook ID: DOC-204</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0f0821] border border-purple-500/20 space-y-2 leading-relaxed font-mono">
                  <p className="font-bold text-white">Docker Build Standards &bull; Production Runbook</p>
                  <p className="text-slate-300 text-[11px]">
                    &ldquo;All microservices deployed to AWS EKS production cluster must pin LTS Python 3.11 runtimes.&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: Security Approval */}
            {activeTab === 'approval' && (
              <div className="p-4 rounded-2xl bg-[#040209] border border-purple-500/30 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/5">
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cryptographic Approval Required</span>
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  VoiceOps wants to open a pull request <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">patch/fix-python-base-image</code>.
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
                    <span>{mockApprovalDone ? 'PR Created!' : 'Approve & Create PR'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/10 bg-[#010103] py-12 px-6 relative z-10 text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="font-glitch text-sm">VOICEOPS</span>
            <span className="text-slate-600 font-normal">&bull; Autonomous DevOps Engineering</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/workspace" className="hover:text-purple-300 transition-colors uppercase">
              Workspace
            </Link>
            <Link href="/projects" className="hover:text-purple-300 transition-colors uppercase">
              Projects
            </Link>
            <a
              href="https://github.com/150ftw/VoiceOps"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-purple-300 transition-colors uppercase"
            >
              GitHub
            </a>
          </div>

          <p className="text-[11px] text-slate-600">
            &copy; 2026 VoiceOps Monorepo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
