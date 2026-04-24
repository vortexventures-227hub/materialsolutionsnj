import inventorySource from '../../../data/forklift-inventory.json';

import type { CanonicalContent } from './canonical/types';
import type { PublishTarget } from './publishAssembly';

type RuleSeverity = 'fail' | 'downgrade';

export interface ClaimSafetyRule {
  id: string;
  flag: string;
  severity: RuleSeverity;
  message: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
}

export interface MarketingQaContext {
  target: PublishTarget;
  existingCanonicalSlugs?: Set<string>;
  imageMetadataByUrl?: Record<string, ImageMetadata>;
}

export interface MarketingQaGateResult {
  key:
    | 'canonical_completeness'
    | 'hold_suppression'
    | 'lot_only_policy'
    | 'media_completeness'
    | 'claim_safety_rules'
    | 'canonical_collision'
    | 'category_conflict'
    | 'min_image_dimension'
    | 'price_sanity'
    | 'schema_org_validity';
  label: string;
  status: 'pass' | 'fail' | 'downgrade';
  message: string;
}

export interface MarketingQaReport {
  overallStatus: 'pass' | 'fail' | 'downgrade';
  results: MarketingQaGateResult[];
  errorLog: string[];
}

type InventorySource = {
  inventory: {
    reference_pricing_ranges_by_type_usd?: Record<string, number[]>;
  };
};
const inventory = inventorySource as unknown as InventorySource;
const DEFAULT_PRICE_BANDS = inventory.inventory.reference_pricing_ranges_by_type_usd ?? {};
const CLAIM_SAFETY_RULES: ClaimSafetyRule[] = [
  { id: 'lot-only-pricing-block', flag: 'lot_only_pricing', severity: 'fail', message: 'Lot-only inventory cannot be advertised with individual-unit pricing.' },
  { id: 'hold-reason-block', flag: 'hold_reason_present', severity: 'fail', message: 'Hold-flagged inventory must stay suppressed until an operator override exists.' },
  { id: 'warranty-confirmation-downgrade', flag: 'warranty_copy_requires_operator_confirmation', severity: 'downgrade', message: 'Warranty copy requires operator confirmation before publication.' },
  { id: 'price-claim-review', flag: 'price_claim_requires_review', severity: 'downgrade', message: 'Price language needs operator review before publish.' },
  { id: 'financing-claim-review', flag: 'financing_claim_requires_review', severity: 'downgrade', message: 'Financing claims require verification before publish.' },
  { id: 'freight-claim-review', flag: 'freight_claim_requires_review', severity: 'downgrade', message: 'Freight and delivery promises require operator confirmation.' },
  { id: 'battery-claim-review', flag: 'battery_claim_requires_review', severity: 'downgrade', message: 'Battery condition claims require operator confirmation.' },
  { id: 'hours-claim-review', flag: 'hours_claim_requires_review', severity: 'downgrade', message: 'Operating-hours claims require source verification.' },
  { id: 'serial-missing-downgrade', flag: 'serial_missing_requires_review', severity: 'downgrade', message: 'Missing serials should be reviewed before publish.' },
  { id: 'location-review', flag: 'location_requires_review', severity: 'downgrade', message: 'Location language requires verification before publish.' },
  { id: 'availability-review', flag: 'availability_claim_requires_review', severity: 'downgrade', message: 'Availability claims require same-day verification.' },
  { id: 'condition-review', flag: 'condition_claim_requires_review', severity: 'downgrade', message: 'Condition-language superlatives require operator review.' },
  { id: 'compliance-footnote-review', flag: 'compliance_footer_requires_review', severity: 'downgrade', message: 'Compliance footer must be reviewed for channel fit.' },
  { id: 'pricing-note-review', flag: 'pricing_note_requires_review', severity: 'downgrade', message: 'Pricing footnotes require operator approval.' },
  { id: 'legal-disclaimer-review', flag: 'legal_disclaimer_requires_review', severity: 'downgrade', message: 'Legal disclaimer text requires review before publish.' },
  { id: 'image-caption-review', flag: 'image_caption_requires_review', severity: 'downgrade', message: 'Image captions need review before publication.' },
  { id: 'lot-composition-review', flag: 'lot_composition_requires_review', severity: 'downgrade', message: 'Lot composition claims require operator verification.' },
  { id: 'model-alias-review', flag: 'model_alias_requires_review', severity: 'downgrade', message: 'Model aliasing needs operator review before publish.' },
  { id: 'capacity-claim-review', flag: 'capacity_claim_requires_review', severity: 'downgrade', message: 'Capacity claims require verification before publish.' },
  { id: 'mast-height-review', flag: 'mast_height_requires_review', severity: 'downgrade', message: 'Mast-height copy requires verification before publish.' },
  { id: 'battery-voltage-review', flag: 'battery_voltage_requires_review', severity: 'downgrade', message: 'Battery-voltage claims require verification before publish.' },
  { id: 'feature-highlight-review', flag: 'feature_highlight_requires_review', severity: 'downgrade', message: 'Highlighted feature claims require operator review.' },
  { id: 'contact-method-review', flag: 'contact_method_requires_review', severity: 'downgrade', message: 'Contact method claims require review before publish.' },
  { id: 'faq-grounding-review', flag: 'faq_grounding_requires_review', severity: 'downgrade', message: 'FAQ grounding should be reviewed before publication.' },
  { id: 'schema-claim-review', flag: 'schema_claim_requires_review', severity: 'downgrade', message: 'Schema-derived claims require review before publish.' },
  { id: 'source-age-review', flag: 'source_age_requires_review', severity: 'downgrade', message: 'Stale source material requires operator review.' },
  { id: 'media-provenance-review', flag: 'media_provenance_requires_review', severity: 'downgrade', message: 'Media provenance requires verification before publish.' },
  { id: 'taxonomy-review', flag: 'taxonomy_requires_review', severity: 'downgrade', message: 'Channel taxonomy mapping requires review before publish.' },
  { id: 'operator-note-review', flag: 'operator_note_requires_review', severity: 'downgrade', message: 'Operator notes should be reconciled before publish.' },
  { id: 'inventory-lock-review', flag: 'inventory_lock_requires_review', severity: 'downgrade', message: 'Inventory lock changes require review before publish.' }
];

