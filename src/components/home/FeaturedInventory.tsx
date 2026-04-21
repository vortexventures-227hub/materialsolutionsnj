'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface FeaturedItem {
  id: string;
  slug: string | null;
  brand: string;
  model: string;
  fuel_type: string | null;
  capacity_lbs: number | null;
  hours: number | null;
  price: number | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl bg-bg-secondary border border-white/[0.06] overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-bg-tertiary" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-bg-tertiary rounded w-3/4" />
            <div className="space-y-2">
              <div className="h-4 bg-bg-tertiary rounded w-1/2" />
              <div className="h-4 bg-bg-tertiary rounded w-1/3" />
            </div>
            <div className="h-8 bg-bg-tertiary rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeaturedInventory() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/inventory?featured=true');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const inventory = data.inventory ?? [];
        if (inventory.length > 0) {
          setItems(inventory.slice(0, 4));
        } else {
          setUnavailable(true);
        }
      } catch {
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  if (unavailable && !loading) return null;

  if (loading) {
    return (
      <section className="relative w-full bg-bg-primary py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-section font-bold text-text-primary mb-2">
              Featured Equipment
            </h2>
            <p className="text-text-secondary">
              Carefully selected units ready for immediate delivery
            </p>
          </div>
          <FeaturedSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-bg-primary py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-12 flex items-end justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="text-section font-bold text-text-primary mb-2">
              Featured Equipment
            </h2>
            <p className="text-text-secondary">
              Carefully selected units ready for immediate delivery
            </p>
          </div>
          <Link
            href="/inventory"
            className="text-accent-primary hover:text-accent-glow transition-colors font-semibold text-sm sm:text-base"
          >
            View All →
          </Link>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {items.map((item) => {
            const href = item.slug ? `/inventory/${item.slug}` : '/inventory';
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-xl',
                  'bg-bg-secondary border border-white/[0.06]',
                  'transition-all duration-300 hover:border-accent-primary/50'
                )}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 shadow-glow-yellow" />
                </div>

                {/* Image Area */}
                <div
                  className={cn(
                    'relative w-full aspect-square overflow-hidden',
                    'bg-gradient-to-br from-accent-primary/10 to-bg-tertiary',
                    'flex items-center justify-center'
                  )}
                >
                  <span className="text-6xl">🚜</span>

                  {/* Live Data Badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full badge-ai text-xs font-semibold">
                    Live Listing
                  </div>

                  {/* Fuel Type Badge */}
                  {item.fuel_type && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-bg-tertiary border border-white/[0.1] text-xs font-semibold text-text-secondary">
                      {item.fuel_type.charAt(0).toUpperCase() + item.fuel_type.slice(1)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4">
                  {/* Title */}
                  <h3 className="text-card-title font-bold text-text-primary mb-3">
                    {item.brand} {item.model}
                  </h3>

                  {/* Specs */}
                  <div className="mb-4 space-y-2 text-sm text-text-secondary flex-1">
                    <div className="flex justify-between">
                      <span>Capacity</span>
                      <span className="font-semibold text-text-primary">
                        {item.capacity_lbs ? `${item.capacity_lbs.toLocaleString()} lbs` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours</span>
                      <span className="font-semibold text-text-primary">
                        {item.hours ? `${item.hours.toLocaleString()} hrs` : 'N/A'}
                      </span>
                    </div>
                    {item.fuel_type && (
                      <div className="flex justify-between">
                        <span>Type</span>
                        <span className="font-semibold text-text-primary">
                          {item.fuel_type.charAt(0).toUpperCase() + item.fuel_type.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-4 pb-4 border-t border-white/[0.06]">
                    <p className="text-xs text-text-tertiary mb-1">Price</p>
                    <p className="font-mono text-2xl font-bold text-accent-success">
                      {item.price ? `$${item.price.toLocaleString()}` : 'Call'}
                    </p>
                  </div>

                  {/* CTA */}
                  <Link
                    href={href}
                    className={cn(
                      'px-4 py-2 rounded-lg font-semibold text-sm',
                      'border border-accent-primary/50 text-accent-primary',
                      'hover:bg-accent-primary/10 transition-colors text-center'
                    )}
                  >
                    View Details →
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
