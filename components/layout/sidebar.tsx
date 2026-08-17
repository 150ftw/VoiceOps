'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mic,
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  BookOpen,
  GitBranch,
  Activity,
  Settings,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Workspace', href: '/workspace', icon: Mic, highlight: true },
  { label: 'Projects & Repos', href: '/projects', icon: FolderGit2 },
  { label: 'Conversations', href: '/conversations', icon: MessageSquare },
  { label: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { label: 'Integrations', href: '/integrations', icon: GitBranch },
  { label: 'Observability', href: '/observability', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-[#040209] border-r border-purple-500/15 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Logo */}
      <Link href="/" className="h-16 flex items-center gap-3 px-5 border-b border-purple-500/15 hover:bg-purple-950/20 transition-colors">
        <img
          src="/logo.png"
          alt="VoiceOps Logo"
          className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-white">
              VoiceOps
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              AI
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">Autonomous DevOps</p>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && !!pathname && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-purple-600/15 text-purple-200 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]',
                item.highlight && !isActive && 'text-purple-300 bg-purple-500/[0.04] hover:bg-purple-500/10'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-purple-500" />
              )}
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive
                    ? 'text-purple-400'
                    : item.highlight
                    ? 'text-purple-400'
                    : 'text-slate-400 group-hover:text-slate-200'
                )}
              />
              <span className="flex-1 tracking-tight">{item.label}</span>
              {item.highlight && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Guardrail Safety Card */}
      <div className="p-3.5 m-3 rounded-2xl bg-[#090514] border border-purple-500/20 shadow-sm space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">Guardrails</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Cryptographic human approval enforced on all write actions.
        </p>
      </div>
    </aside>
  );
};
