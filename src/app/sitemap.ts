import type { MetadataRoute } from 'next';

import inventorySource from '../../data/forklift-inventory.json';
import { getBlogPosts, getBlogUrl } from '@/lib/blog';
import { normalizedInventoryUnits } from '@/lib/inventorySeo';

const SITE_URL = 'https://www.materialsolutionsnj.com';
const CORE_PATHS = [
  '/',
  '/inventory',
  '/blog',
  '/about',
  '/services',
  '/services/osha-training',
  '/services/racking',
  '/services/wire-guided',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
] as const;

const inventoryData = inventorySource as {
  inventory: {
    last_updated?: string;
    lots?: Array<{ lot_id?: string; status?: string }>;
  };
};

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

  const lotEntries: MetadataRoute.Sitemap = (inventoryData.inventory.lots ?? [])
    .filter((lot) => lot.lot_id && lot.status === 'available')
    .map((lot) => ({
      url: `${SITE_URL}/inventory/${lot.lot_id}`,
      changeFrequency: 'daily',
      priority: 0.8,
      lastModified: inventoryData.inventory.last_updated,
    }));

  const blogEntries: MetadataRoute.Sitemap = getBlogPosts().map((post) => ({
    url: getBlogUrl(post.slug),
    changeFrequency: 'weekly',
    priority: 0.65,
    lastModified: post.datePublished,
  }));

  return [...coreEntries, ...lotEntries, ...inventoryEntries, ...blogEntries];
}
