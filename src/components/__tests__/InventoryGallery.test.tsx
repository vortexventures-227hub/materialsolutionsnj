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
  (globalThis as typeof globalThis & { window: Window }).window = dom.window as unknown as Window;
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

function makeUnit(overrides: Partial<ReturnType<typeof normalizeStandaloneUnit>> = {}) {
  return {
    ...normalizeStandaloneUnit({
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
      media_paths: [
        '/tmp/image-1.jpg',
        '/tmp/image-2.jpg',
        '/tmp/image-3.jpg',
        '/tmp/image-4.jpg',
        '/tmp/image-5.jpg',
      ],
      delivery_available: true,
      status: 'available',
      hold_reason: null,
    }),
    ...overrides,
  };
}

test.beforeEach(() => {
  setupDom();
});

test.afterEach(() => {
  cleanup();
});

test('renders empty-state CTA when unit has no media', () => {
  const view = render(<InventoryGallery unit={makeUnit({ media_paths: [] })} />);

  assert.ok(view.getByRole('heading', { name: /photos coming soon/i, level: 2 }));
  assert.ok(view.getByRole('link', { name: /ask david for a walkthrough/i }));
});

test('renders single media item without thumbnail strip', () => {
  const view = render(<InventoryGallery unit={makeUnit({ media_paths: ['/tmp/only-image.jpg'] })} />);

  assert.equal(view.getAllByRole('img').length >= 1, true);
  assert.equal(view.queryAllByRole('button', { name: /show .* of/i }).length, 0);
});

test('renders thumbnails and video item for mixed media gallery', () => {
  const view = render(
    <InventoryGallery
      unit={makeUnit({
        media_paths: [
          '/tmp/image-1.jpg',
          '/tmp/image-2.jpg',
          '/tmp/image-3.jpg',
          '/tmp/image-4.jpg',
          '/tmp/image-5.jpg',
          '/tmp/walkthrough.mp4',
        ],
      })}
    />
  );

  assert.ok(view.getByText(/1 \/ 6/i));
  assert.ok(view.getByLabelText(/show video 6 of 6/i));
});

test('opens and closes lightbox with keyboard support', () => {
  const view = render(<InventoryGallery unit={makeUnit()} />);

  fireEvent.click(view.getByLabelText(/open image in fullscreen viewer/i));
  assert.ok(view.getByRole('dialog', { name: /inventory media viewer/i }));

  fireEvent.keyDown(document, { key: 'Escape' });
  assert.equal(view.queryByRole('dialog', { name: /inventory media viewer/i }), null);
});
