'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
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
import InventoryGallery from '@/components/InventoryGallery';
import SpecsTable from '@/components/inventory/SpecsTable';
import AIAnalysis from '@/components/inventory/AIAnalysis';
import { AnimatedSection } from '@/components/shared/AnimatedSection';
import { PUBLIC_PHONE_HREF } from '@/lib/contactDetails';
import { buildContactHref } from '@/lib/leadRouting';
import type { CanonicalContent } from '@/lib/marketing/canonical/types';
import type { ForkliftUnit } from '@/lib/marketing/schemaTransformers';
import { cn } from '@/lib/utils/cn';
import { type Listing, formatPrice, formatHours, getConditionColor, getConditionLabel } from '@/lib/types';
import { useChatStore } from '@/stores/chatStore';

interface InventoryDetailClientProps {
  slug: string;
  canonical?: CanonicalContent | null;
  leadCaptureForm?: ReactNode;
  galleryUnit?: ForkliftUnit | null;
}

export default function InventoryDetailClient({ slug, canonical = null, galleryUnit, leadCaptureForm }: InventoryDetailClientProps) {
  const openChat = useChatStore((state) => state.openChat);
  const setListingContext = useChatStore((state) => state.setListingContext);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingStatus, setListingStatus] = useState<'ready' | 'unavailable' | 'missing'>('ready');
  const effectiveGalleryUnit = useMemo(() => {
    const detailMediaPaths = listing?.listing_images
      ?.map((image) => image.url)
      .filter((url): url is string => Boolean(url));

    if (galleryUnit && detailMediaPaths?.length) {
      return {
        ...galleryUnit,
        media_paths: detailMediaPaths,
      };
    }

    return galleryUnit;
  }, [galleryUnit, listing?.listing_images]);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/inventory/${slug}`);

        if (res.status === 404) {
          setListing(null);
          setListingStatus('missing');
          return;
        }

        if (!res.ok) {
          setListing(null);
          setListingStatus('unavailable');
          return;
        }

        const data = await res.json();
        if (data.listing) {
          setListing(data.listing);
          setListingStatus('ready');
          return;
        }
      } catch {}

      setListing(null);
      setListingStatus('unavailable');
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
    const title = listingStatus === 'missing'
      ? 'Listing not found'
      : 'Live listing details are temporarily unavailable';
    const body = listingStatus === 'missing'
      ? 'This equipment listing could not be found in the live inventory feed.'
      : 'We could not load trustworthy listing details right now. Please email david@materialsolutionsnj.com and we\'ll follow up within the hour.';
    const unavailableContactHref = buildContactHref({
      subject: `Inventory Question: ${slug}`,
      source: 'inventory_detail_contact',
      pageOrigin: `/inventory/${slug}`,
      ctaOrigin: 'inventory_detail_unavailable_contact',
      listingSlug: slug,
    });

    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
        <div className="text-center max-w-xl">
          <p className="text-xl text-text-primary font-semibold mb-2">{title}</p>
          <p className="text-text-secondary mb-4">{body}</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/inventory" className="text-accent-primary hover:underline">Back to inventory</Link>
            {listingStatus !== 'missing' && (
              <Link
                href={unavailableContactHref}
                className="text-accent-primary hover:text-accent-glow transition-colors"
              >
                Contact the team
              </Link>
            )}
          </div>
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

  const listingPageOrigin = `/inventory/${listing.slug || listing.id}`;
  const contactPhoneHref = PUBLIC_PHONE_HREF;

  const contactQuoteHref = buildContactHref({
    subject: `Quote Request: ${listing.title}`,
    source: 'inventory_detail_quote',
    pageOrigin: listingPageOrigin,
    ctaOrigin: 'inventory_detail_quote',
    listingId: listing.id,
    listingSlug: listing.slug,
    listingTitle: listing.title,
  });

  const inventoryContactHref = buildContactHref({
    subject: `Inventory Question: ${listing.title}`,
    source: 'inventory_detail_contact',
    pageOrigin: listingPageOrigin,
    ctaOrigin: 'inventory_detail_ask_david',
    listingId: listing.id,
    listingSlug: listing.slug,
    listingTitle: listing.title,
  });

  const handleAskDavidAboutListing = () => {
    void inventoryContactHref;
    setListingContext({
      id: listing.id,
      title: listing.title,
      make: listing.make,
      model: listing.model,
      year: listing.year ?? null,
    });
    openChat();
  };

  return (
    <div className="min-h-screen bg-bg-primary">
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
          <div className="space-y-8">
            <AnimatedSection>
              {effectiveGalleryUnit ? (
                <InventoryGallery unit={effectiveGalleryUnit} leadFormAnchorId="inventory-lead-capture" />
              ) : listing.listing_images && listing.listing_images.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-bg-secondary/70">
                  <div className="relative aspect-[4/3] w-full bg-black">
                    {listing.listing_images[0].url.match(/\.(mp4|mov|webm)$/i) ? (
                      <video
                        src={listing.listing_images[0].url}
                        controls
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={listing.listing_images[0].url}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  {listing.listing_images.length > 1 ? (
                    <div className="grid grid-cols-3 gap-2 p-3">
                      {listing.listing_images.slice(1, 4).map((image) =>
                        image.url.match(/\.(mp4|mov|webm)$/i) ? (
                          <video
                            key={image.id}
                            src={image.url}
                            controls
                            playsInline
                            muted
                            className="aspect-video rounded-lg object-cover"
                          />
                        ) : (
                          <img
                            key={image.id}
                            src={image.url}
                            alt={listing.title}
                            className="aspect-video rounded-lg object-cover"
                          />
                        )
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 text-center">
                  <p className="text-lg font-semibold text-white">Media unavailable</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    We could not map the current media set for this unit. Scroll down and send David a note for a walkthrough.
                  </p>
                </div>
              )}
            </AnimatedSection>

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

            <AIAnalysis listing={listing} />

            {canonical ? (
              <AnimatedSection delay={0.15}>
                <div className="space-y-6">
                  <section className="rounded-2xl border border-white/[0.06] bg-bg-secondary/70 p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-primary/20 bg-accent-primary/10">
                        <Sparkles size={18} className="text-accent-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">Canonical overview</p>
                        <h2 className="text-lg font-semibold text-text-primary">Buyer-ready description</h2>
                      </div>
                    </div>
                    <p className="text-sm leading-7 text-text-secondary">{canonical.long_description}</p>
                  </section>

                  {canonical.structured_feature_list.length > 0 ? (
                    <section className="rounded-2xl border border-white/[0.06] bg-bg-secondary/70 p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-bg-tertiary">
                          <Settings size={18} className="text-text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">Canonical features</p>
                          <h2 className="text-lg font-semibold text-text-primary">Key machine highlights</h2>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {canonical.structured_feature_list.map((feature) => (
                          <div key={`${feature.label}-${feature.value}`} className="rounded-xl border border-white/[0.05] bg-bg-tertiary/60 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">{feature.label}</p>
                            <p className="mt-1 text-sm font-medium text-text-primary">{feature.value}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {canonical.faq.length > 0 ? (
                    <section className="rounded-2xl border border-white/[0.06] bg-bg-secondary/70 p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-bg-tertiary">
                          <MessageCircle size={18} className="text-text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">Canonical FAQ</p>
                          <h2 className="text-lg font-semibold text-text-primary">Questions buyers ask first</h2>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {canonical.faq.map((entry) => (
                          <details key={entry.question} className="group rounded-xl border border-white/[0.05] bg-bg-tertiary/60 px-4 py-3">
                            <summary className="cursor-pointer list-none text-sm font-semibold text-text-primary marker:content-none">
                              <span className="flex items-center justify-between gap-3">
                                <span>{entry.question}</span>
                                <ChevronRight size={16} className="shrink-0 text-text-tertiary transition-transform group-open:rotate-90" />
                              </span>
                            </summary>
                            <p className="mt-3 text-sm leading-7 text-text-secondary">{entry.answer}</p>
                          </details>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </AnimatedSection>
            ) : null}

            {listing.listing_specs && listing.listing_specs.length > 0 && (
              <AnimatedSection delay={0.2}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center border border-white/[0.06]">
                    <Settings size={18} className="text-text-secondary" />
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">Full Specifications</h2>
                </div>
                <SpecsTable specs={listing.listing_specs} />
              </AnimatedSection>
            )}

            {leadCaptureForm ? (
              <AnimatedSection delay={0.25}>
                <div id="inventory-lead-capture">{leadCaptureForm}</div>
              </AnimatedSection>
            ) : null}

            <AnimatedSection delay={0.3}>
              <div className="bg-bg-secondary rounded-2xl border border-accent-primary/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center animate-glow-pulse">
                    <Sparkles size={18} className="text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Have questions about this {listing.make} {listing.model}?</p>
                    <p className="text-xs text-text-tertiary">Ask David questions according to the current listing information.</p>
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

          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="bg-bg-secondary rounded-2xl border border-white/[0.06] overflow-hidden"
              >
                <div className="p-6">
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

                  <h1 className="text-2xl font-bold text-text-primary mb-5 leading-tight">{listing.title}</h1>

                  <div className="bg-gradient-to-br from-bg-tertiary to-bg-secondary rounded-xl p-5 mb-6 border border-white/[0.06]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-price font-mono text-accent-success">
                        {listing.price ? formatPrice(listing.price) : 'Call'}
                      </span>
                      {listing.price && <span className="text-text-tertiary text-sm">USD</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Sparkles size={12} className="text-accent-primary" />
                      <span className="text-text-tertiary text-xs">Pricing shown from the current listing data</span>
                    </div>
                  </div>

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

                  <div className="space-y-3">
                    <a href={contactPhoneHref} className="block">
                      <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-primary text-bg-primary font-semibold rounded-xl hover:bg-accent-glow transition-colors">
                        <Phone size={18} />
                        Email the Team
                      </button>
                    </a>
                    <button
                      onClick={handleAskDavidAboutListing}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-primary/10 text-accent-primary font-semibold rounded-xl border border-accent-primary/20 hover:bg-accent-primary/20 transition-colors"
                    >
                      <MessageCircle size={18} />
                      Ask David About This
                    </button>
                    <Link
                      href={contactQuoteHref}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 text-text-secondary font-medium rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition-colors text-sm"
                    >
                      <FileText size={16} />
                      Request a Quote
                    </Link>
                  </div>
                </div>
              </motion.div>

              <div className="bg-bg-secondary/50 rounded-xl border border-white/[0.06] px-4 py-3">
                <button className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors">
                  <Share2 size={14} />
                  Share this listing
                </button>
              </div>
            </div>
          </div>

          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-primary/95 backdrop-blur-xl border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold font-mono text-accent-success truncate">
                  {listing.price ? formatPrice(listing.price) : 'Call'}
                </p>
              </div>
              <a href={contactPhoneHref}>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-bg-primary font-semibold rounded-xl text-sm">
                  <Phone size={16} />
                  Email
                </button>
              </a>
              <button
                onClick={handleAskDavidAboutListing}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary/10 text-accent-primary font-semibold rounded-xl border border-accent-primary/20 text-sm"
              >
                <MessageCircle size={16} />
                Ask David
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="h-20 lg:hidden" />
    </div>
  );
}
