'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

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
    <div
      className={`flex items-center gap-3 py-2.5 px-4 rounded-2xl bg-[#130B24]/80 border border-purple-500/25 backdrop-blur-md shadow-[0_0_25px_rgba(168,85,247,0.15)] w-fit animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}
    >
      {/* Animated Brand Logo Container */}
      <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
        {/* Soft glowing purple radial aura */}
        <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-md animate-pulse" />
        
        {/* Rotating subtle outer ring */}
        <div className="absolute -inset-0.5 rounded-full border border-purple-400/30 border-t-purple-400 animate-[spin_3s_linear_infinite]" />

        {/* User Logo with gentle breathing pulse animation */}
        <div className="relative w-5 h-5 rounded-full overflow-hidden flex items-center justify-center animate-[bounce_2.5s_ease-in-out_infinite]">
          <Image
            src="/logo.png"
            alt="VoiceOps Logo"
            width={20}
            height={20}
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
            priority
          />
        </div>
      </div>

      {/* Cycling Thoughtful Status Text with Purple Palette */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs sm:text-sm font-medium text-purple-200/90 tracking-tight transition-opacity duration-300 font-sans ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {THINKING_STEPS[currentStepIdx]}
        </span>
        <span className="flex gap-1 text-purple-400">
          <span className="inline-block w-1 h-1 rounded-full bg-purple-400 animate-bounce" />
          <span className="inline-block w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
          <span className="inline-block w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
        </span>
      </div>
    </div>
  );
}
