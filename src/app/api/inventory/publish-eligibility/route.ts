import { NextResponse } from 'next/server';

import { normalizedInventoryUnits } from '@/lib/inventorySeo';

export const dynamic = 'force-dynamic';

type PublishEligibilitySummary = {
  canonical_slug: string;
  unit_id: string;
  publish_eligibility: boolean;
  hold_flag: boolean;
  lot_only_flag: boolean;
};

type PublishEligibilityFull = PublishEligibilitySummary & {
  title: string;
  location: string;
  status: string | null;
  asking_price_usd: number | null;
  image_count: number;
  source_kind: 'standalone' | 'lot_member';
  lot_id: string | null;
};

function buildTitle(unit: (typeof normalizedInventoryUnits)[number]): string {
  return [unit.year, unit.make, unit.model, unit.unit_type].filter(Boolean).join(' ');
}

function isPublishEligible(unit: (typeof normalizedInventoryUnits)[number]): boolean {
  return unit.status === 'available' && unit.media_paths.length > 0;
}

function toEligibilitySummary(unit: (typeof normalizedInventoryUnits)[number]): PublishEligibilitySummary {
  return {
    canonical_slug: unit.canonical_slug,
    unit_id: unit.unit_id,
    publish_eligibility: isPublishEligible(unit),
    hold_flag: Boolean(unit.hold_reason),
    lot_only_flag: unit.sold_as_lot_only,
  };
}

function toEligibilityFull(unit: (typeof normalizedInventoryUnits)[number]): PublishEligibilityFull {
  const summary = toEligibilitySummary(unit);

  return {
    ...summary,
    title: buildTitle(unit),
    location: unit.location,
    status: unit.status,
    asking_price_usd: unit.asking_price_usd,
    image_count: unit.media_paths.length,
    source_kind: unit.source_kind,
    lot_id: unit.lot_id,
  };
}

function isEligibleEntry(entry: PublishEligibilitySummary): boolean {
  return entry.publish_eligibility && !entry.hold_flag && !entry.lot_only_flag;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eligibleOnly = url.searchParams.get('eligible') === 'true';
  const full = url.searchParams.get('format') === 'full';

  const units = (full ? normalizedInventoryUnits.map(toEligibilityFull) : normalizedInventoryUnits.map(toEligibilitySummary)).filter(
    (entry) => !eligibleOnly || isEligibleEntry(entry)
  );

  const eligibleCount = units.filter(isEligibleEntry).length;

  return NextResponse.json(
    {
      units,
      total: units.length,
      eligible_count: eligibleCount,
      filter: eligibleOnly ? 'eligible_only' : 'none',
      generated_at: new Date().toISOString(),
    },
    {
      headers: {
        'X-Marketing-Pipeline': 'canonical-v1',
      },
    }
  );
}
