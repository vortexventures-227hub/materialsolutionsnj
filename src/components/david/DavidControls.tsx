'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X, Keyboard, Video, VideoOff, Subtitles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DavidControlsProps {
  /** Is Simli video currently active */
  isVideoActive: boolean;
  /** Is speech recognition listening */
  isListening: boolean;
  /** Is speech recognition supported */
  isSpeechSupported: boolean;
  /** Is message loading */
  isLoading: boolean;
  /** Toggle video on/off */
  onToggleVideo: () => void;
  /** Toggle mic on/off */
  onToggleMic: () => void;
  /** Send text message */
  onSendMessage: (text: string) => void;
  /** Close the widget */
  onClose: () => void;
  /** Whether captions are enabled */
  captionsEnabled?: boolean;
  /** Toggle captions on/off */
  onToggleCaptions?: () => void;
  className?: string;
}

export function DavidControls({
  isVideoActive,
  isListening,
  isSpeechSupported,
  isLoading,
  onToggleVideo,
  onToggleMic,
  onSendMessage,
  onClose,
  captionsEnabled,
  onToggleCaptions,
  className,
}: DavidControlsProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showTextInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showTextInput]);

  const handleSend = () => {
    if (!textInput.trim() || isLoading) return;
    onSendMessage(textInput.trim());
    setTextInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setShowTextInput(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Text input bar */}
      <AnimatePresence>
        {showTextInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 px-3 pb-1">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-secondary-800/80 border border-secondary-600/50 rounded-xl text-sm text-white placeholder:text-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50 backdrop-blur-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!textInput.trim() || isLoading}
                className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control buttons row */}
      <div className="flex items-center justify-center gap-3 px-3 py-2">
        {/* Video toggle */}
        <button
          onClick={onToggleVideo}
          className={cn(
            'p-3 rounded-full transition-all duration-200',
            isVideoActive
              ? 'bg-secondary-700/80 text-white hover:bg-secondary-600/80'
              : 'bg-secondary-800/80 text-secondary-400 hover:bg-secondary-700/80 hover:text-white'
          )}
          aria-label={isVideoActive ? 'Disable video' : 'Enable video'}
        >
          {isVideoActive ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Mic toggle — primary action, larger */}
        {isSpeechSupported && (
          <button
            onClick={onToggleMic}
            className={cn(
              'p-4 rounded-full transition-all duration-200 relative',
              isListening
                ? 'bg-primary-500 text-white shadow-glow-orange hover:bg-primary-600'
                : 'bg-secondary-700/80 text-white hover:bg-secondary-600/80'
            )}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <Mic size={24} /> : <MicOff size={24} />}
            {/* Pulsing ring when listening */}
            {isListening && (
              <span className="absolute inset-0 rounded-full border-2 border-primary-400 animate-ping opacity-50" />
            )}
          </button>
        )}

        {/* Keyboard/text toggle */}
        <button
          onClick={() => setShowTextInput((prev) => !prev)}
          className={cn(
            'p-3 rounded-full transition-all duration-200',
            showTextInput
              ? 'bg-primary-500/20 text-primary-400'
              : 'bg-secondary-700/80 text-secondary-300 hover:bg-secondary-600/80 hover:text-white'
          )}
          aria-label="Toggle text input"
        >
          <Keyboard size={20} />
        </button>

        {/* Captions toggle */}
        {onToggleCaptions && (
          <button
            onClick={onToggleCaptions}
            className={cn(
              'p-3 rounded-full transition-all duration-200',
              captionsEnabled
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-secondary-700/80 text-secondary-300 hover:bg-secondary-600/80 hover:text-white'
            )}
            aria-label={captionsEnabled ? 'Hide captions' : 'Show captions'}
          >
            <Subtitles size={20} />
          </button>
        )}

        {/* Close / End call */}
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-all duration-200"
          aria-label="End conversation"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
