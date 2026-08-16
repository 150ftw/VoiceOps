'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Volume2, Key, Sliders, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [voiceModel, setVoiceModel] = useState('openai');
  const [sttProvider, setSttProvider] = useState('openai');

  useEffect(() => {
    async function loadMe() {
      try {
        const u = await apiRequest('/auth/me');
        setCurrentUser(u);
      } catch (_) {}
    }
    loadMe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Preferences & Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your account profile, AI provider choices, and voice synthesis settings.
        </p>
      </div>

      {/* Profile Section */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-400" />
          <span>User Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Full Name</label>
            <input
              type="text"
              readOnly
              value={currentUser?.full_name || 'Developer'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
            <input
              type="email"
              readOnly
              value={currentUser?.email || 'dev@voiceops.local'}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Voice Preferences */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <span>Voice Synthesis & Recognition Engine</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Speech-to-Text (STT) Provider</label>
            <select
              value={sttProvider}
              onChange={(e) => setSttProvider(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="openai">OpenAI Whisper-1 (High Accuracy)</option>
              <option value="deepgram">Deepgram Nova-2 (Ultra-Low Latency)</option>
              <option value="browser">Browser Native Web Speech API</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Text-to-Speech (TTS) Voice Model</label>
            <select
              value={voiceModel}
              onChange={(e) => setVoiceModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="openai">OpenAI TTS (Alloy)</option>
              <option value="elevenlabs">ElevenLabs Multilingual V1</option>
              <option value="browser">Browser SpeechSynthesis</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
