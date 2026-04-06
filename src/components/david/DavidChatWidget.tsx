'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useChatStore } from '@/stores/chatStore';
import { DavidAvatar } from './DavidAvatar';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { QuickChips } from './QuickChips';

export function DavidChatWidget() {
  const {
    isOpen,
    messages,
    isLoading,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    hasUserSentMessage,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const initialOpenRef = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  // Add initial greeting when first opened
  useEffect(() => {
    if (isOpen && !initialOpenRef.current && messages.length === 0) {
      initialOpenRef.current = true;
      // Delay initial greeting slightly for better UX
      setTimeout(() => {
        const greeting: typeof messages[0] = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            "Hey there! I'm David from Material Solutions NJ. We've got everything from reach trucks to pallet jacks, and I'm here to help you find exactly what you need. What brings you in today?",
          timestamp: new Date(),
        };
        useChatStore.setState((state) => ({
          messages: [...state.messages, greeting],
        }));
      }, 500);
    }
  }, [isOpen, messages.length]);

  const handleQuickChip = async (chip: string) => {
    await sendMessage(chip);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="floating-button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
            onClick={toggleChat}
            className={cn(
              'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 group',
              'bg-gradient-to-br from-accent-primary to-amber-600 text-bg-primary shadow-xl hover:shadow-2xl hover:shadow-accent-primary/50 active:scale-95'
            )}
            aria-label="Open chat with David"
            title="Chat with David"
          >
            {/* Pulsing glow ring */}
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background:
                  'radial-gradient(circle, rgba(232, 184, 0, 0.3), transparent)',
              }}
            />

            <MessageCircle
              size={24}
              className="relative z-10 group-hover:scale-110 transition-transform"
            />

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 px-3 py-1 bg-bg-primary text-text-primary text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-40 border border-bg-tertiary shadow-lg">
              Chat with David
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            className={cn(
              'fixed bottom-6 right-6 z-50 flex flex-col bg-bg-primary border border-bg-tertiary rounded-2xl shadow-2xl overflow-hidden',
              'w-full max-w-md sm:max-w-sm h-screen sm:h-[600px] sm:max-h-[90vh]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-bg-tertiary">
              <div className="flex items-center gap-2">
                <DavidAvatar size="sm" showOnlineDot />
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    David
                  </h3>
                  <p className="text-xs text-text-secondary">
                    AI Sales Specialist
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={closeChat}
                  className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors"
                  aria-label="Minimize chat"
                  title="Minimize"
                >
                  <Minimize2 size={18} className="text-text-secondary" />
                </button>
                <button
                  onClick={closeChat}
                  className="p-1.5 hover:bg-bg-tertiary rounded-lg transition-colors"
                  aria-label="Close chat"
                  title="Close"
                >
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messageContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-bg-tertiary scrollbar-track-transparent"
            >
              {messages.length === 0 && !hasUserSentMessage ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <DavidAvatar size="lg" showGlow className="mx-auto mb-4" />
                    <p className="text-text-secondary text-sm">
                      Loading David...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isLatest={index === messages.length - 1}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Quick Chips or Input */}
            {!hasUserSentMessage && messages.length > 0 ? (
              <>
                <QuickChips
                  onSelect={handleQuickChip}
                  isHidden={hasUserSentMessage}
                />
                <ChatInput
                  onSubmit={sendMessage}
                  isLoading={isLoading}
                  placeholder="Ask David anything..."
                />
              </>
            ) : (
              <ChatInput
                onSubmit={sendMessage}
                isLoading={isLoading}
                placeholder="Ask David anything..."
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
