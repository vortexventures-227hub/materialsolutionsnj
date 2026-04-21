import type { Metadata } from 'next';
import { JsonLdScript } from 'next-seo';

import InventoryDetailClient from '@/components/inventory/InventoryDetailClient';
import { getInventoryDetailSeoPayload } from '@/lib/inventorySeo';

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
        canonical: `/inventory/${slug}`,
      },
    };
  }

  return seo.metadata;
}

export default async function InventoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const seo = getInventoryDetailSeoPayload(slug);

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
        </>
      ) : null}
      <InventoryDetailClient slug={slug} />
    </>
  );
}
