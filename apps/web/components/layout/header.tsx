'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FolderGit2,
  GitBranch,
  LogOut,
  Sparkles,
  ChevronDown,
  User as UserIcon,
  Check,
  Zap,
  Bot,
  Brain,
  Mic,
  Database,
  Radio,
  Sliders,
} from 'lucide-react';
import { Project, Workspace } from '@voiceops/shared';
import { apiRequest, clearAuthToken } from '@/lib/api-client';

interface HeaderProps {
  activeProject?: Project | null;
  onSelectProject?: (project: Project) => void;
}

interface ModelEngineOption {
  id: string;
  name: string;
  badgeLabel: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'fast_hybrid';
  llm: string;
  stt: string;
  vector: string;
  description: string;
  latency: string;
  isPopular?: boolean;
  colorScheme: {
    badge: string;
    border: string;
    text: string;
    icon: string;
    dot: string;
  };
}

const modelOptions: ModelEngineOption[] = [
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    badgeLabel: 'Gemini 1.5 Pro • Whisper • pgvector',
    provider: 'gemini',
    llm: 'Gemini 1.5 Pro (Google DeepMind)',
    stt: 'OpenAI Whisper v3',
    vector: 'Supabase pgvector (1536-dim)',
    description: 'Multimodal DevOps reasoning with 1M context window for large repo trees & logs.',
    latency: '~210ms',
    isPopular: true,
    colorScheme: {
      badge: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-300',
      icon: 'text-cyan-400',
      dot: 'bg-cyan-400',
    },
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    badgeLabel: 'GPT-4o • Whisper • pgvector',
    provider: 'openai',
    llm: 'GPT-4o (Omni Architecture)',
    stt: 'OpenAI Whisper v3',
    vector: 'Supabase pgvector (1536-dim)',
    description: 'High-precision function calling and automated PR / Issue generation.',
    latency: '~260ms',
    colorScheme: {
      badge: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
      icon: 'text-emerald-400',
      dot: 'bg-emerald-400',
    },
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    badgeLabel: 'Claude 3.5 Sonnet • Whisper • pgvector',
    provider: 'anthropic',
    llm: 'Claude 3.5 Sonnet v2',
    stt: 'OpenAI Whisper v3',
    vector: 'Supabase pgvector (1536-dim)',
    description: 'State-of-the-art code diff inspection and syntax error diagnostics.',
    latency: '~290ms',
    colorScheme: {
      badge: 'bg-amber-500/10 hover:bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-300',
      icon: 'text-amber-400',
      dot: 'bg-amber-400',
    },
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1 Reasoning',
    badgeLabel: 'DeepSeek R1 • Whisper • pgvector',
    provider: 'deepseek',
    llm: 'DeepSeek R1 Reasoning (Chain-of-Thought)',
    stt: 'OpenAI Whisper v3',
    vector: 'Supabase pgvector (1536-dim)',
    description: 'Deep mathematical and root-cause logic chain analysis for complex race conditions.',
    latency: '~340ms',
    colorScheme: {
      badge: 'bg-purple-500/10 hover:bg-purple-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-300',
      icon: 'text-purple-400',
      dot: 'bg-purple-400',
    },
  },
  {
    id: 'fast-hybrid',
    name: 'VoiceOps Ultra-Fast Hybrid',
    badgeLabel: 'Gemini Flash • Deepgram • pgvector',
    provider: 'fast_hybrid',
    llm: 'Gemini 1.5 Flash (Sub-Second)',
    stt: 'Deepgram Nova-2 Streaming STT',
    vector: 'Supabase pgvector (1536-dim)',
    description: 'Optimized for high-speed conversational voice feedback with lowest latency.',
    latency: '~110ms',
    colorScheme: {
      badge: 'bg-rose-500/10 hover:bg-rose-500/20',
      border: 'border-rose-500/30',
      text: 'text-rose-300',
      icon: 'text-rose-400',
      dot: 'bg-rose-400',
    },
  },
];

export const Header: React.FC<HeaderProps> = ({ activeProject, onSelectProject }) => {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Model Engine Selector state
  const [selectedModel, setSelectedModel] = useState<ModelEngineOption>(modelOptions[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load saved preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceops_selected_ai_engine');
      if (saved) {
        const found = modelOptions.find((m) => m.id === saved);
        if (found) setSelectedModel(found);
      }
    }
  }, []);

  const handleSelectEngine = (model: ModelEngineOption) => {
    setSelectedModel(model);
    setIsDropdownOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceops_selected_ai_engine', model.id);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const user = await apiRequest('/auth/me');
        setCurrentUser(user);
        if (user.workspaces && user.workspaces.length > 0) {
          setWorkspaces(user.workspaces);
          setCurrentWorkspace(user.workspaces[0]);

          const projs = await apiRequest(`/projects?workspace_id=${user.workspaces[0].id}`).catch(() => []);
          setProjects(projs || []);
          if (projs && projs.length > 0 && onSelectProject && !activeProject) {
            onSelectProject(projs[0]);
          }
        }
      } catch (err) {
        console.log('User session initialized in workspace');
      }
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (_) {}
    clearAuthToken();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#090D16]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Workspace & Project Switchers */}
      <div className="flex items-center gap-4">
        {/* Workspace Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 text-xs text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold">{currentWorkspace?.name || 'VoiceOps Workspace'}</span>
        </div>

        <span className="text-slate-600">/</span>

        {/* Project Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold">{activeProject?.name || 'Production DevOps Service'}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 font-mono">
            {activeProject?.repository?.repo_full_name || 'voiceops/demo-app'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Interactive AI Model Engine Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-medium transition-all shadow-sm ${
              selectedModel.colorScheme.badge
            } ${selectedModel.colorScheme.border} ${selectedModel.colorScheme.text}`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${selectedModel.colorScheme.icon}`} />
            <span className="font-mono tracking-tight">{selectedModel.badgeLabel}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Glassmorphic Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-96 glass-panel rounded-3xl border border-white/10 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-100">Select AI & Voice Engine</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Multi-Model Orchestrator</span>
              </div>

              <div className="space-y-1.5 py-2">
                {modelOptions.map((opt) => {
                  const isSelected = selectedModel.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectEngine(opt)}
                      className={`w-full text-left p-3 rounded-2xl transition-all border flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/40 shadow-inner'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${opt.colorScheme.dot}`} />
                          <span className="text-xs font-bold text-slate-100">{opt.name}</span>
                          {opt.isPopular && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Active Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{opt.description}</p>
                        <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
                          <span className="text-slate-400">{opt.latency}</span>
                          <span>&bull;</span>
                          <span>{opt.stt}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="p-1 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Memory & Vector DB Indicator Footer */}
              <div className="px-3 py-2.5 rounded-2xl bg-slate-950/80 border border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Memory: Supabase pgvector 0.8.2 (1536-dim)</span>
                </div>
                <span className="text-emerald-400">Live</span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-300">
            {currentUser?.full_name?.charAt(0) || 'U'}
          </div>
          <span className="text-xs font-medium text-slate-300 hidden md:inline">
            {currentUser?.full_name || 'Developer'}
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
