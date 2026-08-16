'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  GitBranch,
  Send,
  Sparkles,
  RefreshCw,
  Zap,
  Terminal,
  ExternalLink,
  ChevronDown,
  Mic,
} from 'lucide-react';
import { Conversation, Message, Project } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useWebSocketConversation } from '@/hooks/use-websocket-conversation';
import { VoiceVisualizer } from '@/components/voice/voice-visualizer';
import { ActivitySteps } from '@/components/agent/activity-steps';
import { ApprovalCard } from '@/components/approvals/approval-card';
import { MessageBubble } from '@/components/conversation/message-bubble';

const quickPrompts = [
  'Why did the latest deployment fail?',
  'What changed between the last successful and failed build?',
  'Search docs for deployment configuration',
  'Can you open a GitHub issue for this bug?',
];

export default function VoiceWorkspacePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load active project & conversation
  useEffect(() => {
    async function initWorkspace() {
      setIsLoadingHistory(true);
      try {
        const user = await apiRequest('/auth/me');
        if (user.workspaces && user.workspaces.length > 0) {
          const ws = user.workspaces[0];
          let projs = await apiRequest(`/projects?workspace_id=${ws.id}`).catch(() => []);

          // Auto-provision starter project if empty
          if (!projs || projs.length === 0) {
            const newProj = await apiRequest('/projects', {
              method: 'POST',
              body: JSON.stringify({
                workspace_id: ws.id,
                name: 'Production DevOps Service',
                slug: `prod-devops-${Date.now().toString(36)}`,
                description: 'Starter DevOps investigation repository',
                default_branch: 'main',
                repository_full_name: 'voiceops/demo-app',
                github_repo_id: 123456,
              }),
            }).catch(() => null);

            if (newProj) {
              projs = [newProj];
            }
          }

          if (projs && projs.length > 0) {
            const currentProj = projs[0];
            setProject(currentProj);

            // Get or create conversation
            const convs = await apiRequest(`/conversations?project_id=${currentProj.id}`).catch(() => []);
            let conv = convs && convs.length > 0 ? convs[0] : null;

            if (!conv) {
              conv = await apiRequest('/conversations', {
                method: 'POST',
                body: JSON.stringify({
                  project_id: currentProj.id,
                  title: 'DevOps CI/CD Investigation',
                }),
              }).catch(() => null);
            }

            if (conv) {
              setConversation(conv);

              // Load full conversation details & messages
              const fullConv = await apiRequest(`/conversations/${conv.id}`).catch(() => null);
              if (fullConv?.messages) {
                setMessages(fullConv.messages);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Workspace init fallback', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    initWorkspace();
  }, []);

  // WebSocket Live Hook
  const {
    isConnected,
    agentState,
    activitySteps,
    pendingApproval,
    setPendingApproval,
    isSpeaking,
    sendTextMessage,
    sendAudioChunk,
    sendAudioFinal,
    sendInterrupt,
    respondToApproval,
    stopSpeech,
  } = useWebSocketConversation({
    conversationId: conversation?.id || null,
    onMessageReceived: (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    },
  });

  // Voice Recording Hook: streams live recognized speech directly into textInput chatbox
  const { isRecording, audioLevel, startRecording, stopRecording } = useVoiceRecorder({
    onAudioChunk: (b64Data) => {
      sendAudioChunk(b64Data);
    },
    onInterimTranscript: (liveWords) => {
      setTextInput(liveWords);
    },
    onSpeechRecognitionResult: (recognizedText) => {
      setTextInput(recognizedText);
      handleSendText(recognizedText);
    },
  });

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
      sendAudioFinal();
    } else {
      startRecording();
    }
  };

  const handleSendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation?.id || '',
      sender_type: 'user',
      content: trimmed,
      metadata_json: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    if (isConnected) {
      sendTextMessage(trimmed);
    } else if (conversation) {
      // Fallback REST call if WebSocket is connecting
      try {
        const result = await apiRequest(`/conversations/${conversation.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content: trimmed }),
        });
        if (result?.content) {
          const tempAgentMsg: Message = {
            id: result.message_id || `temp-agent-${Date.now()}`,
            conversation_id: conversation.id,
            sender_type: 'agent',
            content: result.content,
            metadata_json: {
              sources: result.citations || [],
              pending_approval: result.pending_approval || undefined,
            },
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, tempAgentMsg]);
          if (result.pending_approval) {
            setPendingApproval(result.pending_approval);
          }
          handleSpeakAloud(result.content);
        }
      } catch (err) {
        console.error('REST fallback message error:', err);
      }
    }
    setTextInput('');
  };

  const handleSpeakAloud = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      stopSpeech();
      const clean = text.replace(/[*#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* Top Project Status Bar */}
      <div className="flex items-center justify-between px-5 py-3 rounded-2xl glass-panel border border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-100">{project?.name || 'Production DevOps Service'}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1.5 ${
                isConnected 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isConnected ? 'Voice Agent Live' : 'Connecting WebSocket...'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <GitBranch className="w-3 h-3 text-slate-500" />
              <span className="text-slate-300 font-medium">
                {project?.repository?.repo_full_name || 'voiceops/demo-app'}
              </span>
              <span className="text-slate-600">&bull;</span>
              <span>branch: {project?.default_branch || 'main'}</span>
              <span className="text-slate-600">&bull;</span>
              <Link href="/projects" className="text-indigo-400 hover:text-indigo-300 underline font-sans text-[10px]">
                Switch Repo
              </Link>
            </p>
          </div>
        </div>

        {/* Quick Capabilities Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time CI/CD Investigation</span>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left Column: Voice Visualizer & Agent Steps (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
          {/* Voice Interface Centerpiece */}
          <VoiceVisualizer
            isRecording={isRecording}
            audioLevel={audioLevel}
            agentState={agentState}
            isSpeaking={isSpeaking}
            onToggleRecord={handleToggleRecord}
            onInterrupt={sendInterrupt}
          />

          {/* Real-Time Agent Activity Tree */}
          <ActivitySteps steps={activitySteps} />
        </div>

        {/* Right Column: Interactive Chat Stream & Approvals (8 cols) */}
        <div className="lg:col-span-8 flex flex-col glass-panel rounded-3xl border border-white/10 overflow-hidden min-h-0 shadow-2xl">
          {/* Messages Stream Container */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.length === 0 && !isLoadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-white">VoiceOps Ready to Assist</h3>
                  <p className="text-xs text-slate-400">
                    Click the glowing microphone button or select a prompt below to investigate your GitHub Actions pipeline.
                  </p>
                </div>

                {/* Quick Prompts Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendText(prompt)}
                      className="p-3 text-left rounded-xl bg-white/[0.02] hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 text-xs text-slate-300 transition-all flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">{prompt}</span>
                      <Zap className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onSpeak={handleSpeakAloud}
                    onRespondApproval={respondToApproval}
                  />
                ))}
                {pendingApproval && (
                  <ApprovalCard
                    approval={pendingApproval}
                    onRespond={respondToApproval}
                  />
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Prompts Bar (when messages exist) */}
          {messages.length > 0 && (
            <div className="px-4 py-2 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider shrink-0">
                Suggested:
              </span>
              {quickPrompts.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendText(prompt)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Text Input / Command Box */}
          <div className="p-4 border-t border-white/10 bg-slate-950/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText(textInput);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                {isRecording && (
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 text-rose-400 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                )}
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    isRecording
                      ? 'Listening... speaking will type directly here...'
                      : 'Ask about failed workflow runs, error logs, or deployment runbooks...'
                  }
                  className={`w-full bg-slate-900/90 border rounded-xl py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                    isRecording
                      ? 'pl-10 pr-4 border-rose-500/50 shadow-md shadow-rose-500/10 focus:border-rose-400'
                      : 'px-4 border-slate-800 focus:border-indigo-500'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 shadow-lg glow-indigo transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
