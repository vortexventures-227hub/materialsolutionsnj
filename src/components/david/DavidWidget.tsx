'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Maximize2, Minimize2, Mic, MicOff, Send } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSimli } from './hooks/useSimli';
import { useDavidConvo } from './hooks/useDavidConvo';
import { useSpeechInput } from './hooks/useSpeechInput';
import { DavidVideo } from './DavidVideo';
import { DavidChat } from './DavidChat';
import { DavidControls } from './DavidControls';

type WidgetMode = 'closed' | 'chat' | 'video' | 'expanded';

export default function DavidWidget() {
  const [mode, setMode] = useState<WidgetMode>('closed');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [rateLimited, setRateLimited] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionText, setCaptionText] = useState('');
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visitorId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('ms_visitor_id');
      if (!id) {
        id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('ms_visitor_id', id);
      }
      return id;
    }
    return `visitor_${Date.now()}`;
  });

  // Session timer
  const sessionStartRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const MAX_SESSION = 600; // 10 min
  const WARN_AT = 480; // 8 min
  const IDLE_TIMEOUT = 120; // 2 min idle

  // --- Hooks ---
  const simli = useSimli();

  const convo = useDavidConvo({
    visitorId,
    sessionId,
    onResponse: useCallback(
      (text: string) => {
        lastActivityRef.current = Date.now();
        // Set caption text for live subtitles
        setCaptionText(text);
        if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
        // Clear captions after a delay proportional to text length (min 4s, max 15s)
        const duration = Math.min(15000, Math.max(4000, text.length * 60));
        captionTimerRef.current = setTimeout(() => setCaptionText(''), duration);
        // When David responds, speak it through Simli if video is active
        if (simli.status === 'connected' || simli.status === 'speaking' || simli.status === 'silent') {
          simli.speak(text);
        }
      },
      [simli]
    ),
    onRateLimited: useCallback((msg: string) => {
      setRateLimited(true);
      console.warn('Rate limited:', msg);
    }, []),
  });

  const speech = useSpeechInput({
    onTranscript: useCallback(
      (text: string) => {
        convo.sendMessage(text);
      },
      [convo]
    ),
  });

  // --- Session timer + idle timeout ---
  useEffect(() => {
    if (mode === 'closed') {
      sessionStartRef.current = null;
      setSessionSeconds(0);
      setRateLimited(false);
      setSessionId(undefined);
      return;
    }

    if (!sessionStartRef.current) {
      sessionStartRef.current = Date.now();
      lastActivityRef.current = Date.now();
    }

    const interval = setInterval(() => {
      if (sessionStartRef.current) {
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        setSessionSeconds(elapsed);

        // Idle timeout: 2 min of no activity
        const idleSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
        if (idleSeconds >= IDLE_TIMEOUT && elapsed > 30) { // Don't idle-close in first 30s
          convo.addSystemMessage(
            "Looks like you stepped away. Feel free to come back anytime! Call (973) 500-1010 if you need us."
          );
          handleClose();
          return;
        }

        // 8 min warning
        if (elapsed === WARN_AT) {
          convo.addSystemMessage(
            "Just a heads up — I want to make sure we cover everything before I wrap up. Anything else I can help with?"
          );
        }

        // 10 min hard stop
        if (elapsed >= MAX_SESSION) {
          convo.addSystemMessage(
            "I've really enjoyed chatting! Bill will follow up with you. Call us anytime at (973) 500-1010."
          );
          handleClose();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Feed mic stream to Simli when both are active
  useEffect(() => {
    if (speech.micStream && (simli.status === 'connected' || simli.status === 'speaking')) {
      simli.listenToMicrophone(speech.micStream);
    }
  }, [speech.micStream, simli]);

  // Listen for external open requests (e.g. "Chat with David" hero button)
  useEffect(() => {
    const onOpen = () => { if (mode === 'closed') setMode('chat'); };
    window.addEventListener('david:open', onOpen);
    return () => window.removeEventListener('david:open', onOpen);
  }, [mode]);

  // --- Actions ---
  const handleOpen = () => {
    setMode('chat');
  };

  const handleStartVideo = async () => {
    setMode('video');
    try {
      const session = await simli.connect(visitorId);
      if (session?.sessionId) {
        setSessionId(session.sessionId);
      }
      // Send greeting through avatar
      const greetingMsg = convo.messages[0];
      if (greetingMsg?.role === 'assistant') {
        simli.speak(greetingMsg.content);
      }
    } catch (err) {
      console.error('Failed to start video:', err);
      // Fall back to chat mode
      setMode('chat');
    }
  };

  const handleToggleVideo = () => {
    const isVideoActive =
      simli.status === 'connected' || simli.status === 'speaking' || simli.status === 'silent';
    if (isVideoActive) {
      simli.disconnect();
      setMode('chat');
    } else {
      handleStartVideo();
    }
  };

  const handleToggleMic = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  };

  const handleSendText = (text: string) => {
    lastActivityRef.current = Date.now();
    convo.sendMessage(text);
  };

  const handleClose = () => {
    speech.stopListening();
    simli.disconnect();
    setMode('closed');
  };

  const handleToggleExpand = () => {
    setMode((prev) => (prev === 'expanded' ? 'video' : 'expanded'));
  };

  const isVideoActive =
    simli.status === 'connected' || simli.status === 'speaking' || simli.status === 'silent';

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* --- Floating trigger button --- */}
      <AnimatePresence>
        {mode === 'closed' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 bg-primary-500 text-white p-4 rounded-2xl shadow-glow-orange hover:bg-primary-600 hover:shadow-glow-orange-lg transition-all duration-200 group"
            aria-label="Talk to David"
          >
            <MessageCircle size={26} />
            {/* Online indicator */}
            <span className="absolute -top-1 -right-1">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
              </span>
            </span>
            {/* Tooltip */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-secondary-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              Talk to David
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-secondary-900" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- Chat-only mode (no video) --- */}
      <AnimatePresence>
        {mode === 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] h-[100dvh] sm:h-[600px] sm:max-h-[80vh] bg-white sm:rounded-2xl shadow-premium-xl flex flex-col overflow-hidden sm:border border-secondary-200"
          >
            {/* Header */}
            <div className="gradient-primary text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">David</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <p className="text-xs text-white/70">Equipment Specialist</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Upgrade to video */}
                <button
                  onClick={handleStartVideo}
                  className="p-1.5 hover:bg-white/15 rounded-lg transition-colors text-xs flex items-center gap-1"
                  title="Start video call with David"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <DavidChat
              messages={convo.messages}
              isLoading={convo.isLoading}
              interimText={speech.interimText}
            />

            {/* Mic permission notice */}
            {speech.micPermission === 'denied' && (
              <div className="mx-3 mb-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 leading-relaxed">
                <p className="font-semibold">Microphone blocked</p>
                <p>
                  To talk to David, click the lock icon in your address bar and allow microphone access.
                  You can still type below!
                </p>
              </div>
            )}

            {/* Text input */}
            <ChatInput
              onSend={handleSendText}
              isLoading={convo.isLoading}
              isSpeechSupported={speech.isSupported}
              isListening={speech.isListening}
              onToggleMic={handleToggleMic}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Video mode --- */}
      <AnimatePresence>
        {(mode === 'video' || mode === 'expanded') && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'fixed z-50 bg-secondary-900 shadow-premium-xl flex flex-col overflow-hidden',
              mode === 'expanded'
                ? 'bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-[520px] h-[100dvh] sm:h-[85vh] sm:max-h-[900px] sm:rounded-2xl sm:border border-secondary-700/50'
                : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[640px] sm:max-h-[85vh] sm:rounded-2xl sm:border border-secondary-700/50'
            )}
          >
            {/* Video area */}
            <div className="relative flex-shrink-0">
              <DavidVideo
                videoRef={simli.videoRef}
                audioRef={simli.audioRef}
                status={simli.status}
                micPermission={speech.micPermission}
                audioBlocked={simli.audioBlocked}
                onRetryAudio={simli.retryAudioPlayback}
                captionText={captionText}
                captionsEnabled={captionsEnabled}
                className={cn(
                  'rounded-none',
                  mode === 'expanded' ? 'aspect-[4/3]' : 'aspect-[3/4] max-h-[340px]'
                )}
              />

              {/* Overlay controls: expand + timer */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {sessionSeconds > 0 && (
                  <div
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-mono backdrop-blur-sm',
                      sessionSeconds >= WARN_AT
                        ? 'bg-red-500/30 text-red-300'
                        : 'bg-black/30 text-white/70'
                    )}
                  >
                    {formatTime(sessionSeconds)} / {formatTime(MAX_SESSION)}
                  </div>
                )}
                <button
                  onClick={handleToggleExpand}
                  className="p-1.5 bg-black/30 backdrop-blur-sm rounded-lg text-white/70 hover:text-white hover:bg-black/50 transition-colors"
                  aria-label={mode === 'expanded' ? 'Minimize' : 'Expand'}
                >
                  {mode === 'expanded' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>

              {/* Chat transcript overlay on video */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-secondary-900/90 to-transparent pt-8">
                <DavidChat
                  messages={convo.messages}
                  isLoading={convo.isLoading}
                  interimText={speech.interimText}
                  compact
                />
              </div>
            </div>

            {/* Expanded mode: full chat below video */}
            {mode === 'expanded' && (
              <DavidChat
                messages={convo.messages}
                isLoading={convo.isLoading}
                interimText={speech.interimText}
                className="border-t border-secondary-700/50"
              />
            )}

            {/* Controls */}
            <div className="mt-auto">
              <DavidControls
                isVideoActive={isVideoActive}
                isListening={speech.isListening}
                isSpeechSupported={speech.isSupported}
                isLoading={convo.isLoading}
                onToggleVideo={handleToggleVideo}
                onToggleMic={handleToggleMic}
                onSendMessage={handleSendText}
                onClose={handleClose}
                captionsEnabled={captionsEnabled}
                onToggleCaptions={() => setCaptionsEnabled((prev) => !prev)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Inline sub-component: text input bar for chat-only mode ---

function ChatInput({
  onSend,
  isLoading,
  isSpeechSupported,
  isListening,
  onToggleMic,
}: {
  onSend: (text: string) => void;
  isLoading: boolean;
  isSpeechSupported: boolean;
  isListening: boolean;
  onToggleMic: () => void;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-white border-t border-secondary-100 shrink-0">
      <div className="flex gap-2">
        {isSpeechSupported && (
          <button
            onClick={onToggleMic}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              isListening
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-500 hover:bg-secondary-200'
            )}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <Mic size={16} className="animate-pulse" />
            ) : (
              <MicOff size={16} />
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask David anything..."
          className="flex-1 px-4 py-2.5 border border-secondary-200 rounded-xl text-sm placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-[10px] text-secondary-400 mt-2 text-center">
        AI Equipment Specialist &middot; Replies instantly
      </p>
    </div>
  );
}
