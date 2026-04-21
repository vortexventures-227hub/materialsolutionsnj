import type { Metadata } from 'next';
import { JsonLdScript } from 'next-seo';

import inventorySource from '../../../data/forklift-inventory.json';
import InventoryPageClient from '@/components/inventory/InventoryPageClient';
import {
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  toOGMeta,
  toProductSchema,
} from '@/lib/marketing/schemaTransformers';

const SITE_URL = 'https://www.materialsolutionsnj.com';

type InventorySource = {
  inventory: {
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
};

const inventoryData = inventorySource as InventorySource;

function getAllMarketingUnits() {
  const standaloneUnits = inventoryData.inventory.standalone_units.map((unit) =>
    normalizeStandaloneUnit(unit)
  );
  const lotUnits = inventoryData.inventory.lots.flatMap((lot) =>
    lot.units.map((member) => normalizeLotUnitMember(lot, member))
  );

  return [...lotUnits, ...standaloneUnits];
}

const marketingUnits = getAllMarketingUnits();
const pageOg = marketingUnits[0] ? toOGMeta(marketingUnits[0]) : null;

export const metadata: Metadata = {
  title: 'Used Forklift Inventory — Material Solutions NJ',
  description:
    'Browse current Material Solutions NJ inventory for order pickers, reach trucks, articulated forklifts, and other warehouse equipment.',
  alternates: {
    canonical: `${SITE_URL}/inventory`,
  },
  openGraph: {
    type: 'website',
    url: 'https://www.materialsolutionsnj.com/inventory',
    title: 'Used Forklift Inventory — Material Solutions NJ',
    description:
      'Browse current Material Solutions NJ inventory for order pickers, reach trucks, articulated forklifts, and other warehouse equipment.',
    images: pageOg
      ? [
          {
            url: pageOg.image,
            alt: pageOg.title,
          },
        ]
      : undefined,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Used Forklift Inventory — Material Solutions NJ',
    description:
      'Browse current Material Solutions NJ inventory for order pickers, reach trucks, articulated forklifts, and other warehouse equipment.',
    images: pageOg ? [pageOg.image] : undefined,
  },
};

export default function InventoryPage() {
  return (
    <>
      {marketingUnits.map((unit) => (
        <JsonLdScript
          key={unit.unit_id}
          data={toProductSchema(unit)}
          scriptKey={`inventory-card-product-${unit.canonical_slug}`}
        />
      ))}
      <InventoryPageClient />
    </>
  );
}
