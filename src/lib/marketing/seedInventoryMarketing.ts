import { readFile } from 'node:fs/promises';

import type { InventoryMarketingRow } from './canonical/persist';
import { upsertCanonicalContent } from './canonical/persist';
import { generateMarketingAssets } from './canonical/generateMarketingAssets';
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  type ForkliftUnit,
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
} from './schemaTransformers';

export interface InventorySeedSource {
  inventory: {
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
}

export interface SeedInventoryMarketingSummary {
  totalUnits: number;
  upsertedUnits: string[];
  skippedUnits: string[];
  canonicalRows: ReturnType<typeof generateMarketingAssets>[];
}

export interface SeedInventoryMarketingOptions {
  inventoryPath: string;
  dryRun?: boolean;
  unitIdFilter?: string | null;
  listExisting?: (unitIds: string[]) => Promise<Record<string, InventoryMarketingComparable>>;
  upsert?: (content: ReturnType<typeof generateMarketingAssets>) => Promise<InventoryMarketingRow>;
}

type InventoryMarketingComparable = ReturnType<typeof generateMarketingAssets> | InventoryMarketingRow;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const objectValue = value as Record<string, unknown>;
  return `{${Object.keys(objectValue)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`)
    .join(',')}}`;
}

function stripRowMetadata(value: InventoryMarketingComparable): ReturnType<typeof generateMarketingAssets> {
  const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...rest } = value as InventoryMarketingComparable & {
    id?: string;
    created_at?: string;
    updated_at?: string;
  };
  return rest as ReturnType<typeof generateMarketingAssets>;
}

export async function loadInventorySeedSource(inventoryPath: string): Promise<InventorySeedSource> {
  const raw = await readFile(inventoryPath, 'utf8');
  return JSON.parse(raw) as InventorySeedSource;
}

export function collectForkliftUnits(source: InventorySeedSource): ForkliftUnit[] {
  const standalone = source.inventory.standalone_units.map((unit) => normalizeStandaloneUnit(unit));
  const lotMembers = source.inventory.lots.flatMap((lot) => lot.units.map((member) => normalizeLotUnitMember(lot, member)));
  return [...standalone, ...lotMembers];
}

export function collectCanonicalMarketingRows(source: InventorySeedSource, unitIdFilter?: string | null) {
  return collectForkliftUnits(source)
    .filter((unit) => (unitIdFilter ? unit.unit_id === unitIdFilter : true))
    .map((unit) => generateMarketingAssets(unit));
}

export async function seedInventoryMarketing(
  options: SeedInventoryMarketingOptions
): Promise<SeedInventoryMarketingSummary> {
  const source = await loadInventorySeedSource(options.inventoryPath);
  const canonicalRows = collectCanonicalMarketingRows(source, options.unitIdFilter);
  const unitIds = canonicalRows.map((row) => row.unit_id);
  const existing = options.listExisting ? await options.listExisting(unitIds) : {};
  const upsert = options.upsert ?? upsertCanonicalContent;
  const upsertedUnits: string[] = [];
  const skippedUnits: string[] = [];

  for (const canonical of canonicalRows) {
    const current = existing[canonical.unit_id];
    if (current) {
      const currentSignature = stableStringify(stripRowMetadata(current));
      const nextSignature = stableStringify(canonical);
      if (currentSignature === nextSignature) {
        skippedUnits.push(canonical.unit_id);
        continue;
      }
    }

    if (!options.dryRun) {
      await upsert(canonical);
    }
    upsertedUnits.push(canonical.unit_id);
  }

  return {
    totalUnits: canonicalRows.length,
    upsertedUnits,
    skippedUnits,
    canonicalRows,
  };
}
