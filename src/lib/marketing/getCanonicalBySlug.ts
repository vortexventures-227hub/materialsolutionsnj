/**
 * getCanonicalBySlug — resolves a URL slug to canonical MarketingAssets.
 *
 * Uses the canonical pipeline (buildCanonical → generateMarketingAssets) so the
 * inventory detail page, JSON-LD scripts, and OG metadata all derive from the same
 * governed source of truth instead of the parallel pre-canonical stack.
 *
 * Caching: a module-level Map stores computed MarketingAssets per slug within the
 * server-process lifetime.  The underlying static inventory JSON changes only on
 * deploy, so stale-cache risk is zero and the cache provides O(1) repeat lookups
 * for the inventory detail page (which calls this on every render) and the
 * marketing-assets API route.
 */
import { findInventoryUnitBySlug } from '@/lib/inventorySeo';
import { generateMarketingAssetsFromInventory } from './generateMarketingAssets';
import { buildCanonical } from './canonicalFactory';
import type { MarketingAssets } from './generateMarketingAssets';
import type { CanonicalMarketingObject } from './types/CanonicalMarketingObject';

/** Slug → MarketingAssets.  Survives across requests within the same server process. */
const _cache = new Map<string, MarketingAssets>();

/** Slug → CanonicalMarketingObject.  Cached separately so callers that need the raw
 *  canonical object (e.g. batch publish) get a cache hit without recomputing. */
const _rawCache = new Map<string, CanonicalMarketingObject>();

export function getCanonicalBySlug(slug: string): MarketingAssets | null {
  // Normalize once to match what findInventoryUnitBySlug does internally
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (_cache.has(normalized)) return _cache.get(normalized)!;

  const unit = findInventoryUnitBySlug(slug);
  if (!unit) return null;

  const assets = generateMarketingAssetsFromInventory(unit);
  _cache.set(normalized, assets);
  return assets;
}

/**
 * Returns the raw CanonicalMarketingObject for a slug, using an in-process cache
 * so the canonical-prewarm route can pre-populate the cache before the ops window.
 *
 * Returns null if the slug is not found.
 */
export function getRawCanonicalBySlug(slug: string): CanonicalMarketingObject | null {
  const normalized = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (_rawCache.has(normalized)) return _rawCache.get(normalized)!;

  const unit = findInventoryUnitBySlug(slug);
  if (!unit) return null;

  const canonical = buildCanonical(unit);
  _rawCache.set(normalized, canonical);
  return canonical;
}

/** Exposed for tests / cron scripts that need to pre-warm or clear the cache. */
export function clearCanonicalCache(): void {
  _cache.clear();
  _rawCache.clear();
}
