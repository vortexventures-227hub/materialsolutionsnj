'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Search, Sparkles, FileText } from 'lucide-react';
import InventoryCard from '@/components/inventory/InventoryCard';
import FilterBar, { type InventoryFilters, defaultFilters } from '@/components/inventory/FilterBar';
import { InventoryGridSkeleton } from '@/components/shared/Skeleton';
import { AnimatedSection } from '@/components/shared/AnimatedSection';
import { buildContactHref } from '@/lib/leadRouting';
import { CONTACT_DETAILS } from '@/lib/contactDetails';
import { inventoryFiltersEqual, parseInventoryFiltersFromSearchParams, buildInventorySearchParams } from '@/lib/inventoryFilters';
import { type Listing, legacyToListing } from '@/lib/types';
import { useChatStore } from '@/stores/chatStore';

// Inventory truth rule: do not silently substitute unlabeled sample listings on the live buyer path.

type InventorySourceMode = 'live' | 'empty' | 'unavailable';

function InventoryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const openChat = useChatStore((state) => state.openChat);
  const phoneContact = CONTACT_DETAILS.find((d) => d.icon === 'phone');
  const phoneLabel = phoneContact?.primary ?? 'Call us';
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<InventorySourceMode>('live');
  const parsedFilters = useMemo(
    () => parseInventoryFiltersFromSearchParams(new URLSearchParams(searchParamString)),
    [searchParamString]
  );
  const [filters, setFilters] = useState<InventoryFilters>(parsedFilters);
  const lastAppliedSearchParamString = useRef(searchParamString);

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSourceMode('live');

      const params = new URLSearchParams();
      if (filters.make) params.set('make', filters.make);
      if (filters.fuel_type) params.set('fuel_type', filters.fuel_type);
      if (filters.condition) params.set('condition', filters.condition);
      if (filters.min_price) params.set('min_price', filters.min_price);
      if (filters.max_price) params.set('max_price', filters.max_price);
      if (filters.min_capacity) params.set('min_capacity', filters.min_capacity);

      const qs = params.toString();
      const url = qs ? `/api/inventory?${qs}` : '/api/inventory';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (data.listings && data.listings.length > 0) {
        setListings(data.listings);
        setSourceMode('live');
      } else if (data.inventory && data.inventory.length > 0) {
        // Legacy format — convert
        setListings(data.inventory.map(legacyToListing));
        setSourceMode('live');
      } else {
        setListings([]);
        setSourceMode('empty');
      }
    } catch {
      setListings([]);
      setSourceMode('unavailable');
      setError(`Live inventory is temporarily unavailable. ${phoneLabel} or ask David for help finding the right machine.`);
    } finally {
      setIsLoading(false);
    }
  }, [filters, phoneLabel]);

  useEffect(() => {
    if (searchParamString === lastAppliedSearchParamString.current) return;
    lastAppliedSearchParamString.current = searchParamString;
    if (inventoryFiltersEqual(filters, parsedFilters)) return;
    setFilters(parsedFilters);
  }, [filters, parsedFilters, searchParamString]);

  const applyFilters = useCallback((nextFilters: InventoryFilters) => {
    setFilters(nextFilters);

    const nextSearch = buildInventorySearchParams(nextFilters).toString();
    if (nextSearch === searchParamString) return;

    const nextHref = nextSearch ? `${pathname}?${nextSearch}` : pathname;
    lastAppliedSearchParamString.current = nextSearch;
    router.replace(nextHref, { scroll: false });
  }, [pathname, router, searchParamString]);

  useEffect(() => {
    const timer = setTimeout(() => fetchListings(), 150);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Client-side filtering for sample data
    if (filters.make) result = result.filter((l) => l.make === filters.make);
    if (filters.fuel_type) result = result.filter((l) => l.fuel_type === filters.fuel_type);
    if (filters.condition) result = result.filter((l) => l.condition === filters.condition);
    if (filters.min_price) result = result.filter((l) => (l.price || 0) >= parseInt(filters.min_price));
    if (filters.max_price) result = result.filter((l) => (l.price || 0) <= parseInt(filters.max_price));
    if (filters.min_capacity) result = result.filter((l) => (l.capacity || 0) >= parseInt(filters.min_capacity));

    // Sort
    switch (filters.sort) {
      case 'price_asc': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_desc': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'hours_asc': result.sort((a, b) => (a.hours || 0) - (b.hours || 0)); break;
      case 'newest':
      default: result.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
    }

    // Featured first
    result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return result;
  }, [listings, filters]);

  const inventoryHelpHref = buildContactHref({
    subject: 'Inventory Help Request',
    source: 'inventory_contact',
    pageOrigin: '/inventory',
    ctaOrigin: sourceMode === 'unavailable'
      ? 'inventory_empty_contact'
      : 'inventory_results_contact',
  });

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/[0.03] to-transparent" />
        <div className="absolute inset-0 bg-grid-dark" />

        <div className="relative mx-auto max-w-[1280px] px-6 md:px-8 py-12 lg:py-16">
          <AnimatedSection>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-4">
                  <Sparkles size={12} className="text-accent-primary" />
                  <span className="text-xs text-accent-primary font-semibold">
                    {sourceMode === 'live' ? 'Live Equipment Inventory' : 'Inventory Feed Status'}
                  </span>
                </div>
                <h1 className="text-section text-text-primary mb-3">
                  Our Inventory
                </h1>
                <p className="text-text-secondary text-lg">
                  {sourceMode === 'live'
                    ? 'Browse available equipment and reach out when you want pricing, specs, or next-step help.'
                    : 'If live inventory is unavailable, we show an honest status and route you to the team instead of filling the page with unlabeled sample equipment.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-text-tertiary">
                  <span className="font-bold text-accent-success font-mono">{filteredListings.length}</span> Forklifts Available
                </span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-[1280px] px-6 md:px-8 py-8">
        <FilterBar
          filters={filters}
          onFilterChange={applyFilters}
          resultCount={filteredListings.length}
        />

        {/* Loading */}
        {isLoading && <InventoryGridSkeleton count={6} />}

        {/* Status */}
        {!isLoading && error && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredListings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
              <Search size={24} className="text-text-tertiary" />
            </div>
            <p className="text-lg font-semibold text-text-primary mb-2">
              {sourceMode === 'unavailable' ? 'Live inventory is temporarily unavailable' : 'No equipment found'}
            </p>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              {sourceMode === 'unavailable'
                ? 'The live inventory feed did not return usable equipment data. Call the team or ask David for help instead of relying on placeholder listings.'
                : 'Try adjusting your filters or ask David for help finding the right machine.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-sm font-semibold text-accent-primary hover:text-accent-glow px-4 py-2 rounded-lg hover:bg-accent-primary/10 transition-colors"
              >
                Clear all filters
              </button>
              <Link
                href={inventoryHelpHref}
                className="text-sm font-semibold text-accent-primary hover:text-accent-glow px-4 py-2 rounded-lg hover:bg-accent-primary/10 transition-colors inline-flex items-center gap-1.5"
              >
                <FileText size={14} />
                Contact the Team
              </Link>
            </div>
          </div>
        )}

        {/* Grid */}
        {!isLoading && filteredListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredListings.map((listing, index) => (
              <InventoryCard key={listing.id} listing={listing} index={index} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!isLoading && filteredListings.length > 0 && (
          <div className="mt-16 text-center">
            <p className="text-sm text-text-tertiary mb-3">Can&apos;t find what you need?</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={openChat}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-bg-primary font-semibold rounded-xl hover:bg-accent-glow transition-colors"
              >
                Ask David About Inventory
              </button>
              <Link
                href={inventoryHelpHref}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary/10 text-accent-primary font-semibold rounded-xl border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors"
              >
                <FileText size={16} />
                Contact the Team About Inventory
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InventoryPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
