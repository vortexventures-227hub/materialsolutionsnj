import { NextResponse } from 'next/server';

import inventorySource from '../../../data/forklift-inventory.json';
import { PUBLIC_PHONE_IS_LIVE, PUBLIC_PHONE_LABEL } from '@/lib/contactDetails';
import { normalizeInventorySlug } from '@/lib/inventorySeo';

const SITE_URL = 'https://www.materialsolutionsnj.com';

type InventorySource = {
  inventory: {
    contacts_2026_04_21?: {
      public_contact_email?: string;
      phone_public?: string;
    };
    lots: Array<{
      lot_id: string;
      title: string;
      location: string;
      lot_asking_price_usd?: number | null;
      unit_type?: string | null;
    }>;
    standalone_units: Array<{
      unit_id: string;
      year: number;
      make: string;
      model: string;
      unit_type: string;
      location: string;
      asking_price_usd?: number | null;
    }>;
  };
};

const inventory = (inventorySource as InventorySource).inventory;
const contact = inventory.contacts_2026_04_21 ?? {};
const phoneContactLine = PUBLIC_PHONE_IS_LIVE
  ? PUBLIC_PHONE_LABEL
  : contact.phone_public ?? '(848) 999-6854';

export async function GET() {
  const lines = [
    '# Material Solutions NJ',
    '',
    'Used forklifts and material handling equipment with deterministic listing data, public inventory pages, and direct contact paths.',
    '',
    '## Documentation',
    `- ${SITE_URL}/about — company background and operating context`,
    `- ${SITE_URL}/services — service capabilities and warehouse support`,
    `- ${SITE_URL}/inventory — live inventory index`,
    '',
    '## Inventory',
    ...inventory.lots.map((lot) => formatLot(lot)),
    ...inventory.standalone_units.map((unit) => formatUnit(unit)),
    '',
    '## FAQ Surfaces',
    `- ${SITE_URL}/faq — buyer FAQ hub with FAQPage schema`,
    `- ${SITE_URL}/services/osha-training — OSHA training FAQPage schema`,
    `- ${SITE_URL}/services/racking — warehouse racking FAQPage schema`,
    `- ${SITE_URL}/services/wire-guided — wire-guided systems FAQPage schema`,
    '- Inventory detail pages emit FAQPage schema on each public unit URL.',
    '',
    '## Contact',
    `- Email: ${contact.public_contact_email ?? 'info@materialsolutionsnj.com'}`,
    `- Phone: ${phoneContactLine}`,
    `- Contact page: ${SITE_URL}/contact`,
  ];

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function formatLot(lot: InventorySource['inventory']['lots'][number]) {
  return `- ${lot.lot_id}: ${lot.title} | ${lot.unit_type ?? 'Inventory lot'} | ${lot.location} | ${formatPrice(lot.lot_asking_price_usd)} | ${SITE_URL}/inventory/${normalizeInventorySlug(lot.lot_id)}`;
}

function formatUnit(unit: InventorySource['inventory']['standalone_units'][number]) {
  return `- ${unit.unit_id}: ${unit.year} ${unit.make} ${unit.model} | ${unit.unit_type} | ${unit.location} | ${formatPrice(unit.asking_price_usd)} | ${SITE_URL}/inventory/${normalizeInventorySlug(unit.unit_id)}`;
}

function formatPrice(value?: number | null) {
  if (!value) {
    return 'Contact for price';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}
