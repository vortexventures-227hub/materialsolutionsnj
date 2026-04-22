import { NextResponse } from 'next/server';

import { findInventoryUnitBySlug } from '@/lib/inventorySeo';
import { generateMarketingAssets } from '@/lib/marketing/canonical/generateMarketingAssets';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const unit = findInventoryUnitBySlug(slug);

  if (!unit) {
    return NextResponse.json({ error: 'Marketing assets not found' }, { status: 404 });
  }

  const canonical = generateMarketingAssets(unit);

  if (!canonical.publish_eligibility) {
    return NextResponse.json({ error: 'Marketing assets not found' }, { status: 404 });
  }

  return NextResponse.json(
    {
      unit_id: canonical.unit_id,
      canonical_url: canonical.canonical_url,
      publish_eligibility: canonical.publish_eligibility,
      hold_flag: canonical.hold_flag,
      lot_only_flag: canonical.lot_only_flag,
      derivation_version: canonical.derivation_version,
      claim_safety_flags: canonical.claim_safety_flags,
      seo_title: canonical.seo_title,
      meta_description: canonical.meta_description,
      og_title: canonical.og_title,
      og_description: canonical.og_description,
      faq_array: canonical.faq,
      schema_payload: canonical.schema_pointers,
      channel_copy_variants: canonical.platform_overrides.map((override) => ({
        channel: override.channel,
        title: override.title,
        description: override.description,
      })),
      alt_text_array: canonical.images.map((image) => image.alt),
    },
    {
      headers: {
        'X-Marketing-Pipeline': 'canonical-v1',
      },
    }
  );
}
