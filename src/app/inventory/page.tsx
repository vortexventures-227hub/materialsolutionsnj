import type { Metadata } from 'next';
import { JsonLdScript } from 'next-seo';

import inventorySource from '../../../data/forklift-inventory.json';
import LeadCaptureForm, { type LeadCaptureOption } from '@/components/LeadCaptureForm';
import InventoryPageClient from '@/components/inventory/InventoryPageClient';
import {
  type LotForkliftJson,
  type StandaloneForkliftJsonUnit,
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
  toOGMeta,
  toProductSchema,
} from '@/lib/marketing/schemaTransformers';
import { getUnitDisplayName } from '@/lib/marketing/pasteQueueData';

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
const leadCaptureUnits: LeadCaptureOption[] = marketingUnits.map((unit) => ({
  id: unit.unit_id,
  label: getUnitDisplayName(unit),
}));
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
      <div className="mx-auto max-w-[1280px] px-6 py-10 md:px-8 md:py-12">
        <LeadCaptureForm
          units={leadCaptureUnits}
          formSource="inventory_index"
          pageOrigin="/inventory"
          title="Want help narrowing the inventory?"
          description="Send your requirements and David will match you to the right unit, confirm location, and flag anything worth seeing first."
          submitLabel="Send inventory request"
        />
      </div>
    </>
  );
}
