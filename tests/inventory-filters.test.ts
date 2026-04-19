import test from 'node:test';
import assert from 'node:assert/strict';

import { defaultFilters } from '@/components/inventory/FilterBar';
import {
  buildInventorySearchParams,
  inventoryFiltersEqual,
  parseInventoryFiltersFromSearchParams,
} from '@/lib/inventoryFilters';

test('parseInventoryFiltersFromSearchParams hydrates footer fuel filters from URL params', () => {
  const filters = parseInventoryFiltersFromSearchParams(
    new URLSearchParams('fuel_type=diesel&sort=price_desc')
  );

  assert.equal(filters.fuel_type, 'diesel');
  assert.equal(filters.sort, 'price_desc');
  assert.equal(filters.make, '');
  assert.equal(filters.min_capacity, '');
});

test('buildInventorySearchParams omits defaults so clear filters returns canonical inventory URL', () => {
  const params = buildInventorySearchParams(defaultFilters);

  assert.equal(params.toString(), '');
});

test('buildInventorySearchParams preserves non-default inventory filters for router sync', () => {
  const params = buildInventorySearchParams({
    ...defaultFilters,
    fuel_type: 'propane',
    min_capacity: '5000',
  });

  assert.equal(params.get('fuel_type'), 'propane');
  assert.equal(params.get('min_capacity'), '5000');
  assert.equal(params.get('sort'), null);
});

test('inventoryFiltersEqual distinguishes URL-driven filter state changes', () => {
  assert.equal(
    inventoryFiltersEqual(defaultFilters, { ...defaultFilters, fuel_type: 'electric' }),
    false
  );
  assert.equal(inventoryFiltersEqual(defaultFilters, { ...defaultFilters }), true);
});
