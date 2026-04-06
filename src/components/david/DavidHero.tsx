'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useDavidConvo } from './hooks/useDavidConvo';
import { useSpeechInput } from './hooks/useSpeechInput';
import { DavidChat } from './DavidChat';

export function DavidHero() {
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

  const convo = useDavidConvo({
    visitorId,
    onResponse: useCallback((_text: string) => {
      // Future: could pipe to TTS here
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

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!input.trim() || convo.isLoading) return;
    convo.sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleMic = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
      className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] bg-secondary-900/80 backdrop-blur-md shadow-premium-xl h-full min-h-[480px]"
    >
      {/* ── Avatar / Header ── */}
      <div className="shrink-0 p-4 border-b border-white/[0.06] flex items-center gap-3 bg-white/[0.02]">
        {/* Circular avatar frame */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary-500/20 border-2 border-primary-500/40 flex items-center justify-center">
            <MessageCircle size={22} className="text-primary-400" />
          </div>
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-secondary-900" />
            </span>
          </span>
        </div>

        {/* Name + status */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">David</p>
          <p className="text-xs text-green-400 font-medium">Online · Equipment Specialist</p>
        </div>

        {/* 28 years badge */}
        <div className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
          <span className="text-[11px] text-secondary-400 font-medium">28 yrs experience</span>
        </div>
      </div>

      {/* ── Chat messages ── */}
      <DavidChat
        messages={convo.messages}
        isLoading={convo.isLoading}
        interimText={speech.interimText}
        className="flex-1 bg-transparent"
      />

      {/* ── Input bar ── */}
      <div className="shrink-0 p-3 border-t border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-2">
          {speech.isSupported && (
            <button
              onClick={handleToggleMic}
              className={cn(
                'p-2.5 rounded-xl transition-colors shrink-0',
                speech.isListening
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/[0.06] text-secondary-400 hover:bg-white/[0.10] hover:text-white'
              )}
              aria-label={speech.isListening ? 'Stop listening' : 'Start listening'}
            >
              {speech.isListening ? (
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
            placeholder="Ask David anything…"
            disabled={convo.isLoading}
            className="flex-1 px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || convo.isLoading}
            className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-secondary-600 mt-2 text-center">
          AI-powered · Replies instantly · 24/7
        </p>
      </div>
    </motion.div>
  );
}
