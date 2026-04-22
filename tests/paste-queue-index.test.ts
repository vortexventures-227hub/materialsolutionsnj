import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { PasteQueueIndexClient } from '../src/components/admin/paste-queue/PasteQueueIndexClient.tsx';
import { getAllPasteQueueUnits } from '../src/lib/marketing/pasteQueueData.ts';

test('paste queue index renders batch summary banner and preview control', () => {
  const html = renderToStaticMarkup(
    React.createElement(PasteQueueIndexClient, {
      token: 'test-token',
      units: getAllPasteQueueUnits().slice(0, 2),
      marketingSummary: {
        eligible: 1,
        on_hold: 1,
        lot_only: 1,
        total: 2,
      },
    })
  );

  assert.match(html, /Marketing pipeline/);
  assert.match(html, /Live batch copy health/);
  assert.match(html, /Preview All Copy/);
  assert.match(html, /Publish-ready/);
  assert.match(html, /On hold/);
  assert.match(html, /Lot-only/);
  assert.match(html, /Total/);
});