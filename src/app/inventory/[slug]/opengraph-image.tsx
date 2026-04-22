import type { Metadata } from 'next';

import { findUnitBySlug, getDisplayName, renderInventoryOGImage } from '@/lib/marketing/ogImage';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const unit = findUnitBySlug(slug);
  if (!unit) {
    return { title: 'Inventory Listing' };
  }
  return {
    openGraph: {
      title: getDisplayName(unit),
      description: unit.asking_price_usd
        ? `${unit.asking_price_usd} — ${unit.location}`
        : unit.location,
    },
  };
}

export default async function InventoryOGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderInventoryOGImage(slug);
}
