import test from 'node:test';
import assert from 'node:assert/strict';

import inventorySource from '../data/forklift-inventory.json';
import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets';
import { getCanonicalContentBySlug } from '../src/lib/marketing/canonical/persist';
import { normalizeStandaloneUnit, type StandaloneForkliftJsonUnit } from '../src/lib/marketing/schemaTransformers';

const reachTruck = normalizeStandaloneUnit(
  inventorySource.inventory.standalone_units.find(
    (unit) => unit.unit_id === 'RT-970CSR30T-2016'
  ) as StandaloneForkliftJsonUnit
);

function makeFakeSelectClient(row: Record<string, unknown> | null, error: { message: string } | null = null) {
  return {
    from(table: string) {
      assert.equal(table, 'inventory_marketing');

      return {
        select(columns: string) {
          assert.equal(columns, '*');

          return {
            eq(column: string, value: string) {
              assert.equal(column, 'canonical_slug');
              assert.equal(value, 'rt-970csr30t-2016');

              return {
                maybeSingle: async () => ({ data: row, error }),
              };
            },
          };
        },
      };
    },
  };
}

test('getCanonicalContentBySlug returns a validated persisted canonical row when one exists', async () => {
  const canonical = generateMarketingAssets(reachTruck);
  const persisted = {
    id: 'inventory-marketing-row-1',
    created_at: '2026-04-22T14:00:00.000Z',
    updated_at: '2026-04-22T14:00:00.000Z',
    ...canonical,
    meta_description: 'Persisted copy edit for live review.',
  };

  const result = await getCanonicalContentBySlug('rt-970csr30t-2016', makeFakeSelectClient(persisted));

  assert.ok(result);
  assert.equal(result?.id, 'inventory-marketing-row-1');
  assert.equal(result?.canonical_slug, 'rt-970csr30t-2016');
  assert.equal(result?.meta_description, 'Persisted copy edit for live review.');
});

test('getCanonicalContentBySlug returns null when the persisted row is missing or unreadable', async () => {
  const missing = await getCanonicalContentBySlug('rt-970csr30t-2016', makeFakeSelectClient(null));
  assert.equal(missing, null);

  const errored = await getCanonicalContentBySlug(
    'rt-970csr30t-2016',
    makeFakeSelectClient(null, { message: 'boom' })
  );
  assert.equal(errored, null);
});