export function loadClaimSafetyRules(): ClaimSafetyRule[] {
  return CLAIM_SAFETY_RULES;
}

function gate(
  key: MarketingQaGateResult['key'],
  label: string,
  status: MarketingQaGateResult['status'],
  message: string,
): MarketingQaGateResult {
  return { key, label, status, message };
}

function normalizeUnitType(unitType: string): string {
  const value = unitType.toLowerCase();
  if (value.includes('order picker')) return 'order_pickers';
  if (value.includes('swing')) return 'swing_reaches';
  if (value.includes('reach')) return 'reach_trucks';
  if (value.includes('counterbalance') || value.includes('bendi') || value.includes('articulated')) {
    return 'stand_up_counterbalance';
  }
  return 'unknown';
}

function validateSchemaPointer(pointer: Record<string, unknown> | null, label: string): string | null {
  if (!pointer) {
    return `${label} pointer missing`;
  }
  if (pointer['@context'] !== 'https://schema.org') {
    return `${label} pointer missing https://schema.org context`;
  }
  if (typeof pointer['@type'] !== 'string' || String(pointer['@type']).trim().length === 0) {
    return `${label} pointer missing @type`;
  }
  return null;
}

function allowedForTarget(canonical: CanonicalContent, target: PublishTarget): boolean {
  const value = canonical.unit_type.toLowerCase();
  if (target === 'website' || target === 'email_campaign') {
    return true;
  }
  return /(forklift|reach|picker|swing|bendi|articulated)/i.test(value);
}

