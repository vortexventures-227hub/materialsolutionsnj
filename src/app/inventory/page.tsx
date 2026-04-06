'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, Sparkles, MessageCircle } from 'lucide-react';
import InventoryCard from '@/components/inventory/InventoryCard';
import FilterBar, { type InventoryFilters, defaultFilters } from '@/components/inventory/FilterBar';
import { InventoryGridSkeleton } from '@/components/shared/Skeleton';
import { AnimatedSection } from '@/components/shared/AnimatedSection';
import { type Listing, legacyToListing } from '@/lib/types';

// Sample data (used when Supabase isn't connected yet)
const sampleListings: Listing[] = [
  {
    id: '1', slug: '2019-toyota-8fgu25-5000lb-propane', title: '2019 Toyota 8FGU25', make: 'Toyota', model: '8FGU25',
    year: 2019, price: 24500, capacity: 5000, fuel_type: 'propane', mast_type: 'Triple Stage', max_height: 240,
    hours: 3200, serial_number: 'TY8FGU25-X01', condition: 'used', status: 'active', featured: true,
    ai_description: 'Well-maintained Toyota 8FGU25 with low hours. Triple stage mast, side shift, and excellent tire condition. Ideal for warehouse and dock operations.',
    ai_analysis: null, ai_highlights: ['Low hours for year', 'Triple stage mast', 'Side shift included', 'Recently serviced'],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
  {
    id: '2', slug: '2020-hyster-h50ft-5000lb-diesel', title: '2020 Hyster H50FT', make: 'Hyster', model: 'H50FT',
    year: 2020, price: 28900, capacity: 5000, fuel_type: 'diesel', mast_type: 'Two Stage', max_height: 189,
    hours: 2100, serial_number: 'HY50FT-002', condition: 'certified', status: 'active', featured: true,
    ai_description: 'Certified pre-owned Hyster H50FT. Diesel powered with pneumatic tires, perfect for outdoor and rough terrain operations.',
    ai_analysis: null, ai_highlights: ['Certified pre-owned', 'Pneumatic tires', 'Full service records'],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
  {
    id: '3', slug: '2021-yale-glc050-5000lb-propane', title: '2021 Yale GLC050VX', make: 'Yale', model: 'GLC050VX',
    year: 2021, price: 22500, capacity: 5000, fuel_type: 'propane', mast_type: 'Triple Stage', max_height: 240,
    hours: 1800, serial_number: 'YL050VX-003', condition: 'used', status: 'active', featured: false,
    ai_description: 'Low-hour Yale GLC050VX with triple stage mast. Excellent condition with minimal wear.',
    ai_analysis: null, ai_highlights: ['Very low hours', 'Minimal wear', 'Recent battery test: 95%'],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
  {
    id: '4', slug: '2018-crown-fc5200-3000lb-electric', title: '2018 Crown FC5200', make: 'Crown', model: 'FC5200',
    year: 2018, price: 18500, capacity: 3000, fuel_type: 'electric', mast_type: 'Quad', max_height: 312,
    hours: 6800, serial_number: 'CR5200-004', condition: 'used', status: 'active', featured: false,
    ai_description: 'Crown FC5200 electric reach truck with quad mast for high-bay operations.',
    ai_analysis: null, ai_highlights: ['26ft reach', 'Quad mast', 'Good battery condition'],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
  {
    id: '5', slug: '2022-toyota-8fbcu25-5000lb-electric', title: '2022 Toyota 8FBCU25', make: 'Toyota', model: '8FBCU25',
    year: 2022, price: 32000, capacity: 5000, fuel_type: 'electric', mast_type: 'Triple Stage', max_height: 240,
    hours: 950, serial_number: 'TY8FB-005', condition: 'certified', status: 'active', featured: true,
    ai_description: 'Nearly new Toyota 8FBCU25 electric with under 1000 hours. Premium condition throughout.',
    ai_analysis: null, ai_highlights: ['Under 1,000 hours', 'Like-new condition', 'Full warranty remaining'],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
  {
    id: '6', slug: '2019-caterpillar-gp25n-5000lb-propane', title: '2019 CAT GP25N', make: 'Caterpillar', model: 'GP25N',
    year: 2019, price: 21000, capacity: 5000, fuel_type: 'propane', mast_type: 'Two Stage', max_height: 189,
    hours: 4500, serial_number: 'CAT25N-006', condition: 'used', status: 'active', featured: false,
    ai_description: 'Dependable CAT GP25N with good maintenance history. Two stage mast, cushion tires.',
    ai_analysis: null, ai_highlights: ['Reliable Caterpillar build', 'Good maintenance records', 'Cushion tires'],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
];

function InventoryContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>(defaultFilters);

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

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
      } else if (data.inventory && data.inventory.length > 0) {
        // Legacy format — convert
        setListings(data.inventory.map(legacyToListing));
      } else {
        setListings(sampleListings);
      }
    } catch {
      setListings(sampleListings);
      setError('Showing demo inventory. Connect Supabase for live data.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

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
                  <span className="text-xs text-accent-primary font-semibold">AI-Verified Inventory</span>
                </div>
                <h1 className="text-section text-text-primary mb-3">
                  Our Inventory
                </h1>
                <p className="text-text-secondary text-lg">
                  Every unit AI-analyzed. Every listing verified. Every price transparent.
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
          onFilterChange={setFilters}
          resultCount={filteredListings.length}
        />

        {/* Loading */}
        {isLoading && <InventoryGridSkeleton count={6} />}

        {/* Empty State */}
        {!isLoading && filteredListings.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-bg-secondary flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
              <Search size={24} className="text-text-tertiary" />
            </div>
            <p className="text-lg font-semibold text-text-primary mb-2">No equipment found</p>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Try adjusting your filters or ask David for help finding the right machine.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-sm font-semibold text-accent-primary hover:text-accent-glow px-4 py-2 rounded-lg hover:bg-accent-primary/10 transition-colors"
              >
                Clear all filters
              </button>
              <button className="text-sm font-semibold text-accent-primary hover:text-accent-glow px-4 py-2 rounded-lg hover:bg-accent-primary/10 transition-colors inline-flex items-center gap-1.5">
                <MessageCircle size={14} />
                Ask David
              </button>
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
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-bg-primary font-semibold rounded-xl hover:bg-accent-glow transition-colors">
              <Sparkles size={16} />
              Ask David to Find It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InventoryPage() {
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
