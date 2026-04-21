'use client';

import { create } from 'zustand';

import type {
  BackendActionContext,
  BackendActionReceipt,
  DavidChatRuntimeMetadata,
  DavidChatStreamFrame,
} from '@/app/api/david/chat/handler';

export type {
  BackendActionContext,
  BackendActionReceipt,
  DavidChatRuntimeMetadata,
  DavidChatStreamFrame,
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ListingContext {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number | null;
}

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  hasUserSentMessage: boolean;
  sessionId: string;
  listingContext?: ListingContext;
  runtimeMetadata: DavidChatRuntimeMetadata | null;
  actionReceipts: BackendActionReceipt[];
  // actions
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  setListingContext: (ctx: ListingContext) => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

function buildApiMessages(
  msgs: ChatMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return msgs.map((m) => ({ role: m.role, content: m.content }));
}

function isStructuredDavidStream(response: Response): boolean {
  return response.headers.get('x-david-stream-protocol') === 'ndjson-v1';
}

type ChatStoreSet = (
  partial:
    | Partial<ChatState>
    | ((state: ChatState) => Partial<ChatState>)
) => void;

function parseDavidStreamFrame(line: string): DavidChatStreamFrame | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as DavidChatStreamFrame;
  } catch {
    return null;
  }
}

function appendAssistantDelta(delta: string, setState: ChatStoreSet): void {
  setState((s) => {
    const msgs = [...s.messages];
    const last = msgs[msgs.length - 1];

    if (last?.role === 'assistant') {
      msgs[msgs.length - 1] = {
        ...last,
        content: last.content + delta,
      };
      return { messages: msgs };
    }

    return {
      messages: [
        ...msgs,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: delta,
          timestamp: new Date(),
          isStreaming: true,
        },
      ],
    };
  });
}

function finishAssistantMessage(setState: ChatStoreSet): void {
  setState((s) => {
    const msgs = [...s.messages];
    const last = msgs[msgs.length - 1];
    if (last?.role === 'assistant') {
      msgs[msgs.length - 1] = { ...last, isStreaming: false };
      return { messages: msgs };
    }
    return {};
  });
}

function applyRuntimeMetadata(
  frame: Extract<DavidChatStreamFrame, { type: 'context' }>,
  setState: ChatStoreSet
): void {
  setState({
    runtimeMetadata: {
      contractMode: frame.contractMode,
      toolExecutionEnabled: frame.toolExecutionEnabled,
      followUpSchedulingEnabled: frame.followUpSchedulingEnabled,
      leadCaptureState: frame.leadCaptureState,
      callbackCaptureState: frame.callbackCaptureState,
      backendActionContext: frame.backendActionContext ?? {},
    },
  });
}

function appendActionReceipts(
  frame: Extract<DavidChatStreamFrame, { type: 'action_receipt' }>,
  setState: ChatStoreSet
): void {
  if (!frame.receipts.length) {
    return;
  }

  setState((state) => ({
    actionReceipts: [...state.actionReceipts, ...frame.receipts],
  }));
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  hasUserSentMessage: false,
  sessionId: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36),
  runtimeMetadata: null,
  actionReceipts: [],

  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  setListingContext: (ctx) => set({ listingContext: ctx }),

  sendMessage: async (message: string) => {
    const { messages, sessionId, listingContext } = get();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Build outboundMessages BEFORE set() to guarantee userMsg is included in the API payload.
    // This is the proven pattern: compute the array once, use it for both store and API.
    const outboundMessages = [...messages, userMsg];

    set(() => ({
      messages: outboundMessages,
      isLoading: true,
      hasUserSentMessage: true,
    }));

    try {
      const res = await fetch('/api/david/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: buildApiMessages(outboundMessages),
          sessionId,
          listingContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      if (!isStructuredDavidStream(res)) {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        };

        set((s) => ({ messages: [...s.messages, assistantMsg] }));

        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { done: d, value } = await reader.read();
          done = d;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            appendAssistantDelta(chunk, set);
          }
        }

        finishAssistantMessage(set);
        return;
      }

      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { done: d, value } = await reader.read();
        done = d;
        if (!value) {
          continue;
        }

        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const frame = parseDavidStreamFrame(line);
          if (!frame) continue;

          if (frame.type === 'context') {
            applyRuntimeMetadata(frame, set);
          } else if (frame.type === 'text_delta') {
            appendAssistantDelta(frame.text, set);
          } else if (frame.type === 'action_receipt') {
            appendActionReceipts(frame, set);
          } else if (frame.type === 'done') {
            finishAssistantMessage(set);
          }
        }
      }

      if (buffer.trim()) {
        const trailingFrame = parseDavidStreamFrame(buffer);
        if (trailingFrame?.type === 'context') {
          applyRuntimeMetadata(trailingFrame, set);
        } else if (trailingFrame?.type === 'text_delta') {
          appendAssistantDelta(trailingFrame.text, set);
        } else if (trailingFrame?.type === 'action_receipt') {
          appendActionReceipts(trailingFrame, set);
        } else if (trailingFrame?.type === 'done') {
          finishAssistantMessage(set);
        }
      }

      finishAssistantMessage(set);
    } catch (primaryErr) {
      // Fallback: try the non-streaming /api/david/message endpoint once
      const allMessages = get().messages;
      try {
        const fallbackRes = await fetch('/api/david/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: buildApiMessages(allMessages),
            visitorId: sessionId,
            sessionId,
            inventoryViewed: listingContext ? [listingContext.id] : [],
          }),
        });

        if (fallbackRes.ok) {
          const data = await fallbackRes.json() as { message?: string };
          const fallbackMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message ?? 'Here is what I found:',
            timestamp: new Date(),
            isStreaming: false,
          };
          set((s) => ({ messages: [...s.messages, fallbackMsg] }));
        } else {
          throw new Error(`Fallback HTTP ${fallbackRes.status}`);
        }
      } catch {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, I ran into an issue just now. Please try again or reach us directly at (973) 500-1010.',
          timestamp: new Date(),
          isStreaming: false,
        };
        set((s) => ({ messages: [...s.messages, errorMsg] }));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => set({ messages: [], hasUserSentMessage: false, actionReceipts: [] }),
}));
