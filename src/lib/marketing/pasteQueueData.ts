import inventorySource from '../../../data/forklift-inventory.json';

import {
  assemblePublishPayload,
  type PublishPayload,
  type PublishTarget,
} from './publishAssembly';
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  type ForkliftUnit,
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
} from './schemaTransformers';

type InventorySource = {
  inventory: {
    last_updated: string;
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

export const PASTE_QUEUE_TARGETS: PublishTarget[] = [
  'facebook_marketplace',
  'craigslist',
  'ebay',
  'website',
  'email_campaign',
];

export const PASTE_QUEUE_TARGET_LABELS: Record<PublishTarget, string> = {
  facebook_marketplace: 'Facebook Marketplace',
  craigslist: 'Craigslist',
  ebay: 'eBay',
  website: 'Website',
  email_campaign: 'Email',
};

export const PASTE_QUEUE_POSTING_URLS: Record<PublishTarget, string> = {
  facebook_marketplace: 'https://www.facebook.com/marketplace/create/item',
  craigslist: 'https://accounts.craigslist.org/login',
  ebay: 'https://www.ebay.com/sl/sell',
  website: 'Internal — pushes via Publish Button when API ready',
  email_campaign: 'Feed to SendGrid template',
};

const inventoryData = inventorySource as InventorySource;

export function isPasteQueueAuthorized(token?: string): boolean {
  const expected = process.env.ADMIN_PASTE_QUEUE_TOKEN;
  return Boolean(expected && token && token === expected);
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function sentenceCaseUnitType(unitType: string): string {
  const normalized = unitType.toLowerCase();

  if (normalized.includes('order picker')) return 'Order Picker';
  if (normalized.includes('reach truck')) return 'Reach Truck';
  if (normalized.includes('swing reach')) return 'Swing Reach';
  if (normalized.includes('articulated') || normalized.includes('bendi')) return 'Articulated Forklift';

  return unitType;
}

export function getUnitDisplayName(unit: ForkliftUnit): string {
  return collapseWhitespace(
    [unit.year, unit.make, unit.model, sentenceCaseUnitType(unit.unit_type)]
      .filter(Boolean)
      .join(' ')
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function parseLocation(location: string): { city: string; state: string } {
  const cleaned = collapseWhitespace(location.replace(/\s*\(.*?\)\s*/g, ''));
  const [city = '', state = ''] = cleaned.split(',').map((part) => part.trim());
  const normalizedState =
    state === 'Maryland' ? 'MD' : state === 'New Jersey' ? 'NJ' : state.toUpperCase();

  return {
    city: city || cleaned,
    state: normalizedState,
  };
}

export function getAllPasteQueueUnits(): ForkliftUnit[] {
  const standaloneUnits = inventoryData.inventory.standalone_units.map((unit) =>
    normalizeStandaloneUnit(unit)
  );
  const lotUnits = inventoryData.inventory.lots.flatMap((lot) =>
    lot.units.map((member) => normalizeLotUnitMember(lot, member))
  );

  return [...lotUnits, ...standaloneUnits];
}

export function getPasteQueueUnitById(unitId: string): ForkliftUnit | null {
  return getAllPasteQueueUnits().find((unit) => unit.unit_id === unitId) ?? null;
}

export function getPasteQueuePayloads(unit: ForkliftUnit): Record<PublishTarget, PublishPayload> {
  return PASTE_QUEUE_TARGETS.reduce(
    (acc, target) => {
      acc[target] = assemblePublishPayload(unit, target);
      return acc;
    },
    {} as Record<PublishTarget, PublishPayload>
  );
}

export function getPasteQueueGeneratedTimestamp(): string {
  return `${inventoryData.inventory.last_updated}T00:00:00Z`;
}
