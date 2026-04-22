import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { assemblePublishPayload } from '../src/lib/marketing/publishAssembly.ts';
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
} from '../src/lib/marketing/schemaTransformers.ts';

const INVENTORY_PATH = new URL('../data/forklift-inventory.json', import.meta.url);
const OUTPUT_DIR = '/Users/vortexventures/Desktop/Claude_Dispatch_Operations/listings/paste_queue';
const INDEX_PATH = path.join(OUTPUT_DIR, '_INDEX.md');
const GENERATED_TIMESTAMP_PLACEHOLDER = '__GENERATED_TIMESTAMP__';

const TARGETS = [
  'facebook_marketplace',
  'craigslist',
  'ebay',
  'website',
  'email_campaign',
];

const TARGET_LABELS = {
  facebook_marketplace: 'Facebook Marketplace',
  craigslist: 'Craigslist',
  ebay: 'eBay',
  website: 'Website',
  email_campaign: 'Email',
};

const POSTING_URLS = {
  facebook_marketplace: 'https://www.facebook.com/marketplace/create/item',
  craigslist: 'https://accounts.craigslist.org/login',
  ebay: 'https://www.ebay.com/sl/sell',
  website: 'Internal — pushes via Publish Button when API ready',
  email_campaign: 'Feed to SendGrid template',
};

async function loadInventorySource() {
  const raw = await fs.readFile(INVENTORY_PATH, 'utf8');
  return JSON.parse(raw);
}

function collapseWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function sentenceCaseUnitType(unitType) {
  const normalized = unitType.toLowerCase();

  if (normalized.includes('order picker')) return 'Order Picker';
  if (normalized.includes('reach truck')) return 'Reach Truck';
  if (normalized.includes('swing reach')) return 'Swing Reach';
  if (normalized.includes('articulated') || normalized.includes('bendi')) return 'Articulated Forklift';

  return unitType;
}

