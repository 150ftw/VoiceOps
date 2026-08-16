'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVoiceRecorderOptions {
  onAudioChunk?: (base64Data: string) => void;
  onInterimTranscript?: (text: string) => void;
  onSpeechRecognitionResult?: (text: string) => void;
}

export function useVoiceRecorder({
  onAudioChunk,
  onInterimTranscript,
  onSpeechRecognitionResult,
}: UseVoiceRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>('');

  const onInterimTranscriptRef = useRef(onInterimTranscript);
  const onSpeechRecognitionResultRef = useRef(onSpeechRecognitionResult);

  useEffect(() => {
    onInterimTranscriptRef.current = onInterimTranscript;
  }, [onInterimTranscript]);

  useEffect(() => {
    onSpeechRecognitionResultRef.current = onSpeechRecognitionResult;
  }, [onSpeechRecognitionResult]);

  // Initialize Web Speech Recognition if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              fullTranscriptRef.current += (fullTranscriptRef.current ? ' ' : '') + transcriptPiece.trim();
            } else {
              interim += transcriptPiece;
            }
          }
          const currentText = fullTranscriptRef.current + (interim ? (fullTranscriptRef.current ? ' ' : '') + interim : '');
          if (currentText && onInterimTranscriptRef.current) {
            onInterimTranscriptRef.current(currentText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
        };

        speechRecognitionRef.current = recognition;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      fullTranscriptRef.current = '';

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasPermission(true);

      // Web Audio Analyser for visualizer waveform
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();

      // MediaRecorder for audio chunks
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0 && onAudioChunk) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = (reader.result as string).split(',')[1];
            if (base64data) {
              onAudioChunk(base64data);
            }
          };
          reader.readAsDataURL(e.data);
        }
      };

      recorder.start(1000); // 1-second chunks
      setIsRecording(true);

      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
        } catch (_) {}
      }
    } catch (err) {
      console.error('Microphone access denied', err);
      setHasPermission(false);
      setIsRecording(false);
    }
  }, [onAudioChunk]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
    }

    setIsRecording(false);
    setAudioLevel(0);

    // Dispatch completed recognized text once upon stopping
    const finalResult = fullTranscriptRef.current;
    if (finalResult && finalResult.trim() && onSpeechRecognitionResultRef.current) {
      onSpeechRecognitionResultRef.current(finalResult.trim());
    }
    fullTranscriptRef.current = '';
  }, []);

  return {
    isRecording,
    audioLevel,
    hasPermission,
    startRecording,
    stopRecording,
  };
}
