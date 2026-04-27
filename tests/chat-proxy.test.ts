import test from 'node:test';
import assert from 'node:assert/strict';

import { fsmChatForward, FsmChatError } from '@/lib/api/fsm-chat';

// ── helpers ────────────────────────────────────────────────────────────────

function withEnv(overrides: Record<string, string | undefined>, run: () => Promise<void>) {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(overrides)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return run().finally(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
}

// ── fsmChatForward unit tests ──────────────────────────────────────────────

test('fsmChatForward: throws FsmChatError when FSM_SERVICE_JWT is missing', async () => {
  await withEnv(
    {
      FSM_SERVICE_JWT: undefined,
      NEXT_PUBLIC_BACKEND_URL: 'https://does-not-matter.example.com',
    },
    async () => {
      await assert.rejects(
        () => fsmChatForward({ message: 'hello' }),
        (err: unknown) => {
          assert.ok(err instanceof FsmChatError, 'expected FsmChatError');
          assert.ok(
            (err as FsmChatError).message.includes('FSM_SERVICE_JWT not configured'),
          );
          return true;
        },
      );
    },
  );
});

test('fsmChatForward: sends correct payload to FSM endpoint', async () => {
  let capturedUrl: string | undefined;
  let capturedInit: RequestInit | undefined;

  const origFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = typeof input === 'string' ? input : String(input);
    capturedInit = init;
    return new Response(
      JSON.stringify({ response: 'Hi there!', timestamp: '2026-04-27T11:00:00.000Z' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    await withEnv(
      {
        FSM_SERVICE_JWT: 'test-service-jwt-token',
        NEXT_PUBLIC_BACKEND_URL: 'https://fsm.example.com',
        BACKEND_API_KEY: undefined,
      },
      async () => {
        const result = await fsmChatForward({ message: 'What reach trucks do you have?' });

        assert.equal(capturedUrl, 'https://fsm.example.com/api/chat/message');
        assert.equal(capturedInit?.method, 'POST');

        const headers = capturedInit?.headers as Record<string, string>;
        assert.equal(headers['Authorization'], 'Bearer test-service-jwt-token');
        assert.equal(headers['Content-Type'], 'application/json');

        const body = JSON.parse(capturedInit?.body as string);
        assert.equal(body.message, 'What reach trucks do you have?');
        assert.equal(body.leadId, undefined);

        assert.equal(result.response, 'Hi there!');
        assert.equal(result.timestamp, '2026-04-27T11:00:00.000Z');
      },
    );
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('fsmChatForward: passes optional leadId in payload', async () => {
  let capturedBody: Record<string, unknown> | undefined;

  const origFetch = globalThis.fetch;
  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return new Response(
      JSON.stringify({ response: 'Got it', timestamp: '2026-04-27T11:00:00.000Z' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    await withEnv(
      {
        FSM_SERVICE_JWT: 'test-service-jwt-token',
        NEXT_PUBLIC_BACKEND_URL: 'https://fsm.example.com',
        BACKEND_API_KEY: undefined,
      },
      async () => {
        await fsmChatForward({ message: 'Do you offer warranty?', leadId: 'lead-abc-123' });
        assert.equal(capturedBody?.message, 'Do you offer warranty?');
        assert.equal(capturedBody?.leadId, 'lead-abc-123');
      },
    );
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('fsmChatForward: wraps BackendError as FsmChatError with status', async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    await withEnv(
      {
        FSM_SERVICE_JWT: 'bad-token',
        NEXT_PUBLIC_BACKEND_URL: 'https://fsm.example.com',
        BACKEND_API_KEY: undefined,
      },
      async () => {
        await assert.rejects(
          () => fsmChatForward({ message: 'hello' }),
          (err: unknown) => {
            assert.ok(err instanceof FsmChatError, 'expected FsmChatError');
            assert.equal((err as FsmChatError).status, 401);
            return true;
          },
        );
      },
    );
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('fsmChatForward: FSM_SERVICE_JWT overrides BACKEND_API_KEY in Authorization header', async () => {
  let capturedAuthHeader: string | undefined;

  const origFetch = globalThis.fetch;
  globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedAuthHeader = (init?.headers as Record<string, string>)?.['Authorization'];
    return new Response(
      JSON.stringify({ response: 'OK', timestamp: '2026-04-27T11:00:00.000Z' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    await withEnv(
      {
        FSM_SERVICE_JWT: 'service-jwt-xyz',
        BACKEND_API_KEY: 'should-not-be-used',
        NEXT_PUBLIC_BACKEND_URL: 'https://fsm.example.com',
      },
      async () => {
        await fsmChatForward({ message: 'test' });
        assert.equal(capturedAuthHeader, 'Bearer service-jwt-xyz');
      },
    );
  } finally {
    globalThis.fetch = origFetch;
  }
});
