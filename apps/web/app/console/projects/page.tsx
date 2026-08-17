'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  MoreVertical,
  ChevronDown,
  Trash2,
  RefreshCw,
  BookOpen,
  Terminal,
  Unlink,
  Check,
} from 'lucide-react';
import { Project, Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';
import { ConfirmModal } from '@/components/ui/confirm-modal';

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
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepoItem[]>([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [importingRepoId, setImportingRepoId] = useState<number | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null);
  const [detachingProjectId, setDetachingProjectId] = useState<string | null>(null);
  const [confirmDetachTarget, setConfirmDetachTarget] = useState<{ id: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [repoFullName, setRepoFullName] = useState('');
  const [githubRepoId, setGithubRepoId] = useState<number | null>(null);
  const [defaultBranch, setDefaultBranch] = useState('main');

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProjects = async (wsId: string) => {
    try {
      const data = await apiRequest(`/projects?workspace_id=${wsId}`).catch(() => []);
      const list = Array.isArray(data) ? data : data?.projects || [];
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setProjects([]);
    }
  };

  const loadGitHubRepos = async (wsId: string) => {
    setIsLoadingRepos(true);
    try {
      const statusData = await apiRequest(`/integrations/github/status?workspace_id=${wsId}`).catch(() => null);
      if (statusData?.connected) {
        setGithubConnected(true);
        const reposData = await apiRequest(`/integrations/github/repositories?workspace_id=${wsId}`).catch(() => []);
        const list = Array.isArray(reposData) ? reposData : reposData?.repositories || [];
        setGithubRepos(list);
      } else {
        setGithubConnected(false);
        setGithubRepos([]);
      }
    } catch (err) {
      console.warn('Failed to load GitHub repos:', err);
      setGithubRepos([]);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const user = await apiRequest('/auth/me').catch(() => null);
        if (user?.workspaces && user.workspaces.length > 0) {
          const ws = user.workspaces[0];
          setWorkspace(ws);
          await Promise.all([loadProjects(ws.id), loadGitHubRepos(ws.id)]);
        } else {
          // Fallback workspace
          const defaultWs: Workspace = {
            id: 'ws-primary-default',
            name: 'Primary Workspace',
            slug: 'primary',
            role: 'owner',
            owner_id: 'default',
            created_at: new Date().toISOString(),
          };
          setWorkspace(defaultWs);
          await Promise.all([loadProjects(defaultWs.id), loadGitHubRepos(defaultWs.id)]);
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
      const projSlug = `${repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36).slice(-4)}`;

      const newProj = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: workspace.id,
          name: projName,
          slug: projSlug,
          description: repo.description || `Imported from GitHub ${repo.full_name}`,
          default_branch: repo.default_branch || 'main',
          repository_full_name: repo.full_name,
          github_repo: repo.full_name,
          github_repo_id: repo.id,
        }),
      });

      if (newProj) {
        setProjects((prev) => [newProj, ...prev.filter((p) => p.id !== newProj.id)]);
      }

      await loadProjects(workspace.id);
      showToast(`Imported ${repo.full_name} successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to import repository');
    } finally {
      setImportingRepoId(null);
    }
  };

  const promptDetachRepo = (projectId: string, projName: string) => {
    setActiveDropdownId(null);
    setConfirmDetachTarget({ id: projectId, name: projName });
  };

  const executeDetachRepo = async () => {
    if (!workspace || !confirmDetachTarget) return;

    setDetachingProjectId(confirmDetachTarget.id);
    try {
      await apiRequest(`/projects/${confirmDetachTarget.id}`, { method: 'DELETE' });
      
      // Clear active project ID from localStorage if it matches
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('voiceops_active_project_id');
        if (storedId === confirmDetachTarget.id) {
          localStorage.removeItem('voiceops_active_project_id');
        }
        window.dispatchEvent(new CustomEvent('voiceops_project_detached', { detail: { projectId: confirmDetachTarget.id } }));
      }

      await loadProjects(workspace.id);
      showToast(`Detached ${confirmDetachTarget.name} from workspace.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to detach repository');
    } finally {
      setDetachingProjectId(null);
      setConfirmDetachTarget(null);
    }
  };

  const handleSyncProject = async (projectId: string) => {
    setSyncingProjectId(projectId);
    setActiveDropdownId(null);
    try {
      const res = await apiRequest(`/projects/${projectId}/sync-repo`, { method: 'POST' });
      showToast(`Synced ${res.files_indexed || 0} files (${res.chunks_created || 0} chunks) into pgvector!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to sync repository');
    } finally {
      setSyncingProjectId(null);
    }
  };

  const handleInvestigate = (projectId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceops_active_project_id', projectId);
    }
    router.push(`/console/workspace?project_id=${projectId}`);
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
      showToast('Project created successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredGitHubRepos = (Array.isArray(githubRepos) ? githubRepos : []).filter((r) =>
    r?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r?.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 antialiased" ref={dropdownRef}>
      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0C121E] border border-indigo-500/40 shadow-2xl text-xs text-slate-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal for Detach */}
      <ConfirmModal
        isOpen={Boolean(confirmDetachTarget)}
        title="Detach Repository?"
        description="This will unlink the repository from your workspace, remove cached pgvector vector embeddings, and reset associated conversation history. You can re-import this repository at any time."
        targetName={confirmDetachTarget?.name}
        confirmText="Detach Repository"
        cancelText="Cancel"
        isDanger={true}
        isLoading={Boolean(detachingProjectId)}
        onConfirm={executeDetachRepo}
        onCancel={() => setConfirmDetachTarget(null)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Projects & Repositories</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure codebases, manage linked GitHub repositories, and trigger AI investigations.
          </p>
        </div>

        {!githubConnected && (
          <Link
            href="/console/integrations"
            className="px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Github className="w-4 h-4" />
            <span>Connect GitHub Account</span>
          </Link>
        )}
      </div>

      {/* GitHub Auto-Discovery Repositories Banner / Grid */}
      {githubConnected && (
        <div className="rounded-3xl bg-[#080B14] p-6 border border-white/[0.08] space-y-4 shadow-xl">
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
                  Select any repository below to investigate or manage attachments with VoiceOps AI.
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
                className="w-full bg-[#0C121E] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                const linkedProject = projects.find((p) => {
                  const pRepo = p.repository?.repo_full_name || (p as any).github_repo || (p as any).repository_full_name;
                  if (pRepo && pRepo.toLowerCase() === repo.full_name.toLowerCase()) return true;
                  if (p.name && (p.name.toLowerCase() === repo.name.toLowerCase() || p.slug === repo.name.toLowerCase())) return true;
                  return false;
                });
                const isAlreadyLinked = Boolean(linkedProject);
                const isImporting = importingRepoId === repo.id;
                const isDropdownOpen = activeDropdownId === `repo-${repo.id}`;

                return (
                  <div
                    key={repo.id}
                    className="p-4 rounded-2xl bg-[#090E1A] hover:bg-[#0D1424] border border-white/[0.06] hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3 group relative"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors">
                          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate max-w-[160px]">{repo.name}</span>
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

                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] relative">
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        <span>{repo.default_branch || 'main'}</span>
                      </span>

                      {isAlreadyLinked && linkedProject ? (
                        <div className="relative">
                          {/* Manage Dropdown Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(isDropdownOpen ? null : `repo-${repo.id}`);
                            }}
                            className="flex items-center gap-1.5 text-[11px] text-slate-200 font-semibold px-2.5 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 transition-all cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Manage</span>
                            <ChevronDown className={`w-3 h-3 text-indigo-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Action Dropdown Menu */}
                          {isDropdownOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-[#0c121e] border border-slate-700 shadow-2xl rounded-2xl p-2 z-[999] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10 text-xs">
                              <button
                                onClick={() => handleInvestigate(linkedProject.id)}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition-colors font-medium text-left"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Investigate Codebase</span>
                              </button>

                              <button
                                onClick={() => handleSyncProject(linkedProject.id)}
                                disabled={syncingProjectId === linkedProject.id}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-cyan-300 hover:bg-cyan-500/10 transition-colors font-medium text-left"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${syncingProjectId === linkedProject.id ? 'animate-spin' : ''}`} />
                                <span>Sync pgvector</span>
                              </button>

                              <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-colors font-medium text-left"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                <span>View on GitHub</span>
                              </a>

                              <div className="h-px bg-white/10 my-1" />

                              <button
                                onClick={() => promptDetachRepo(linkedProject.id, linkedProject.name)}
                                disabled={detachingProjectId === linkedProject.id}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-medium text-left"
                              >
                                <Unlink className="w-3.5 h-3.5 text-rose-400" />
                                <span>Detach Repository</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuickImport(repo)}
                          disabled={isImporting}
                          className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] flex items-center gap-1 shadow-sm transition-all disabled:opacity-50"
                        >
                          {isImporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
        <div className="rounded-3xl bg-[#080B14] p-6 border border-white/[0.08] space-y-4">
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
                  className="w-full bg-[#0C121E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs"
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
                  className="w-full bg-[#0C121E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
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
                className="w-full bg-[#0C121E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                className="w-full bg-[#0C121E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Core payment gateway service with Docker & GitHub Actions"
                className="w-full bg-[#0C121E] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
            <div className="rounded-3xl bg-[#080B14] p-8 border border-white/[0.06] text-center text-xs text-slate-400">
              No projects created yet. Import a repository from above or use the form to get started.
            </div>
          ) : (
            projects.map((proj) => {
              const isDropdownOpen = activeDropdownId === `proj-${proj.id}`;

              return (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl bg-[#080B14] border border-white/[0.06] hover:border-indigo-500/30 transition-all space-y-3 shadow-lg relative"
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

                    {/* Manage Dropdown on Active Project Card */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveDropdownId(isDropdownOpen ? null : `proj-${proj.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md glow-indigo transition-all"
                      >
                        <span>Manage</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#0c121e] border border-slate-700 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-white/10 text-xs">
                          <button
                            onClick={() => handleInvestigate(proj.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-emerald-300 hover:bg-emerald-500/10 transition-colors font-medium text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Investigate Codebase</span>
                          </button>

                          <button
                            onClick={() => handleSyncProject(proj.id)}
                            disabled={syncingProjectId === proj.id}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-cyan-300 hover:bg-cyan-500/10 transition-colors font-medium text-left"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${syncingProjectId === proj.id ? 'animate-spin' : ''}`} />
                            <span>Sync pgvector</span>
                          </button>

                          <Link
                            href="/console/knowledge"
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-indigo-300 hover:bg-indigo-500/10 transition-colors font-medium text-left"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            <span>View Runbooks</span>
                          </Link>

                          {(proj.repository?.repo_full_name || (proj as any).github_repo) && (
                            <a
                              href={`https://github.com/${proj.repository?.repo_full_name || (proj as any).github_repo}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-colors font-medium text-left"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>View on GitHub</span>
                            </a>
                          )}

                          <div className="h-px bg-white/10 my-1" />

                          <button
                            onClick={() => promptDetachRepo(proj.id, proj.name)}
                            disabled={detachingProjectId === proj.id}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-medium text-left"
                          >
                            <Unlink className="w-3.5 h-3.5 text-rose-400" />
                            <span>Detach Repository</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono text-slate-400">
                      <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300 font-medium">
                        {proj.repository?.repo_full_name || (proj as any).github_repo || 'No repository linked'}
                      </span>
                      {(proj.repository || (proj as any).github_repo) && (
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