function getDisplayName(unit) {
  return collapseWhitespace(
    [unit.year, unit.make, unit.model, sentenceCaseUnitType(unit.unit_type)]
      .filter(Boolean)
      .join(' ')
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeState(value) {
  const cleaned = value.replace(/\(.*?\)/g, '').trim().toLowerCase();
  const states = {
    maryland: 'MD',
    'new jersey': 'NJ',
  };

  return states[cleaned] ?? value.trim().toUpperCase();
}

function parseLocation(location) {
  const cleaned = collapseWhitespace(location.replace(/\s*\(.*?\)\s*/g, ''));
  const [city = '', state = ''] = cleaned.split(',').map((part) => part.trim());

  return {
    city: city || cleaned,
    state: normalizeState(state),
  };
}

function validateUnit(unit) {
  const missing = [];

  if (!unit.unit_id) missing.push('unit_id');
  if (!unit.canonical_slug) missing.push('canonical_slug');
  if (!unit.location) missing.push('location');

  return missing;
}

function buildAskingPriceLine(unit, payload) {
  if (unit.sold_as_lot_only) {
    return 'Sold as lot only — see lot listing';
  }

  if (payload.price == null) {
    return 'Call for price';
  }

  return formatCurrency(payload.price);
}

function buildWarningsSection(payloadWarnings) {
  if (payloadWarnings.length === 0) {
    return 'None';
  }

  return payloadWarnings.map((warning) => `- ${warning}`).join('\n');
}

function buildImagesSection(images) {
  if (images.length === 0) {
    return '1. None provided';
  }

  return images
    .map((image, index) => `${index + 1}. ${image.src} — alt: ${image.alt}`)
    .join('\n');
}

function buildFileContents(unit, target, payload) {
  const displayName = getDisplayName(unit);
  const platformLabel = TARGET_LABELS[target];
  const location = parseLocation(unit.location);
  const holdBanner =
    unit.status === 'hold'
      ? '## HOLD STATUS — confirm before posting\n\n'
      : '';
  const preheaderSection =
    target === 'email_campaign'
      ? `## ✉️ Preheader\n\n${String(payload.platformSpecificFields.preheader ?? '')}\n\n`
      : '';

  return `${holdBanner}# ${displayName} — ${platformLabel}

**Unit:** ${unit.unit_id}
**Location:** ${location.city}, ${location.state}
**Asking Price:** ${buildAskingPriceLine(unit, payload)}
**Posting URL:** ${POSTING_URLS[target]}

## ✂️ Copy/Paste Title

${payload.title}

${preheaderSection}## ✂️ Copy/Paste Description

${payload.description}

## 🖼 Images (paste URLs or upload in this order)

${buildImagesSection(payload.images)}

## ⚠️ Warnings

${buildWarningsSection(payload.warnings)}

## 🔗 Meta

- SEO title: ${payload.metaTags.seo_title}
- Meta description: ${payload.metaTags.meta_description}
- Canonical URL: ${payload.canonical_url}
- Generated: ${GENERATED_TIMESTAMP_PLACEHOLDER}
`;
}

function buildNormalizedUnits(inventory) {
  return [
    ...inventory.inventory.lots.flatMap((lot) =>
      lot.units.map((member) => normalizeLotUnitMember(lot, member))
    ),
    ...inventory.inventory.standalone_units.map((unit) => normalizeStandaloneUnit(unit)),
  ];
}

function buildTotalAsking(inventory, units) {
  const standaloneTotal = units
    .filter((unit) => !unit.sold_as_lot_only)
    .reduce((sum, unit) => sum + (unit.asking_price_usd ?? 0), 0);

  const lotTotal = inventory.inventory.lots.reduce(
    (sum, lot) => sum + (lot.lot_asking_price_usd ?? 0),
    0
  );

  return standaloneTotal + lotTotal;
}

function buildIndex(units, writtenRows, totalAsking) {
  const lotOnlyUnits = units.filter((unit) => unit.sold_as_lot_only).length;
  const individualUnits = units.length - lotOnlyUnits;
  const header = `# Paste Queue Index

## Executive Summary

- Units: ${units.length}
- Targets per unit: ${TARGETS.length}
- Generated files: ${writtenRows.length}
- Total asking value: ${formatCurrency(totalAsking)}
- Lot-only units: ${lotOnlyUnits} (${lotOnlyUnits * TARGETS.length} files)
- Individual units: ${individualUnits} (${individualUnits * TARGETS.length} files)
- Generated timestamp: ${GENERATED_TIMESTAMP_PLACEHOLDER}

| Unit ID | Unit Type | Location | FB Marketplace | Craigslist | eBay | Website | Email |
|---|---|---|---|---|---|---|---|
`;

  const rows = units
    .map((unit) => {
      const location = parseLocation(unit.location);
      const rowMap = new Map(
        writtenRows
          .filter((entry) => entry.unit_id === unit.unit_id)
          .map((entry) => [entry.target, entry.fileName])
      );

      return `| ${unit.unit_id} | ${sentenceCaseUnitType(unit.unit_type)} | ${location.city}, ${location.state} | [FB](${rowMap.get('facebook_marketplace')}) | [Craigslist](${rowMap.get('craigslist')}) | [eBay](${rowMap.get('ebay')}) | [Website](${rowMap.get('website')}) | [Email](${rowMap.get('email_campaign')}) |`;
    })
    .join('\n');

  return `${header}${rows}\n`;
}

async function main() {
  const inventorySource = await loadInventorySource();
  const units = buildNormalizedUnits(inventorySource);
  const writtenRows = [];
  const generatedTimestamp = `${inventorySource.inventory.last_updated}T00:00:00Z`;

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const unit of units) {
    for (const target of TARGETS) {
      const missing = validateUnit(unit);
      if (missing.length > 0) {
        console.error(
          `[skip] ${unit.unit_id} × ${target} missing required field(s): ${missing.join(', ')}`
        );
        continue;
      }

      const payload = assemblePublishPayload(unit, target);
      const fileName = `${unit.unit_id}_${target}.md`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      const contents = buildFileContents(unit, target, payload).replaceAll(
        GENERATED_TIMESTAMP_PLACEHOLDER,
        generatedTimestamp
      );

      await fs.writeFile(filePath, contents, 'utf8');

      writtenRows.push({
        unit_id: unit.unit_id,
        target,
        fileName,
      });
    }
  }

  const totalAsking = buildTotalAsking(inventorySource, units);
  const indexContents = buildIndex(units, writtenRows, totalAsking).replaceAll(
    GENERATED_TIMESTAMP_PLACEHOLDER,
    generatedTimestamp
  );
  await fs.writeFile(INDEX_PATH, indexContents, 'utf8');

  console.log(
    `Generated ${writtenRows.length} paste-queue files and index at ${OUTPUT_DIR}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
