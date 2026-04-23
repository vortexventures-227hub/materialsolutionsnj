'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Minimize2 } from 'lucide-react';
import { CONTACT_DETAILS } from '@/lib/contactDetails';
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
    runtimeMetadata,
    actionReceipts,
  } = useChatStore();

  const [healthState, setHealthState] = useState<'healthy' | 'degraded' | 'offline'>('healthy');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const initialOpenRef = useRef(false);
  const phoneContact = CONTACT_DETAILS.find((detail) => detail.icon === 'phone');
  const emailContact = CONTACT_DETAILS.find((detail) => detail.icon === 'mail');
  const emailLabel = emailContact?.primary ?? 'info@materialsolutionsnj.com';
  // Phone is provisioned only when the contact entry carries a real tel: href.
  // The phone entry in CONTACT_DETAILS currently holds an email as primary
  // (primary: 'info@materialsolutionsnj.com', href: 'mailto:...'), so we must
  // check href, not primary, to avoid false "Call now" with a mailto link.
  const isPhoneUnprovisioned = !phoneContact?.href?.startsWith('tel:');
  const immediateHelpMessage = isPhoneUnprovisioned
    ? `Email ${emailLabel} or use the contact form if you need immediate help.`
    : `Call ${phoneContact!.primary} or email ${emailLabel} if you need immediate help.`;
  const immediateHelpHref = isPhoneUnprovisioned ? `mailto:${emailLabel}` : (phoneContact!.href ?? `mailto:${emailLabel}`);
  const immediateHelpLabel = isPhoneUnprovisioned ? 'Email now' : 'Call now';

  // Fetch health on mount; fail-open — any error defaults to 'healthy'
  useEffect(() => {
    fetch('/api/david/health')
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (data?.healthState) {
          setHealthState(data.healthState);
        }
      })
      .catch(() => {
        // Network error — stay healthy (fail-open)
      });
  }, []);

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

  const callbackBanner =
    runtimeMetadata?.callbackCaptureState === 'success'
      ? {
          tone: 'emerald',
          message: `Your callback request was received in this chat. ${immediateHelpMessage}`,
        }
      : runtimeMetadata?.callbackCaptureState && runtimeMetadata.callbackCaptureState !== 'success'
        ? {
            tone: 'amber',
            message:
              `We couldn't confirm your callback request was saved. Please email ${emailLabel}, or use the contact form so the team gets it directly.`,
          }
        : null;

  const hasActionReceipts = actionReceipts.length > 0;

  // TODO: wire to real telemetry
  const handleEscapeClick = () => {
    console.log({ event: 'david_fallback_escape_click', timestamp: Date.now(), healthState });
  };

  return (
    <div data-david-mode={healthState}>
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
                    Equipment Guide
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

            {/* Degraded health banner */}
            {healthState === 'degraded' && (
              <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  David&apos;s response quality may be limited right now. For the fastest help, reach us directly.
                </p>
                <Link
                  href="/contact?source=david-fallback"
                  onClick={handleEscapeClick}
                  className="shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:no-underline"
                >
                  Talk to a human
                </Link>
              </div>
            )}

            {/* Offline health banner */}
            {healthState === 'offline' && (
              <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  David is offline right now. Use the contact form or call us if you need team follow-up.
                </p>
                <Link
                  href="/contact?source=david-fallback"
                  onClick={handleEscapeClick}
                  className="shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400 underline underline-offset-2 hover:no-underline"
                >
                  Talk to a human
                </Link>
              </div>
            )}

            {/* Callback confirmation banner */}
            {callbackBanner && (
              <div
                className={cn(
                  'px-4 py-2 border-b flex items-center justify-between gap-3',
                  callbackBanner.tone === 'emerald'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-amber-500/10 border-amber-500/20'
                )}
              >
                <p
                  className={cn(
                    'text-xs',
                    callbackBanner.tone === 'emerald'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {callbackBanner.message}
                </p>
                <Link
                  href={callbackBanner.tone === 'emerald' ? immediateHelpHref : '/contact?source=david-callback-recovery'}
                  onClick={handleEscapeClick}
                  className={cn(
                    'shrink-0 text-xs font-medium underline underline-offset-2 hover:no-underline',
                    callbackBanner.tone === 'emerald'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {callbackBanner.tone === 'emerald' ? immediateHelpLabel : 'Contact us'}
                </Link>
              </div>
            )}

            {hasActionReceipts && (
              <div className="border-b border-bg-tertiary bg-bg-secondary/60 px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                    Session Actions
                  </p>
                  <p className="text-[11px] text-text-secondary">
                    Backend receipts captured in this conversation
                  </p>
                </div>
                <div className="space-y-2">
                  {actionReceipts.map((receipt) => (
                    <div
                      key={receipt.receipt_id}
                      className="rounded-xl border border-bg-tertiary bg-bg-primary/80 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-text-primary">{receipt.action}</p>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            receipt.outcome === 'success'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : receipt.outcome === 'degraded'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          )}
                        >
                          {receipt.outcome}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">{receipt.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-secondary">
                        <span>Receipt: {receipt.receipt_id}</span>
                        <span>Executed: {receipt.executed_at}</span>
                        <span>
                          Operator alert: {receipt.operator_alert_dispatched ? 'sent' : 'not sent'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
    </div>
  );
}
