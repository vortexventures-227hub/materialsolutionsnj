import type { MetadataRoute } from 'next';

import inventorySource from '../../data/forklift-inventory.json';
import { normalizeInventorySlug } from '@/lib/inventorySeo';

const SITE_URL = 'https://www.materialsolutionsnj.com';
const CORE_PATHS = ['/', '/inventory', '/about', '/services', '/contact', '/faq', '/privacy', '/terms'] as const;

type InventorySource = {
  inventory: {
    last_updated?: string;
    lots: Array<{
      lot_id: string;
      status?: string | null;
      units: Array<{ unit_index: number }>;
    }>;
    standalone_units: Array<{ unit_id: string; status?: string | null }>;
  };
};

const inventoryData = inventorySource as InventorySource;

export default function sitemap(): MetadataRoute.Sitemap {
  const coreEntries: MetadataRoute.Sitemap = CORE_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '/inventory' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/inventory' ? 0.9 : 0.7,
    lastModified: inventoryData.inventory.last_updated,
  }));

  const inventoryEntries: MetadataRoute.Sitemap = [
    ...inventoryData.inventory.lots
      .filter((lot) => lot.status === 'available')
      .flatMap((lot) => lot.units.map((unit) => `${lot.lot_id}-unit-${unit.unit_index}`)),
    ...inventoryData.inventory.standalone_units
      .filter((unit) => unit.status === 'available')
      .map((unit) => unit.unit_id),
  ].map((id) => ({
    url: `${SITE_URL}/inventory/${normalizeInventorySlug(id)}`,
    changeFrequency: 'daily',
    priority: 0.8,
    lastModified: inventoryData.inventory.last_updated,
  }));

  return [...coreEntries, ...inventoryEntries];
}
