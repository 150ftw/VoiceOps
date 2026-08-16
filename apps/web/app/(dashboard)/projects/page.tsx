'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  Plus,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Github,
  Search,
  Lock,
  Globe,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Project, Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';

interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description?: string;
  default_branch: string;
  updated_at?: string;
}

export default function ProjectsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepoItem[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [importingRepoId, setImportingRepoId] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [repoFullName, setRepoFullName] = useState('');
  const [githubRepoId, setGithubRepoId] = useState<number | null>(null);
  const [defaultBranch, setDefaultBranch] = useState('main');

  const loadProjects = async (wsId: string) => {
    try {
      const data = await apiRequest(`/projects?workspace_id=${wsId}`);
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadGitHubRepos = async (wsId: string) => {
    setIsLoadingRepos(true);
    try {
      const statusData = await apiRequest(`/integrations/github/status?workspace_id=${wsId}`).catch(() => null);
      if (statusData?.connected) {
        setGithubConnected(true);
        const reposData = await apiRequest(`/integrations/github/repositories?workspace_id=${wsId}`).catch(() => []);
        setGithubRepos(reposData || []);
      } else {
        setGithubConnected(false);
      }
    } catch (err) {
      console.warn('Failed to load GitHub repos:', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const user = await apiRequest('/auth/me');
        if (user.workspaces && user.workspaces.length > 0) {
          const ws = user.workspaces[0];
          setWorkspace(ws);
          await Promise.all([loadProjects(ws.id), loadGitHubRepos(ws.id)]);
        }
      } catch (err) {
        console.warn('Init error:', err);
      }
    }
    init();
  }, []);

  const handleSelectRepo = (repo: GitHubRepoItem) => {
    setName(repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    setSlug(repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    setDescription(repo.description || `DevOps service repository for ${repo.full_name}`);
    setRepoFullName(repo.full_name);
    setGithubRepoId(repo.id);
    setDefaultBranch(repo.default_branch || 'main');
  };

  const handleQuickImport = async (repo: GitHubRepoItem) => {
    if (!workspace) return;
    setImportingRepoId(repo.id);

    try {
      const projName = repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const projSlug = `${repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).slice(-4)}`;

      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: workspace.id,
          name: projName,
          slug: projSlug,
          description: repo.description || `Imported from GitHub ${repo.full_name}`,
          default_branch: repo.default_branch || 'main',
          repository_full_name: repo.full_name,
          github_repo_id: repo.id,
        }),
      });

      await loadProjects(workspace.id);
    } catch (err: any) {
      alert(err.message || 'Failed to import repository');
    } finally {
      setImportingRepoId(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !name.trim() || !slug.trim()) return;

    setIsCreating(true);
    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: workspace.id,
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim() || null,
          default_branch: defaultBranch || 'main',
          repository_full_name: repoFullName.trim() || null,
          github_repo_id: githubRepoId || 1001,
        }),
      });

      setName('');
      setSlug('');
      setDescription('');
      setRepoFullName('');
      setGithubRepoId(null);
      await loadProjects(workspace.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredGitHubRepos = githubRepos.filter((r) =>
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Projects & Repositories</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure codebases and link GitHub repositories for agentic CI/CD investigation.
          </p>
        </div>

        {!githubConnected && (
          <Link
            href="/integrations"
            className="px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Github className="w-4 h-4" />
            <span>Connect GitHub Account</span>
          </Link>
        )}
      </div>

      {/* GitHub Auto-Discovery Repositories Banner / Grid */}
      {githubConnected && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">Your GitHub Repositories</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Auto-Discovered ({githubRepos.length})</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Select any repository below to instantly import and inspect with VoiceOps AI.
                </p>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repos..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {isLoadingRepos ? (
            <div className="py-8 flex justify-center items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Fetching your GitHub repositories...</span>
            </div>
          ) : filteredGitHubRepos.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No repositories found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {filteredGitHubRepos.map((repo) => {
                const isAlreadyLinked = projects.some(
                  (p) => p.repository?.repo_full_name?.toLowerCase() === repo.full_name.toLowerCase()
                );
                const isImporting = importingRepoId === repo.id;

                return (
                  <div
                    key={repo.id}
                    className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors">
                          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate max-w-[170px]">{repo.name}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/5">
                          {repo.private ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Globe className="w-2.5 h-2.5 text-slate-400" />}
                          <span>{repo.private ? 'Private' : 'Public'}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {repo.description || repo.full_name}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        <span>{repo.default_branch || 'main'}</span>
                      </span>

                      {isAlreadyLinked ? (
                        <Link
                          href={`/workspace?project_id=${projects.find(p => p.repository?.repo_full_name?.toLowerCase() === repo.full_name.toLowerCase())?.id || ''}`}
                          onClick={() => {
                            const p = projects.find(p => p.repository?.repo_full_name?.toLowerCase() === repo.full_name.toLowerCase());
                            if (p && typeof window !== 'undefined') {
                              localStorage.setItem('voiceops_active_project_id', p.id);
                            }
                          }}
                          className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Investigate &rarr;</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleQuickImport(repo)}
                          disabled={isImporting}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
                        >
                          {isImporting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          <span>1-Click Import</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Manual Form & Existing Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create / Customize Project Form (1 col) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Create Custom Project</span>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Select Connected GitHub Repo</label>
              {githubRepos.length > 0 ? (
                <select
                  onChange={(e) => {
                    const selected = githubRepos.find((r) => r.full_name === e.target.value);
                    if (selected) handleSelectRepo(selected);
                  }}
                  value={repoFullName}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                >
                  <option value="">-- Choose from your GitHub repos --</option>
                  {githubRepos.map((r) => (
                    <option key={r.id} value={r.full_name}>
                      {r.full_name} ({r.private ? 'Private' : 'Public'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={repoFullName}
                  onChange={(e) => setRepoFullName(e.target.value)}
                  placeholder="e.g. acme-corp/payments-service"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Project Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }}
                placeholder="e.g. Payments Microservice"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="payments-microservice"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Core payment gateway service with Docker & GitHub Actions"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md glow-indigo transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Create Project</span>
            </button>
          </form>
        </div>

        {/* Existing Active Projects List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Active Investigation Projects ({projects.length})
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-white/5 text-center text-xs text-slate-400">
              No projects created yet. Import a repository from above or use the form to get started.
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-indigo-500/30 transition-all space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-100">{proj.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                        {proj.slug}
                      </span>
                    </div>
                    {proj.description && (
                      <p className="text-xs text-slate-400">{proj.description}</p>
                    )}
                  </div>

                  <Link
                    href="/workspace"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md glow-indigo transition-all"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-400">
                    <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300 font-medium">
                      {proj.repository?.repo_full_name || 'No repository linked'}
                    </span>
                    {proj.repository && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Linked
                      </span>
                    )}
                  </div>

                  <span className="text-slate-500 text-[11px] font-mono">
                    branch: {proj.default_branch}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
