import type { Metadata } from 'next';
import Link from 'next/link';

import { getBlogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Used Forklift Buying Resources | MSNJ',
  description: 'Practical used forklift buying guides from Material Solutions NJ, with inventory links, inspection checklists, and warehouse fit guidance.',
  alternates: {
    canonical: 'https://www.materialsolutionsnj.com/blog',
  },
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <section className="border-b border-white/[0.06] px-6 py-12 md:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-primary">Material Solutions NJ</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">Used Forklift Buying Resources</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-text-secondary">
            Clear, buyer-focused guides for warehouse teams comparing used forklifts, reach trucks, order pickers, Bendi units, and narrow-aisle equipment.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 md:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-primary">{post.primaryKeyword}</p>
              <h2 className="mt-2 text-xl font-semibold leading-7">
                <Link href={`/blog/${post.slug}`} className="hover:text-accent-primary">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">{post.metaDescription}</p>
              <p className="mt-4 text-xs text-text-tertiary">{post.wordCount.toLocaleString()} words</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
