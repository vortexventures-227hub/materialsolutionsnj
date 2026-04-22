import type { MetadataRoute } from 'next';

import inventorySource from '../../data/forklift-inventory.json';
import { normalizedInventoryUnits } from '@/lib/inventorySeo';

const SITE_URL = 'https://www.materialsolutionsnj.com';
const CORE_PATHS = ['/', '/inventory', '/about', '/services', '/contact', '/faq', '/privacy', '/terms'] as const;

const inventoryData = inventorySource as { inventory: { last_updated?: string } };

export default function sitemap(): MetadataRoute.Sitemap {
  const coreEntries: MetadataRoute.Sitemap = CORE_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '/inventory' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/inventory' ? 0.9 : 0.7,
    lastModified: inventoryData.inventory.last_updated,
  }));

  const inventoryEntries: MetadataRoute.Sitemap = normalizedInventoryUnits
    .filter((unit) => unit.source_kind === 'standalone' && unit.status === 'available')
    .map((unit) => ({
      url: `${SITE_URL}/inventory/${unit.canonical_slug}`,
      changeFrequency: 'daily',
      priority: 0.8,
      lastModified: inventoryData.inventory.last_updated,
    }));

  return [...coreEntries, ...inventoryEntries];
}
