import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.materialsolutionsnj.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
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
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
