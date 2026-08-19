'use client';

import React, { useState } from 'react';
import { Bot, User, Volume2, ShieldCheck, Copy, Check, Sparkles } from 'lucide-react';
import { Message, PendingApproval } from '@voiceops/shared';
import { formatDate } from '@/lib/utils';
import { CitationsCard } from './citations-card';
import { ApprovalCard } from '../approvals/approval-card';
import { MarkdownContent } from './markdown-content';

import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
  userAvatarUrl?: string;
  userName?: string;
  onSpeak?: (text: string) => void;
  onRespondApproval?: (approvalId: string, decision: 'approved' | 'rejected') => Promise<void> | void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  userAvatarUrl,
  userName,
  onSpeak,
  onRespondApproval,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const isUser = message.sender_type === 'user';
  const sources = message.metadata?.sources || message.metadata_json?.sources || [];
  const pendingApproval: PendingApproval | undefined =
    message.metadata?.pending_approval || message.metadata_json?.pending_approval;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const effectiveAvatar = userAvatarUrl || 'https://avatars.githubusercontent.com/u/86033717?v=4';

  return (
    <div className={`flex gap-3 sm:gap-4 my-5 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar Icon */}
      {isUser ? (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-purple-400/40 bg-purple-900/60 flex items-center justify-center ring-2 ring-purple-500/20">
          <img
            src={effectiveAvatar}
            alt={userName || 'User'}
            className="w-full h-full object-cover block"
            loading="eager"
          />
        </div>
      ) : (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#0C1222] border border-white/[0.08] p-1.5 shrink-0 flex items-center justify-center shadow-lg ring-2 ring-indigo-500/20">
          <Image
            src="/logo.png"
            alt="VoiceOps Logo"
            width={32}
            height={32}
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
            priority
          />
        </div>
      )}

      {/* Message Content Body */}
      <div className={`max-w-3xl flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
        <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px]">
          <span className="font-semibold text-slate-200 tracking-tight">
            {isUser ? 'You' : 'VoiceOps AI'}
          </span>
          {!isUser && (
            <span className="px-2 py-0.2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9.5px] font-mono text-indigo-300 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              <span>pgvector AST</span>
            </span>
          )}
          <span className="text-slate-500 font-mono text-[10px]">{formatDate(message.created_at)}</span>
        </div>

        <div
          className={`w-full ${
            isUser
              ? 'bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-600 text-white rounded-3xl rounded-tr-md p-4 sm:p-5 shadow-xl border border-purple-400/30'
              : 'bg-[#080C16]/95 text-slate-200 rounded-3xl rounded-tl-md border border-white/[0.08] p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-3 ring-1 ring-white/[0.02]'
          }`}
        >
          <MarkdownContent content={message.content} isUser={isUser} />

          {/* Inline Approval Card if attached to message */}
          {!isUser && pendingApproval && onRespondApproval && (
            <div className="mt-4 pt-2">
              <ApprovalCard
                approval={pendingApproval}
                onRespond={onRespondApproval}
              />
            </div>
          )}

          {/* Sources / Citations if attached to this message */}
          {!isUser && sources.length > 0 && <CitationsCard sources={sources} />}
        </div>

        {/* Action toolbar for Agent messages */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-2 px-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {onSpeak && (
              <button
                onClick={() => onSpeak(message.content)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-slate-400 hover:text-indigo-300 transition-all font-mono"
                title="Read response aloud"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Read aloud</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-slate-400 hover:text-white transition-all font-mono"
              title="Copy markdown content"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
