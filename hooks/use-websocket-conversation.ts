'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AgentActivityStep, CitationSource, Message, PendingApproval } from '@voiceops/shared';
import { apiRequest, getAuthToken } from '@/lib/api-client';

interface UseWebSocketConversationOptions {
  conversationId: string | null;
  onMessageReceived?: (message: Message) => void;
}

export function useWebSocketConversation({
  conversationId,
  onMessageReceived,
}: UseWebSocketConversationOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [agentState, setAgentState] = useState<'idle' | 'thinking' | 'executing_tool' | 'speaking'>('idle');
  const [activitySteps, setActivitySteps] = useState<AgentActivityStep[]>([]);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [currentSources, setCurrentSources] = useState<CitationSource[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const onMessageReceivedRef = useRef(onMessageReceived);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingApprovalRef = useRef(pendingApproval);

  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    pendingApprovalRef.current = pendingApproval;
  }, [pendingApproval]);

  // Stop / Cancel audio playback on client
  const stopSpeech = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const sendInterrupt = useCallback(() => {
    stopSpeech();
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'user.interrupt' }));
    }
    setAgentState('idle');
  }, [stopSpeech]);

  // Stable WebSocket connection manager with auto-reconnect
  useEffect(() => {
    if (!conversationId) {
      setIsConnected(false);
      return;
    }

    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;

      const token = getAuthToken();
      const envWs = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      const cleanWs = envWs.endsWith('/') ? envWs.slice(0, -1) : envWs;
      const baseWs = cleanWs.endsWith('/ws/v1') ? cleanWs.slice(0, -6) : cleanWs;
      const wsUrl = `${baseWs}/ws/v1/conversations/${conversationId}${token ? `?token=${token}` : ''}`;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isUnmounted) {
            setIsConnected(true);
            console.log('VoiceOps WebSocket connected for conversation:', conversationId);
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setIsConnected(false);
            console.log('VoiceOps WebSocket disconnected, scheduling reconnect...');
            // Auto reconnect after 2 seconds
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isUnmounted) {
                connectWebSocket();
              }
            }, 2000);
          }
        };

        ws.onerror = (err) => {
          console.warn('VoiceOps WebSocket warning:', err);
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const msg = JSON.parse(event.data);

            switch (msg.type) {
              case 'agent.state.changed':
                setAgentState(msg.state);
                if (msg.state === 'idle') {
                  setIsSpeaking(false);
                }
                break;

              case 'agent.activity.step':
                setActivitySteps((prev) => {
                  const existingIdx = prev.findIndex((s) => s.id === msg.id);
                  if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = { ...updated[existingIdx], ...msg };
                    return updated;
                  }
                  return [...prev, msg];
                });
                break;

              case 'agent.approval.required':
                setPendingApproval({
                  id: msg.approval_id,
                  action_type: msg.action_type,
                  description: msg.description,
                  payload: msg.payload,
                  status: 'pending',
                });
                break;

              case 'agent.approval.resolved':
                setPendingApproval(null);
                break;

              case 'agent.sources':
                if (msg.sources) {
                  setCurrentSources(msg.sources);
                }
                break;

              case 'agent.response.completed':
                if (onMessageReceivedRef.current) {
                  onMessageReceivedRef.current({
                    id: msg.message_id || `agent-${Date.now()}`,
                    conversation_id: conversationId,
                    sender_type: 'agent',
                    content: msg.text,
                    created_at: new Date().toISOString(),
                    metadata: {
                      sources: msg.sources || [],
                      pending_approval: pendingApprovalRef.current || undefined,
                    },
                  });
                }
                break;

              case 'agent.audio.chunk':
                // Silent mode: AI responds visually in chat without synthesized audio
                setIsSpeaking(false);
                break;

              default:
                break;
            }
          } catch (err) {
            console.error('Failed to parse WebSocket packet', err);
          }
        };
      } catch (wsErr) {
        console.error('Failed to initialize WebSocket', wsErr);
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
          socketRef.current.close();
        }
        socketRef.current = null;
      }
    };
  }, [conversationId]);

  const sendTextMessage = useCallback((content: string): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setActivitySteps([]);
      setCurrentSources([]);
      socketRef.current.send(JSON.stringify({ type: 'user.text.message', content }));
      return true;
    }
    return false;
  }, []);

  const sendAudioChunk = useCallback((base64Data: string): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'user.audio.chunk', data: base64Data }));
      return true;
    }
    return false;
  }, []);

  const sendAudioFinal = useCallback((): boolean => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setActivitySteps([]);
      setCurrentSources([]);
      socketRef.current.send(JSON.stringify({ type: 'user.audio.final' }));
      return true;
    }
    return false;
  }, []);

  const respondToApproval = useCallback(async (approvalId: string, decision: 'approved' | 'rejected') => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'user.approval.response',
          approval_id: approvalId,
          decision,
        })
      );
    } else {
      // Fallback REST endpoint for approval
      try {
        await apiRequest(`/approvals/${approvalId}/respond`, {
          method: 'POST',
          body: JSON.stringify({ decision }),
        });
        setPendingApproval(null);
      } catch (err) {
        console.error('Failed to submit approval via REST', err);
      }
    }
  }, []);

  return {
    isConnected,
    agentState,
    activitySteps,
    pendingApproval,
    currentSources,
    isSpeaking,
    sendTextMessage,
    sendAudioChunk,
    sendAudioFinal,
    sendInterrupt,
    respondToApproval,
    setPendingApproval,
    stopSpeech,
  };
}
