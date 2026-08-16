'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Terminal, FileCode2, Sparkles } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
  isUser?: boolean;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, isUser }) => {
  if (isUser) {
    return <div className="whitespace-pre-wrap leading-relaxed font-sans">{content}</div>;
  }

  return (
    <div className="markdown-content text-slate-200 text-xs sm:text-[13px] leading-relaxed space-y-2 font-sans antialiased">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight pt-1 mb-1.5 flex items-center gap-2 border-b border-white/[0.06] pb-1.5">
              <span className="text-indigo-400">#</span>
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight pt-1 mb-1 flex items-center gap-1.5">
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-[13px] font-bold text-slate-100 pt-0.5 mb-1 flex items-center gap-1.5 text-indigo-200">
              <span>{children}</span>
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[11px] sm:text-xs font-semibold text-slate-300 pt-0.5 mb-0.5 uppercase tracking-wider font-mono">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-slate-300 leading-relaxed my-1">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-indigo-300 not-italic font-medium">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 my-1 pl-1 list-none">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1 my-1 pl-4 list-decimal text-slate-300">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 text-slate-300">
              <span className="text-indigo-400 mt-1 text-[10px] shrink-0 select-none">&bull;</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeText = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} value={codeText} />;
            }

            if (!inline && codeText.includes('\n')) {
              return <CodeBlock language="text" value={codeText} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-lg bg-slate-900 text-indigo-300 font-mono text-[11px] border border-white/[0.08]"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-500 pl-3 my-2 text-slate-300 italic bg-indigo-500/[0.04] py-1.5 rounded-r-xl text-xs">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-2xl border border-white/[0.08] bg-slate-950/80">
              <table className="w-full text-left text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 bg-slate-900/90 font-semibold text-white border-b border-white/10 font-mono text-[11px]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-white/[0.04] text-slate-300">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors font-medium"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl bg-[#06080F] border border-white/[0.08] overflow-hidden shadow-xl ring-1 ring-white/[0.02]">
      {/* macOS Terminal Window Header */}
      <div className="px-3.5 py-2 bg-slate-950/90 border-b border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-500 text-[10px]">|</span>
          <span className="text-indigo-300 font-semibold text-[10px] uppercase">{language || 'code'}</span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.04]"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre className="p-3.5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed selection:bg-indigo-500/30">
        <code>{value}</code>
      </pre>
    </div>
  );
};
