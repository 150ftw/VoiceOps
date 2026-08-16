'use client';

import React from 'react';
import { BookOpen, ExternalLink, FileText } from 'lucide-react';
import { CitationSource } from '@voiceops/shared';

interface CitationsCardProps {
  sources: CitationSource[];
}

export const CitationsCard: React.FC<CitationsCardProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="glass-panel p-4 rounded-xl border border-white/10 my-3">
      <div className="flex items-center gap-2 mb-2.5">
        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
          Referenced Knowledge Sources ({sources.length})
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sources.map((src, idx) => {
          const similarityPct = Math.round(src.similarity * 100);
          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-200 truncate">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{src.document_title || src.filename}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {similarityPct}% match
                </span>
              </div>

              {src.metadata?.heading && (
                <div className="text-[11px] text-indigo-400/90 mb-1">
                  &sect; {src.metadata.heading}
                </div>
              )}

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {src.content_excerpt || src.content || 'Excerpt from project documentation.'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
