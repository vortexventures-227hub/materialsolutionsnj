import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../data/forklift-inventory.json';
import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets';
import { upsertCanonicalContent } from '../src/lib/marketing/canonical/persist';
import { normalizeStandaloneUnit, type StandaloneForkliftJsonUnit } from '../src/lib/marketing/schemaTransformers';

const reachTruck = normalizeStandaloneUnit(
  inventorySource.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-970CSR30T-2016'
  ) as StandaloneForkliftJsonUnit
);

test('upsertCanonicalContent writes normalized canonical content into assets_json for the inventory_marketing cache row', async () => {
  const canonical = generateMarketingAssets(reachTruck);
  const normalizedCanonical = {
    ...canonical,
    source_updated_at: new Date(canonical.source_updated_at).toISOString(),
    generated_at: new Date(canonical.generated_at).toISOString(),
  };

  let capturedPayload: Record<string, unknown> | null = null;

  const fakeClient = {
    from(table: string) {
      assert.equal(table, 'inventory_marketing');

      return {
        upsert(payload: Record<string, unknown>, options: { onConflict: string }) {
          capturedPayload = payload;
          assert.equal(options.onConflict, 'unit_id');

          return {
            select(columns: string) {
              assert.equal(columns, '*');

              return {
                single: async () => ({
                  data: {
                    id: 'inventory-marketing-row-1',
                    created_at: '2026-04-23T10:00:00.000Z',
                    updated_at: '2026-04-23T10:00:00.000Z',
                    ...payload,
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

  const persisted = await upsertCanonicalContent(canonical, fakeClient);

  assert.ok(capturedPayload);
  assert.deepEqual(capturedPayload?.assets_json, normalizedCanonical);
  assert.equal(persisted.unit_id, canonical.unit_id);
});
