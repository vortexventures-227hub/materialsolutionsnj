'use client';

import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ListingContext {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number | null;
}

export interface ChatStore {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string;
  listingContext: ListingContext | null;
  hasUserSentMessage: boolean;

  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  setListingContext: (context: ListingContext | null) => void;
  clearMessages: () => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
}

async function readStreamingResponse(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    fullContent += chunk;
  }

  return fullContent;
}

async function requestDavidFallback(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  sessionId: string,
  listingContext: ListingContext | null
): Promise<string> {
  const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';
  const inventoryViewed = listingContext?.id ? [listingContext.id] : [];

  const response = await fetch('/api/david/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      visitorId: sessionId,
      sessionId,
      currentPage,
      inventoryViewed,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || `Fallback API error: ${response.statusText}`);
  }

  if (!data.message) {
    throw new Error('Fallback API returned no message');
  }

  return data.message;
}

export const useChatStore = create<ChatStore>((set, get) => {
  const sessionId = typeof window !== 'undefined' ? crypto.randomUUID() : '';

  return {
    isOpen: false,
    messages: [],
    isLoading: false,
    sessionId,
    listingContext: null,
    hasUserSentMessage: false,

    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),

    setListingContext: (context) => set({ listingContext: context }),

    clearMessages: () =>
      set({ messages: [], hasUserSentMessage: false, listingContext: null }),

    addMessage: (message) =>
      set((state) => ({
        messages: [...state.messages, message],
      })),

    updateLastMessage: (content) =>
      set((state) => {
        const messages = [...state.messages];
        if (messages.length > 0) {
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content,
            isStreaming: false,
          };
        }
        return { messages };
      }),

    sendMessage: async (content: string) => {
      const state = get();

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      const outboundMessages = [...state.messages, userMessage];

      set(() => ({
        messages: outboundMessages,
        isLoading: true,
        hasUserSentMessage: true,
      }));

      // Add streaming assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      set((s) => ({
        messages: [...s.messages, assistantMessage],
      }));

      try {
        const requestMessages = outboundMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        let fullContent = '';

        try {
          const response = await fetch('/api/david/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: requestMessages,
              sessionId: state.sessionId,
              listingContext: state.listingContext,
            }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }

          fullContent = await readStreamingResponse(response);
        } catch {
          fullContent = await requestDavidFallback(
            requestMessages,
            state.sessionId,
            state.listingContext
          );
        }

        set((s) => {
          const messages = [...s.messages];
          const lastIndex = messages.length - 1;
          if (messages[lastIndex]?.role === 'assistant') {
            messages[lastIndex] = {
              ...messages[lastIndex],
              content: fullContent,
              isStreaming: false,
            };
          }
          return { messages, isLoading: false };
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Connection error';

        set((s) => {
          const messages = [...s.messages];
          const lastIndex = messages.length - 1;
          if (messages[lastIndex]?.role === 'assistant') {
            messages[lastIndex] = {
              ...messages[lastIndex],
              content: `Sorry, I encountered an error: ${errorMessage}. Please try again or call us at (973) 500-1010.`,
              isStreaming: false,
            };
          }
          return { messages, isLoading: false };
        });
      }
    },
  };
});
