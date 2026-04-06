'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechInputOptions {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  language?: string;
}

export type MicPermission = 'unknown' | 'prompt' | 'granted' | 'denied';

interface UseSpeechInputReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  interimText: string;
  micStream: MediaStream | null;
  micPermission: MicPermission;
}

export function useSpeechInput({
  onTranscript,
  onInterimTranscript,
  language = 'en-US',
}: UseSpeechInputOptions): UseSpeechInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micPermission, setMicPermission] = useState<MicPermission>('unknown');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    // Detect microphone permission state
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          setMicPermission(result.state as MicPermission);
          result.addEventListener('change', () => {
            setMicPermission(result.state as MicPermission);
          });
        })
        .catch(() => {
          // permissions API not available for mic — leave as unknown
        });
    }
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Get microphone stream for Simli
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      setMicPermission('granted');
    } catch {
      console.warn('Microphone access denied');
      setMicPermission('denied');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
        onInterimTranscript?.(interim);
      }

      if (final) {
        setInterimText('');
        onTranscript(final);
      }
    };

    recognition.onerror = (event: any) => {      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [language, onTranscript, onInterimTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      rec.stop();
    }
    setIsListening(false);
    setInterimText('');

    // Stop mic stream
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      setMicStream(null);
    }
  }, [micStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    interimText,
    micStream,
    micPermission,
  };
}

// Web Speech API type declarations (not in all TS lib builds)
interface SpeechRecognitionResult {
  readonly results: { readonly [index: number]: { readonly [index: number]: { transcript: string } }; readonly length: number };
}

interface SpeechRecognitionError {
  readonly error: string;
  readonly message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResult) => void) | null;
  onerror: ((event: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
