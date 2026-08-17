'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mic,
  Terminal,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Cpu,
  Radio,
  Layers,
  Volume2,
  Workflow,
  CheckCircle2,
  FileCode,
  Activity,
  Play,
  Pause,
} from 'lucide-react';
import logoImg from '@/public/logo.png';
import { TopNavBar } from '@/components/layout/top-nav-bar';

export default function PublicWorkspacePage() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'ci' | 'k8s' | 'iam'>('ci');

  const toggleVoiceDemo = () => {
    if (isPlayingAudio) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "I analyzed workflow run 1245 for demo-app. The Docker build failed due to Python 3.13 bcrypt incompatibility. Would you like me to open a pull request to patch it?"
      );
      utterance.rate = 1.05;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-[#030206] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200 relative font-sans antialiased">
      {/* Fixed Ambient Background Glow Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] -top-24 -left-24 animate-pulse-subtle" />
        <div className="absolute w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[160px] -bottom-24 -right-24" />
      </div>

      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 h-16 sm:h-20 px-4 sm:px-12 flex items-center justify-between border-b border-purple-500/15 bg-[#030206]/90 backdrop-blur-xl transition-all">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <Image
            src={logoImg}
            alt="VoiceOps Logo"
            priority
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] group-hover:scale-105 transition-transform"
          />
          <span className="text-lg sm:text-xl font-glitch text-purple-200 tracking-widest uppercase">
            VOICEOPS
          </span>
        </Link>

        {/* Center Subpage Navigation */}
        <div className="hidden md:flex items-center">
          <TopNavBar currentTab="workspace" />
        </div>

        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs">
          <Link
            href="/console/workspace"
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold uppercase tracking-wider text-[11px] sm:text-xs shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-1.5"
          >
            <span>Launch Studio</span>
            <span>↗</span>
          </Link>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-24 space-y-12 sm:space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-400/40 text-purple-300 font-mono text-xs uppercase tracking-wider shadow-inner">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>01 // Autonomous Voice Console</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-glitch uppercase tracking-wide text-white leading-tight drop-shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            Speak to your Infrastructure.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 drop-shadow-[0_0_35px_rgba(192,132,252,0.8)]">
              Debug with Voice.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            The VoiceOps Studio replaces slow multi-tab incident triaging with real-time,
            sub-second audio dialogue and autonomous DevOps tool execution.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/console/workspace"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Enter Live Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={toggleVoiceDemo}
              className="px-6 py-3 rounded-2xl bg-[#0a0518] hover:bg-purple-950/40 border border-purple-500/30 text-purple-200 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Pause Voice Sample</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span>Hear Voice Agent Sample</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Interactive Workspace Preview Console */}
        <section className="relative bg-[#07040f]/90 border border-purple-500/25 rounded-3xl p-6 sm:p-10 shadow-[0_0_90px_rgba(147,51,234,0.18)] backdrop-blur-2xl overflow-hidden space-y-6">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80" />

          {/* Console Header */}
          <div className="flex items-center justify-between border-b border-purple-500/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-mono text-xs text-purple-300 font-semibold tracking-wider uppercase">
                VoiceOps Interactive Workspace // Live Simulation
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-[10px] text-emerald-400 uppercase">
                WebSockets Ready
              </span>
            </div>
          </div>

          {/* Simulation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
            <button
              onClick={() => setActiveTab('ci')}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs transition-all ${
                activeTab === 'ci'
                  ? 'bg-purple-600/30 border border-purple-400/50 text-purple-200'
                  : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              Scenario 1: CI/CD Build Failure
            </button>
            <button
              onClick={() => setActiveTab('k8s')}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs transition-all ${
                activeTab === 'k8s'
                  ? 'bg-purple-600/30 border border-purple-400/50 text-purple-200'
                  : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              Scenario 2: Kubernetes CrashLoopBackOff
            </button>
            <button
              onClick={() => setActiveTab('iam')}
              className={`px-4 py-1.5 rounded-xl font-mono text-xs transition-all ${
                activeTab === 'iam'
                  ? 'bg-purple-600/30 border border-purple-400/50 text-purple-200'
                  : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              Scenario 3: AWS IAM Security Audit
            </button>
          </div>

          {/* Live Telemetry Display */}
          <div className="bg-[#030206] border border-purple-500/20 rounded-2xl p-6 font-mono text-xs space-y-4 shadow-inner">
            <div className="flex items-center gap-3 text-purple-400 border-b border-purple-500/10 pb-3">
              <Mic className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Voice Query:</span>
              <span className="text-white font-semibold">
                {activeTab === 'ci'
                  ? '"Why did my latest deployment to production fail?"'
                  : activeTab === 'k8s'
                  ? '"Why is the redis-cache pod crashing repeatedly in staging?"'
                  : '"Scan production Terraform scripts for overly permissive IAM wildcards."'}
              </span>
            </div>

            <div className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
              <p className="text-emerald-400">
                &gt; [0.08s] OpenAI Whisper Speech-to-Text processed audio stream.
              </p>
              <p className="text-cyan-400">
                &gt; [0.14s] Supabase pgvector searched 1,536-dim runbook embeddings (Cosine Similarity: 0.96).
              </p>
              <p className="text-purple-300">
                &gt; [0.29s] Multi-Model Reasoning identified root cause and drafted code patch.
              </p>
              <p className="text-amber-300">
                &gt; [0.41s] Generated Deterministic Developer Approval Request for Pull Request open.
              </p>
            </div>

            {/* Simulated Code Diff */}
            <div className="bg-[#080512] border border-purple-500/20 rounded-xl p-4 space-y-1 text-[11px]">
              <div className="text-slate-500">
                --- {activeTab === 'ci' ? 'Dockerfile' : activeTab === 'k8s' ? 'k8s/redis-deployment.yaml' : 'terraform/iam/deploy_role.tf'}
              </div>
              <div className="text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded">
                {activeTab === 'ci'
                  ? '- FROM python:3.13-alpine'
                  : activeTab === 'k8s'
                  ? '- maxmemory 256mb  # Exceeding cgroup limit'
                  : '- actions = ["*"]'}
              </div>
              <div className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded">
                {activeTab === 'ci'
                  ? '+ FROM python:3.12-slim-bookworm  # Fixes bcrypt binary build'
                  : activeTab === 'k8s'
                  ? '+ maxmemory 128mb  # Aligned with namespace quota'
                  : '+ actions = ["ecr:GetAuthorizationToken", "eks:DescribeCluster"]'}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sub-Second Latency</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Full-duplex WebSocket architecture delivers streaming STT and TTS voice feedback with sub-300ms round trips.
            </p>
          </div>

          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Model Engine</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hot-switch between Gemini 1.5 Pro, GPT-4o, Claude 3.5 Sonnet, and DeepSeek R1 directly inside the workspace.
            </p>
          </div>

          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Human Approval Guardrails</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Autonomous agents can inspect, test, and draft PRs, but destructive actions require cryptographic human sign-off.
            </p>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="relative bg-gradient-to-b from-[#090514] to-[#030206] border border-purple-500/30 rounded-3xl p-10 sm:p-14 text-center space-y-6 overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to automate your DevOps?
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Link your GitHub repositories and start debugging your infrastructure with voice intelligence.
            </p>
          </div>

          <Link
            href="/console/workspace"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
          >
            <span>Launch Live Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
