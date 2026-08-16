'use client';

import React from 'react';
import { Bot, User, Volume2, ShieldCheck } from 'lucide-react';
import { Message, PendingApproval } from '@voiceops/shared';
import { formatDate } from '@/lib/utils';
import { CitationsCard } from './citations-card';
import { ApprovalCard } from '../approvals/approval-card';
import { MarkdownContent } from './markdown-content';

interface MessageBubbleProps {
  message: Message;
  onSpeak?: (text: string) => void;
  onRespondApproval?: (approvalId: string, decision: 'approved' | 'rejected') => Promise<void> | void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSpeak,
  onRespondApproval,
}) => {
  const isUser = message.sender_type === 'user';
  const sources = message.metadata?.sources || message.metadata_json?.sources || [];
  const pendingApproval: PendingApproval | undefined =
    message.metadata?.pending_approval || message.metadata_json?.pending_approval;

  return (
    <div className={`flex gap-3.5 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-gradient-to-tr from-slate-700 to-slate-600 text-slate-200'
            : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white glow-indigo'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Message Content Body */}
      <div className={`max-w-2xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-semibold text-slate-300">
            {isUser ? 'You' : 'VoiceOps'}
          </span>
          <span className="text-[10px] text-slate-500">{formatDate(message.created_at)}</span>
        </div>

        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600/90 text-white rounded-tr-none shadow-md'
              : 'glass-panel text-slate-200 rounded-tl-none border border-white/10 shadow-lg'
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

        {/* Audio Replay action for Agent messages */}
        {!isUser && onSpeak && (
          <div className="flex items-center gap-2 mt-1.5 px-1">
            <button
              onClick={() => onSpeak(message.content)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Read aloud</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
