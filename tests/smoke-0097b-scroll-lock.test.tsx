'use strict';
import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { cleanup, fireEvent, render } from '@testing-library/react';

const { default: InventoryGallery } = await import('@/components/InventoryGallery');
const { normalizeStandaloneUnit } = await import('@/lib/marketing/schemaTransformers');

function setupDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
  });
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  (globalThis as typeof globalThis & { document: Document }).document =
    dom.window.document as unknown as Document;
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
  });
  Object.assign(globalThis, {
    HTMLElement: dom.window.HTMLElement,
    HTMLVideoElement: dom.window.HTMLVideoElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    KeyboardEvent: dom.window.KeyboardEvent,
  });
}

function makeUnit() {
  return normalizeStandaloneUnit({
    unit_id: 'RT-752R45TT-2018',
    make: 'Raymond',
    model: '752R45TT',
    year: 2018,
    unit_type: 'Reach Truck',
    location: 'Baltimore, Maryland',
    serial: '752-18-AD67929',
    capacity_lbs: 4500,
    mast_collapsed_inches: 183,
    mast_extended_inches: 440,
    battery: '36V Battery + Charger',
    battery_voltage: 36,
    hours_approx: 2300,
    condition: 'Used — Running',
    asking_price_usd: 29500,
    media_paths: ['/tmp/image-1.jpg', '/tmp/image-2.jpg'],
    delivery_available: true,
    status: 'available',
    hold_reason: null,
  });
}

test.beforeEach(() => {
  setupDom();
});

test.afterEach(() => {
  cleanup();
  document.body.style.overflow = '';
});

// NEXUS-0097B re-smoke: body scroll lock — mobile 375
test('body scroll lock: overflow=hidden when lightbox opens (mobile_375)', () => {
  const view = render(<InventoryGallery unit={makeUnit()} />);
  assert.equal(document.body.style.overflow, '', 'body overflow should be empty before lightbox opens');

  fireEvent.click(view.getByLabelText(/open image in fullscreen viewer/i));
  assert.ok(view.getByRole('dialog', { name: /inventory media viewer/i }), 'dialog should be open');
  assert.equal(document.body.style.overflow, 'hidden', 'body overflow must be hidden when lightbox is open');

  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(view.queryByRole('dialog'), null, 'dialog should close on Escape');
  assert.equal(document.body.style.overflow, '', 'body overflow must reset after lightbox closes');
});

// NEXUS-0097B re-smoke: body scroll lock — desktop 1280
test('body scroll lock: overflow=hidden when lightbox opens (desktop_1280)', () => {
  const view = render(<InventoryGallery unit={makeUnit()} />);
  assert.equal(document.body.style.overflow, '', 'body overflow should be empty before lightbox opens');

  fireEvent.click(view.getByLabelText(/open image in fullscreen viewer/i));
  assert.ok(view.getByRole('dialog', { name: /inventory media viewer/i }), 'dialog should be open');
  assert.equal(document.body.style.overflow, 'hidden', 'body overflow must be hidden when lightbox is open');

  fireEvent.click(view.getByLabelText(/close lightbox/i));
  assert.equal(view.queryByRole('dialog'), null, 'dialog should close via close button');
  assert.equal(document.body.style.overflow, '', 'body overflow must reset after close button');
});

// NEXUS-0097B re-smoke: arrow key navigation
test('arrow key navigation: ArrowRight advances slide counter', () => {
  const view = render(<InventoryGallery unit={makeUnit()} />);

  fireEvent.click(view.getByLabelText(/open image in fullscreen viewer/i));
  assert.ok(view.getByRole('dialog'), 'lightbox must be open');
  assert.ok(view.getAllByText(/1 of 2/i).length > 0, 'initial counter must show 1 of 2');

  fireEvent.keyDown(document, { key: 'ArrowRight' });
  assert.ok(view.getAllByText(/2 of 2/i).length > 0, 'counter must advance to 2 of 2 after ArrowRight');
});
