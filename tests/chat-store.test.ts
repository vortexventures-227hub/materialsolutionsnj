import test from 'node:test';
import assert from 'node:assert/strict';

import { useChatStore } from '@/stores/chatStore';
import type { ChatMessage, DavidChatRuntimeMetadata } from '@/stores/chatStore';

function resetChatStore(seedMessages: ChatMessage[] = []) {
  useChatStore.setState({
    isOpen: false,
    messages: seedMessages,
    isLoading: false,
    sessionId: 'session-test',
    listingContext: null,
    hasUserSentMessage: false,
    runtimeMetadata: null,
  });
}

test('sendMessage includes the latest user message in the API request payload', async () => {
  resetChatStore([
    {
      id: 'assistant-1',
      role: 'assistant',
      content: 'How can I help?',
      timestamp: new Date('2026-04-17T12:00:00.000Z'),
    },
  ]);

  const originalFetch = globalThis.fetch;
  let capturedBody: Record<string, unknown> | null = null;

  globalThis.fetch = async (_input, init) => {
    capturedBody = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    return new Response('Absolutely — I can help with that.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  };

  try {
    await useChatStore.getState().sendMessage('I need a Raymond reach truck.');
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.ok(capturedBody, 'fetch should receive a request body');
  assert.deepEqual(capturedBody?.messages, [
    {
      role: 'assistant',
      content: 'How can I help?',
    },
    {
      role: 'user',
      content: 'I need a Raymond reach truck.',
    },
  ]);

  const finalMessages = useChatStore.getState().messages;
  assert.equal(finalMessages.length, 3);
  assert.equal(finalMessages[1]?.role, 'user');
  assert.equal(finalMessages[1]?.content, 'I need a Raymond reach truck.');
  assert.equal(finalMessages[2]?.role, 'assistant');
  assert.equal(finalMessages[2]?.content, 'Absolutely — I can help with that.');
  assert.equal(finalMessages[2]?.isStreaming, false);
});

test('sendMessage parses structured david chat stream frames and stores runtime metadata', async () => {
  resetChatStore();

  const originalFetch = globalThis.fetch;
  const runtimeMetadata: DavidChatRuntimeMetadata = {
    contractMode: 'tool-less-structured-context-v1',
    toolExecutionEnabled: false,
    followUpSchedulingEnabled: false,
    backendActionContext: {
      inventorySummary: 'The backend returned 2 current item(s). Top matches: 2018 Raymond 7530RST Reach Truck; 2019 Toyota 8FBCU25.',
      listingDetailsSummary: '2018 Raymond 7530RST Reach Truck was fetched successfully with these verified details: price 18900, 4120 hours, capacity 3000 lbs.',
    },
    leadCaptureState: 'success',
    callbackCaptureState: null,
  };

  globalThis.fetch = async () => new Response(
    [
      JSON.stringify({ type: 'context', ...runtimeMetadata }),
      JSON.stringify({ type: 'text_delta', text: 'Structured ' }),
      JSON.stringify({ type: 'text_delta', text: 'reply.' }),
      JSON.stringify({ type: 'done' }),
      '',
    ].join('\n'),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'x-david-stream-protocol': 'ndjson-v1',
      },
    }
  );

  try {
    await useChatStore.getState().sendMessage('Show me Raymond reach truck options.');
  } finally {
    globalThis.fetch = originalFetch;
  }

  const finalState = useChatStore.getState();
  assert.equal(finalState.runtimeMetadata?.contractMode, 'tool-less-structured-context-v1');
  assert.equal(finalState.runtimeMetadata?.toolExecutionEnabled, false);
  assert.equal(finalState.runtimeMetadata?.followUpSchedulingEnabled, false);
  assert.equal(finalState.runtimeMetadata?.leadCaptureState, 'success');
  assert.equal(finalState.runtimeMetadata?.callbackCaptureState, null);
  assert.match(finalState.runtimeMetadata?.backendActionContext?.inventorySummary ?? '', /backend returned 2 current item\(s\)/i);
  assert.match(finalState.runtimeMetadata?.backendActionContext?.listingDetailsSummary ?? '', /price 18900/i);
  assert.equal(finalState.messages.length, 2);
  assert.equal(finalState.messages[0]?.role, 'user');
  assert.equal(finalState.messages[0]?.content, 'Show me Raymond reach truck options.');
  assert.equal(finalState.messages[1]?.role, 'assistant');
  assert.equal(finalState.messages[1]?.content, 'Structured reply.');
  assert.equal(finalState.messages[1]?.isStreaming, false);
});

test('sendMessage falls back to /api/david/message when the streaming chat route fails', async () => {
  resetChatStore([
    {
      id: 'assistant-1',
      role: 'assistant',
      content: 'What equipment are you looking for?',
      timestamp: new Date('2026-04-17T12:05:00.000Z'),
    },
  ]);

  useChatStore.getState().setListingContext({
    id: 'listing-42',
    title: '2021 Raymond 750-R45TT',
    make: 'Raymond',
    model: '750-R45TT',
    year: 2021,
  });

  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
    calls.push({ url, body });

    if (url === '/api/david/chat') {
      return new Response(JSON.stringify({ error: 'Missing Anthropic key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    assert.equal(url, '/api/david/message');
    return new Response(
      JSON.stringify({
        message: 'Fallback David is live. I can help you with that Raymond reach truck.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    await useChatStore.getState().sendMessage('Do you have a Raymond reach truck?');
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.url, '/api/david/chat');
  assert.equal(calls[1]?.url, '/api/david/message');
  assert.deepEqual(calls[1]?.body.messages, [
    {
      role: 'assistant',
      content: 'What equipment are you looking for?',
    },
    {
      role: 'user',
      content: 'Do you have a Raymond reach truck?',
    },
  ]);
  assert.equal(calls[1]?.body.visitorId, 'session-test');
  assert.equal(calls[1]?.body.sessionId, 'session-test');
  assert.deepEqual(calls[1]?.body.inventoryViewed, ['listing-42']);

  const finalMessages = useChatStore.getState().messages;
  assert.equal(finalMessages.length, 3);
  assert.equal(finalMessages[2]?.content, 'Fallback David is live. I can help you with that Raymond reach truck.');
  assert.equal(finalMessages[2]?.isStreaming, false);
});
