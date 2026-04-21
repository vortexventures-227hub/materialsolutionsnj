import type { Metadata } from 'next';
import { JsonLdScript } from 'next-seo';

import LeadCaptureForm, { type LeadCaptureOption } from '@/components/LeadCaptureForm';
import InventoryDetailClient from '@/components/inventory/InventoryDetailClient';
import { getInventoryDetailSeoPayload } from '@/lib/inventorySeo';
import { getAllPasteQueueUnits, getUnitDisplayName } from '@/lib/marketing/pasteQueueData';

const SITE_URL = 'https://www.materialsolutionsnj.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seo = getInventoryDetailSeoPayload(slug);

  if (!seo) {
    return {
      title: 'Inventory Detail',
      description: 'Current forklift inventory details from Material Solutions NJ.',
      alternates: {
        canonical: `${SITE_URL}/inventory/${slug}`,
      },
    };
  }

  return seo.metadata;
}

export default async function InventoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const seo = getInventoryDetailSeoPayload(slug);
  const units: LeadCaptureOption[] = getAllPasteQueueUnits().map((unit) => ({
    id: unit.unit_id,
    label: getUnitDisplayName(unit),
  }));

  return (
    <>
      {seo ? (
        <>
          <JsonLdScript
            data={seo.productJsonLd}
            scriptKey={`inventory-product-${seo.unit.unit_id.toLowerCase()}`}
          />
          <JsonLdScript
            data={seo.vehicleJsonLd}
            scriptKey={`inventory-vehicle-${seo.unit.unit_id.toLowerCase()}`}
          />
          <JsonLdScript
            data={seo.faqJsonLd}
            scriptKey={`inventory-faq-${seo.unit.unit_id.toLowerCase()}`}
          />
          <JsonLdScript
            data={seo.breadcrumbJsonLd}
            scriptKey={`inventory-breadcrumb-${seo.unit.unit_id.toLowerCase()}`}
          />
        </>
      ) : null}
      <InventoryDetailClient
        slug={slug}
        leadCaptureForm={
          <LeadCaptureForm
            units={units}
            formSource="inventory_detail"
            pageOrigin={`/inventory/${slug}`}
            preselectedUnitId={seo?.unit.unit_id ?? null}
            listingContext={
              seo
                ? {
                    id: seo.unit.unit_id,
                    slug: seo.unit.canonical_slug,
                    title: [seo.unit.year, seo.unit.make, seo.unit.model, seo.unit.unit_type]
                      .filter(Boolean)
                      .join(' '),
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
