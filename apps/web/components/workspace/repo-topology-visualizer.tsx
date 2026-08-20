'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  Terminal,
  Database,
  ShieldCheck,
  CheckCircle2,
  FileCode2,
  Cpu,
  Layers,
  ArrowRight,
  GitCommit,
  Sparkles,
} from 'lucide-react';

type TabType = 'pipeline' | 'ast' | 'vector';

export const RepoTopologyVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-[#090D17] border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden font-mono text-xs select-none ring-1 ring-white/[0.02]">
      {/* Terminal / IDE Window Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#060911] border-b border-white/[0.06]">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80" />
          <span className="ml-2 text-[11px] font-sans font-medium text-slate-400">
            voiceops-architecture-preview
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-sans font-medium transition-all ${
              activeTab === 'pipeline'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline Flow
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ast')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-sans font-medium transition-all ${
              activeTab === 'ast'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AST Parser
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vector')}
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-sans font-medium transition-all ${
              activeTab === 'vector'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vector Memory
          </button>
        </div>
      </div>

      {/* Main Preview Body */}
      <div className="p-4 bg-[#080B14]">
        {activeTab === 'pipeline' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* 4-Step Architectural Pipeline Stage */}
            <div className="grid grid-cols-4 gap-2">
              {/* Step 1: Git Repo */}
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[9px] text-slate-500 font-mono">01</span>
                </div>
                <div>
                  <p className="text-[11px] font-sans font-semibold text-slate-200">Git Ingestion</p>
                  <p className="text-[9.5px] text-slate-400 font-mono">HEAD commit scan</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-emerald-400">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>OAuth Linked</span>
                </div>
              </div>

              {/* Step 2: AST Parser */}
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[9px] text-slate-500 font-mono">02</span>
                </div>
                <div>
                  <p className="text-[11px] font-sans font-semibold text-slate-200">Tree-sitter AST</p>
                  <p className="text-[9.5px] text-slate-400 font-mono">Symbol extraction</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>142 files</span>
                </div>
              </div>

              {/* Step 3: pgvector Memory */}
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[9px] text-slate-500 font-mono">03</span>
                </div>
                <div>
                  <p className="text-[11px] font-sans font-semibold text-slate-200">pgvector RAG</p>
                  <p className="text-[9.5px] text-slate-400 font-mono">1536-dim cosine</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-purple-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Semantic Index</span>
                </div>
              </div>

              {/* Step 4: VoiceOps Agent */}
              <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] text-indigo-400 font-mono">04</span>
                </div>
                <div>
                  <p className="text-[11px] font-sans font-semibold text-white">Zero-Write Agent</p>
                  <p className="text-[9.5px] text-indigo-300/80 font-mono">Ed25519 Guard</p>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Strict Safe</span>
                </div>
              </div>
            </div>

            {/* Interactive Terminal Output Log */}
            <div className="p-3 rounded-xl bg-[#05070D] border border-white/[0.04] text-[10.5px] text-slate-300 space-y-1">
              <div className="flex items-center gap-2 text-slate-500">
                <Terminal className="w-3 h-3 text-indigo-400" />
                <span className="text-indigo-400 font-semibold">$</span>
                <span>voiceops ingest --repo &lt;connected-repository&gt;</span>
              </div>
              <div className="pl-5 space-y-0.5 text-slate-400 text-[10px]">
                <p className="text-slate-300 flex items-center gap-1.5">
                  <span className="text-emerald-400">✔</span> Ingestion: Parse code files, TSX components, CI/CD YAML
                </p>
                <p className="text-slate-300 flex items-center gap-1.5">
                  <span className="text-cyan-400">✔</span> Vector Store: Generate pgvector embeddings (1536-dim)
                </p>
                <p className="text-slate-300 flex items-center gap-1.5">
                  <span className="text-purple-400">✔</span> Voice Runtime: Sub-200ms TTFT neural streaming ready
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ast' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-[#05070D] border border-white/[0.04] text-[10.5px] space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                <span className="text-indigo-400 font-semibold flex items-center gap-1.5">
                  <FileCode2 className="w-3 h-3" />
                  <span>AST Code Structure Breakdown</span>
                </span>
                <span className="text-[9.5px] text-slate-500">Tree-sitter Parser</span>
              </div>
              <div className="space-y-1 text-[10px] text-slate-400">
                <div className="flex items-center justify-between py-0.5 px-2 rounded bg-white/[0.02]">
                  <span className="text-slate-300">app/page.tsx</span>
                  <span className="text-cyan-400 font-mono text-[9px]">4 exports &bull; 12 hooks</span>
                </div>
                <div className="flex items-center justify-between py-0.5 px-2 rounded bg-white/[0.02]">
                  <span className="text-slate-300">.github/workflows/deploy.yml</span>
                  <span className="text-amber-400 font-mono text-[9px]">3 jobs &bull; CI/CD</span>
                </div>
                <div className="flex items-center justify-between py-0.5 px-2 rounded bg-white/[0.02]">
                  <span className="text-slate-300">Dockerfile</span>
                  <span className="text-purple-400 font-mono text-[9px]">Multi-stage build</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vector' && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-[#05070D] border border-white/[0.04] text-[10.5px] space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  <span>PostgreSQL pgvector Memory Index</span>
                </span>
                <span className="text-[9.5px] text-emerald-400">1536-dim Cosine</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5">
                  <span className="text-slate-500 text-[9px]">Index Type</span>
                  <p className="text-slate-200 font-semibold">HNSW + Cosine Distance</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-0.5">
                  <span className="text-slate-500 text-[9px]">Embedding Model</span>
                  <p className="text-slate-200 font-semibold">text-embedding-3-small</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#060911] border-t border-white/[0.06] text-[10px] text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Engine Standby</span>
        </div>
        <span>Awaiting repository link</span>
      </div>
    </div>
  );
};
