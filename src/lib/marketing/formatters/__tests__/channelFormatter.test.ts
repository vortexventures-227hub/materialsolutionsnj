import assert from 'node:assert/strict';
import test from 'node:test';

import inventorySource from '../../../../../data/forklift-inventory.json' assert { type: 'json' };
import {
  normalizeStandaloneUnit,
  type StandaloneForkliftJsonUnit,
} from '../../schemaTransformers';
import { generateMarketingAssets } from '../../canonical/generateMarketingAssets';
import {
  CHANNEL_FORMATTERS,
  EbayChannelFormatter,
  FacebookMarketplaceChannelFormatter,
  WebsiteChannelFormatter,
} from '../ChannelFormatter';

type InventorySource = {
  inventory: {
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

function buildSampleCanonical() {
  const inventory = inventorySource as InventorySource;
  const sample = inventory.inventory.standalone_units.find((unit) => unit.unit_id === 'RT-752R45TT-2018');
  assert.ok(sample, 'expected RT-752R45TT-2018 fixture');
  return generateMarketingAssets(normalizeStandaloneUnit(sample));
}

test('CHANNEL_FORMATTERS exposes the tier-auto phase-1 formatter contract', () => {
  assert.deepEqual(
    CHANNEL_FORMATTERS.map((formatter) => formatter.channel),
    ['website', 'facebook_marketplace', 'ebay'],
  );
  assert.ok(CHANNEL_FORMATTERS.every((formatter) => formatter.tier === 'auto'));
});

test('website formatter persists canonical marketing rows through injected storage', async () => {
  const canonical = buildSampleCanonical();
  const formatter = new WebsiteChannelFormatter();
  const persisted: string[] = [];

  const receipt = await formatter.publish(canonical, {
    persistCanonical: async (content) => {
      persisted.push(content.unit_id);
      return {
        id: 'row-1',
        created_at: '2026-04-21T18:00:00.000Z',
        updated_at: '2026-04-21T18:00:00.000Z',
        ...content,
      };
    },
  });

  assert.deepEqual(persisted, ['RT-752R45TT-2018']);
  assert.equal(receipt.channel, 'website');
  assert.equal(receipt.mode, 'storage');
  assert.equal(receipt.referenceId, 'row-1');
  assert.match(receipt.summary, /inventory_marketing/i);
});

test('facebook formatter builds bounded Graph payload through injected HTTP client', async () => {
  const canonical = buildSampleCanonical();
  const formatter = new FacebookMarketplaceChannelFormatter();
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];

  const receipt = await formatter.publish(canonical, {
    postJson: async (url, body) => {
      requests.push({ url, body: body as Record<string, unknown> });
      return { id: 'fb-item-123' };
    },
    env: {
      FACEBOOK_ACCESS_TOKEN: 'token',
      FACEBOOK_CATALOG_ID: 'catalog-42',
    },
  });

  assert.equal(requests.length, 1);
  assert.match(requests[0]!.url, /graph\.facebook\.com/);
  assert.equal(requests[0]!.body.id, canonical.unit_id);
  assert.equal(requests[0]!.body.title, canonical.platform_overrides.find((entry) => entry.channel === 'facebook_marketplace')?.title);
  assert.equal(receipt.channel, 'facebook_marketplace');
  assert.equal(receipt.mode, 'http');
  assert.equal(receipt.referenceId, 'fb-item-123');
});

test('ebay formatter builds Sell Inventory payload through injected HTTP client', async () => {
  const canonical = buildSampleCanonical();
  const formatter = new EbayChannelFormatter();
  const requests: Array<{ url: string; body: Record<string, unknown> }> = [];

  const receipt = await formatter.publish(canonical, {
    postJson: async (url, body) => {
      requests.push({ url, body: body as Record<string, unknown> });
      return { sku: canonical.unit_id };
    },
    env: {
      EBAY_INVENTORY_LOCATION_KEY: 'msnj-main',
    },
  });

  assert.equal(requests.length, 1);
  assert.match(requests[0]!.url, /sell\/inventory/);
  assert.equal(requests[0]!.body.sku, canonical.unit_id);
  assert.equal(receipt.channel, 'ebay');
  assert.equal(receipt.mode, 'http');
  assert.equal(receipt.referenceId, canonical.unit_id);
});
