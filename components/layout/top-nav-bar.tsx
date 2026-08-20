'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import logoImg from '@/public/logo.png';

interface TopNavBarProps {
  currentTab?: 'workspace' | 'projects' | 'knowledge' | 'founder' | 'landing';
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ currentTab }) => {
  const pathname = usePathname();

  const isTabActive = (tab: string, path: string) => {
    if (currentTab) return currentTab === tab;
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <nav className="flex items-center gap-4 sm:gap-6 md:gap-8 font-mono text-[11px] sm:text-xs tracking-wider sm:tracking-widest uppercase overflow-x-auto no-scrollbar py-1 shrink-0 whitespace-nowrap">
      <Link
        href="/workspace"
        className={`transition-all ${
          isTabActive('workspace', '/workspace')
            ? 'text-purple-300 font-bold drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]'
            : 'text-slate-400 hover:text-purple-200'
        }`}
      >
        WORKSPACE
      </Link>

      <Link
        href="/projects"
        className={`transition-all ${
          isTabActive('projects', '/projects')
            ? 'text-purple-300 font-bold drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]'
            : 'text-slate-400 hover:text-purple-200'
        }`}
      >
        PROJECTS
      </Link>

      <Link
        href="/knowledge"
        className={`transition-all ${
          isTabActive('knowledge', '/knowledge')
            ? 'text-purple-300 font-bold drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]'
            : 'text-slate-400 hover:text-purple-200'
        }`}
      >
        KNOWLEDGE
      </Link>

      <Link
        href="/founder"
        className={`transition-all ${
          isTabActive('founder', '/founder')
            ? 'text-purple-300 font-bold drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]'
            : 'text-slate-400 hover:text-purple-200'
        }`}
      >
        FOUNDER
      </Link>
    </nav>
  );
};
