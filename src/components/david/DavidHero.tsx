'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Play, Volume2, VolumeX, Mic, MicOff, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSimli } from './hooks/useSimli';
import { useDavidConvo } from './hooks/useDavidConvo';
import { useSpeechInput } from './hooks/useSpeechInput';
import { DavidVideo } from './DavidVideo';
import { DavidChat } from './DavidChat';

/**
 * DavidHero - Embedded avatar component for the hero section
 * Shows a preview of David with option to start conversation
 */
export default function DavidHero() {
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionText, setCaptionText] = useState('');
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
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

  const simli = useSimli();

  const convo = useDavidConvo({
    visitorId,
    sessionId,
    onResponse: useCallback(
      (text: string) => {
        setCaptionText(text);
        if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
        const duration = Math.min(15000, Math.max(4000, text.length * 60));
        captionTimerRef.current = setTimeout(() => setCaptionText(''), duration);
        if (simli.status === 'connected' || simli.status === 'speaking' || simli.status === 'silent') {
          simli.speak(text);
        }
      },
      [simli]
    ),
    onRateLimited: useCallback((msg: string) => {
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

  // Feed mic stream to Simli when both are active
  useEffect(() => {
    if (speech.micStream && (simli.status === 'connected' || simli.status === 'speaking')) {
      simli.listenToMicrophone(speech.micStream);
    }
  }, [speech.micStream, simli]);

  const handleStartConversation = async () => {
    setIsActive(true);
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
    }
  };

  const handleClose = () => {
    speech.stopListening();
    simli.disconnect();
    setIsActive(false);
    setCaptionText('');
  };

  const handleSendText = () => {
    if (!inputText.trim() || convo.isLoading) return;
    convo.sendMessage(inputText.trim());
    setInputText('');
  };

  const handleToggleMic = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  };

  const isVideoActive =
    simli.status === 'connected' || simli.status === 'speaking' || simli.status === 'silent';

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      <AnimatePresence mode="wait">
        {!isActive ? (
          /* Inactive state: Preview card */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Avatar preview image/placeholder */}
            <div className="aspect-[3/4] bg-gradient-to-b from-secondary-800 to-secondary-900 relative flex items-center justify-center">
              {/* Placeholder avatar graphic */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500/30 to-primary-600/20 flex items-center justify-center">
                  <MessageCircle size={48} className="text-primary-400" />
                </div>
              </div>
              
              {/* Online indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-white/80 font-medium">Online</span>
              </div>

              {/* Play button overlay */}
              <button
                onClick={handleStartConversation}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center shadow-glow-orange group-hover:scale-110 transition-transform">
                  <Play size={32} className="text-white ml-1" />
                </div>
              </button>
            </div>

            {/* Info bar */}
            <div className="p-4 bg-secondary-900/50 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <MessageCircle size={22} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">David</h3>
                  <p className="text-sm text-white/60">AI Equipment Specialist</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-white/50">
                Click to start a live conversation. Ask about inventory, get recommendations, or schedule a callback.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Active state: Live video */
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-secondary-900 rounded-3xl overflow-hidden shadow-2xl border border-secondary-700/50"
          >
            {/* Video container */}
            <div className="relative">
              <DavidVideo
                videoRef={simli.videoRef}
                audioRef={simli.audioRef}
                status={simli.status}
                micPermission={speech.micPermission}
                audioBlocked={simli.audioBlocked}
                onRetryAudio={simli.retryAudioPlayback}
                captionText={captionText}
                captionsEnabled={captionsEnabled}
                className="aspect-[3/4] rounded-none"
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm rounded-full text-white/70 hover:text-white hover:bg-black/60 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              {/* Online indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs text-white/80 font-medium">Live</span>
              </div>

              {/* Recent messages overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                {convo.messages.slice(-2).map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'text-sm mb-1 last:mb-0',
                      msg.role === 'assistant' ? 'text-white/90' : 'text-primary-300'
                    )}
                  >
                    <span className="font-medium">{msg.role === 'assistant' ? 'David: ' : 'You: '}</span>
                    {msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content}
                  </div>
                ))}
              </div>
            </div>

            {/* Input controls */}
            <div className="p-3 bg-secondary-800/80 backdrop-blur border-t border-secondary-700/50">
              <div className="flex gap-2">
                {speech.isSupported && (
                  <button
                    onClick={handleToggleMic}
                    className={cn(
                      'p-2.5 rounded-xl transition-colors',
                      speech.isListening
                        ? 'bg-primary-500 text-white'
                        : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                    )}
                    aria-label={speech.isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {speech.isListening ? (
                      <Mic size={18} className="animate-pulse" />
                    ) : (
                      <MicOff size={18} />
                    )}
                  </button>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
                  placeholder="Ask David anything..."
                  className="flex-1 px-4 py-2.5 bg-secondary-700 border border-secondary-600 rounded-xl text-sm text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors"
                  disabled={convo.isLoading}
                />
                <button
                  onClick={handleSendText}
                  disabled={!inputText.trim() || convo.isLoading}
                  className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
