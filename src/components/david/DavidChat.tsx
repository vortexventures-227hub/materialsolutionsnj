'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { Message } from './hooks/useDavidConvo';

interface DavidChatProps {
  messages: Message[];
  isLoading: boolean;
  interimText?: string;
  /** Compact mode shows fewer messages with transparent bg (overlay on video) */
  compact?: boolean;
  className?: string;
}

export function DavidChat({
  messages,
  isLoading,
  interimText,
  compact = false,
  className,
}: DavidChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading, interimText]);

  // In compact mode, only show last 4 messages
  const visibleMessages = compact ? messages.slice(-4) : messages;

  return (
    <div
      ref={scrollRef}
      className={cn(
        'overflow-y-auto',
        compact
          ? 'max-h-[180px] px-3 py-2 space-y-2'
          : 'flex-1 p-4 space-y-3 bg-secondary-50/50',
        className
      )}
    >
      <AnimatePresence initial={false}>
        {visibleMessages.map((message, index) => (
          <motion.div
            key={`${message.timestamp.getTime()}-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] px-3 py-2 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'bg-primary-500 text-white rounded-2xl rounded-br-md'
                  : compact
                  ? 'bg-black/50 text-white rounded-2xl rounded-bl-md backdrop-blur-sm'
                  : 'bg-white text-secondary-800 rounded-2xl rounded-bl-md shadow-premium border border-secondary-100'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {!compact && (
                <p
                  className={cn(
                    'text-[10px] mt-1',
                    message.role === 'user' ? 'text-white/50' : 'text-secondary-400'
                  )}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Interim speech text */}
      {interimText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end"
        >
          <div className={cn(
            'max-w-[85%] px-3 py-2 text-sm rounded-2xl rounded-br-md italic',
            compact
              ? 'bg-white/20 text-white/70 backdrop-blur-sm'
              : 'bg-primary-100 text-primary-700'
          )}>
            {interimText}...
          </div>
        </motion.div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
          <div
            className={cn(
              'px-4 py-3 rounded-2xl rounded-bl-md',
              compact
                ? 'bg-black/50 backdrop-blur-sm'
                : 'bg-white shadow-premium border border-secondary-100'
            )}
          >
            <div className="flex gap-1.5">
              <span
                className={cn(
                  'w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]',
                  compact ? 'bg-white/50' : 'bg-secondary-300'
                )}
              />
              <span
                className={cn(
                  'w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]',
                  compact ? 'bg-white/50' : 'bg-secondary-300'
                )}
              />
              <span
                className={cn(
                  'w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]',
                  compact ? 'bg-white/50' : 'bg-secondary-300'
                )}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
