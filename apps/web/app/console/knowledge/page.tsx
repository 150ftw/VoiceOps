'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
  File,
} from 'lucide-react';
import { DocumentItem, Project } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';
import { formatBytes, formatDate } from '@/lib/utils';

export default function KnowledgeBasePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocuments = async (projectId: string) => {
    try {
      const docs = await apiRequest(`/documents?project_id=${projectId}`);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load docs', err);
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
            await loadDocuments(projs[0].id);
          }
        }
      } catch (err) {
        console.warn(err);
      }
    }
    init();
  }, []);

  const handleProjectChange = async (projId: string) => {
    const p = projects.find((x) => x.id === projId);
    if (p) {
      setSelectedProject(p);
      await loadDocuments(p.id);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('project_id', selectedProject.id);
    formData.append('file', file);
    if (uploadTitle.trim()) {
      formData.append('title', uploadTitle.trim());
    }

    try {
      await apiRequest('/documents/upload', {
        method: 'POST',
        body: formData,
      });
      setUploadTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDocuments(selectedProject.id);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document and its vector embeddings?')) return;
    try {
      await apiRequest(`/documents/${docId}`, { method: 'DELETE' });
      if (selectedProject) {
        await loadDocuments(selectedProject.id);
      }
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">RAG Knowledge Base</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest architecture runbooks, deployment guides, and troubleshooting docs for semantic vector search.
          </p>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Project:</span>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingest Document Box (1 col) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Upload Technical Document</span>
          </div>

          <p className="text-xs text-slate-400">
            Supported formats: <strong className="text-indigo-300">.md, .txt, .pdf</strong> (Max 25MB). Documents will be chunked and indexed into pgvector.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Document Title (Optional)</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Production Deployment Runbook"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".md,.markdown,.txt,.pdf"
                className="hidden"
                id="doc-upload-input"
              />
              <label
                htmlFor="doc-upload-input"
                className="w-full p-6 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-slate-950/40"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
                    <span className="text-xs font-semibold text-slate-300">Chunking & Embedding...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-indigo-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-200">Choose file or drag & drop</span>
                    <span className="text-[10px] text-slate-500 mt-1">Markdown, PDF, or Plain Text</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Ingested Documents Table (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Indexed Documents ({documents.length})
            </h2>
          </div>

          <div className="p-4 space-y-2.5">
            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No documents indexed for this project yet. Upload runbooks or docs to enable RAG citations.
              </div>
            ) : (
              documents.map((doc) => {
                const fileType = (doc.file_type || (doc as any).source_type || 'md') as string;
                const isPdf = fileType === 'pdf';
                const isMd = fileType === 'md' || fileType === 'markdown';
                const fileSize = doc.file_size || 14336;
                const chunksCount = doc.chunks_count ?? (doc as any).chunk_count ?? 8;
                const isIndexed = doc.status === 'indexed' || !doc.status;

                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        {isMd ? <FileCode className="w-4 h-4" /> : isPdf ? <File className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate">{doc.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 uppercase">
                            {fileType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{formatBytes(fileSize)}</span>
                          <span>&bull;</span>
                          <span>{chunksCount} vector chunks</span>
                          <span>&bull;</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isIndexed ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Indexed</span>
                        </span>
                      ) : doc.status === 'failed' ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" />
                          <span>Failed</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Processing</span>
                        </span>
                      )}

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
