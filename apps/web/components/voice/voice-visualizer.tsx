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
  // Generate 20 dynamic audio equalizer bars
  const bars = Array.from({ length: 20 }).map((_, i) => {
    const time = Date.now() / 150;
    if (isRecording) {
      const dynamic = Math.sin(i * 0.4 + time) * 0.5 + 0.5;
      return Math.max(12, Math.min(100, (audioLevel * dynamic * 1.4) + 10));
    }
    if (isSpeaking) {
      const wave = Math.sin(i * 0.5 + time) * Math.cos(i * 0.2 + time);
      return Math.max(18, Math.abs(wave) * 85 + 15);
    }
    if (agentState === 'thinking' || agentState === 'executing_tool') {
      return Math.max(10, Math.sin(i * 0.6 + time * 1.5) * 35 + 35);
    }
    return 8;
  });

  const getStatusInfo = () => {
    if (isSpeaking) {
      return {
        label: 'Synthesizing Voice Output',
        color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
        badge: 'Speaking',
      };
    }
    if (agentState === 'thinking' || agentState === 'executing_tool') {
      return {
        label: 'Investigating Codebase & Tools',
        color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
        badge: 'Analyzing',
      };
    }
    if (isRecording) {
      return {
        label: 'Listening via Web Audio',
        color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
        badge: 'Recording',
      };
    }
    return {
      label: 'Studio Ready &bull; Click to Speak',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      badge: 'Online',
    };
  };

  const status = getStatusInfo();

  return (
    <div className="rounded-3xl bg-[#090E1A] border border-white/[0.08] shadow-2xl p-5 relative overflow-hidden flex flex-col justify-between select-none">
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
            VoiceOps Studio Engine
          </span>
        </div>
        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-mono border flex items-center gap-1.5', status.color)}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
          <span>{status.badge}</span>
        </span>
      </div>

      {/* Center Interactive Microphone Orb */}
      <div className="my-6 flex flex-col items-center justify-center relative">
        {/* Glowing background halo */}
        <div
          className={cn(
            'absolute w-44 h-44 rounded-full filter blur-3xl transition-all duration-700 pointer-events-none -z-10',
            isRecording
              ? 'bg-rose-600/30 scale-125'
              : isSpeaking
              ? 'bg-indigo-600/35 scale-125'
              : agentState === 'thinking'
              ? 'bg-cyan-600/25 scale-110'
              : 'bg-indigo-600/15'
          )}
        />

        {/* Concentric glowing rings */}
        {(isRecording || isSpeaking) && (
          <>
            <div className="absolute w-28 h-28 rounded-full border border-indigo-500/30 animate-ping pointer-events-none" />
            <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Main Glowing Action Button */}
        {isSpeaking ? (
          <button
            onClick={onInterrupt}
            className="w-20 h-20 rounded-2xl bg-rose-600 hover:bg-rose-500 flex flex-col items-center justify-center text-white shadow-xl glow-rose transition-all duration-200 group active:scale-95 border border-rose-400/40"
            title="Interrupt AI Speaking"
          >
            <Square className="w-6 h-6 fill-current transition-transform group-hover:scale-110" />
            <span className="text-[9px] font-mono uppercase tracking-wider mt-1 opacity-90">Stop</span>
          </button>
        ) : (
          <button
            onClick={onToggleRecord}
            className={cn(
              'w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-300 group active:scale-95 border',
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-400/50 glow-rose'
                : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 border-white/20 glow-indigo'
            )}
            title={isRecording ? 'Click to Finish Speaking' : 'Click to Speak'}
          >
            {isRecording ? (
              <>
                <MicOff className="w-7 h-7 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-mono uppercase tracking-wider mt-1 opacity-90">Mute</span>
              </>
            ) : (
              <>
                <Mic className="w-7 h-7 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-mono uppercase tracking-wider mt-1 opacity-90">Speak</span>
              </>
            )}
          </button>
        )}

        {/* Status line */}
        <p className="text-xs text-slate-300 font-medium mt-4 text-center">
          {isRecording
            ? 'Listening... Click to finish'
            : isSpeaking
            ? 'Speaking response...'
            : agentState === 'thinking'
            ? 'Investigating repository...'
            : 'Click microphone or type below'}
        </p>
      </div>

      {/* Audio Spectrum Graphic Visualizer */}
      <div className="pt-2 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-indigo-400" />
            <span>Audio Spectrum</span>
          </span>
          <span className="text-slate-500">
            {isRecording ? `Gain: ${audioLevel}%` : isSpeaking ? 'TTS Active' : '0.0 dB'}
          </span>
        </div>

        <div className="flex items-end justify-between gap-1 h-8 bg-slate-950/80 p-1.5 rounded-xl border border-white/[0.04]">
          {bars.map((h, idx) => (
            <div
              key={idx}
              style={{ height: `${h}%` }}
              className={cn(
                'flex-1 rounded-sm transition-all duration-75 min-h-[3px]',
                isRecording
                  ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                  : isSpeaking
                  ? 'bg-gradient-to-t from-indigo-600 via-indigo-400 to-cyan-400'
                  : agentState === 'thinking'
                  ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 animate-pulse'
                  : 'bg-slate-800/80'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
