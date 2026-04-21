import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const sitemapPath = new URL('../src/app/sitemap.ts', import.meta.url);
const robotsPath = new URL('../src/app/robots.ts', import.meta.url);

test('sitemap and robots metadata routes exist', () => {
  assert.equal(existsSync(sitemapPath), true, 'expected src/app/sitemap.ts to exist');
  assert.equal(existsSync(robotsPath), true, 'expected src/app/robots.ts to exist');
});

test('sitemap includes core public routes on the production domain', async () => {
  const { default: sitemap } = await import('../src/app/sitemap.ts');
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.ok(urls.length >= 6, 'expected sitemap to list the core public pages');
  assert.ok(urls.every((url) => url.startsWith('https://www.materialsolutionsnj.com/')));
  assert.deepEqual(
    urls,
    expectUrls([
      '/',
      '/inventory',
      '/about',
      '/services',
      '/contact',
      '/privacy',
      '/terms',
    ])
  );
});

test('robots metadata points crawlers at the production sitemap', async () => {
  const { default: robots } = await import('../src/app/robots.ts');
  const config = await robots();

  assert.equal(config.host, 'https://www.materialsolutionsnj.com');
  assert.deepEqual(config.sitemap, 'https://www.materialsolutionsnj.com/sitemap.xml');
  assert.deepEqual(config.rules, {
    userAgent: '*',
    allow: '/',
  });
});

function expectUrls(paths: string[]) {
  return paths.map((path) => `https://www.materialsolutionsnj.com${path}`);
}
