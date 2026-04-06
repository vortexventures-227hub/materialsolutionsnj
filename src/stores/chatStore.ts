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
  year: number;
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

      set((s) => ({
        messages: [...s.messages, userMessage],
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
        const response = await fetch('/api/david/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: state.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            sessionId: state.sessionId,
            listingContext: state.listingContext,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

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

          // Update the last message with streamed content
          set((s) => {
            const messages = [...s.messages];
            const lastIndex = messages.length - 1;
            if (messages[lastIndex]?.role === 'assistant') {
              messages[lastIndex] = {
                ...messages[lastIndex],
                content: fullContent,
              };
            }
            return { messages };
          });
        }

        // Mark streaming as complete
        set((s) => {
          const messages = [...s.messages];
          const lastIndex = messages.length - 1;
          if (messages[lastIndex]?.role === 'assistant') {
            messages[lastIndex] = {
              ...messages[lastIndex],
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
