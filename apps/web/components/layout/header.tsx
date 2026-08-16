'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FolderGit2,
  GitBranch,
  LogOut,
  Sparkles,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { Project, Workspace } from '@voiceops/shared';
import { apiRequest, clearAuthToken } from '@/lib/api-client';

interface HeaderProps {
  activeProject?: Project | null;
  onSelectProject?: (project: Project) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeProject, onSelectProject }) => {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await apiRequest('/auth/me');
        setCurrentUser(user);
        if (user.workspaces && user.workspaces.length > 0) {
          setWorkspaces(user.workspaces);
          setCurrentWorkspace(user.workspaces[0]);

          // Load projects for first workspace
          const projs = await apiRequest(`/projects?workspace_id=${user.workspaces[0].id}`);
          setProjects(projs);
          if (projs.length > 0 && onSelectProject && !activeProject) {
            onSelectProject(projs[0]);
          }
        }
      } catch (err) {
        console.log('User not authenticated or offline mock mode');
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
    <header className="h-16 border-b border-white/5 bg-[#090D16]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Workspace & Project Switchers */}
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
          <span className="font-semibold">{activeProject?.name || 'Demo DevOps Project'}</span>
          {activeProject?.repository && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 font-mono">
              {activeProject.repository.repo_full_name}
            </span>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* AI Model Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-medium text-cyan-300">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Gemini &bull; Whisper &bull; pgvector</span>
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
