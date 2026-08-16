'use client';

import React from 'react';
import { CheckCircle2, CircleDashed, AlertCircle, Clock } from 'lucide-react';
import { AgentActivityStep } from '@voiceops/shared';
import { cn } from '@/lib/utils';

interface ActivityStepsProps {
  steps: AgentActivityStep[];
}

export const ActivitySteps: React.FC<ActivityStepsProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="glass-panel p-4 rounded-xl border border-white/10 my-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Agent Live Activity
        </span>
      </div>

      <div className="space-y-2.5">
        {steps.map((step) => {
          const isRunning = step.status === 'running';
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';
          const isPending = step.status === 'pending';

          return (
            <div key={step.id} className="flex items-start gap-2.5 text-xs text-slate-300">
              <div className="mt-0.5 shrink-0">
                {isRunning && (
                  <CircleDashed className="w-4 h-4 text-cyan-400 animate-spin" />
                )}
                {isCompleted && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {isFailed && (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                {isPending && (
                  <Clock className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={cn(
                    isRunning && 'text-cyan-300 font-medium',
                    isCompleted && 'text-slate-300',
                    isFailed && 'text-rose-300',
                    isPending && 'text-amber-300'
                  )}
                >
                  {step.label}
                </span>
                {step.detail && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
