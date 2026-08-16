'use client';

import React from 'react';
import { Mic, MicOff, Volume2, Square, Sparkles } from 'lucide-react';
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
  interimTranscript,
  onToggleRecord,
  onInterrupt,
}) => {
  // Generate 14 responsive equalizer bars based on audioLevel
  const bars = Array.from({ length: 14 }).map((_, i) => {
    const heightPercent = isRecording
      ? Math.max(15, Math.min(100, (audioLevel * (1 + Math.sin(i + Date.now() / 200))) / 1.5))
      : isSpeaking
      ? Math.max(20, Math.sin(i * 0.8 + Date.now() / 300) * 80 + 20)
      : 8;
    return heightPercent;
  });

  const getStatusText = () => {
    if (isSpeaking) return 'VoiceOps is speaking...';
    if (agentState === 'thinking') return 'Investigating workflows & logs...';
    if (agentState === 'executing_tool') return 'Executing DevOps diagnostic tool...';
    if (isRecording) return 'Listening to you...';
    return 'Click microphone to speak';
  };

  const getStatusBadge = () => {
    if (isSpeaking) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium animate-pulse">
          <Volume2 className="w-3.5 h-3.5" />
          <span>Speaking</span>
        </div>
      );
    }
    if (agentState === 'thinking' || agentState === 'executing_tool') {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Analyzing</span>
        </div>
      );
    }
    if (isRecording) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Recording</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-400 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Ready</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl relative overflow-hidden text-center">
      {/* Background radial glow */}
      <div
        className={cn(
          'absolute w-64 h-64 rounded-full filter blur-3xl opacity-20 transition-all duration-700 pointer-events-none -z-10',
          isRecording ? 'bg-rose-500 opacity-30' : isSpeaking ? 'bg-indigo-500 opacity-40' : 'bg-indigo-600/30'
        )}
      />

      <div className="mb-4">{getStatusBadge()}</div>

      {/* Main Interactive Button with concentric pulsing ripples */}
      <div className="relative flex items-center justify-center my-2">
        {(isRecording || isSpeaking) && (
          <>
            <div className="absolute w-28 h-28 rounded-full border border-indigo-500/30 animate-pulse-ring pointer-events-none" />
            <div className="absolute w-36 h-36 rounded-full border border-indigo-500/20 animate-pulse-ring [animation-delay:0.5s] pointer-events-none" />
          </>
        )}

        {isSpeaking ? (
          <button
            onClick={onInterrupt}
            className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-lg glow-rose transition-all duration-200 group active:scale-95"
            title="Interrupt AI Speaking"
          >
            <Square className="w-7 h-7 fill-current transition-transform group-hover:scale-110" />
          </button>
        ) : (
          <button
            onClick={onToggleRecord}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 group active:scale-95',
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 glow-rose'
                : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 glow-indigo'
            )}
            title={isRecording ? 'Click to Finish Speaking' : 'Click to Speak'}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8 transition-transform group-hover:scale-110" />
            ) : (
              <Mic className="w-8 h-8 transition-transform group-hover:scale-110" />
            )}
          </button>
        )}
      </div>

      {/* Live Equalizer Waveform */}
      <div className="flex items-center gap-1.5 h-10 my-3">
        {bars.map((h, idx) => (
          <div
            key={idx}
            style={{ height: `${h}%` }}
            className={cn(
              'w-1.5 rounded-full transition-all duration-100',
              isRecording
                ? 'bg-rose-400'
                : isSpeaking
                ? 'bg-indigo-400'
                : agentState === 'thinking'
                ? 'bg-cyan-400'
                : 'bg-slate-700'
            )}
          />
        ))}
      </div>

      <p className="text-xs text-slate-300 font-medium mt-1 max-w-xs line-clamp-2 px-2">
        {getStatusText()}
      </p>
    </div>
  );
};
