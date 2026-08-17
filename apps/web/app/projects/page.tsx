'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderGit2,
  GitBranch,
  Github,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Workflow,
  GitPullRequest,
  RefreshCw,
  Layers,
  Search,
  ExternalLink,
  Code2,
} from 'lucide-react';
import logoImg from '@/public/logo.png';
import { TopNavBar } from '@/components/layout/top-nav-bar';

export default function PublicProjectsPage() {
  const SAMPLE_REPOS = [
    {
      name: 'VoiceOps',
      fullName: '150ftw/VoiceOps',
      branch: 'main',
      status: 'Synced',
      workflows: 4,
      desc: 'Agentic Voice-Based DevOps Engineer Monorepo with pgvector RAG and Multi-Model AI Orchestrator.',
      tags: ['Next.js 14', 'FastAPI', 'pgvector', 'Docker'],
    },
    {
      name: 'EcoInsight',
      fullName: '150ftw/EcoInsight',
      branch: 'main',
      status: 'Active',
      workflows: 3,
      desc: 'Professional Economic Intelligence engine with real-time analytics and predictive data models.',
      tags: ['React', 'Python', 'PostgreSQL', 'TailwindCSS'],
    },
    {
      name: 'microservices-k8s-demo',
      fullName: '150ftw/microservices-k8s-demo',
      branch: 'main',
      status: 'Ready',
      workflows: 2,
      desc: 'Kubernetes cloud-native deployment with Helm charts, Istio service mesh, and Prometheus telemetry.',
      tags: ['Kubernetes', 'Helm', 'Terraform', 'Prometheus'],
    },
  ];

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
          <TopNavBar currentTab="projects" />
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <Link
            href="/console/projects"
            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-1.5"
          >
            <span>Connect Repo</span>
            <span>↗</span>
          </Link>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 sm:py-24 space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-400/40 text-purple-300 font-mono text-xs uppercase tracking-wider shadow-inner">
            <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
            <span>02 // Multi-Repository Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Connect GitHub Repos.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400">
              Synchronize Workflows.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Link your personal or organizational GitHub repositories. VoiceOps indexes your AST codebase,
            tracks CI/CD workflows in real-time, and opens pull requests autonomously.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/console/projects"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>Explore Projects Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Repositories Showcase Matrix */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-2.5">
              <FolderGit2 className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Active DevOps Repositories
              </h2>
            </div>
            <span className="font-mono text-xs text-purple-300">
              3 Projects Connected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLE_REPOS.map((repo) => (
              <div
                key={repo.name}
                className="bg-[#07040f]/90 border border-purple-500/25 rounded-3xl p-6 shadow-[0_0_50px_rgba(147,51,234,0.12)] backdrop-blur-xl space-y-4 hover:border-purple-400/50 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-purple-400" />
                        <h3 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors">
                          {repo.name}
                        </h3>
                      </div>
                      <p className="font-mono text-xs text-slate-500">
                        {repo.fullName}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] uppercase">
                      ● {repo.status}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    {repo.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {repo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-[#0a0518] border border-purple-500/20 text-purple-300 font-mono text-[10px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-purple-500/15 flex items-center justify-between font-mono text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{repo.branch}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Workflow className="w-3.5 h-3.5" />
                    <span>{repo.workflows} Workflows</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CI/CD Automated Workflow Automation Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-md">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Continuous Webhook Sync</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every commit, PR, and GitHub Actions workflow run is ingested into vector memory via HMAC-SHA256 verified webhooks.
            </p>
          </div>

          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Full AST Parsing</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Codebase trees are chunked, tokenized, and parsed with Abstract Syntax Tree awareness for pinpoint accuracy.
            </p>
          </div>

          <div className="bg-[#07040f]/90 border border-purple-500/20 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-md">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Automated PR Dispatch</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Generate bug fixes, dependency patches, and CI configuration updates directly to new branches with 1-click human approval.
            </p>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="relative bg-gradient-to-b from-[#090514] to-[#030206] border border-purple-500/30 rounded-3xl p-10 sm:p-14 text-center space-y-6 overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Connect Your GitHub Codebase
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Link your repository in 10 seconds and let VoiceOps inspect your workflows.
            </p>
          </div>

          <Link
            href="/console/projects"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
          >
            <span>Launch Projects Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
