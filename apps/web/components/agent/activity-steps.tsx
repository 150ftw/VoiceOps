'use client';

import React from 'react';
import { CheckCircle2, CircleDashed, AlertCircle, Clock, Terminal, ChevronRight, Activity } from 'lucide-react';
import { AgentActivityStep } from '@voiceops/shared';
import { cn } from '@/lib/utils';

interface ActivityStepsProps {
  steps: AgentActivityStep[];
}

export const ActivitySteps: React.FC<ActivityStepsProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-3xl bg-[#090E1A] border border-white/[0.08] shadow-2xl p-4 my-2 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
            Agent Tool Telemetry
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{steps.length} Steps</span>
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-2 font-mono text-[11px]">
        {steps.map((step, idx) => {
          const isRunning = step.status === 'running';
          const isCompleted = step.status === 'completed';
          const isFailed = step.status === 'failed';
          const isPending = step.status === 'pending';

          return (
            <div
              key={step.id || idx}
              className={cn(
                'flex items-start gap-2.5 p-2 rounded-xl border transition-all',
                isRunning
                  ? 'bg-cyan-500/[0.06] border-cyan-500/30 text-cyan-200'
                  : isCompleted
                  ? 'bg-white/[0.02] border-white/[0.04] text-slate-300'
                  : isFailed
                  ? 'bg-rose-500/[0.06] border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/[0.06] border-amber-500/30 text-amber-300'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isRunning && <CircleDashed className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {isFailed && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                {isPending && <Clock className="w-3.5 h-3.5 text-amber-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">
                    {step.label}
                  </span>
                  <span className="text-[9px] text-slate-500 shrink-0">
                    {isCompleted ? '✓ Done' : isRunning ? 'Running' : 'Pending'}
                  </span>
                </div>
                {step.detail && (
                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
