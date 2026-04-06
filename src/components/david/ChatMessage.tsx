'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { DavidAvatar } from './DavidAvatar';
import { ChatMessage as ChatMessageType } from '@/stores/chatStore';

interface ChatMessageProps {
  message: ChatMessageType;
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest = false }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex gap-3 mb-4',
        isAssistant ? 'justify-start' : 'justify-end'
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0">
          <DavidAvatar size="sm" />
        </div>
      )}

      <div
        className={cn(
          'group max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl',
          isAssistant
            ? 'bg-bg-tertiary text-text-primary rounded-tl-sm'
            : 'bg-accent-primary text-bg-primary rounded-tr-sm'
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>

        {/* Typing indicator for streaming messages */}
        {isAssistant && message.isStreaming && (
          <div className="flex gap-1 mt-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-text-secondary"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-text-secondary"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-text-secondary"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
            />
          </div>
        )}

        {/* Timestamp on hover */}
        {isLatest && (
          <div className="text-xs text-text-secondary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
