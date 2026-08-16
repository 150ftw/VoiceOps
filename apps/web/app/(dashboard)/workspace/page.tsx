'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  GitBranch,
  ShieldAlert,
  Send,
  Sparkles,
  Zap,
  Terminal,
  RefreshCw,
  Database,
  CheckCircle2,
  Loader2,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Conversation, Message, Project, Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';
import { useWebSocketConversation } from '@/hooks/use-websocket-conversation';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { VoiceVisualizer } from '@/components/voice/voice-visualizer';
import { ActivitySteps } from '@/components/agent/activity-steps';
import { ApprovalCard } from '@/components/approvals/approval-card';
import { MessageBubble } from '@/components/conversation/message-bubble';

const quickPrompts = [
  "What's this repo about?",
  "What's in index.html?",
  'Explain what app.js does',
  'What styles and colors are in styles.css?',
  'How do I run this locally?',
  'Why did the latest deployment fail?',
];

export default function VoiceWorkspacePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSyncingRepo, setIsSyncingRepo] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);

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

          // No projects — user needs to connect a repo from Projects page
          if (!projs || projs.length === 0) {
            projs = [];
          }

          if (projs && projs.length > 0) {
            const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            const targetProjId = urlParams?.get('project_id') || (typeof window !== 'undefined' ? localStorage.getItem('voiceops_active_project_id') : null);
            const currentProj = projs.find((p: any) => p.id === targetProjId) || projs[0];
            setProject(currentProj);

            // Get or create conversation
            const convs = await apiRequest(`/conversations?project_id=${currentProj.id}`).catch(() => []);
            let conv = convs && convs.length > 0 ? convs[0] : null;

            if (!conv) {
              conv = await apiRequest('/conversations', {
                method: 'POST',
                body: JSON.stringify({
                  project_id: currentProj.id,
                  title: `Investigation: ${currentProj.name}`,
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

  const {
    isConnected,
    agentState,
    activitySteps,
    pendingApproval,
    isSpeaking,
    sendTextMessage,
    sendInterrupt,
    respondToApproval,
    setPendingApproval,
    stopSpeech,
  } = useWebSocketConversation({
    conversationId: conversation?.id || null,
    onMessageReceived: (msg: Message) => {
      setMessages((prev) => {
        const existingIdx = prev.findIndex((m) => m.id === msg.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = msg;
          return updated;
        }
        return [...prev, msg];
      });
      if (msg.content) {
        handleSpeakAloud(msg.content);
      }
    },
  });

  const { isRecording, audioLevel, startRecording, stopRecording } = useVoiceRecorder({
    onSpeechRecognitionResult: (text: string) => {
      if (text) {
        setTextInput(text);
      }
    },
  });

  const handleSyncRepo = async () => {
    if (!project) return;
    setIsSyncingRepo(true);
    setSyncStatus(null);
    try {
      const result = await apiRequest(`/projects/${project.id}/sync-repo`, { method: 'POST' });
      if (result.success) {
        setSyncStatus(`Indexed ${result.files_indexed || 0} files (${result.chunks_created || 0} chunks)`);
        setTimeout(() => setSyncStatus(null), 5000);
      }
    } catch (err: any) {
      console.warn('Repo sync error:', err);
    } finally {
      setIsSyncingRepo(false);
    }
  };

  const handleClearChat = async () => {
    if (!conversation) return;
    setIsClearingChat(true);
    try {
      stopSpeech();
      await apiRequest(`/conversations/${conversation.id}/clear`, { method: 'POST' });
      setMessages([]);
      setPendingApproval(null);
    } catch (err) {
      console.warn('Clear chat error:', err);
      // Client-side fallback clear
      setMessages([]);
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      stopSpeech();
      startRecording();
    }
  };

  const handleSendText = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : textInput;
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Immediately clear chat input box synchronously
    setTextInput('');
    stopSpeech();

    // Optimistically append user message to UI
    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      conversation_id: conversation?.id || 'temp',
      sender_type: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    let sentViaWs = false;
    if (isConnected) {
      sentViaWs = sendTextMessage(trimmed);
    }

    if (!sentViaWs && conversation) {
      // Fallback REST call if WebSocket is connecting or disconnected
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
    <div className="max-w-7xl mx-auto h-[calc(100vh-5.5rem)] flex flex-col gap-3 font-sans antialiased">
      {/* Studio Top Context Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-[#080B14] border border-white/[0.07] shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-100 tracking-tight">
              {project?.name || 'No project selected'}
            </span>
          </div>
          <span className="text-slate-600 font-mono text-xs">&bull;</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <GitBranch className="w-3 h-3 text-slate-500" />
            <span className="text-slate-200 font-medium">
              {project?.repository?.repo_full_name || '— connect a repo'}
            </span>
            <span className="text-slate-600">({project?.default_branch || 'main'})</span>
          </div>
        </div>

        {/* Action Controls: Vector Status, Sync & Delete Chat */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>{syncStatus || 'pgvector Codebase Active'}</span>
          </div>

          <button
            onClick={handleSyncRepo}
            disabled={isSyncingRepo}
            className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Scan and re-index repository into pgvector"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRepo ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{isSyncingRepo ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={handleClearChat}
            disabled={isClearingChat || messages.length === 0}
            className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:hover:bg-white/[0.04] disabled:hover:text-slate-400"
            title="Delete conversation chat history"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isClearingChat ? 'animate-pulse text-rose-400' : 'text-slate-400'}`} />
            <span>{isClearingChat ? 'Deleting...' : 'Delete Chat'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Voice Visualizer, Telemetry & Guardrails (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-0.5">
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

          {/* Security Guardrail Card */}
          <div className="rounded-3xl bg-[#080B14] border border-white/[0.07] p-4 shadow-xl space-y-2 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                  Safety Guardrails
                </span>
              </div>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Enforced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Zero unauthorized writes. Issue creation, PRs, and workflow mutations require cryptographic developer approval.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Chat Stream & Approvals (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-3xl bg-[#06080F] border border-white/[0.07] overflow-hidden min-h-0 shadow-2xl">
          {/* Messages Stream Container */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
            {messages.length === 0 && !isLoadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-white tracking-tight">VoiceOps Studio Ready</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Repository ingested into vector memory. Ask anything about code files, UI components, dependencies, or CI/CD pipelines.
                  </p>
                </div>

                {/* Quick Prompts Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendText(prompt)}
                      className="p-3 text-left rounded-2xl bg-white/[0.02] hover:bg-indigo-500/10 border border-white/[0.04] hover:border-indigo-500/30 text-xs text-slate-300 transition-all flex items-center justify-between group"
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

                {/* Active Pending Approval Security Guardrail Card */}
                {pendingApproval && (
                  <div className="my-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <ApprovalCard
                      approval={pendingApproval}
                      onRespond={respondToApproval}
                    />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Suggestion Bar */}
          {messages.length > 0 && (
            <div className="px-5 py-2 bg-slate-950/70 border-t border-white/[0.04] flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400 no-scrollbar">
              <span className="shrink-0 font-mono text-[10px] uppercase text-slate-500">Suggested:</span>
              {quickPrompts.slice(0, 4).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendText(prompt)}
                  className="px-3 py-1 rounded-xl bg-white/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-white/[0.04] transition-all text-slate-300 shrink-0 whitespace-nowrap font-mono text-[11px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Command Palette Chat Input Bar */}
          <div className="p-3.5 bg-slate-950/90 border-t border-white/[0.06]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                placeholder="Ask about index.html, app.js logic, styles.css theme, or deployment runbooks..."
                className="w-full bg-[#090D17] border border-slate-800 focus:border-indigo-500/60 rounded-2xl pl-4 pr-14 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="absolute right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-600 shadow-md glow-indigo"
                title="Send message (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
