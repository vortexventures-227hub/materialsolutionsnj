import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';

import { getArticleSchema, getBlogPostBySlug, getBlogPosts, getBlogUrl, getFaqSchema } from '@/lib/blog';

interface BlogPostPageProps {
  params: { slug: string };
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(
      <Link key={`${match[2]}-${match.index}`} href={match[2]} className="text-accent-primary hover:underline">
        {match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderMarkdown(body: string) {
  const blocks = body.split(/\n{2,}/);

  return blocks.map((block, index) => {
    const trimmed = block.trim();

    if (trimmed.startsWith('### ')) {
      return <h3 key={index} className="mt-8 text-2xl font-semibold">{trimmed.slice(4)}</h3>;
    }

    if (trimmed.startsWith('## ')) {
      return <h2 key={index} className="mt-10 text-3xl font-bold">{trimmed.slice(3)}</h2>;
    }

    if (trimmed.startsWith('# ')) {
      return <h1 key={index} className="text-4xl font-bold md:text-5xl">{trimmed.slice(2)}</h1>;
    }

    if (trimmed.startsWith('- ')) {
      return (
        <ul key={index} className="my-6 list-disc space-y-2 pl-6 text-text-secondary">
          {trimmed.split('\n').map((line) => (
            <li key={line}>{renderInlineMarkdown(line.replace(/^- /, ''))}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={index} className="my-5 leading-8 text-text-secondary">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });
}

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Post',
      description: 'Material Solutions NJ used forklift buying resource.',
    };
  }

  return {
    title: post.titleTag,
    description: post.metaDescription,
    alternates: {
      canonical: getBlogUrl(post.slug),
    },
    openGraph: {
      type: 'article',
      url: getBlogUrl(post.slug),
      title: post.title,
      description: post.metaDescription,
      images: [{ url: post.heroImage, alt: post.title }],
    },
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getArticleSchema(post)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getFaqSchema(post)) }}
      />

      <article className="mx-auto max-w-3xl px-6 py-12 md:px-8">
        <Link href="/blog" className="text-sm font-semibold text-accent-primary hover:underline">
          Back to resources
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-accent-primary">{post.primaryKeyword}</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">{post.title}</h1>
        <p className="mt-4 text-sm text-text-tertiary">
          Published {post.datePublished} by {post.author} - {post.wordCount.toLocaleString()} words
        </p>
        <div className="mt-10">{renderMarkdown(post.body)}</div>
      </article>
    </main>
  );
}
