import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  titleTag: string;
  metaDescription: string;
  primaryKeyword: string;
  datePublished: string;
  heroImage: string;
  author: string;
  internalLinks: string[];
  faqs: BlogFaq[];
}

export interface BlogPost extends BlogPostMeta {
  body: string;
  wordCount: number;
}

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
const SITE_URL = 'https://www.materialsolutionsnj.com';

function parseBlogFile(raw: string): BlogPost {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    throw new Error('Blog post is missing JSON frontmatter');
  }

  const meta = JSON.parse(match[1]) as BlogPostMeta;
  const body = match[2].trim();
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  return { ...meta, body, wordCount };
}

let cachedPosts: BlogPost[] | null = null;

export function getBlogPosts(): BlogPost[] {
  if (cachedPosts) {
    return cachedPosts;
  }

  cachedPosts = readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseBlogFile(readFileSync(path.join(BLOG_DIR, file), 'utf8')))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return cachedPosts;
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return getBlogPosts().find((post) => post.slug === slug) ?? null;
}

export function getBlogUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

export function getArticleSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    datePublished: post.datePublished,
    image: `${SITE_URL}${post.heroImage}`,
    publisher: {
      '@type': 'Organization',
      name: 'Material Solutions NJ',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getBlogUrl(post.slug),
    },
  };
}

export function getFaqSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
