import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { JSDOM } from 'jsdom';
import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LeadCaptureForm, { buildLeadCapturePayload, validateLeadCaptureForm } from '@/components/LeadCaptureForm';

const units = [
  { id: 'MD-LOT-001-unit-1', label: '2020 Raymond 750-R45TT Order Picker' },
  { id: 'RT-752R45TT-2018', label: '2018 Raymond 752-R45TT Reach Truck' },
];

let dom: JSDOM;
let originalFetch: typeof globalThis.fetch | undefined;

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://www.materialsolutionsnj.com/inventory',
  });

  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLInputElement = dom.window.HTMLInputElement;
  globalThis.HTMLFormElement = dom.window.HTMLFormElement;
  globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
  globalThis.Node = dom.window.Node;
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
  });
  Object.defineProperty(dom.window.HTMLElement.prototype, 'attachEvent', {
    value: () => {},
    configurable: true,
  });
  Object.defineProperty(dom.window.HTMLElement.prototype, 'detachEvent', {
    value: () => {},
    configurable: true,
  });
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  cleanup();
  dom.window.close();
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    // @ts-expect-error cleanup
    delete globalThis.fetch;
  }
});

test('validation requires a real email and a 10-character message', () => {
  const errors = validateLeadCaptureForm({
    name: 'Chris',
    email: 'not-an-email',
    phone: '',
    unitId: 'RT-752R45TT-2018',
    message: 'Too short',
    preferredContact: 'email',
    honeypot: '',
  });

  assert.equal(errors.email, 'Enter a valid email address.');
  assert.equal(errors.message, 'Please share at least 10 characters so we can help.');
});

test('detail form preselects the passed unit', () => {
  const view = render(
    <LeadCaptureForm
      units={units}
      formSource="inventory_detail"
      pageOrigin="/inventory/rt-752r45tt-2018"
      preselectedUnitId="RT-752R45TT-2018"
    />
  );

  const select = view.getByLabelText('Unit of interest') as HTMLSelectElement;
  assert.equal(select.value, 'RT-752R45TT-2018');
});

test('buildLeadCapturePayload dual-writes the NeonForge keys and current handler keys', () => {
  const payload = buildLeadCapturePayload({
    values: {
      name: 'Chris',
      email: 'chris@example.com',
      phone: '123-456-7890',
      unitId: 'RT-752R45TT-2018',
      message: 'Need delivery timing for this reach truck.',
      preferredContact: 'phone',
      honeypot: '',
    },
    formSource: 'inventory_detail',
    pageOrigin: '/inventory/rt-752r45tt-2018',
    unitLabel: '2018 Raymond 752-R45TT Reach Truck',
    listingContext: {
      id: 'RT-752R45TT-2018',
      slug: 'rt-752r45tt-2018',
      title: '2018 Raymond 752-R45TT Reach Truck',
    },
  });

  assert.equal(payload.unit_id_of_interest, 'RT-752R45TT-2018');
  assert.equal(payload.message_body, 'Need delivery timing for this reach truck.');
  assert.equal(payload.preferred_contact, 'phone');
  assert.equal(payload.form_source, 'inventory_detail');
  assert.equal(payload.message, payload.message_body);
  assert.equal(payload.source, 'inventory_detail');
  assert.equal(payload.listing_id, 'RT-752R45TT-2018');
  assert.match(payload.subject, /Reach Truck/);
});

test('submitting valid input posts to /api/leads and shows the success state', async () => {
  const user = userEvent.setup({ document: globalThis.document });
  let capturedBody: Record<string, unknown> | null = null;

  globalThis.fetch = (async (_input, init) => {
    capturedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof globalThis.fetch;

  const view = render(
    <LeadCaptureForm
      units={units}
      formSource="home"
      pageOrigin="/"
      submitLabel="Send to David"
    />
  );

  await user.type(view.getByPlaceholderText('Your full name'), 'Chris Vortex');
  await user.type(view.getByPlaceholderText('you@company.com'), 'chris@example.com');
  await user.type(
    view.getByLabelText('Message / question'),
    'Looking for a reach truck that can ship this week.'
  );
  await user.selectOptions(view.getByLabelText('Unit of interest'), 'RT-752R45TT-2018');
  await user.click(view.getByRole('button', { name: 'Send to David' }));

  await waitFor(() => {
    assert.ok(view.getByText(/David will follow up within about 5 minutes/i));
  });

  assert.ok(capturedBody);
  const submittedBody = capturedBody as Record<string, unknown>;
  assert.equal(submittedBody.name, 'Chris Vortex');
  assert.equal(submittedBody.unit_id_of_interest, 'RT-752R45TT-2018');
  assert.equal(submittedBody.form_source, 'home');
});

test('failed submit shows the fallback email and starts cooldown feedback', async () => {
  const user = userEvent.setup({ document: globalThis.document });

  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: 'bad gateway' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof globalThis.fetch;

  const view = render(
    <LeadCaptureForm
      units={units}
      formSource="inventory_index"
      pageOrigin="/inventory"
    />
  );

  await user.type(view.getByPlaceholderText('Your full name'), 'Chris Vortex');
  await user.type(view.getByPlaceholderText('you@company.com'), 'chris@example.com');
  await user.type(view.getByLabelText('Message / question'), 'Need pricing and freight quote.');
  await user.click(view.getByRole('button', { name: 'Send to David' }));

  await waitFor(() => {
    assert.ok(view.getByText(/Retry opens in/i));
  });

  assert.ok(view.getByText(/david@materialsolutionsnj\.com/i));
});
