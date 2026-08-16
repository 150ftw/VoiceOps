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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Voice Workspace', href: '/workspace', icon: Mic, highlight: true },
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
    <aside className="w-64 shrink-0 bg-[#070A12] border-r border-white/5 flex flex-col h-screen sticky top-0">
      {/* Brand Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg glow-indigo">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            VoiceOps
          </span>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-indigo-400">
            DevOps Assistant
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
                item.highlight && !isActive && 'text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive
                    ? 'text-indigo-400'
                    : item.highlight
                    ? 'text-indigo-400'
                    : 'text-slate-400 group-hover:text-slate-200'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.highlight && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Safety Badge */}
      <div className="p-4 border-t border-white/5 m-3 rounded-2xl bg-white/[0.02] border">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Guardrails Active</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Write actions require explicit approval before execution.
        </p>
      </div>
    </aside>
  );
};
