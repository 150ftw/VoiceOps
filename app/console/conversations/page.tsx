'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';
import { Conversation, Project } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

export default function ConversationsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = async (projId: string) => {
    setIsLoading(true);
    try {
      const data = await apiRequest(`/conversations?project_id=${projId}`);
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const user = await apiRequest('/auth/me');
        if (user.workspaces && user.workspaces.length > 0) {
          const projs = await apiRequest(`/projects?workspace_id=${user.workspaces[0].id}`);
          setProjects(projs);
          if (projs.length > 0) {
            setSelectedProject(projs[0]);
            await loadConversations(projs[0].id);
          }
        }
      } catch (err) {
        console.warn(err);
      }
    }
    init();
  }, []);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Conversation History</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse and reopen previous DevOps investigations and failure analyses.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Project:</span>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value);
                if (p) {
                  setSelectedProject(p);
                  loadConversations(p.id);
                }
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search previous investigations by topic..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="glass-panel p-8 rounded-3xl border border-white/5 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading history...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl border border-white/5 text-center text-xs text-slate-400">
            No conversations found. Start a new session in the Voice Workspace.
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="p-4 rounded-2xl glass-panel border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-slate-200">{conv.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(conv.updated_at || conv.created_at)}</span>
                  {conv.state?.active_repo && (
                    <>
                      <span>&bull;</span>
                      <span className="font-mono text-slate-400">{conv.state.active_repo}</span>
                    </>
                  )}
                </div>
              </div>

              <Link
                href="/workspace"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <span>Reopen</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
