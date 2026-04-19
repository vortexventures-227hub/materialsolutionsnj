import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFallbackQueueEntry,
  buildHardFailureResponse,
  buildQueuedDegradedResponse,
  normalizeLeadCapturePayload,
} from '@/lib/leads/capture';

test('normalizeLeadCapturePayload keeps phone-only leads truthful and preserves routing context', () => {
  const normalized = normalizeLeadCapturePayload(
    {
      name: 'Jane Buyer',
      phone: '973-555-0101',
      subject: 'Wire-Guided Systems',
      source: 'wire_guided_quote',
      page_origin: '/services/wire-guided',
      cta_origin: 'wire_guided_hero_quote',
      listing_id: 'listing-123',
      listing_slug: 'toyota-8fgcu25',
      listing_title: 'Toyota 8FGCU25',
      service_slug: 'wire-guided',
      message: 'Need a quote this week.',
    },
    {
      now: '2026-04-17T12:00:00.000Z',
      captureIdFactory: () => 'capture-fixed',
    }
  );

  assert.equal(normalized.insert.visitor_id, 'capture-fixed');
  assert.equal(normalized.insert.phone, '973-555-0101');
  assert.equal(normalized.insert.email, null);
  assert.equal(normalized.captureId, 'capture-fixed');
  assert.deepEqual(
    normalized.interests,
    [
      'Wire-Guided Systems',
      'wire_guided_quote',
      'page_origin:/services/wire-guided',
      'cta_origin:wire_guided_hero_quote',
      'listing_id:listing-123',
      'listing_slug:toyota-8fgcu25',
      'listing_title:Toyota 8FGCU25',
      'service_slug:wire-guided',
    ]
  );
  assert.match(normalized.insert.conversation_summary ?? '', /Subject: Wire-Guided Systems/);
  assert.match(normalized.insert.conversation_summary ?? '', /Source: wire_guided_quote/);
  assert.match(normalized.insert.conversation_summary ?? '', /Page Origin: \/services\/wire-guided/);
  assert.match(normalized.insert.conversation_summary ?? '', /CTA Origin: wire_guided_hero_quote/);
  assert.match(normalized.insert.conversation_summary ?? '', /Listing ID: listing-123/);
  assert.match(normalized.insert.conversation_summary ?? '', /Need a quote this week\./);
});

test('buildFallbackQueueEntry writes durable retry ownership details for the queue record', () => {
  const normalized = normalizeLeadCapturePayload(
    {
      name: 'Jane Buyer',
      phone: '973-555-0101',
      subject: 'Wire-Guided Systems',
      source: 'wire_guided_quote',
      page_origin: '/services/wire-guided',
      cta_origin: 'wire_guided_hero_quote',
      message: 'Need a quote this week.',
    },
    {
      now: '2026-04-17T12:00:00.000Z',
      captureIdFactory: () => 'capture-fixed',
    }
  );

  const entry = buildFallbackQueueEntry(normalized, {
    now: '2026-04-17T12:00:00.000Z',
    queueIdFactory: () => 'queue-42',
    retryDeadline: '2026-04-17T12:15:00.000Z',
    degradedReason: 'primary_persistence_failed',
    alertArtifactPath: '/tmp/operator-alert.json',
  });

  assert.equal(entry.queueId, 'queue-42');
  assert.equal(entry.captureId, 'capture-fixed');
  assert.equal(entry.retryOwner, 'sales_ops');
  assert.equal(entry.retryDeadline, '2026-04-17T12:15:00.000Z');
  assert.equal(entry.alertArtifactPath, '/tmp/operator-alert.json');
  assert.equal(entry.payload.subject, 'Wire-Guided Systems');
  assert.equal(entry.payload.page_origin, '/services/wire-guided');
  assert.equal(entry.payload.cta_origin, 'wire_guided_hero_quote');
});

test('buildQueuedDegradedResponse returns queue ids and retry ownership for durable fallback', () => {
  const response = buildQueuedDegradedResponse({
    queueId: 'queue-42',
    captureId: 'capture-fixed',
    degradedReason: 'primary_persistence_failed',
    retryOwner: 'sales_ops',
    retryDeadline: '2026-04-17T12:15:00.000Z',
    operatorAlerted: true,
    alertArtifactPath: '/tmp/operator-alert.json',
  });

  assert.deepEqual(response, {
    success: true,
    degraded: true,
    captureState: 'degraded',
    lead_id: null,
    queue_id: 'queue-42',
    capture_id: 'capture-fixed',
    persisted_at: null,
    degraded_reason: 'primary_persistence_failed',
    operator_alerted: true,
    retry_owner: 'sales_ops',
    retry_deadline: '2026-04-17T12:15:00.000Z',
    alert_artifact_path: '/tmp/operator-alert.json',
  });
});

test('buildHardFailureResponse stays non-success when neither persistence nor fallback can be trusted', () => {
  const response = buildHardFailureResponse({
    errorCode: 'lead_capture_unavailable',
    message: 'We could not save your request. Please call us at (973) 500-1010.',
    operatorAlerted: false,
  });

  assert.deepEqual(response, {
    success: false,
    degraded: false,
    captureState: 'failure',
    error_code: 'lead_capture_unavailable',
    retryable: true,
    operator_alerted: false,
    message: 'We could not save your request. Please call us at (973) 500-1010.',
  });
});
