'use client';

import React from 'react';
import { Mic, MicOff, Volume2, Square, Sparkles, Activity, Radio, Cpu, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
  isRecording: boolean;
  audioLevel: number;
  agentState: 'idle' | 'thinking' | 'executing_tool' | 'speaking';
  isSpeaking: boolean;
  interimTranscript?: string;
  onToggleRecord: () => void;
  onInterrupt: () => void;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isRecording,
  audioLevel,
  agentState,
  isSpeaking,
  onToggleRecord,
  onInterrupt,
}) => {
  // Generate 28 dynamic audio equalizer bars for smooth spectrum visualization
  const bars = Array.from({ length: 28 }).map((_, i) => {
    const time = Date.now() / 150;
    if (isRecording) {
      const dynamic = Math.sin(i * 0.3 + time) * 0.5 + 0.5;
      return Math.max(12, Math.min(100, audioLevel * dynamic * 1.6 + 14));
    }
    if (isSpeaking) {
      const wave = Math.sin(i * 0.4 + time) * Math.cos(i * 0.2 + time);
      return Math.max(16, Math.abs(wave) * 85 + 18);
    }
    if (agentState === 'thinking' || agentState === 'executing_tool') {
      return Math.max(10, Math.sin(i * 0.45 + time * 1.5) * 35 + 35);
    }
    return 6;
  });

  const getStatusInfo = () => {
    if (isSpeaking) {
      return {
        label: 'Executing DevOps Actions & Code Stream',
        badge: 'Active Stream',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]',
        dotClass: 'bg-indigo-400 animate-ping',
      };
    }
    if (agentState === 'thinking' || agentState === 'executing_tool') {
      return {
        label: 'Deep AST & pgvector Reasoning',
        badge: 'Reasoning',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
        dotClass: 'bg-cyan-400 animate-pulse',
      };
    }
    if (isRecording) {
      return {
        label: 'Listening via Microphone...',
        badge: 'Live Audio',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
        dotClass: 'bg-rose-400 animate-ping',
      };
    }
    return {
      label: 'Voice Engine Active • Click to Speak',
      badge: 'Online',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-400',
    };
  };

  const status = getStatusInfo();

  return (
    <div className="rounded-3xl bg-[#080C16] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden flex flex-col justify-between select-none ring-1 ring-white/[0.02]">
      {/* Top Studio HUD Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[10.5px] font-mono font-bold tracking-wider text-slate-300 uppercase">
            VoiceOps Engine
          </span>
        </div>
        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-mono border flex items-center gap-1.5 font-medium transition-colors', status.badgeClass)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', status.dotClass)} />
          <span>{status.badge}</span>
        </span>
      </div>

      {/* Living Neural Voice Core */}
      <div className="my-6 flex flex-col items-center justify-center relative">
        {/* Ambient Backlight Glow */}
        <div
          className={cn(
            'absolute w-44 h-44 rounded-full filter blur-3xl transition-all duration-700 pointer-events-none -z-10',
            isRecording
              ? 'bg-rose-500/30 scale-125'
              : isSpeaking
              ? 'bg-indigo-500/35 scale-125'
              : agentState === 'thinking'
              ? 'bg-cyan-500/30 scale-110'
              : 'bg-indigo-600/15'
          )}
        />

        {/* Concentric Pulsing Audio Waves */}
        {(isRecording || isSpeaking) && (
          <>
            <div className="absolute w-28 h-28 rounded-full border border-indigo-500/40 animate-ping pointer-events-none" />
            <div className="absolute w-36 h-36 rounded-full border border-cyan-500/25 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Main Acoustic Interaction Orb Button */}
        {isSpeaking ? (
          <button
            onClick={onInterrupt}
            className="w-20 h-20 rounded-3xl bg-rose-600 hover:bg-rose-500 flex flex-col items-center justify-center text-white shadow-2xl glow-rose transition-all duration-200 group active:scale-95 border border-rose-400/50"
            title="Interrupt AI Speaking"
          >
            <Square className="w-6 h-6 fill-current transition-transform group-hover:scale-110" />
            <span className="text-[9px] font-mono uppercase tracking-wider mt-1 opacity-90 font-bold">Interrupt</span>
          </button>
        ) : (
          <button
            onClick={onToggleRecord}
            className={cn(
              'w-20 h-20 rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-300 group active:scale-95 border',
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-400/60 glow-rose scale-105'
                : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 border-white/20 glow-indigo'
            )}
            title={isRecording ? 'Click to Finish Speaking' : 'Click to Speak'}
          >
            {isRecording ? (
              <>
                <MicOff className="w-7 h-7 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-mono uppercase tracking-wider mt-1 opacity-90 font-bold">Mute</span>
              </>
            ) : (
              <>
                <Mic className="w-7 h-7 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-mono uppercase tracking-wider mt-1 opacity-90 font-bold">Speak</span>
              </>
            )}
          </button>
        )}

        {/* Status text */}
        <p className="text-[12px] text-slate-300 font-medium mt-3.5 text-center tracking-tight font-mono">
          {status.label}
        </p>
      </div>

      {/* Audio Spectrum Graphic Visualizer */}
      <div className="pt-2.5 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Neural Spectrum</span>
          </span>
          <span className="text-slate-500 text-[10px]">
            {isRecording ? `Gain: ${audioLevel}%` : isSpeaking ? 'TTS Streaming' : 'Ready'}
          </span>
        </div>

        <div className="flex items-end justify-between gap-1 h-7 bg-[#050811] p-1.5 rounded-xl border border-white/[0.04]">
          {bars.map((h, idx) => (
            <div
              key={idx}
              style={{ height: `${h}%` }}
              className={cn(
                'flex-1 rounded-sm transition-all duration-75 min-h-[3px]',
                isRecording
                  ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                  : isSpeaking
                  ? 'bg-gradient-to-t from-indigo-600 via-purple-400 to-cyan-400'
                  : agentState === 'thinking'
                  ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 animate-pulse'
                  : 'bg-slate-800/70'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
