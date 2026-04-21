import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.materialsolutionsnj.com';
const CORE_PATHS = [
  '/',
  '/inventory',
  '/about',
  '/services',
  '/contact',
  '/privacy',
  '/terms',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return CORE_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '/inventory' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/inventory' ? 0.9 : 0.7,
  }));
}
