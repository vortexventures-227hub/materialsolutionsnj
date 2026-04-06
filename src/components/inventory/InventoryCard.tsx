'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Zap, Ruler, Weight, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { type Listing, formatPrice, formatHours, getConditionColor, getFuelIcon } from '@/lib/types';

interface InventoryCardProps {
  listing: Listing;
  index?: number;
}

export default function InventoryCard({ listing, index = 0 }: InventoryCardProps) {
  const primaryImage = listing.listing_images?.find((img) => img.is_primary) || listing.listing_images?.[0];
  const conditionColor = getConditionColor(listing.condition);

  const conditionClasses = {
    success: 'bg-accent-success/10 text-accent-success border-accent-success/20',
    warning: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
    ai: 'bg-accent-ai/10 text-accent-ai border-accent-ai/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link href={`/inventory/${listing.slug || listing.id}`} className="group block h-full">
        <div className="bg-bg-secondary rounded-xl overflow-hidden border border-white/[0.06] hover:border-accent-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(232,184,0,0.08)] h-full flex flex-col">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-bg-tertiary overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={listing.title}
                fill
                className="object-cover brightness-[0.95] contrast-[1.05] group-hover:brightness-100 group-hover:contrast-100 group-hover:scale-105 transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-secondary to-bg-tertiary">
                <span className="text-6xl opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
                  {getFuelIcon(listing.fuel_type || 'electric')}
                </span>
              </div>
            )}

            {/* AI Verified Badge */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-primary/90 text-bg-primary backdrop-blur-md">
                <Sparkles size={11} />
                AI-Verified
              </span>
            </div>

            {/* Fuel Type Badge */}
            <div className="absolute top-3 right-3">
              <span className="badge-dark badge-fuel flex items-center gap-1.5 px-2.5 py-1 text-xs">
                <span>{getFuelIcon(listing.fuel_type || '')}</span>
                <span className="capitalize">{listing.fuel_type || 'N/A'}</span>
              </span>
            </div>

            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg-secondary/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            {/* Make & Year */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-accent-primary uppercase tracking-wide">
                {listing.make}
              </span>
              <span className="text-white/20">&middot;</span>
              <span className="text-xs text-text-tertiary">{listing.year || 'N/A'}</span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors line-clamp-2 mb-3">
              {listing.title}
            </h3>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {listing.hours != null && (
                <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Clock size={12} className="text-text-tertiary/60 flex-shrink-0" />
                  <span>{formatHours(listing.hours)}</span>
                </div>
              )}
              {listing.fuel_type && (
                <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Zap size={12} className="text-text-tertiary/60 flex-shrink-0" />
                  <span className="capitalize">{listing.fuel_type}</span>
                </div>
              )}
              {listing.max_height != null && (
                <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Ruler size={12} className="text-text-tertiary/60 flex-shrink-0" />
                  <span>{Math.round(listing.max_height / 12)} ft lift</span>
                </div>
              )}
              {listing.capacity != null && (
                <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                  <Weight size={12} className="text-text-tertiary/60 flex-shrink-0" />
                  <span>{listing.capacity.toLocaleString()} lbs</span>
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Price + Condition */}
            <div className="flex items-end justify-between pt-4 border-t border-white/[0.06]">
              <div>
                <p className="text-xl font-bold font-mono text-accent-success">
                  {listing.price ? formatPrice(listing.price) : 'Call for Price'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase border',
                    conditionClasses[conditionColor]
                  )}>
                    {listing.condition}
                  </span>
                  {listing.featured && (
                    <span className="flex items-center gap-0.5 text-[10px] text-accent-secondary font-medium">
                      <Shield size={10} />
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                View
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
