'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Loader2,
  GitPullRequest,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { PendingApproval } from '@voiceops/shared';

interface ApprovalCardProps {
  approval: PendingApproval;
  onRespond: (approvalId: string, decision: 'approved' | 'rejected') => Promise<void> | void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ approval, onRespond }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionState, setDecisionState] = useState<'pending' | 'approved' | 'rejected'>(
    approval.status === 'approved' || approval.status === 'rejected' ? approval.status : 'pending'
  );
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      await onRespond(approval.id, decision);
      setDecisionState(decision);
      if (decision === 'approved') {
        const repo = approval.payload?.repository || 'voiceops/demo-app';
        setResultMessage(`Action successfully approved and executed in ${repo}.`);
      } else {
        setResultMessage('Action was cancelled by user.');
      }
    } catch (err: any) {
      console.error('Failed to submit approval decision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isIssue = approval.action_type === 'create_issue';
  const isPR = approval.action_type === 'create_pull_request';

  return (
    <div
      className={`p-5 rounded-2xl border shadow-xl my-3 backdrop-blur-md transition-all duration-300 ${
        decisionState === 'approved'
          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-500/5'
          : decisionState === 'rejected'
          ? 'bg-slate-900/40 border-slate-700/50'
          : 'bg-amber-950/20 border-amber-500/40 shadow-amber-500/5'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            decisionState === 'approved'
              ? 'bg-emerald-500/20 text-emerald-400'
              : decisionState === 'rejected'
              ? 'bg-slate-800 text-slate-400'
              : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {decisionState === 'approved' ? (
            <ShieldCheck className="w-6 h-6" />
          ) : (
            <ShieldAlert className="w-6 h-6" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                decisionState === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : decisionState === 'rejected'
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {decisionState === 'approved'
                ? 'Action Approved'
                : decisionState === 'rejected'
                ? 'Action Cancelled'
                : 'Approval Required'}
            </span>
            <span className="text-xs text-slate-400">Security Guardrail</span>
          </div>

          <h3 className="text-sm font-semibold text-slate-100 mt-1.5">{approval.description}</h3>

          {/* Action Payload Preview */}
          <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-white/5 text-xs text-slate-300 space-y-1.5 font-mono">
            {isIssue && (
              <>
                <div>
                  <span className="text-slate-500">Repository: </span>
                  <span className="text-indigo-300 font-semibold">{approval.payload?.repository}</span>
                </div>
                <div>
                  <span className="text-slate-500">Title: </span>
                  <span className="text-amber-200">{approval.payload?.title}</span>
                </div>
                {approval.payload?.labels && (
                  <div>
                    <span className="text-slate-500">Labels: </span>
                    <span className="text-slate-300">{approval.payload.labels.join(', ')}</span>
                  </div>
                )}
              </>
            )}

            {isPR && (
              <>
                <div>
                  <span className="text-slate-500">Branches: </span>
                  <span className="text-indigo-300 font-semibold">
                    {approval.payload?.head} &rarr; {approval.payload?.base}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Title: </span>
                  <span className="text-amber-200">{approval.payload?.title}</span>
                </div>
              </>
            )}
          </div>

          {/* Result / Decision State or Interactive Buttons */}
          {decisionState === 'approved' ? (
            <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{resultMessage || 'Action successfully executed and recorded in audit log.'}</span>
            </div>
          ) : decisionState === 'rejected' ? (
            <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs font-medium text-slate-400">
              <X className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{resultMessage || 'Action rejected. No changes were made.'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => handleDecision('rejected')}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                onClick={() => handleDecision('approved')}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>Approve & Execute</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
