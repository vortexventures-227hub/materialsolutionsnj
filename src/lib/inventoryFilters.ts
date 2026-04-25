import { defaultFilters, type InventoryFilters } from '@/components/inventory/FilterBar';

const allowedFuelTypes = new Set(['', 'electric']);

const filterKeys: Array<keyof InventoryFilters> = [
  'make',
  'fuel_type',
  'condition',
  'min_price',
  'max_price',
  'min_capacity',
  'sort',
];

export function parseInventoryFiltersFromSearchParams(
  searchParams: URLSearchParams | Pick<URLSearchParams, 'get'>
): InventoryFilters {
  const filters: InventoryFilters = { ...defaultFilters };

  for (const key of filterKeys) {
    const value = searchParams.get(key)?.trim();
    if (!value) continue;
    if (key === 'fuel_type' && !allowedFuelTypes.has(String(value))) continue;
    filters[key] = value;
  }

  return filters;
}

export function buildInventorySearchParams(filters: InventoryFilters): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of filterKeys) {
    const value = filters[key]?.trim();
    if (!value || value === defaultFilters[key]) continue;
    if (key === 'fuel_type' && !allowedFuelTypes.has(String(value))) continue;
    params.set(key, value);
  }

  return params;
}

export function inventoryFiltersEqual(a: InventoryFilters, b: InventoryFilters): boolean {
  return filterKeys.every((key) => a[key] === b[key]);
}
