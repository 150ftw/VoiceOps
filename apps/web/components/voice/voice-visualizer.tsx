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
  // Generate 24 dynamic audio equalizer bars
  const bars = Array.from({ length: 24 }).map((_, i) => {
    const time = Date.now() / 120;
    if (isRecording) {
      const dynamic = Math.sin(i * 0.35 + time) * 0.5 + 0.5;
      return Math.max(10, Math.min(100, (audioLevel * dynamic * 1.5) + 12));
    }
    if (isSpeaking) {
      const wave = Math.sin(i * 0.45 + time) * Math.cos(i * 0.25 + time);
      return Math.max(15, Math.abs(wave) * 80 + 20);
    }
    if (agentState === 'thinking' || agentState === 'executing_tool') {
      return Math.max(8, Math.sin(i * 0.5 + time * 1.2) * 30 + 30);
    }
    return 6;
  });

  const getStatusInfo = () => {
    if (isSpeaking) {
      return {
        label: 'Streaming Voice Feedback',
        badge: 'Speaking',
        badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        dotClass: 'bg-indigo-400 animate-ping',
      };
    }
    if (agentState === 'thinking' || agentState === 'executing_tool') {
      return {
        label: 'Investigating Codebase & Repos',
        badge: 'Reasoning',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        dotClass: 'bg-cyan-400 animate-pulse',
      };
    }
    if (isRecording) {
      return {
        label: 'Listening via Microphone',
        badge: 'Recording',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        dotClass: 'bg-rose-400 animate-ping',
      };
    }
    return {
      label: 'Studio Ready',
      badge: 'Online',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dotClass: 'bg-emerald-400',
    };
  };

  const status = getStatusInfo();

  return (
    <div className="rounded-3xl bg-[#080B14] border border-white/[0.07] shadow-2xl p-5 relative overflow-hidden flex flex-col justify-between select-none">
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300 uppercase">
            VoiceOps Voice Engine
          </span>
        </div>
        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-mono border flex items-center gap-1.5 font-medium', status.badgeClass)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', status.dotClass)} />
          <span>{status.badge}</span>
        </span>
      </div>

      {/* Organic Living AI Voice Core */}
      <div className="my-7 flex flex-col items-center justify-center relative">
        {/* Ambient Backlight Glow */}
        <div
          className={cn(
            'absolute w-40 h-40 rounded-full filter blur-3xl transition-all duration-700 pointer-events-none -z-10',
            isRecording
              ? 'bg-rose-500/25 scale-125'
              : isSpeaking
              ? 'bg-indigo-500/30 scale-125'
              : agentState === 'thinking'
              ? 'bg-cyan-500/25 scale-110'
              : 'bg-indigo-600/15'
          )}
        />

        {/* Concentric Pulsing Audio Waves */}
        {(isRecording || isSpeaking) && (
          <>
            <div className="absolute w-28 h-28 rounded-full border border-indigo-500/30 animate-ping pointer-events-none" />
            <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Main Action Button */}
        {isSpeaking ? (
          <button
            onClick={onInterrupt}
            className="w-20 h-20 rounded-3xl bg-rose-600 hover:bg-rose-500 flex flex-col items-center justify-center text-white shadow-xl glow-rose transition-all duration-200 group active:scale-95 border border-rose-400/40"
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
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-400/50 glow-rose'
                : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 border-white/20 glow-indigo'
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
        <p className="text-xs text-slate-300 font-medium mt-4 text-center tracking-tight">
          {status.label}
        </p>
      </div>

      {/* Audio Spectrum Graphic Visualizer */}
      <div className="pt-2 border-t border-white/[0.05] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-indigo-400" />
            <span>Audio Waveform</span>
          </span>
          <span className="text-slate-500">
            {isRecording ? `Gain: ${audioLevel}%` : isSpeaking ? 'TTS Streaming' : 'Ready'}
          </span>
        </div>

        <div className="flex items-end justify-between gap-1 h-8 bg-slate-950/90 p-1.5 rounded-xl border border-white/[0.03]">
          {bars.map((h, idx) => (
            <div
              key={idx}
              style={{ height: `${h}%` }}
              className={cn(
                'flex-1 rounded-sm transition-all duration-75 min-h-[2px]',
                isRecording
                  ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                  : isSpeaking
                  ? 'bg-gradient-to-t from-indigo-600 via-indigo-400 to-cyan-400'
                  : agentState === 'thinking'
                  ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 animate-pulse'
                  : 'bg-slate-800/60'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
