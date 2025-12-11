import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

export interface LiveSessionState {
  isConnected: boolean;
  isAudioStreaming: boolean;
  error: string | null;
  volume: number; // For visualization 0-1
}

export const useLiveSession = () => {
  const [state, setState] = useState<LiveSessionState>({
    isConnected: false,
    isAudioStreaming: false,
    error: null,
    volume: 0,
  });

  // Refs for audio context and processing
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const volumeIntervalRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const cleanupAudio = useCallback(() => {
    // Stop all playing sources
    if (sourcesRef.current) {
      for (const source of sourcesRef.current) {
        try { source.stop(); } catch (e) {}
      }
      sourcesRef.current.clear();
    }

    // Disconnect inputs
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Close contexts
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
    }
    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
    }

    if (volumeIntervalRef.current) {
      window.clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    try {
      setState(s => ({ ...s, error: null }));

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup Input Processing
      inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      // Analyser for visualization
      analyserRef.current = inputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      inputSourceRef.current.connect(analyserRef.current);

      // Start volume meter
      volumeIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setState(s => ({ ...s, volume: avg / 255 }));
      }, 50);

      // Connect Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            setState(s => ({ ...s, isConnected: true, isAudioStreaming: true }));
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              console.log("Model interrupted");
              for (const source of sourcesRef.current) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Session Closed");
            setState(s => ({ ...s, isConnected: false, isAudioStreaming: false }));
            cleanupAudio();
          },
          onerror: (e) => {
            console.error("Session Error", e);
            setState(s => ({ ...s, error: "Connection error occurred" }));
            cleanupAudio();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a friendly and concise AI assistant. Keep responses short and conversational.',
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

      // Handle Input Streaming
      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromise.then(session => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      inputSourceRef.current.connect(processorRef.current);
      processorRef.current.connect(inputAudioContextRef.current.destination);

    } catch (err) {
      console.error("Failed to connect", err);
      setState(s => ({ ...s, error: (err as Error).message }));
      cleanupAudio();
    }
  }, [cleanupAudio]);

  const disconnect = useCallback(() => {
    // There is no explicit "close" on the session object exposed easily without the promise,
    // but we can stop sending audio and rely on cleanup. 
    // The library usually handles close if we drop the connection, but ideally we'd call session.close()
    // if we stored the resolved session.
    if (sessionPromiseRef.current) {
        // We can't cancel the promise easily, but we can stop processing.
        sessionPromiseRef.current.then(session => {
             // Try to close if method exists, otherwise just cleanup local
             // @ts-ignore
             if(session.close) session.close();
        });
    }
    cleanupAudio();
    setState(s => ({ ...s, isConnected: false, isAudioStreaming: false, volume: 0 }));
  }, [cleanupAudio]);

  return {
    ...state,
    connect,
    disconnect
  };
};
