import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createLeadCaptureHandler } from '@/app/api/leads/handler';
import { BackendError } from '@/lib/api/backend';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validLeadBody = {
  name: 'Jane Buyer',
  email: 'jane@example.com',
  phone: '973-555-1234',
  subject: 'Reach truck quote',
  source: 'contact_form',
  page_origin: '/contact',
  cta_origin: 'contact_form_submit',
  message: 'Need a quote for a Crown reach truck.',
};

function makeSuccessSupabase(overrides?: { insertedRows?: unknown[] }) {
  const insertedRows = overrides?.insertedRows ?? [];
  return {
    from(table: string) {
      if (table === 'leads') {
        return {
          insert(row: unknown) {
            insertedRows.push(row);
            return {
              select() {
                return {
                  single: async () => ({
                    data: {
                      ...((row ?? {}) as Record<string, unknown>),
                      id: 'lead-proxy-001',
                      created_at: '2026-04-26T14:25:00.000Z',
                      status: 'warm',
                      score: 40,
                      timeline: null,
                      budget_confirmed: false,
                      use_case: null,
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }
      // Any other table (e.g. leads_fsm_forward_failures) — accept insert silently
      return {
        insert() {
          return { select() { return { single: async () => ({ data: null, error: null }) }; } };
        },
      };
    },
  };
}

async function withArtifactRoot<T>(run: (root: string) => Promise<T>) {
  const root = await mkdtemp(path.join(tmpdir(), 'leads-proxy-test-'));
  const prev = process.env.LEAD_CAPTURE_ARTIFACT_ROOT;
  process.env.LEAD_CAPTURE_ARTIFACT_ROOT = root;
  try {
    return await run(root);
  } finally {
    if (prev === undefined) delete process.env.LEAD_CAPTURE_ARTIFACT_ROOT;
    else process.env.LEAD_CAPTURE_ARTIFACT_ROOT = prev;
    await rm(root, { recursive: true, force: true });
  }
}

function withFlag(name: string, value: string | undefined, fn: () => Promise<void>) {
  const prev = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  return fn().finally(() => {
    if (prev === undefined) delete process.env[name];
    else process.env[name] = prev;
  });
}

// Test 1: flag off → no FSM call attempted, storefront sink still hit, 200 returned
test('leads-proxy: flag off — storefront sink hit, FSM not called, 2xx returned', async () => {
  await withArtifactRoot(async () => {
    await withFlag('NEXT_PUBLIC_LEADS_FSM_FORWARD_ENABLED', undefined, async () => {
      const fsmCalls: unknown[] = [];
      const insertedRows: unknown[] = [];

      const handler = createLeadCaptureHandler({
        getSupabaseAdmin: () => makeSuccessSupabase({ insertedRows }) as ReturnType<typeof import('@/lib/db/supabase').getSupabaseAdmin>,
        async sendLeadNotification() { return true; },
        async fsmForwardLead(leadId, body) {
          fsmCalls.push({ leadId, body });
        },
      });

      const response = await handler(makeRequest(validLeadBody));

      assert.equal(fsmCalls.length, 0, 'FSM must not be called when flag is off');
      assert.equal(insertedRows.length, 1, 'storefront sink must be hit');
      assert.ok(response.status < 400, `expected 2xx but got ${response.status}`);
    });
  });
});

// Test 2: flag on, FSM 200 → both sinks hit, 2xx returned
test('leads-proxy: flag on, FSM 200 — both sinks hit, 2xx returned', async () => {
  await withArtifactRoot(async () => {
    await withFlag('NEXT_PUBLIC_LEADS_FSM_FORWARD_ENABLED', 'true', async () => {
      const fsmCalls: unknown[] = [];
      const insertedRows: unknown[] = [];

      const handler = createLeadCaptureHandler({
        getSupabaseAdmin: () => makeSuccessSupabase({ insertedRows }) as ReturnType<typeof import('@/lib/db/supabase').getSupabaseAdmin>,
        async sendLeadNotification() { return true; },
        async fsmForwardLead(leadId, body) {
          fsmCalls.push({ leadId, body });
          // success — resolves without error
        },
      });

      const response = await handler(makeRequest(validLeadBody));

      assert.equal(fsmCalls.length, 1, 'FSM must be called once when flag is on');
      assert.equal(insertedRows.length, 1, 'storefront sink must be hit');
      assert.ok(response.status < 400, `expected 2xx but got ${response.status}`);
      const payload = await response.json() as Record<string, unknown>;
      assert.equal(payload.lead_id, 'lead-proxy-001');
    });
  });
});

// Test 3: flag on, FSM 500 → storefront sink still hit, 2xx returned to customer, error logged
test('leads-proxy: flag on, FSM 500 — storefront sink hit, 2xx returned, error logged', async () => {
  await withArtifactRoot(async () => {
    await withFlag('NEXT_PUBLIC_LEADS_FSM_FORWARD_ENABLED', 'true', async () => {
      const insertedRows: unknown[] = [];
      const errorLogs: unknown[] = [];
      const origError = console.error.bind(console);
      console.error = (...args: unknown[]) => { errorLogs.push(args); };

      try {
        const handler = createLeadCaptureHandler({
          getSupabaseAdmin: () => makeSuccessSupabase({ insertedRows }) as ReturnType<typeof import('@/lib/db/supabase').getSupabaseAdmin>,
          async sendLeadNotification() { return true; },
          async fsmForwardLead() {
            throw new BackendError(500, 'Internal Server Error');
          },
        });

        const response = await handler(makeRequest(validLeadBody));

        assert.equal(insertedRows.length, 1, 'storefront sink must be hit even on FSM failure');
        assert.ok(response.status < 400, `expected 2xx but got ${response.status}`);
        const logged = errorLogs.find((args) =>
          (args as unknown[]).some((a) => typeof a === 'string' && a.includes('[leads-proxy]'))
        );
        assert.ok(logged, 'FSM failure must be logged via console.error');
      } finally {
        console.error = origError;
      }
    });
  });
});

// Test 4: flag on, network error → storefront sink still hit, 2xx returned, error logged
test('leads-proxy: flag on, network error — storefront sink hit, 2xx returned, error logged', async () => {
  await withArtifactRoot(async () => {
    await withFlag('NEXT_PUBLIC_LEADS_FSM_FORWARD_ENABLED', 'true', async () => {
      const insertedRows: unknown[] = [];
      const errorLogs: unknown[] = [];
      const origError = console.error.bind(console);
      console.error = (...args: unknown[]) => { errorLogs.push(args); };

      try {
        const handler = createLeadCaptureHandler({
          getSupabaseAdmin: () => makeSuccessSupabase({ insertedRows }) as ReturnType<typeof import('@/lib/db/supabase').getSupabaseAdmin>,
          async sendLeadNotification() { return true; },
          async fsmForwardLead() {
            throw new Error('fetch failed: ECONNREFUSED');
          },
        });

        const response = await handler(makeRequest(validLeadBody));

        assert.equal(insertedRows.length, 1, 'storefront sink must be hit even on network error');
        assert.ok(response.status < 400, `expected 2xx but got ${response.status}`);
        const logged = errorLogs.find((args) =>
          (args as unknown[]).some((a) => typeof a === 'string' && a.includes('[leads-proxy]'))
        );
        assert.ok(logged, 'network error must be logged via console.error');
      } finally {
        console.error = origError;
      }
    });
  });
});

// Test 5: malformed payload → 400 from validator, neither sink touched
test('leads-proxy: malformed payload (no email or phone) — 400, neither sink touched', async () => {
  await withArtifactRoot(async () => {
    const insertedRows: unknown[] = [];
    const fsmCalls: unknown[] = [];

    const handler = createLeadCaptureHandler({
      getSupabaseAdmin: () => makeSuccessSupabase({ insertedRows }) as ReturnType<typeof import('@/lib/db/supabase').getSupabaseAdmin>,
      async sendLeadNotification() { return true; },
      async fsmForwardLead(leadId, body) {
        fsmCalls.push({ leadId, body });
      },
    });

    const response = await handler(makeRequest({
      name: 'No Contact Buyer',
      subject: 'Inquiry',
      source: 'contact_form',
      message: 'Missing contact info.',
      // no email, no phone
    }));

    assert.equal(response.status, 400);
    assert.equal(insertedRows.length, 0, 'Supabase sink must not be touched on bad payload');
    assert.equal(fsmCalls.length, 0, 'FSM must not be called on bad payload');
  });
});
