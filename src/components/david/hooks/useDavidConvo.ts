'use client';

import { useState, useCallback, useRef } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseDavidConvoOptions {
  visitorId: string;
  sessionId?: string;
  onResponse?: (message: string) => void;
  onRateLimited?: (message: string) => void;
}

interface UseDavidConvoReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<string | null>;
  addSystemMessage: (content: string) => void;
  reset: () => void;
}

const DEFAULT_GREETING = "Hey there! I'm David, equipment specialist at Material Solutions. 28 years in the forklift business. What can I help you with today?";

function getGreeting(page: string): string {
  switch (page) {
    case 'inventory':
      return "Hey! I see you're browsing our inventory. Looking for anything specific? I know every unit we've got.";
    case 'services':
      return "Hey there! Interested in our services? We do OSHA training, wire-guided systems, and racking. What can I help with?";
    case 'contact':
      return "Hey! Looking to get in touch? I can help answer questions right now, or I can get Bill to call you back.";
    case 'about':
      return "Hey! Want to know more about us? 29 years in business, narrow aisle specialists. What questions do you have?";
    default:
      return DEFAULT_GREETING;
  }
}

export function useDavidConvo({ visitorId, sessionId, onResponse, onRateLimited }: UseDavidConvoOptions): UseDavidConvoReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const initializedRef = useRef(false);

  // Initialize with greeting on first access
  if (!initializedRef.current && typeof window !== 'undefined') {
    initializedRef.current = true;
    const page = window.location.pathname.split('/')[1] || 'home';
    setMessages([{
      role: 'assistant',
      content: getGreeting(page),
      timestamp: new Date(),
    }]);
  }

  const sendMessage = useCallback(async (text: string): Promise<string | null> => {
    if (!text.trim() || isLoading) return null;

    const userMessage: Message = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';

      const response = await fetch('/api/david/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          visitorId,
          sessionId,
          currentPage,
          inventoryViewed: [],
        }),
      });

      if (response.status === 429 || response.status === 410 || response.status === 503) {
        const data = await response.json();
        onRateLimited?.(data.error || 'Please try again later.');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || "I'm having some technical difficulties. Please call us at (973) 500-1010.",
          timestamp: new Date(),
        }]);
        return null;
      }

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage = data.message;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      }]);

      onResponse?.(assistantMessage);
      return assistantMessage;
    } catch {
      const errorMsg = "I'm having some technical difficulties. Please call us at (973) 500-1010 or try again in a moment.";
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
      }]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, visitorId, sessionId, onResponse, onRateLimited]);

  const addSystemMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content,
      timestamp: new Date(),
    }]);
  }, []);

  const reset = useCallback(() => {
    initializedRef.current = false;
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    addSystemMessage,
    reset,
  };
}
