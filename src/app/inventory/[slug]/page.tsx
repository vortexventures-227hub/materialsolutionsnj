import type { Metadata } from 'next';
import { JsonLdScript } from 'next-seo';

import LeadCaptureForm, { type LeadCaptureOption } from '@/components/LeadCaptureForm';
import InventoryDetailClient from '@/components/inventory/InventoryDetailClient';
import { findInventoryUnitBySlug } from '@/lib/inventorySeo';
import { generateMarketingAssets } from '@/lib/marketing/canonical/generateMarketingAssets';
import type { CanonicalContent } from '@/lib/marketing/canonical/types';
import { getAllPasteQueueUnits, getUnitDisplayName } from '@/lib/marketing/pasteQueueData';

const SITE_URL = 'https://www.materialsolutionsnj.com';

type InventoryDetailCanonicalPayload = {
  canonical: CanonicalContent;
  canonicalPath: string;
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getInventoryDetailCanonicalPayload(slug: string): InventoryDetailCanonicalPayload | null {
  const unit = findInventoryUnitBySlug(slug);
  if (!unit) {
    return null;
  }

  const canonical = generateMarketingAssets(unit);
  return {
    canonical,
    canonicalPath: new URL(canonical.canonical_url).pathname,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = getInventoryDetailCanonicalPayload(slug);

  if (!payload) {
    return {
      title: 'Inventory Detail',
      description: 'Current forklift inventory details from Material Solutions NJ.',
      alternates: {
        canonical: `${SITE_URL}/inventory/${slug}`,
      },
    };
  }

  const { canonical, canonicalPath } = payload;

  return {
    title: canonical.seo_title,
    description: canonical.meta_description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'website',
      url: canonical.canonical_url,
      title: canonical.og_title,
      description: canonical.og_description,
      images: canonical.og_image_url
        ? [
            {
              url: canonical.og_image_url,
              alt: `${canonical.title} primary image`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: canonical.twitter_card,
      title: canonical.og_title,
      description: canonical.og_description,
      images: canonical.og_image_url ? [canonical.og_image_url] : undefined,
    },
  };
}

export default async function InventoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const payload = getInventoryDetailCanonicalPayload(slug);
  const canonical = payload?.canonical;
  const units: LeadCaptureOption[] = getAllPasteQueueUnits().map((unit) => ({
    id: unit.unit_id,
    label: getUnitDisplayName(unit),
  }));

  return (
    <>
      {canonical ? (
        <>
          {canonical.schema_pointers.product ? (
            <JsonLdScript
              data={canonical.schema_pointers.product}
              scriptKey={`inventory-product-${canonical.unit_id.toLowerCase()}`}
            />
          ) : null}
          {canonical.schema_pointers.vehicle ? (
            <JsonLdScript
              data={canonical.schema_pointers.vehicle}
              scriptKey={`inventory-vehicle-${canonical.unit_id.toLowerCase()}`}
            />
          ) : null}
          {canonical.schema_pointers.faqPage ? (
            <JsonLdScript
              data={canonical.schema_pointers.faqPage}
              scriptKey={`inventory-faq-${canonical.unit_id.toLowerCase()}`}
            />
          ) : null}
          {canonical.schema_pointers.breadcrumb ? (
            <JsonLdScript
              data={canonical.schema_pointers.breadcrumb}
              scriptKey={`inventory-breadcrumb-${canonical.unit_id.toLowerCase()}`}
            />
          ) : null}
        </>
      ) : null}
      <InventoryDetailClient
        slug={slug}
        canonical={canonical ?? null}
        leadCaptureForm={
          <LeadCaptureForm
            units={units}
            formSource="inventory_detail"
            pageOrigin={`/inventory/${slug}`}
            preselectedUnitId={canonical?.unit_id ?? null}
            listingContext={
              canonical
                ? {
                    id: canonical.unit_id,
                    slug: canonical.canonical_slug,
                    title: canonical.title,
                  }
                : undefined
            }
            title="Questions about this unit?"
            description="Send a note and David will follow up with availability, pricing, transport details, or the next best comparable unit."
            submitLabel="Ask about this unit"
          />
        }
      />
    </>
  );
}
