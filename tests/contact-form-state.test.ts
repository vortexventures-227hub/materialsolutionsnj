import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getContactFormFeedback,
  validateContactForm,
  type ContactFormData,
} from '@/components/ui/contactFormState';

const baseForm: ContactFormData = {
  name: 'Jane Buyer',
  email: '',
  phone: '',
  company: 'Acme Warehousing',
  message: 'Need help with a forklift.',
};

test('validateContactForm accepts phone-only submissions', () => {
  assert.equal(
    validateContactForm({
      ...baseForm,
      phone: '973-555-0101',
    }),
    null
  );
});

test('validateContactForm rejects submissions without email or phone', () => {
  assert.equal(
    validateContactForm(baseForm),
    'Please provide an email address or phone number.'
  );
});

test('getContactFormFeedback returns truthful degraded success messaging', () => {
  const result = getContactFormFeedback({
    ok: true,
    status: 202,
    payload: {
      success: true,
      degraded: true,
      captureState: 'degraded',
      message:
        'We captured your request into our recovery queue and flagged the team for manual follow-up. If this is urgent, please call us at (973) 500-1010.',
    },
  });

  assert.equal(result.error, null);
  assert.deepEqual(result.feedback, {
    title: 'Request Received — Manual Follow-Up Queued',
    message:
      'We captured your request into our recovery queue and flagged the team for manual follow-up. If this is urgent, please call us at (973) 500-1010.',
    degraded: true,
  });
});

test('getContactFormFeedback rejects ambiguous legacy success payloads', () => {
  const result = getContactFormFeedback({
    ok: true,
    status: 200,
    payload: {
      success: true,
      message: 'Lead captured (database temporarily unavailable)',
    },
  });

  assert.equal(result.feedback, null);
  assert.equal(
    result.error,
    'We could not verify that your request was captured. Please reach us at info@materialsolutionsnj.com.'
  );
});

test('getContactFormFeedback returns failure messaging from API payload', () => {
  const result = getContactFormFeedback({
    ok: false,
    status: 400,
    payload: {
      success: false,
      degraded: false,
      captureState: 'failure',
      error: 'Please provide an email address or phone number.',
    },
  });

  assert.equal(result.feedback, null);
  assert.equal(result.error, 'Please provide an email address or phone number.');
});
