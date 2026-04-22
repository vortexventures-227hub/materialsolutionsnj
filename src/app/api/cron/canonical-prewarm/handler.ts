import { NextResponse } from 'next/server';

import { normalizedInventoryUnits } from '@/lib/inventorySeo';
import { upsertCanonicalContent } from '@/lib/marketing/canonical/persist';
import { generateMarketingAssets } from '@/lib/marketing/canonical/generateMarketingAssets';
import type { CanonicalContent } from '@/lib/marketing/canonical/types';
import type { ForkliftUnit } from '@/lib/marketing/schemaTransformers';

export interface CanonicalPrewarmHandlerDependencies {
  cronSecretToken: string | null;
  listUnits: () => ForkliftUnit[];
  generateCanonicalContent: (unit: ForkliftUnit) => CanonicalContent;
  upsertCanonicalContent: (canonical: CanonicalContent) => Promise<unknown>;
  now: () => Date;
}

const defaultDependencies: CanonicalPrewarmHandlerDependencies = {
  cronSecretToken: process.env.CRON_SECRET_TOKEN ?? null,
  listUnits: () => normalizedInventoryUnits,
  generateCanonicalContent: generateMarketingAssets,
  upsertCanonicalContent,
  now: () => new Date(),
};
function getBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization') ?? '';
  return authorization.replace(/^Bearer\s+/i, '').trim();
}

function isActiveUnit(unit: ForkliftUnit): boolean {
  return unit.status === 'available' && !unit.hold_reason && !unit.sold_as_lot_only;
}

export function createCanonicalPrewarmHandler(
  dependencies: CanonicalPrewarmHandlerDependencies = defaultDependencies
) {
  return async function canonicalPrewarmHandler(request: Request) {
    if (dependencies.cronSecretToken && getBearerToken(request) !== dependencies.cronSecretToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startedAt = Date.now();
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dry_run') === '1';
    const units = dependencies.listUnits();
    const activeUnits = units.filter(isActiveUnit);
    const skipped = units
      .filter((unit) => !isActiveUnit(unit))
      .map((unit) => unit.canonical_slug || unit.unit_id);
    const errors: Array<{ slug: string; error: string }> = [];
    let unitsWarmed = 0;

    for (const unit of activeUnits) {
      const canonical = dependencies.generateCanonicalContent(unit);
      unitsWarmed += 1;

      if (dryRun) {
        continue;
      }

      try {
        await dependencies.upsertCanonicalContent(canonical);
      } catch (error) {
        errors.push({
          slug: unit.canonical_slug || unit.unit_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json(
      {
        mode: dryRun ? 'dry_run' : 'prewarm',
        units_total: units.length,
        units_active: activeUnits.length,
        units_warmed: unitsWarmed,
        units_skipped: skipped.length,
        skipped,
        errors,
        elapsed_ms: Date.now() - startedAt,
        cached: !dryRun,
        timestamp: dependencies.now().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-Cron-Pipeline': 'canonical-v1:prewarm',
        },
      }
    );
  };
}
