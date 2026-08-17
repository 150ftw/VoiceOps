'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Github,
  Terminal,
  Cpu,
  Zap,
  ShieldCheck,
  Globe,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Code2,
  GitBranch,
} from 'lucide-react';
import logoImg from '@/public/logo.png';
import founderImg from '@/public/founder.png';

import { TopNavBar } from '@/components/layout/top-nav-bar';

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-[#030206] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200 relative font-sans antialiased">
      {/* Fixed Ambient Background Glow Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] -top-24 -left-24 animate-pulse-subtle" />
        <div className="absolute w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[160px] -bottom-24 -right-24" />
      </div>

      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 h-20 px-6 sm:px-12 flex items-center justify-between border-b border-purple-500/15 bg-[#030206]/90 backdrop-blur-xl transition-all">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src={logoImg}
            alt="VoiceOps Logo"
            priority
            className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] group-hover:scale-105 transition-transform"
          />
          <span className="text-xl font-glitch text-purple-200 tracking-widest uppercase">
            VOICEOPS
          </span>
        </Link>

        {/* Center Subpage Navigation */}
        <div className="hidden md:flex items-center">
          <TopNavBar currentTab="founder" />
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <Link
            href="/workspace"
            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
          >
            Launch Studio ↗
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-24 space-y-16">
        {/* Founder Hero Card */}
        <section className="relative bg-[#07040f]/90 border border-purple-500/25 rounded-3xl p-8 sm:p-14 shadow-[0_0_90px_rgba(147,51,234,0.18)] backdrop-blur-2xl overflow-hidden space-y-8">
          {/* Top Laser Rim Glow */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            {/* Avatar — Real Founder Photo */}
            <div className="relative shrink-0 group">
              {/* Ambient glow behind photo */}
              <div className="absolute -inset-5 bg-purple-600/25 rounded-[2rem] blur-2xl group-hover:bg-purple-500/40 transition-all duration-500" />
              {/* Outer holographic ring */}
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-[1.75rem] border-2 border-purple-400/50 shadow-[0_0_50px_rgba(168,85,247,0.35)] overflow-hidden bg-[#0c061a]">
                <Image
                  src={founderImg}
                  alt="Shivam Sharma — Founder of VoiceOps"
                  fill
                  priority
                  className="object-cover object-top scale-105 group-hover:scale-110 transition-transform duration-500"
                />
                {/* Subtle holographic overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-500" />
              </div>
              {/* FOUNDER badge */}
              <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                <span className="px-3 py-0.5 rounded-full bg-purple-950/95 border border-purple-400/60 font-mono text-[9px] uppercase tracking-widest text-purple-200 shadow-md backdrop-blur-sm">
                  ● FOUNDER
                </span>
              </div>
            </div>

            {/* Founder Biography & Credentials */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <span className="font-mono text-xs text-purple-400 uppercase tracking-widest">
                    01 // CREATOR &amp; ARCHITECT
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] uppercase">
                    Live in Production
                  </span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                  Shivam Sharma
                </h1>
                <p className="font-mono text-sm sm:text-base text-purple-300/90 tracking-wide">
                  Building Voice-Native Autonomous Infrastructure &bull; Shivam Sharma
                </p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl font-sans">
                Software engineering is experiencing a generational shift from manual keyboard-bound
                orchestration to natural voice-driven agentic intent. Shivam designed and architected{' '}
                <strong className="text-white font-semibold">VoiceOps</strong> to bridge the gap
                between speech recognition, deep LLM code graph reasoning, and cryptographic
                human-in-the-loop DevOps execution.
              </p>

              {/* Badges / Tech Chips */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                <span className="px-3 py-1 rounded-full bg-[#120826] border border-purple-500/25 font-mono text-[11px] text-purple-200">
                  ⚡ Autonomous Agents
                </span>
                <span className="px-3 py-1 rounded-full bg-[#120826] border border-purple-500/25 font-mono text-[11px] text-purple-200">
                  🎙️ Streaming Neural Audio
                </span>
                <span className="px-3 py-1 rounded-full bg-[#120826] border border-purple-500/25 font-mono text-[11px] text-purple-200">
                  🛡️ Zero-Downtime Rollbacks
                </span>
                <span className="px-3 py-1 rounded-full bg-[#120826] border border-purple-500/25 font-mono text-[11px] text-purple-200">
                  🧠 pgvector AST RAG
                </span>
              </div>

              {/* Social & Repository Links */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4 font-mono text-xs">
                <a
                  href="https://github.com/shivamsharma"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#0e071e] hover:bg-[#1a0e36] border border-purple-500/30 text-white flex items-center gap-2 transition-all shadow-md group cursor-pointer"
                >
                  <Github className="w-4 h-4 text-purple-300 group-hover:text-white" />
                  <span>GitHub // Shivam Sharma ↗</span>
                </a>
                <a
                  href="https://github.com/shivamsharma/VoiceOps"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#0e071e] hover:bg-[#1a0e36] border border-purple-500/30 text-purple-200 flex items-center gap-2 transition-all shadow-md group cursor-pointer"
                >
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span>VoiceOps Repository ↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Vision & Core Architectural Pillars */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Architectural Vision &amp; Philosophy
            </h2>
            <p className="font-mono text-xs text-purple-300/80 uppercase tracking-widest">
              Why VoiceOps was created by Shivam Sharma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-6 rounded-2xl bg-[#07040f]/80 border border-purple-500/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">01 // Conversational DevOps</h3>
              <p className="text-slate-400 leading-relaxed">
                Engineers shouldn&apos;t spend 45 minutes clicking through multi-cloud AWS, GCP, and
                Kubernetes consoles just to locate a broken container image or failed workflow run.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#07040f]/80 border border-purple-500/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">02 // Code-Graph Grounding</h3>
              <p className="text-slate-400 leading-relaxed">
                Raw LLM outputs hallucinate without repository context. VoiceOps embeds ASTs, CI logs,
                and pgvector runbooks to ensure 100% deterministic patch generation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#07040f]/80 border border-purple-500/20 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">03 // Cryptographic Guardrails</h3>
              <p className="text-slate-400 leading-relaxed">
                Autonomous doesn&apos;t mean reckless. Every mutation requires explicit biometric or
                voice-approved authorization before touching production cluster nodes.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive CTA */}
        <section className="text-center p-10 rounded-3xl bg-gradient-to-b from-purple-950/40 to-[#05020c] border border-purple-500/30 space-y-6 shadow-2xl">
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Experience the Future of DevOps
            </h2>
            <p className="text-sm text-purple-300/80 font-mono">
              Test live voice debugging, repository AST diagnosis, and simulated cluster rollbacks.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/workspace"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:brightness-110 text-white font-mono text-xs font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
            >
              Open Live Workspace ↗
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-[#090514] hover:bg-[#120826] border border-purple-500/30 text-purple-200 font-mono text-xs uppercase tracking-widest transition-all"
            >
              Back to Terminal
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-500/10 bg-[#010103] py-12 px-6 relative z-10 text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-slate-300 font-bold">
            <Image
              src={logoImg}
              alt="VoiceOps Logo"
              className="w-5 h-5 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            />
            <span className="font-glitch text-sm">VOICEOPS</span>
            <span className="text-slate-600 font-normal">&bull; Founded by Shivam Sharma</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400 uppercase">
            <Link href="/workspace" className="hover:text-purple-300 transition-colors">
              Workspace
            </Link>
            <Link href="/projects" className="hover:text-purple-300 transition-colors">
              Projects
            </Link>
            <Link href="/knowledge" className="hover:text-purple-300 transition-colors">
              Knowledge
            </Link>
            <Link href="/founder" className="text-purple-300 font-bold hover:text-white transition-colors">
              Founder
            </Link>
            <a
              href="https://github.com/shivamsharma/VoiceOps"
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-300 transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
