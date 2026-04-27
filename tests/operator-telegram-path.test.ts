import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createLeadCaptureHandler } from '../src/app/api/leads/handler';
import {
  sendLeadNotification,
  type NotificationPayload,
} from '../src/lib/notifications/telegram';

const samplePayload: NotificationPayload = {
  lead: {
    id: 'lead-telegram-payload',
    name: 'Telegram Payload Buyer',
    company: 'North Jersey Warehouse',
    phone: '973-555-0199',
    email: 'buyer@example.com',
    message: null,
    interests: ['reach_truck'],
    score: 82,
    status: 'hot',
    created_at: '2026-04-27T00:00:00.000Z',
    updated_at: '2026-04-27T00:00:00.000Z',
    source: 'contact_form',
    budget_confirmed: true,
    timeline: 'this_week',
    use_case: 'Narrow aisle replenishment',
  },
  conversationSummary: 'Buyer asked for a reach truck and provided contact info.',
  inventoryInterests: ['reach_truck', 'narrow_aisle'],
};

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function withArtifactRoot<T>(run: (artifactRoot: string) => Promise<T>) {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), 'operator-telegram-path-'));
  const previousRoot = process.env.LEAD_CAPTURE_ARTIFACT_ROOT;
  process.env.LEAD_CAPTURE_ARTIFACT_ROOT = artifactRoot;
  try {
    return await run(artifactRoot);
  } finally {
    if (previousRoot === undefined) {
      delete process.env.LEAD_CAPTURE_ARTIFACT_ROOT;
    } else {
      process.env.LEAD_CAPTURE_ARTIFACT_ROOT = previousRoot;
    }
    await rm(artifactRoot, { recursive: true, force: true });
  }
}

test('operator Telegram notification posts a plain-text payload without a live Telegram send', async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousChat = process.env.TELEGRAM_CHAT_ID;
  const previousFetch = globalThis.fetch;

  process.env.TELEGRAM_BOT_TOKEN = ' packet-test-token\\n';
  process.env.TELEGRAM_CHAT_ID = ' 998877 ';

  let capturedUrl = '';
  let capturedBody: Record<string, unknown> | null = null;

  globalThis.fetch = (async (url: string | URL | globalThis.Request, init?: RequestInit) => {
    capturedUrl = String(url);
    capturedBody = JSON.parse(String(init?.body ?? '{}'));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  try {
    const sent = await sendLeadNotification(samplePayload);
    assert.equal(sent, true);
    assert.equal(capturedUrl, 'https://api.telegram.org/botpacket-test-token/sendMessage');
    assert.equal(capturedBody?.chat_id, '998877');
    assert.match(String(capturedBody?.text), /HOT LEAD - Material Solutions NJ/);
    assert.match(String(capturedBody?.text), /Telegram Payload Buyer/);
    assert.match(String(capturedBody?.text), /Narrow aisle replenishment/);
    assert.ok(!('parse_mode' in (capturedBody ?? {})));
  } finally {
    if (previousToken === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = previousToken;
    }
    if (previousChat === undefined) {
      delete process.env.TELEGRAM_CHAT_ID;
    } else {
      process.env.TELEGRAM_CHAT_ID = previousChat;
    }
    globalThis.fetch = previousFetch;
  }
});

test('lead capture persists first, then writes local operator-alert artifact when Telegram fails', async () => {
  await withArtifactRoot(async (artifactRoot) => {
    const insertedRows: unknown[] = [];
    let notificationCalled = false;

    const handler = createLeadCaptureHandler({
      getSupabaseAdmin() {
        return {
          from(table: string) {
            assert.equal(table, 'leads');
            return {
              insert(row: unknown) {
                insertedRows.push(row);
                return {
                  select() {
                    return {
                      single: async () => ({
                        data: {
                          ...((row ?? {}) as Record<string, unknown>),
                          id: 'lead-telegram-fallback',
                          created_at: '2026-04-27T00:00:00.000Z',
                          status: 'warm',
                          score: 55,
                          timeline: 'this_week',
                          budget_confirmed: true,
                          use_case: 'Narrow aisle replenishment',
                        },
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        } as never;
      },
      async sendLeadNotification() {
        notificationCalled = true;
        assert.equal(insertedRows.length, 1, 'lead row is persisted before Telegram operator alert');
        return false;
      },
    });

    const response = await handler(
      makeRequest({
        name: 'Fallback Artifact Buyer',
        email: 'fallback@example.com',
        subject: 'Reach truck quote',
        source: 'contact_form',
        page_origin: '/contact',
        cta_origin: 'contact_form_submit',
        message: 'Need a reach truck quote this week.',
        timeline: 'this_week',
        budget_confirmed: true,
        use_case: 'Narrow aisle replenishment',
      }),
    );

    assert.equal(notificationCalled, true);
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.operator_alerted, false);
    assert.match(payload.message, /instant alert failed/i);

    const alertArtifactPath = String(payload.alert_artifact_path);
    assert.match(alertArtifactPath, new RegExp(`${path.sep.replace(/\\/g, '\\\\')}operator_alerts${path.sep.replace(/\\/g, '\\\\')}capture_`));

    const alertArtifact = JSON.parse(await readFile(alertArtifactPath, 'utf8'));
    assert.equal(alertArtifact.kind, 'notification_failure');
    assert.equal(alertArtifact.operator_alerted, false);
    assert.equal(alertArtifact.reason, 'telegram_notification_failed_after_persist');

    const visitorId = (insertedRows[0] as { visitor_id: string }).visitor_id;
    const persistedArtifact = JSON.parse(
      await readFile(path.join(artifactRoot, 'persisted_records', `${visitorId}.json`), 'utf8'),
    );
    assert.equal(persistedArtifact.lead_id, 'lead-telegram-fallback');
    assert.equal(persistedArtifact.notification_sent, false);
    assert.equal(persistedArtifact.operator_alerted, false);
    assert.equal(persistedArtifact.alert_artifact_path, alertArtifactPath);
  });
});
