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
import FlowingMenu from '@/components/landing/FlowingMenu';
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
  const [showTelemetryBox, setShowTelemetryBox] = useState(false);

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

    // Show telemetry popup after 5 seconds
    const timer = setTimeout(() => {
      setShowTelemetryBox(true);
    }, 5000);
    return () => clearTimeout(timer);
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

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <span className="hidden md:inline-block text-[11px] text-purple-400/80 uppercase tracking-widest font-mono">
            V1.0 &bull; LIVE
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

      {/* Full-Screen Flowing Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#030206] flex flex-col justify-between animate-in fade-in duration-300">
          {/* Top Bar with Logo and Close Button */}
          <div className="h-20 px-6 sm:px-12 flex items-center justify-between border-b border-purple-500/20 bg-[#030206]/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="VoiceOps Logo"
                className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
              />
              <span className="text-xl sm:text-2xl font-glitch text-purple-200 tracking-widest uppercase">
                VOICEOPS
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2.5 text-purple-300 hover:text-white hover:scale-110 transition-all rounded-full border border-purple-500/30 hover:border-purple-400 bg-purple-950/40"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Flowing Menu Component */}
          <div className="flex-1 w-full relative overflow-hidden">
            <FlowingMenu
              items={[
                {
                  link: '/workspace',
                  text: 'Live Voice Workspace',
                  image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&h=400&fit=crop&auto=format',
                },
                {
                  link: '/projects',
                  text: 'Repositories & Projects',
                  image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&h=400&fit=crop&auto=format',
                },
                {
                  link: '/knowledge',
                  text: 'pgvector Knowledge Base',
                  image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&h=400&fit=crop&auto=format',
                },
                {
                  link: '#capabilities',
                  text: 'Architecture & Security',
                  image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&h=400&fit=crop&auto=format',
                },
                {
                  link: 'https://github.com/150ftw/VoiceOps',
                  text: 'GitHub Repository',
                  image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=600&h=400&fit=crop&auto=format',
                },
              ]}
              speed={14}
              textColor="#E9D5FF"
              bgColor="#030206"
              marqueeBgColor="#A855F7"
              marqueeTextColor="#030206"
              borderColor="rgba(168, 85, 247, 0.18)"
              onItemClick={() => setIsMenuOpen(false)}
            />
          </div>

          {/* Bottom Bar */}
          <div className="h-16 px-6 sm:px-12 flex items-center justify-between border-t border-purple-500/20 bg-[#030206]/90 backdrop-blur-md text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            <span>&copy; 2026 VoiceOps Autonomous DevOps</span>
            <span className="text-purple-400 font-semibold">100% OPERATIONAL &bull; V1.0</span>
          </div>
        </div>
      )}

      {/* Hero Section — Editorial Brutalist Showcase */}
      <section className="relative pt-24 pb-16 px-6 sm:px-12 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[75vh] text-center z-10 select-none">
        {/* Top Sub-Header */}
        <p className="font-mono text-xs sm:text-sm text-purple-300/90 tracking-[0.25em] uppercase mb-4">
          Autonomous DevOps Voice Engine
        </p>

        {/* Massive Centerpiece Display Headline with Luminous V Logo Backdrop */}
        <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center py-6 my-2 group cursor-pointer">
          {/* Giant Luminous V Logo Backdrop behind typography */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-80 sm:w-96 md:w-[480px] h-80 sm:h-96 md:h-[480px] bg-purple-600/35 rounded-full blur-[100px] group-hover:bg-purple-500/50 group-hover:scale-110 transition-all duration-700 animate-pulse-subtle" />
            <img
              src="/logo.png"
              alt="VoiceOps Logo Backdrop"
              className="w-72 sm:w-96 md:w-[480px] lg:w-[540px] h-auto object-contain opacity-45 sm:opacity-55 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700 drop-shadow-[0_0_90px_rgba(168,85,247,0.8)]"
              style={{ animation: 'float 7s ease-in-out infinite' }}
            />
          </div>

          {/* Foreground Glitch Typography with Asynchronous Per-Letter Glitch & Smooth Hover Expansion */}
          <h1 className="relative z-10 text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-glitch uppercase scale-y-95 w-full flex flex-col items-center justify-center gap-1 sm:gap-3 select-none text-center">
            {/* VOICE Row */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 group-hover:gap-4 sm:group-hover:gap-8 md:group-hover:gap-12 transition-all duration-700 ease-out">
              {[
                { char: 'V', delay: '0.1s', duration: '3.4s', color: 'text-purple-100/90' },
                { char: 'O', delay: '1.4s', duration: '4.2s', color: 'text-purple-200/90' },
                { char: 'I', delay: '0.6s', duration: '2.8s', color: 'text-purple-100/85' },
                { char: 'C', delay: '2.1s', duration: '3.9s', color: 'text-purple-300/90' },
                { char: 'E', delay: '0.9s', duration: '4.6s', color: 'text-purple-200/95' },
              ].map((item, idx) => (
                <span
                  key={`voice-${idx}`}
                  data-text={item.char}
                  className={`glitch-letter inline-block ${item.color} drop-shadow-[0_0_35px_rgba(168,85,247,0.35)] transition-all duration-700 ease-out group-hover:scale-105`}
                  style={
                    {
                      '--glitch-delay': item.delay,
                      '--glitch-duration': item.duration,
                    } as React.CSSProperties
                  }
                >
                  {item.char}
                </span>
              ))}
            </div>

            {/* OPS Row */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 group-hover:gap-5 sm:group-hover:gap-10 md:group-hover:gap-14 transition-all duration-700 ease-out">
              {[
                { char: 'O', delay: '1.1s', duration: '3.7s', color: 'text-purple-200/90' },
                { char: 'P', delay: '1.8s', duration: '4.4s', color: 'text-purple-100/90' },
                { char: 'S', delay: '0.4s', duration: '3.2s', color: 'text-purple-300/90' },
              ].map((item, idx) => (
                <span
                  key={`ops-${idx}`}
                  data-text={item.char}
                  className={`glitch-letter inline-block ${item.color} drop-shadow-[0_0_35px_rgba(168,85,247,0.35)] transition-all duration-700 ease-out group-hover:scale-105`}
                  style={
                    {
                      '--glitch-delay': item.delay,
                      '--glitch-duration': item.duration,
                    } as React.CSSProperties
                  }
                >
                  {item.char}
                </span>
              ))}
            </div>
          </h1>
        </div>

        {/* Secondary Subtitle */}
        <p className="font-mono text-xs sm:text-sm text-purple-300/80 max-w-xl mx-auto tracking-widest uppercase mt-4">
          Talk to your infrastructure. Fix CI/CD in seconds.
        </p>

        {/* Interactive Clickable Prompt Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
          {[
            "Why did my production deployment fail?",
            "Rollback latest container release",
            "Fix memory leak in redis worker",
            "Run security audit on IAM roles",
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => {
                setSelectedPrompt(promptText);
                const el = document.getElementById("console-preview");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border ${
                selectedPrompt === promptText
                  ? "bg-purple-500/25 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-105"
                  : "bg-[#090514]/80 text-slate-400 border-purple-500/20 hover:border-purple-400/60 hover:text-purple-200 hover:scale-102"
              }`}
            >
              <span className="text-purple-400">⚡</span>
              <span>{promptText}</span>
            </button>
          ))}
        </div>

        {/* Bottom 3-Column Editorial Metadata Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-14 pt-8 border-t border-purple-500/20 text-left font-mono text-[11px]">
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
        <div className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6 pt-10">
          {/* Bottom-Left Multi-Bar Audio Level Waveform with Neural Synth */}
          <button
            onClick={toggleMockVoice}
            className="flex items-center gap-3 font-mono text-xs text-purple-300 p-2.5 px-5 rounded-full bg-[#090514]/90 border border-purple-500/30 hover:border-purple-400/70 hover:bg-purple-950/40 backdrop-blur-md transition-all shadow-lg group cursor-pointer"
          >
            <div className="flex items-end gap-1 h-5 origin-bottom">
              <span className="w-1 bg-purple-400 animate-[wave_0.8s_ease-in-out_infinite] h-3 rounded-full origin-bottom" />
              <span className="w-1 bg-purple-300 animate-[wave_1.2s_ease-in-out_infinite_0.2s] h-5 rounded-full origin-bottom" />
              <span className="w-1 bg-purple-500 animate-[wave_0.9s_ease-in-out_infinite_0.4s] h-2 rounded-full origin-bottom" />
              <span className="w-1 bg-fuchsia-400 animate-[wave_1.1s_ease-in-out_infinite_0.1s] h-4 rounded-full origin-bottom" />
              <span className="w-1 bg-purple-300 animate-[wave_0.7s_ease-in-out_infinite_0.3s] h-3 rounded-full origin-bottom" />
              <span className="w-1 bg-purple-400 animate-[wave_1.0s_ease-in-out_infinite_0.15s] h-5 rounded-full origin-bottom" />
              <span className="w-1 bg-fuchsia-300 animate-[wave_0.85s_ease-in-out_infinite_0.35s] h-3 rounded-full origin-bottom" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-purple-200 group-hover:text-white transition-colors">
              {isPlayingVoice ? '◼ Pause Voice Demo' : '▶ Play Voice Demo'}
            </span>
          </button>

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
          <div className="flex items-center gap-2.5 text-slate-300 font-bold">
            <img
              src="/logo.png"
              alt="VoiceOps Logo"
              className="w-5 h-5 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            />
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

      {/* Root-Level Floating System Telemetry Pop-up (z-[9999] over all content) */}
      {showTelemetryBox && (
        <div className="fixed bottom-6 left-6 z-[9999] w-80 p-4 rounded-2xl bg-[#090514]/98 border border-purple-500/40 backdrop-blur-2xl shadow-[0_15px_60px_rgba(0,0,0,0.95)] font-mono text-left animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center justify-between text-xs font-bold text-purple-300 pb-2 border-b border-purple-500/25">
            <span className="tracking-wider uppercase">SYSTEM TELEMETRY</span>
            <button
              onClick={() => setShowTelemetryBox(false)}
              className="hover:text-white text-purple-400 transition-colors p-1"
              title="Close"
            >
              [X]
            </button>
          </div>
          <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed uppercase">
            Streaming full-duplex WebSocket connected. 1536-dim embeddings synchronized.
          </p>
          <div className="pt-3.5 flex items-center justify-between">
            <Link
              href="/workspace"
              className="text-[11px] font-bold text-purple-200 hover:text-white underline uppercase tracking-wider"
            >
              CONNECT MIC &rarr;
            </Link>
            <span className="text-[10px] text-emerald-400 font-semibold">● 100% OPERATIONAL</span>
          </div>
        </div>
      )}
    </div>
  );
}
