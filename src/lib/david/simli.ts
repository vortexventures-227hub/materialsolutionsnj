// Simli AI Integration — David Avatar Live Video Streaming
// Uses simli-client SDK for WebRTC avatar connection

export const SIMLI_CONFIG = {
  faceId: process.env.NEXT_PUBLIC_SIMLI_FACE_ID || '80d84fc6-e2e3-4a09-8259-30ecede1a41f',
  maxSessionLength: 600, // 10 minutes
  maxIdleTime: 120,      // 2 minutes idle timeout
  handleSilence: true,
};

export type SimliStatus = 'idle' | 'connecting' | 'connected' | 'speaking' | 'silent' | 'error' | 'disconnected';

export interface SimliSessionData {
  sessionToken: string;
  sessionId: string;
  iceServers: RTCIceServer[];
  expiresIn: number;
}

// Fetch session token + ICE servers from our backend
export async function fetchSimliSession(visitorId?: string): Promise<SimliSessionData> {
  const response = await fetch('/api/david/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create Simli session');
  }

  return response.json();
}

// Fetch TTS audio from our backend (OpenAI onyx voice)
// Returns PCM audio data for Simli lip-sync
export async function fetchTTSAudio(text: string): Promise<Uint8Array> {
  const response = await fetch('/api/david/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate TTS audio');
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}
