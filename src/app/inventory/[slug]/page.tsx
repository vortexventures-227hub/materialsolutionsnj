'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  FileText,
  Share2,
  Sparkles,
  Clock,
  Zap,
  Ruler,
  Weight,
  Shield,
  Settings,
  Loader2,
} from 'lucide-react';
import ImageGallery from '@/components/inventory/ImageGallery';
import SpecsTable from '@/components/inventory/SpecsTable';
import AIAnalysis from '@/components/inventory/AIAnalysis';
import InventoryCard from '@/components/inventory/InventoryCard';
import { AnimatedSection } from '@/components/shared/AnimatedSection';
import { cn } from '@/lib/utils/cn';
import { type Listing, formatPrice, formatHours, getConditionColor, getConditionLabel } from '@/lib/types';

// Sample detail data
const sampleListing: Listing = {
  id: '1',
  slug: '2019-toyota-8fgu25-5000lb-propane',
  title: '2019 Toyota 8FGU25',
  make: 'Toyota',
  model: '8FGU25',
  year: 2019,
  price: 24500,
  capacity: 5000,
  fuel_type: 'propane',
  mast_type: 'Triple Stage',
  max_height: 240,
  hours: 3200,
  serial_number: '8FGU25-2019-X4821',
  condition: 'used',
  status: 'active',
  featured: true,
  ai_description: `This 2019 Toyota 8FGU25 is an exceptional find for any warehouse or distribution operation. Our AI analysis detected minimal frame wear, well-maintained hydraulic components, and consistent service history.\n\nThe triple stage mast provides 240 inches of lift height while maintaining a compact collapsed profile, ideal for standard-height dock doors. The propane powertrain delivers reliable performance for both indoor and outdoor applications.\n\nWith only 3,200 hours on the meter, this unit represents excellent value in its class. Our computer vision analysis rated the overall condition as above-average for its year and usage profile.`,
  ai_analysis: null,
  ai_highlights: [
    'Low hours for model year — 3,200 hrs',
    'Triple stage mast with side shift',
    'Full service history available',
    'Tires in good condition (70%+ tread)',
    'Recently tuned — runs smooth',
    'No visible frame damage or rust',
  ],
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-03-10T00:00:00Z',
  listing_images: [],
  listing_specs: [
    { id: 's1', listing_id: '1', category: 'general', spec_key: 'Make', spec_value: 'Toyota', sort_order: 0 },
    { id: 's2', listing_id: '1', category: 'general', spec_key: 'Model', spec_value: '8FGU25', sort_order: 1 },
    { id: 's3', listing_id: '1', category: 'general', spec_key: 'Year', spec_value: '2019', sort_order: 2 },
    { id: 's4', listing_id: '1', category: 'general', spec_key: 'Serial Number', spec_value: '8FGU25-2019-X4821', sort_order: 3 },
    { id: 's5', listing_id: '1', category: 'general', spec_key: 'Hours', spec_value: '3,200', sort_order: 4 },
    { id: 's6', listing_id: '1', category: 'performance', spec_key: 'Capacity', spec_value: '5,000 lbs', sort_order: 0 },
    { id: 's7', listing_id: '1', category: 'performance', spec_key: 'Load Center', spec_value: '24 inches', sort_order: 1 },
    { id: 's8', listing_id: '1', category: 'performance', spec_key: 'Max Lift Speed', spec_value: '130 fpm', sort_order: 2 },
    { id: 's9', listing_id: '1', category: 'mast', spec_key: 'Type', spec_value: 'Triple Stage', sort_order: 0 },
    { id: 's10', listing_id: '1', category: 'mast', spec_key: 'Max Height', spec_value: '240 inches (20 ft)', sort_order: 1 },
    { id: 's11', listing_id: '1', category: 'mast', spec_key: 'Free Lift', spec_value: '72 inches', sort_order: 2 },
    { id: 's12', listing_id: '1', category: 'power', spec_key: 'Fuel Type', spec_value: 'Propane (LPG)', sort_order: 0 },
    { id: 's13', listing_id: '1', category: 'power', spec_key: 'Engine', spec_value: 'Toyota 4Y', sort_order: 1 },
    { id: 's14', listing_id: '1', category: 'power', spec_key: 'Transmission', spec_value: 'Automatic', sort_order: 2 },
    { id: 's15', listing_id: '1', category: 'tires', spec_key: 'Type', spec_value: 'Cushion', sort_order: 0 },
    { id: 's16', listing_id: '1', category: 'tires', spec_key: 'Condition', spec_value: '70%+ tread remaining', sort_order: 1 },
    { id: 's17', listing_id: '1', category: 'dimensions', spec_key: 'Overall Length', spec_value: '93.5 inches', sort_order: 0 },
    { id: 's18', listing_id: '1', category: 'dimensions', spec_key: 'Overall Width', spec_value: '42 inches', sort_order: 1 },
    { id: 's19', listing_id: '1', category: 'dimensions', spec_key: 'Turning Radius', spec_value: '73.6 inches', sort_order: 2 },
  ],
};