function derivePriceBand(canonical: CanonicalContent): [number, number] | null {
  const key = normalizeUnitType(canonical.unit_type);
  const rawBand = DEFAULT_PRICE_BANDS[key];
  if (!Array.isArray(rawBand) || rawBand.length < 2) {
    return null;
  }
  return [Number(rawBand[0]), Number(rawBand[1])];
}

function gateStatusFromResults(results: MarketingQaGateResult[]): MarketingQaReport['overallStatus'] {
  if (results.some((result) => result.status === 'fail')) {
    return 'fail';
  }
  if (results.some((result) => result.status === 'downgrade')) {
    return 'downgrade';
  }
  return 'pass';
}

export function runMarketingQaGates(
  canonical: CanonicalContent,
  context: MarketingQaContext,
): MarketingQaReport {
  const existingCanonicalSlugs = context.existingCanonicalSlugs ?? new Set<string>();
  const imageMetadataByUrl = context.imageMetadataByUrl ?? {};
  const results: MarketingQaGateResult[] = [];

  const requiredFields: Array<keyof CanonicalContent> = [
    'unit_id',
    'title',
    'long_description',
    'location_label',
    'contact_email_public',
    'contact_phone_public',
    'canonical_url',
    'seo_title',
    'meta_description',
  ];
  const missingFields = requiredFields.filter((field) => {
    const value = canonical[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });
  results.push(
    missingFields.length === 0
      ? gate('canonical_completeness', 'Gate 1 — canonical completeness', 'pass', 'Required canonical fields are populated.')
      : gate(
          'canonical_completeness',
          'Gate 1 — canonical completeness',
          'fail',
          `Missing required canonical fields: ${missingFields.join(', ')}`,
        ),
  );

  const allowHoldPublish = canonical.manual_overrides.allow_hold_publish === true;
  results.push(
    canonical.hold_flag && !allowHoldPublish
      ? gate(
          'hold_suppression',
          'Gate 2 — hold suppression',
          'fail',
          'Hold-flagged content is blocked until an operator override is present.',
        )
      : gate('hold_suppression', 'Gate 2 — hold suppression', 'pass', 'No hold suppression blocker present.'),
  );

  const lotOnlyConflict = canonical.lot_only_flag && canonical.source_kind !== 'lot';
  results.push(
    lotOnlyConflict
      ? gate(
          'lot_only_policy',
          'Gate 3 — lot-only policy',
          'fail',
          'Lot-only inventory is being treated like an individual-unit listing.',
        )
      : gate('lot_only_policy', 'Gate 3 — lot-only policy', 'pass', 'Lot-only policy is internally consistent.'),
  );

  const minImageCount = canonical.source_kind === 'lot' ? 3 : 1;
  results.push(
    canonical.images.length >= minImageCount
      ? gate('media_completeness', 'Gate 4 — media completeness', 'pass', `Media count meets the minimum of ${minImageCount}.`)
      : gate(
          'media_completeness',
          'Gate 4 — media completeness',
          'fail',
          `Media count ${canonical.images.length} is below the minimum ${minImageCount}.`,
        ),
  );

  const matchedClaimSafetyRules = loadClaimSafetyRules().filter((rule) => canonical.claim_safety_flags.includes(rule.flag));
  if (matchedClaimSafetyRules.length === 0) {
    results.push(gate('claim_safety_rules', 'Gate 5 — claim safety rules', 'pass', 'No claim-safety flags matched the YAML rule set.'));
  } else {
    const status = matchedClaimSafetyRules.some((rule) => rule.severity === 'fail') ? 'fail' : 'downgrade';
    results.push(
      gate(
        'claim_safety_rules',
        'Gate 5 — claim safety rules',
        status,
        matchedClaimSafetyRules.map((rule) => `${rule.id}: ${rule.message}`).join(' | '),
      ),
    );
  }

  results.push(
    existingCanonicalSlugs.has(canonical.canonical_slug)
      ? gate(
          'canonical_collision',
          'Gate 6 — canonical collision',
          'fail',
          `Canonical slug '${canonical.canonical_slug}' already exists in inventory_marketing.`,
        )
      : gate('canonical_collision', 'Gate 6 — canonical collision', 'pass', 'Canonical slug is unique in the provided context.'),
  );

  results.push(
    allowedForTarget(canonical, context.target)
      ? gate('category_conflict', 'Gate 7 — category conflict', 'pass', `${canonical.unit_type} is valid for ${context.target}.`)
      : gate(
          'category_conflict',
          'Gate 7 — category conflict',
          'fail',
          `${canonical.unit_type} is not valid for ${context.target}.`,
        ),
  );

  const missingMetadata = canonical.images.filter((image) => !imageMetadataByUrl[image.source_path]);
  const undersizedImages = canonical.images.filter((image) => {
    const metadata = imageMetadataByUrl[image.source_path];
    if (!metadata) return false;
    return Math.max(metadata.width, metadata.height) < 800;
  });
  const hasImageMetadata = Object.keys(imageMetadataByUrl).length > 0;
  if (undersizedImages.length > 0) {
    results.push(
      gate(
        'min_image_dimension',
        'Gate 8 — min image dimension',
        'fail',
        `Images below 800px long edge: ${undersizedImages.map((image) => image.source_path).join(', ')}`,
      ),
    );
  } else if (hasImageMetadata && canonical.images.length > 0 && missingMetadata.length > 0) {
    results.push(
      gate(
        'min_image_dimension',
        'Gate 8 — min image dimension',
        'downgrade',
        `Image metadata missing for: ${missingMetadata.map((image) => image.source_path).join(', ')}`,
      ),
    );
  } else {
    results.push(
      gate(
        'min_image_dimension',
        'Gate 8 — min image dimension',
        'pass',
        hasImageMetadata
          ? 'Image dimensions meet the 800px minimum.'
          : 'Image-dimension metadata not provided; strict size check skipped.',
      ),
    );
  }

  const priceBand = derivePriceBand(canonical);
  const price = canonical.asking_price_usd;
  if (canonical.lot_only_flag || price == null) {
    results.push(gate('price_sanity', 'Gate 9 — price sanity', 'pass', 'No individual-unit price is advertised for this record.'));
  } else if (!priceBand) {
    results.push(
      gate(
        'price_sanity',
        'Gate 9 — price sanity',
        'downgrade',
        `No reference price band is configured for ${canonical.unit_type}.`,
      ),
    );
  } else {
    const [bandMin, bandMax] = priceBand;
    const lowerBound = bandMin * 0.3;
    const upperBound = bandMax * 2;
    results.push(
      price >= lowerBound && price <= upperBound
        ? gate(
            'price_sanity',
            'Gate 9 — price sanity',
            'pass',
            `Price ${price} is within the accepted ${lowerBound}-${upperBound} range.`,
          )
        : gate(
            'price_sanity',
            'Gate 9 — price sanity',
            'fail',
            `Price ${price} is outside the accepted ${lowerBound}-${upperBound} range.`,
          ),
    );
  }

  const schemaErrors = [
    validateSchemaPointer(canonical.schema_pointers.product, 'product'),
    validateSchemaPointer(canonical.schema_pointers.vehicle, 'vehicle'),
    validateSchemaPointer(canonical.schema_pointers.faqPage, 'faqPage'),
    validateSchemaPointer(canonical.schema_pointers.breadcrumb, 'breadcrumb'),
  ].filter(Boolean) as string[];
  results.push(
    schemaErrors.length === 0
      ? gate('schema_org_validity', 'Gate 10 — schema.org validity', 'pass', 'Schema pointers carry schema.org context and @type fields.')
      : gate(
          'schema_org_validity',
          'Gate 10 — schema.org validity',
          'fail',
          schemaErrors.join(' | '),
        ),
  );

  const overallStatus = gateStatusFromResults(results);
  const errorLog = results
    .filter((result) => result.status === 'fail')
    .map((result) => `${result.key}: ${result.message}`);

  return {
    overallStatus,
    results,
    errorLog,
  };
}
