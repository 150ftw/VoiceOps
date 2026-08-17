'use client';

import React, { useEffect, useState } from 'react';

const THINKING_STEPS = [
  'Triangulating',
  'Analyzing repository AST',
  'Synthesizing codebase context',
  'Indexing pgvector semantic memory',
  'Formulating response',
  'Reasoning',
];

export function ClaudeThinkingIndicator({ className = '' }: { className?: string }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentStepIdx((prev) => (prev + 1) % THINKING_STEPS.length);
        setIsFading(false);
      }, 300);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-3 py-3 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] w-fit animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>
      {/* Claude signature 8-petal terracotta sunburst / asterisk */}
      <div className="relative flex items-center justify-center w-6 h-6">
        {/* Ambient warm glow */}
        <div className="absolute inset-0 rounded-full bg-[#D97757]/20 blur-md animate-pulse" />
        
        <svg
          className="w-5 h-5 text-[#D97757] animate-[spin_8s_linear_infinite]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* 8-ray sunburst asterisk */}
          <line x1="12" y1="2" x2="12" y2="7" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="2" y1="12" x2="7" y2="12" />
          <line x1="17" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="4.93" x2="8.46" y2="8.46" />
          <line x1="15.54" y1="15.54" x2="19.07" y2="19.07" />
          <line x1="4.93" y1="19.07" x2="8.46" y2="15.54" />
          <line x1="15.54" y1="8.46" x2="19.07" y2="4.93" />
        </svg>
      </div>

      {/* Cycling Thoughtful Status Text */}
      <div className="flex items-center gap-1.5">
        <span
          className={`text-sm font-medium text-slate-300 tracking-tight transition-opacity duration-300 font-sans ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {THINKING_STEPS[currentStepIdx]}
        </span>
        <span className="flex gap-0.5 text-[#D97757] animate-pulse">
          <span className="inline-block w-1 h-1 rounded-full bg-[#D97757]" />
          <span className="inline-block w-1 h-1 rounded-full bg-[#D97757] animation-delay-200" />
          <span className="inline-block w-1 h-1 rounded-full bg-[#D97757] animation-delay-400" />
        </span>
      </div>
    </div>
  );
}