const relatedListings: Listing[] = [
  {
    id: '2', slug: '2020-hyster-h50ft-5000lb-diesel', title: '2020 Hyster H50FT', make: 'Hyster', model: 'H50FT',
    year: 2020, price: 28900, capacity: 5000, fuel_type: 'diesel', mast_type: 'Two Stage', max_height: 189,
    hours: 2100, serial_number: null, condition: 'certified', status: 'active', featured: false,
    ai_description: null, ai_analysis: null, ai_highlights: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
  {
    id: '5', slug: '2022-toyota-8fbcu25-5000lb-electric', title: '2022 Toyota 8FBCU25', make: 'Toyota', model: '8FBCU25',
    year: 2022, price: 32000, capacity: 5000, fuel_type: 'electric', mast_type: 'Triple Stage', max_height: 240,
    hours: 950, serial_number: null, condition: 'certified', status: 'active', featured: true,
    ai_description: null, ai_analysis: null, ai_highlights: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
  {
    id: '3', slug: '2021-yale-glc050-5000lb-propane', title: '2021 Yale GLC050VX', make: 'Yale', model: 'GLC050VX',
    year: 2021, price: 22500, capacity: 5000, fuel_type: 'propane', mast_type: 'Triple Stage', max_height: 240,
    hours: 1800, serial_number: null, condition: 'used', status: 'active', featured: false,
    ai_description: null, ai_analysis: null, ai_highlights: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), listing_images: [],
  },
];

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function InventoryDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch from API, fall back to sample
    async function fetchListing() {
      try {
        const res = await fetch(`/api/inventory/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.listing) {
            setListing(data.listing);
            return;
          }
        }
      } catch {}
      // Fallback to sample
      setListing(sampleListing);
      setLoading(false);
    }
    fetchListing().finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-text-primary font-semibold mb-2">Listing not found</p>
          <Link href="/inventory" className="text-accent-primary hover:underline">Back to inventory</Link>
        </div>
      </div>
    );
  }

  const conditionColor = getConditionColor(listing.condition);
  const conditionClasses: Record<string, string> = {
    success: 'bg-accent-success/10 text-accent-success border-accent-success/20',
    warning: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
    ai: 'bg-accent-ai/10 text-accent-ai border-accent-ai/20',
  };

  const quickSpecs = [
    { icon: Clock, label: 'Hours', value: listing.hours != null ? formatHours(listing.hours) : 'N/A' },
    { icon: Weight, label: 'Capacity', value: listing.capacity ? `${listing.capacity.toLocaleString()} lbs` : 'N/A' },
    { icon: Ruler, label: 'Max Height', value: listing.max_height ? `${Math.round(listing.max_height / 12)} ft` : 'N/A' },
    { icon: Zap, label: 'Fuel', value: listing.fuel_type ? listing.fuel_type.charAt(0).toUpperCase() + listing.fuel_type.slice(1) : 'N/A' },
    { icon: Settings, label: 'Mast', value: listing.mast_type || 'N/A' },
    { icon: Shield, label: 'Condition', value: getConditionLabel(listing.condition) },
  ];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Breadcrumb */}
      <div className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1280px] px-6 md:px-8">
          <nav className="flex items-center gap-2 py-4 text-sm">
            <Link href="/inventory" className="flex items-center gap-1.5 text-text-tertiary hover:text-accent-primary transition-colors font-medium">
              <ArrowLeft size={14} />
              Inventory
            </Link>
            <ChevronRight size={14} className="text-text-tertiary/40" />
            <span className="text-text-tertiary">{listing.make}</span>
            <ChevronRight size={14} className="text-text-tertiary/40" />
            <span className="text-text-primary font-medium truncate max-w-[200px] sm:max-w-none">{listing.model}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-6 md:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Gallery */}
            <AnimatedSection>
              <ImageGallery images={listing.listing_images || []} title={listing.title} />
            </AnimatedSection>

            {/* Mobile Title/Price (hidden on desktop) */}
            <div className="lg:hidden">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-accent-primary uppercase tracking-wide">{listing.make}</span>
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', conditionClasses[conditionColor])}>
                  {getConditionLabel(listing.condition)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary">{listing.title}</h1>
              <p className="text-3xl font-bold font-mono text-accent-success mt-3">
                {listing.price ? formatPrice(listing.price) : 'Call for Price'}
              </p>
            </div>

            {/* AI Analysis */}
            <AIAnalysis listing={listing} />

            {/* Specs */}
            {listing.listing_specs && listing.listing_specs.length > 0 && (
              <AnimatedSection delay={0.2}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center border border-white/[0.06]">
                    <Settings size={18} className="text-text-secondary" />
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">Full Specifications</h2
>
                </div>
                <SpecsTable specs={listing.listing_specs} />
              </AnimatedSection>
            )}

            {/* Ask David */}
            <AnimatedSection delay={0.3}>
              <div className="bg-bg-secondary rounded-2xl border border-accent-primary/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center animate-glow-pulse">
                    <Sparkles size={18} className="text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Have questions about this {listing.make} {listing.model}?</p>
                    <p className="text-xs text-text-tertiary">David knows every spec inside and out</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[`What's the warranty?`, `Compare to similar units`, `Is this good for my warehouse?`].map((q) => (
                    <button key={q} className="px-3 py-1.5 text-xs font-medium text-accent-primary bg-accent-primary/10 rounded-full border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Right Column — Sticky Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {/* Main Info Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="bg-bg-secondary rounded-2xl border border-white/[0.06] overflow-hidden"
              >
                <div className="p-6">
                  {/* Brand & Condition */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-accent-primary uppercase tracking-wide">{listing.make}</span>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', conditionClasses[conditionColor])}>
                      {getConditionLabel(listing.condition)}
                    </span>
                    {listing.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                        <Shield size={10} />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold text-text-primary mb-5 leading-tight">{listing.title}</h1>

                  {/* Price Block */}
                  <div className="bg-gradient-to-br from-bg-tertiary to-bg-secondary rounded-xl p-5 mb-6 border border-white/[0.06]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-price font-mono text-accent-success">
                        {listing.price ? formatPrice(listing.price) : 'Call'}
                      </span>
                      {listing.price && <span className="text-text-tertiary text-sm">USD</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Sparkles size={12} className="text-accent-primary" />
                      <span className="text-text-tertiary text-xs">AI-Verified Pricing</span>
                    </div>
                  </div>

                  {/* Quick Specs */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {quickSpecs.map(({ icon: Icon, label, value }) => (
                      <div key={label} className="bg-bg-tertiary/50 rounded-xl px-3.5 py-3 border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={13} className="text-text-tertiary" />
                          <span className="text-[11px] text-text-tertiary font-medium uppercase tracking-wide">{label}</span>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="space-y-3">
                    <a href="tel:+19735001010" className="block">
                      <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-primary text-bg-primary font-semibold rounded-xl hover:bg-accent-glow transition-colors">
                        <Phone size={18} />
                        Call Now
                      </button>
                    </a>
                    <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-primary/10 text-accent-primary font-semibold rounded-xl border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors">
                      <MessageCircle size={18} />
                      Ask David About This
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-6 py-3 text-text-secondary font-medium rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors text-sm">
                      <FileText size={16} />
                      Request a Quote
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Share */}
              <div className="bg-bg-secondary/50 rounded-xl border border-white/[0.06] px-4 py-3">
                <button className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors">
                  <Share2 size={14} />
                  Share this listing
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Sticky CTA */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-primary/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold font-mono text-accent-success truncate">
                  {listing.price ? formatPrice(listing.price) : 'Call'}
                </p>
              </div>
              <a href="tel:+19735001010">
                <button className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-bg-primary font-semibold rounded-xl text-sm">
                  <Phone size={16} />
                  Call
                </button>
              </a>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary/10 text-accent-primary font-semibold rounded-xl border border-accent-primary/20 text-sm">
                <MessageCircle size={16} />
                David
              </button>
            </div>
          </div>
        </div>

        {/* Related Listings */}
        <AnimatedSection delay={0.4} className="mt-16 lg:mt-24">
          <h2 className="text-section text-text-primary mb-8">Similar Equipment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedListings.map((item, i) => (
              <InventoryCard key={item.id} listing={item} index={i} />
            ))}
          </div>
        </AnimatedSection>
      </div>

      {/* Mobile spacer */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
