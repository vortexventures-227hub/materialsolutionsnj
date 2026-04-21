import test from 'node:test';
import assert from 'node:assert/strict';

import { createCallbackHandler } from '@/app/api/leads/callback/handler';

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/leads/callback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('/api/leads/callback notifies operators when a callback is marked contacted', async () => {
  const notifications: unknown[] = [];
  const handler = createCallbackHandler({
    getSupabaseAdmin() {
      return {
        from(table: string) {
          assert.equal(table, 'leads');
          return {
            update(values: Record<string, unknown>) {
              return {
                eq(column: string, leadId: string) {
                  assert.equal(column, 'id');
                  assert.equal(leadId, 'lead-123');
                  return {
                    select() {
                      return {
                        single: async () => ({
                          data: {
                            id: 'lead-123',
                            visitor_id: 'capture-123',
                            name: 'Callback Buyer',
                            email: 'callback@example.com',
                            phone: '973-555-0101',
                            company: 'Material Solutions',
                            subject: 'Callback request',
                            source: 'david_chat',
                            page_origin: '/inventory',
                            cta_origin: 'callback_request',
                            listing_id: null,
                            listing_slug: null,
                            listing_title: null,
                            service_slug: null,
                            score: 80,
                            status: values.status,
                            interests: ['callback_request'],
                            conversation_summary: 'Buyer asked for a callback after browsing inventory.',
                            timeline: null,
                            budget_confirmed: false,
                            use_case: 'Need help selecting a unit',
                            created_at: '2026-04-20T23:00:00.000Z',
                            updated_at: values.updated_at,
                            last_activity: values.last_activity,
                            notified: true,
                          },
                          error: null,
                        }),
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    async sendLeadNotification(payload) {
      notifications.push(payload);
      return true;
    },
  });

  const response = await handler(makeRequest({ leadId: 'lead-123' }));

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.operator_alerted, true);
  assert.equal(notifications.length, 1);
  const notification = notifications[0] as {
    conversationSummary: string;
    inventoryInterests: string[];
    lead: { status: string };
  };
  assert.equal(notification.lead.status, 'contacted');
  assert.match(notification.conversationSummary, /callback/i);
  assert.deepEqual(notification.inventoryInterests, ['callback_request']);
});

test('/api/leads/callback still succeeds but reports delayed alert when operator notification fails', async () => {
  const handler = createCallbackHandler({
    getSupabaseAdmin() {
      return {
        from() {
          return {
            update(values: Record<string, unknown>) {
              return {
                eq() {
                  return {
                    select() {
                      return {
                        single: async () => ({
                          data: {
                            id: 'lead-456',
                            visitor_id: 'capture-456',
                            name: 'Callback Delay Buyer',
                            email: 'delay@example.com',
                            phone: '973-555-0202',
                            company: null,
                            subject: 'Need a callback',
                            source: 'contact_form',
                            page_origin: '/contact',
                            cta_origin: 'contact_form_submit',
                            listing_id: null,
                            listing_slug: null,
                            listing_title: null,
                            service_slug: null,
                            score: 40,
                            status: values.status,
                            interests: ['callback_request'],
                            conversation_summary: 'Buyer asked the team to call back.',
                            timeline: null,
                            budget_confirmed: false,
                            use_case: null,
                            created_at: '2026-04-20T23:05:00.000Z',
                            updated_at: values.updated_at,
                            last_activity: values.last_activity,
                            notified: false,
                          },
                          error: null,
                        }),
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    async sendLeadNotification() {
      return false;
    },
  });

  const response = await handler(makeRequest({ leadId: 'lead-456' }));

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.equal(payload.operator_alerted, false);
  assert.match(payload.message, /alert failed|follow-up may be delayed/i);
});
