'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SimliClient } from 'simli-client';
import { fetchSimliSession, fetchTTSAudio, type SimliStatus } from '@/lib/david/simli';

interface UseSimliReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  status: SimliStatus;
  connect: (visitorId?: string) => Promise<{ sessionId?: string } | void>;
  disconnect: () => void;
  speak: (text: string) => Promise<void>;
  listenToMicrophone: (stream: MediaStream) => void;
}

export function useSimli(): UseSimliReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clientRef = useRef<SimliClient | null>(null);
  const [status, setStatus] = useState<SimliStatus>('idle');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.stop();
        clientRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(async (visitorId?: string): Promise<{ sessionId?: string }> => {
    if (!videoRef.current || !audioRef.current) {
      throw new Error('Video/audio refs not attached');
    }

    setStatus('connecting');

    try {
      // Get session token and ICE servers from our backend
      const { sessionToken, sessionId, iceServers } = await fetchSimliSession(visitorId);

      // Create SimliClient with SDK
      const client = new SimliClient(
        sessionToken,
        videoRef.current,
        audioRef.current,
        iceServers,
      );

      // Wire up events
      client.on('start', () => setStatus('connected'));
      client.on('speaking', () => setStatus('speaking'));
      client.on('silent', () => setStatus('connected'));
      client.on('error', (detail) => {
        console.error('Simli error:', detail);
        setStatus('error');
      });
      client.on('stop', () => {
        setStatus('disconnected');
        clientRef.current = null;
      });

      clientRef.current = client;
      await client.start();
      return { sessionId };
    } catch (error) {
      console.error('Failed to connect Simli:', error);
      setStatus('error');
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stop();
      clientRef.current = null;
    }
    setStatus('idle');
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!clientRef.current) {
      console.warn('Simli client not connected, cannot speak');
      return;
    }

    try {
      // Get PCM audio from OpenAI TTS via our backend
      const audioData = await fetchTTSAudio(text);

      // Send audio to Simli for lip-sync rendering
      clientRef.current.sendAudioData(audioData);
    } catch (error) {
      console.error('TTS/speak error:', error);
    }
  }, []);

  const listenToMicrophone = useCallback((stream: MediaStream) => {
    if (!clientRef.current) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      clientRef.current.listenToMediastreamTrack(audioTrack);
    }
  }, []);

  return {
    videoRef,
    audioRef,
    status,
    connect,
    disconnect,
    speak,
    listenToMicrophone,
  };
}
