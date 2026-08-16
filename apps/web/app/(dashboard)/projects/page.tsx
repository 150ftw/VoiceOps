'use client';

import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  Plus,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Link2,
} from 'lucide-react';
import { Project, Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';

export default function ProjectsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [repoFullName, setRepoFullName] = useState('');
  const [githubRepoId, setGithubRepoId] = useState('');

  const loadProjects = async (wsId: string) => {
    try {
      const data = await apiRequest(`/projects?workspace_id=${wsId}`);
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const user = await apiRequest('/auth/me');
        if (user.workspaces && user.workspaces.length > 0) {
          const ws = user.workspaces[0];
          setWorkspace(ws);
          await loadProjects(ws.id);
        }
      } catch (err) {
        console.warn(err);
      }
    }
    init();
  }, []);

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
          default_branch: 'main',
          repository_full_name: repoFullName.trim() || null,
          github_repo_id: githubRepoId ? parseInt(githubRepoId, 10) : 1001,
        }),
      });

      setName('');
      setSlug('');
      setDescription('');
      setRepoFullName('');
      setGithubRepoId('');
      await loadProjects(workspace.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Projects & Repositories</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure codebases and link GitHub repositories for agentic investigation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Project Form (1 col) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Create New Project</span>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
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
              <label className="block text-slate-400 mb-1 font-medium">GitHub Repository (owner/repo)</label>
              <input
                type="text"
                value={repoFullName}
                onChange={(e) => setRepoFullName(e.target.value)}
                placeholder="e.g. acme-corp/payments-service"
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

        {/* Existing Projects List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {projects.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl border border-white/5 text-center text-xs text-slate-400">
              No projects created yet. Use the form to add your first project.
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-indigo-500/30 transition-all space-y-3"
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
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-400">
                    <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                    <span>{proj.repository?.repo_full_name || 'No repository linked'}</span>
                    {proj.repository && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Linked
                      </span>
                    )}
                  </div>

                  <span className="text-slate-500 text-[11px]">
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
