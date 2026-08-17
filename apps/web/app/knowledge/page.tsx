'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Database,
  Search,
  FileText,
  Zap,
  Sparkles,
  ArrowRight,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  UploadCloud,
  Terminal,
} from 'lucide-react';
import logoImg from '@/public/logo.png';
import { TopNavBar } from '@/components/layout/top-nav-bar';

export default function PublicKnowledgePage() {
  const SAMPLE_RUNBOOKS = [
    {
      title: 'Kubernetes Incident Remediation Runbook',
      type: 'Markdown',
      chunks: 14,
      similarity: '98.4%',
      desc: 'Standard operating procedures for CrashLoopBackOff, OOMKilled, and pod network partition incidents in production EKS.',
    },
    {
      title: 'AWS IAM Principle of Least Privilege Guide',
      type: 'PDF Guide',
      chunks: 8,
      similarity: '96.2%',
      desc: 'Security standard on wildcard IAM reduction, role assumption security policies, and ECR scoped permissions.',
    },
    {
      title: 'Redis & Celery Distributed Task Standards',
      type: 'Markdown',
      chunks: 11,
      similarity: '94.8%',
      desc: 'Memory bounds, socket pooling architecture, worker concurrency tuning, and failover disaster recovery.',
    },
    {
      title: 'PostgreSQL High-Availability Failover SOP',
      type: 'Runbook',
      chunks: 19,
      similarity: '99.1%',
      desc: 'Connection pooler saturation handling, read replica promotion, and pgvector HNSW index maintenance.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#030206] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200 relative overflow-x-hidden font-sans antialiased">
      {/* Ambient Background Glow Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(168,85,247,0.08)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -top-24 -left-24 animate-pulse-subtle" />
      <div className="absolute w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[160px] pointer-events-none -bottom-24 -right-24" />

      {/* Top Navigation */}
      <header className="relative z-20 h-20 px-6 sm:px-12 flex items-center justify-between border-b border-purple-500/15 bg-[#030206]/80 backdrop-blur-md">
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
          <TopNavBar currentTab="knowledge" />
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <Link
            href="/console/knowledge"
            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-1.5"
          >
            <span>Runbooks Console</span>
            <span>↗</span>
          </Link>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-400/40 text-purple-300 font-mono text-xs uppercase tracking-wider shadow-inner">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>03 // pgvector Semantic RAG</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Runbooks & Architecture.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400">
              Vectorized in Supabase.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Upload your markdown runbooks, PDF troubleshooting guides, and infrastructure specs. VoiceOps indexes
            them into 1536-dimensional embeddings with cosine similarity retrieval.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/console/knowledge"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Knowledge Base</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Vector Semantic Memory Live Demonstration */}
        <section className="relative bg-[#07040f]/90 border border-purple-500/25 rounded-3xl p-6 sm:p-10 shadow-[0_0_90px_rgba(147,51,234,0.18)] backdrop-blur-2xl overflow-hidden space-y-6">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-80" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-purple-500/15 pb-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Semantic Vector RAG Architecture
              </h2>
            </div>
            <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-full uppercase">
              1536-DIM &bull; HNSW Indexing
            </span>
          </div>

          {/* Runbooks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_RUNBOOKS.map((rb) => (
              <div
                key={rb.title}
                className="bg-[#030206] border border-purple-500/20 rounded-2xl p-5 space-y-2.5 hover:border-purple-400/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">{rb.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-500/30 text-purple-300">
                    {rb.similarity} Match
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{rb.desc}</p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Type: {rb.type}</span>
                  <span>{rb.chunks} Vector Chunks</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Instant Document Ingestion</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Drag-and-drop Markdown, PDF, OpenAPI JSON, or YAML runbooks directly into your workspace.
            </p>
          </div>

          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Contextual Precision</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Chunks are automatically filtered with cosine similarity thresholds to eliminate hallucinated fixes.
            </p>
          </div>

          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Enterprise pgvector</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Powered by native PostgreSQL pgvector tables in Supabase with sub-millisecond query execution.
            </p>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="relative bg-gradient-to-b from-[#090514] to-[#030206] border border-purple-500/30 rounded-3xl p-10 sm:p-14 text-center space-y-6 overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Vectorize Your Team&apos;s Runbooks
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Empower your AI DevOps agents with exact corporate SOPs and troubleshooting guides.
            </p>
          </div>

          <Link
            href="/console/knowledge"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
          >
            <span>Launch Knowledge Base</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
