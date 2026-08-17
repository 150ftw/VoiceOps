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

  const effectiveAvatar = userAvatarUrl || 'https://github.com/ss18244646.png';

  return (
    <div className={`flex gap-3.5 my-5 ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar Icon */}
      <div
        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md overflow-hidden ${
          isUser
            ? 'bg-gradient-to-tr from-purple-600 via-purple-500 to-fuchsia-400 border border-purple-400/30 text-white'
            : 'bg-[#180F33] border border-purple-500/30 text-white shadow-lg shadow-purple-950/50'
        }`}
      >
        {isUser ? (
          !imgError && effectiveAvatar ? (
            <img
              src={effectiveAvatar}
              alt={userName || 'User'}
              className="w-full h-full object-cover rounded-2xl"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-xs font-bold text-white">
              {userName?.charAt(0) || 'S'}
            </span>
          )
        ) : (
          <div className="w-5 h-5 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="VoiceOps Logo"
              width={20}
              height={20}
              className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]"
            />
          </div>
        )}
      </div>

      {/* Message Content Body */}
      <div className={`max-w-2xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px]">
          <span className="font-semibold text-slate-300">
            {isUser ? 'You' : 'VoiceOps AI'}
          </span>
          {!isUser && (
            <span className="px-2 py-0.2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-mono text-indigo-300">
              pgvector
            </span>
          )}
          <span className="text-slate-500 font-mono text-[10px]">{formatDate(message.created_at)}</span>
        </div>

        <div
          className={`p-5 rounded-3xl text-xs sm:text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-sm shadow-md'
              : 'bg-[#090E1A] text-slate-200 rounded-tl-sm border border-white/[0.08] shadow-2xl space-y-3'
          }`}
        >
          <MarkdownContent content={message.content} isUser={isUser} />

          {/* Inline Approval Card if attached to message */}
          {!isUser && pendingApproval && onRespondApproval && (
            <div className="mt-3">
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
          <div className="flex items-center gap-3 mt-1.5 px-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {onSpeak && (
              <button
                onClick={() => onSpeak(message.content)}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors font-mono"
                title="Read response aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Read aloud</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors font-mono"
              title="Copy markdown content"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
