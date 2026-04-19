import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDavidChatSystemPrompt,
  createDavidChatHandler,
} from '../src/app/api/david/chat/handler';

test('buildDavidChatSystemPrompt stays truthful about runtime capabilities', () => {
  const prompt = buildDavidChatSystemPrompt({
    id: 'listing-42',
    title: '2018 Raymond 7530RST Reach Truck',
    make: 'Raymond',
    model: '7530RST',
    year: 2018,
  });

  assert.match(prompt, /CURRENT LISTING CONTEXT/);
  assert.match(prompt, /2018 Raymond 7530RST Reach Truck/);
  assert.match(prompt, /RUNTIME TRUTH RULES/);
  assert.match(prompt, /Do not claim to use tools/i);
  assert.match(prompt, /Do not promise that Bill or the team will follow up/i);
  assert.doesNotMatch(prompt, /schedule_callback/);
  assert.doesNotMatch(prompt, /capture_lead/);
  assert.doesNotMatch(prompt, /search_inventory/);
  assert.doesNotMatch(prompt, /get_listing_details/);
  assert.doesNotMatch(prompt, /promise a follow-up/i);
});

test('buildDavidChatSystemPrompt can surface verified backend lookup results without advertising tools', () => {
  const prompt = buildDavidChatSystemPrompt(
    {
      id: 'listing-42',
      title: '2018 Raymond 7530RST Reach Truck',
      make: 'Raymond',
      model: '7530RST',
      year: 2018,
    },
    null,
    null,
    {
      inventorySummary: 'The backend returned 2 current item(s). Top matches: 2018 Raymond 7530RST Reach Truck; 2019 Toyota 8FBCU25.',
      listingDetailsSummary: '2018 Raymond 7530RST Reach Truck was fetched successfully with these verified details: price 18900, 4120 hours, capacity 3000 lbs.',
    }
  );

  assert.match(prompt, /VERIFIED BACKEND ACTION CONTEXT/);
  assert.match(prompt, /backend returned 2 current item\(s\)/i);
  assert.match(prompt, /price 18900/i);
  assert.doesNotMatch(prompt, /AVAILABLE TOOLS/);
  assert.doesNotMatch(prompt, /search_inventory/);
  assert.doesNotMatch(prompt, /get_listing_details/);
});

test('createDavidChatHandler filters tool-claiming delta text into honest storefront language', async () => {
  const handler = createDavidChatHandler({
    createMessageStream: async () => {
      return (async function* () {
        yield {
          type: 'content_block_delta',
          delta: {
            type: 'text_delta',
            text: 'I searched our inventory and found two Raymond units.\nI can schedule a callback for you right now.',
          },
        };
      })();
    },
  });

  const response = await handler(
    new Request('http://localhost/api/david/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'session-filter',
        messages: [{ role: 'user', content: 'Hello there.' }],
      }),
    })
  );

  assert.equal(response.status, 200);
  const frames = String(await response.text())
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as Record<string, any>);

  const textDeltas = frames
    .filter((frame) => frame.type === 'text_delta')
    .map((frame) => String(frame.text ?? ''));

  assert.equal(textDeltas.length, 1);
  assert.match(textDeltas[0] ?? '', /^Based on the information available to me from our current listings, i searched our inventory and found two Raymond units\./i);
  assert.doesNotMatch(textDeltas[0] ?? '', /schedule a callback/i);
  assert.equal(frames[0]?.type, 'context');
  assert.equal(frames[0]?.contractMode, 'tool-less-structured-context-v1');
  assert.equal(frames[0]?.toolExecutionEnabled, false);
  assert.equal(frames[0]?.followUpSchedulingEnabled, false);
  assert.equal(frames.at(-1)?.type, 'done');
});

test('createDavidChatHandler streams structured frames without advertising unsupported tools', async () => {
  const capturedCalls: Array<Record<string, unknown>> = [];

  const handler = createDavidChatHandler({
    createMessageStream: async (params) => {
      capturedCalls.push(params as Record<string, unknown>);
      return (async function* () {
        yield {
          type: 'content_block_delta',
          delta: {
            type: 'text_delta',
            text: 'Fallback-free reply.',
          },
        };
      })();
    },
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);

    if (url.includes('/api/inventory?limit=3')) {
      return new Response(
        JSON.stringify({
          inventory: [
            { year: 2018, brand: 'Raymond', model: '7530RST', type: 'reach truck' },
            { year: 2019, brand: 'Toyota', model: '8FBCU25', type: 'electric forklift' },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/api/inventory/listing-42')) {
      return new Response(
        JSON.stringify({
          listing: {
            id: 'listing-42',
            title: '2018 Raymond 7530RST Reach Truck',
            price: 18900,
            hours: 4120,
            capacity_lbs: 3000,
            fuel_type: 'electric',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    throw new Error(`Unexpected fetch during test: ${url}`);
  };

  try {
    const response = await handler(
      new Request('http://localhost/api/david/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session-1',
          messages: [{ role: 'user', content: 'Do you have a Raymond reach truck? More details please.' }],
          listingContext: {
            id: 'listing-42',
            title: '2018 Raymond 7530RST Reach Truck',
            make: 'Raymond',
            model: '7530RST',
            year: 2018,
          },
        }),
      })
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-david-stream-protocol'), 'ndjson-v1');
    assert.equal(response.headers.get('x-david-contract-mode'), 'tool-less-structured-context-v1');
    assert.match(response.headers.get('content-type') ?? '', /application\/x-ndjson/);

    const frames = String(await response.text())
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, any>);

    assert.equal(frames[0]?.type, 'context');
    assert.equal(frames[0]?.contractMode, 'tool-less-structured-context-v1');
    assert.equal(frames[0]?.toolExecutionEnabled, false);
    assert.equal(frames[0]?.followUpSchedulingEnabled, false);
    assert.match(frames[0]?.backendActionContext?.inventorySummary ?? '', /backend returned 2 current item\(s\)/i);
    assert.match(frames[0]?.backendActionContext?.listingDetailsSummary ?? '', /price 18900/i);
    assert.deepEqual(
      frames.filter((frame) => frame.type === 'text_delta').map((frame) => frame.text),
      ['Fallback-free reply.']
    );
    assert.equal(frames.at(-1)?.type, 'done');

    assert.equal(capturedCalls.length, 1);
    assert.equal(capturedCalls[0]?.model, 'claude-haiku-4-5-20251001');
    const tools = capturedCalls[0]?.tools;
    assert.ok(
      tools === undefined || (Array.isArray(tools) && tools.length === 0),
      'expected no callable tools to be registered for the David chat route'
    );

    const system = String(capturedCalls[0]?.system ?? '');
    assert.match(system, /CURRENT LISTING CONTEXT/);
    assert.match(system, /VERIFIED BACKEND ACTION CONTEXT/);
    assert.match(system, /Raymond 7530RST Reach Truck/);
    assert.match(system, /price 18900/i);
    assert.doesNotMatch(system, /AVAILABLE TOOLS/);
    assert.doesNotMatch(system, /capture_lead/);
    assert.doesNotMatch(system, /schedule_callback/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
