import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

import inventorySource from '../data/forklift-inventory.json';

const sitemapPath = new URL('../src/app/sitemap.ts', import.meta.url);
const robotsPath = new URL('../src/app/robots.ts', import.meta.url);

test('sitemap and robots metadata routes exist', () => {
  assert.equal(existsSync(sitemapPath), true, 'expected src/app/sitemap.ts to exist');
  assert.equal(existsSync(robotsPath), true, 'expected src/app/robots.ts to exist');
});

test('root layout metadata sets the production metadataBase for social URLs', () => {
  const layoutSource = readFileSync(new URL('../src/app/layout.tsx', import.meta.url), 'utf8');
  const metadataBlock = layoutSource.match(/export const metadata: Metadata = \{([\s\S]*?)\n\};/);

  assert.ok(metadataBlock, 'expected root layout to export a metadata object');
  assert.match(metadataBlock[1], /metadataBase:\s*new URL\('https:\/\/www\.materialsolutionsnj\.com'\)/);
});

test('root layout emits Organization and LocalBusiness JSON-LD for every page render', () => {
  const layoutSource = readFileSync(new URL('../src/app/layout.tsx', import.meta.url), 'utf8');

  assert.match(layoutSource, /['"]@type['"]:\s*['"]Organization['"]/);
  assert.match(layoutSource, /['"]@type['"]:\s*['"]LocalBusiness['"]/);
  assert.match(layoutSource, /28C Industrial Drive/);
  assert.match(layoutSource, /\(973\) 500-1010/);
  assert.match(layoutSource, /info@materialsolutionsnj\.com/);
});

test('sitemap includes core public routes on the production domain', async () => {
  const { default: sitemap } = await import('../src/app/sitemap.ts');
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.ok(urls.length >= 7, 'expected sitemap to list the core public pages');
  assert.ok(urls.every((url) => url.startsWith('https://www.materialsolutionsnj.com/')));
  assert.deepEqual(
    expectUrls(['/', '/inventory', '/about', '/services', '/contact', '/privacy', '/terms']),
    expectUrls(['/', '/inventory', '/about', '/services', '/contact', '/privacy', '/terms']).filter((url) => urls.includes(url))
  );
});

test('sitemap includes current inventory detail routes from forklift-inventory.json', async () => {
  const { default: sitemap } = await import('../src/app/sitemap.ts');
  const entries = await sitemap();
  const urls = new Set(entries.map((entry) => entry.url));

  const inventory = inventorySource.inventory;
  const expectedSlugs = [
    ...inventory.lots
      .filter((lot) => lot.status === 'available')
      .flatMap((lot) => lot.units.map((unit) => `${lot.lot_id}-unit-${unit.unit_index}`)),
    ...inventory.standalone_units
      .filter((unit) => unit.status === 'available')
      .map((unit) => unit.unit_id),
  ].map((slug) => normalizeSlug(slug));

  assert.equal(expectedSlugs.length, 14);

  for (const slug of expectedSlugs) {
    assert.ok(
      urls.has(`https://www.materialsolutionsnj.com/inventory/${slug}`),
      `expected sitemap to include inventory slug ${slug}`
    );
  }

  assert.ok(!urls.has('https://www.materialsolutionsnj.com/inventory/md-lot-001'));
});

test('lot-member inventory slugs resolve through the SEO payload builder', async () => {
  const { getInventoryDetailSeoPayload } = await import('../src/lib/inventorySeo.ts');
  const seo = getInventoryDetailSeoPayload('md-lot-001-unit-1');

  assert.ok(seo, 'expected lot-member slug to resolve through inventory SEO payloads');
  assert.equal(seo?.unit.unit_id, 'MD-LOT-001-unit-1');
  assert.equal(seo?.unit.source_kind, 'lot_member');
  assert.deepEqual(seo?.metadata.alternates, { canonical: '/inventory/md-lot-001-unit-1' });
});

test('robots metadata points crawlers at the production sitemap and allowlists named AI bots', async () => {
  const { default: robots } = await import('../src/app/robots.ts');
  const config = await robots();

  assert.equal(config.host, 'https://www.materialsolutionsnj.com');
  assert.deepEqual(config.sitemap, 'https://www.materialsolutionsnj.com/sitemap.xml');
  assert.deepEqual(config.rules, [
    {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/admin'],
    },
    { userAgent: 'GPTBot', allow: '/' },
    { userAgent: 'ChatGPT-User', allow: '/' },
    { userAgent: 'Google-Extended', allow: '/' },
    { userAgent: 'PerplexityBot', allow: '/' },
    { userAgent: 'ClaudeBot', allow: '/' },
    { userAgent: 'CCBot', allow: '/' },
    { userAgent: 'Amazonbot', allow: '/' },
    { userAgent: 'OAI-SearchBot', allow: '/' },
    { userAgent: 'YouBot', allow: '/' },
    { userAgent: 'DeepseekBot', allow: '/' },
    { userAgent: 'Applebot', allow: '/' },
    { userAgent: 'Bytespider', allow: '/' },
    { userAgent: 'AhrefsBot', allow: '/' },
    { userAgent: 'SemrushBot', allow: '/' },
  ]);
});

test('public server routes with direct metadata exports include canonical URLs', () => {
  const homeSource = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
  const privacySource = readFileSync(new URL('../src/app/privacy/page.tsx', import.meta.url), 'utf8');
  const termsSource = readFileSync(new URL('../src/app/terms/page.tsx', import.meta.url), 'utf8');
  const faqSource = readFileSync(new URL('../src/app/faq/page.tsx', import.meta.url), 'utf8');
  const oshaSource = readFileSync(new URL('../src/app/services/osha-training/page.tsx', import.meta.url), 'utf8');
  const rackingSource = readFileSync(new URL('../src/app/services/racking/page.tsx', import.meta.url), 'utf8');
  const wireGuidedSource = readFileSync(new URL('../src/app/services/wire-guided/page.tsx', import.meta.url), 'utf8');

  assert.match(homeSource, /canonical:\s*'\/'/);
  assert.match(privacySource, /canonical:\s*'\/privacy'/);
  assert.match(termsSource, /canonical:\s*'\/terms'/);
  assert.match(faqSource, /canonical:\s*`\$\{SITE_URL\}\/faq`/);
  assert.match(oshaSource, /canonical:\s*'\/services\/osha-training'/);
  assert.match(rackingSource, /canonical:\s*'\/services\/racking'/);
  assert.match(wireGuidedSource, /canonical:\s*'\/services\/wire-guided'/);
});

test('FAQ-bearing routes emit FAQPage schema through the shared helper', () => {
  const faqSource = readFileSync(new URL('../src/app/faq/page.tsx', import.meta.url), 'utf8');
  const oshaSource = readFileSync(new URL('../src/app/services/osha-training/page.tsx', import.meta.url), 'utf8');
  const rackingSource = readFileSync(new URL('../src/app/services/racking/page.tsx', import.meta.url), 'utf8');
  const wireGuidedSource = readFileSync(new URL('../src/app/services/wire-guided/page.tsx', import.meta.url), 'utf8');

  assert.match(faqSource, /toFAQPageSchema/);
  assert.match(faqSource, /application\/ld\+json/);
  assert.match(oshaSource, /toFAQPageSchema/);
  assert.match(oshaSource, /application\/ld\+json/);
  assert.match(rackingSource, /toFAQPageSchema/);
  assert.match(rackingSource, /application\/ld\+json/);
  assert.match(wireGuidedSource, /toFAQPageSchema/);
  assert.match(wireGuidedSource, /application\/ld\+json/);
});

function expectUrls(paths: string[]) {
  return paths.map((path) => `https://www.materialsolutionsnj.com${path}`);
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
