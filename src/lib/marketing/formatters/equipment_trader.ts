/**
 * equipment_trader.ts
 * AXIS-004 — Publish Button: next 5 platform formatters
 *
 * Platform: Equipment Trader (EquipTrader.com)
 * Tier: template (manual posting — dealer inventory feed UI)
 *
 * API status: No public dealer API confirmed.
 * Credential needed: [CONFIRM_WITH_CHRIS] Equipment Trader dealer account + feed access.
 *
 * Pattern: mirrors machinery_trader.ts (template-tier, manual posting).
 */

import { buildDescriptionSections, buildManualPostingInstructions, buildPlatformOutput, displayName, type PublishPayload } from './shared';

export function formatForPlatform(payload: PublishPayload) {
  return buildPlatformOutput('equipment_trader', payload, {
    titleSource: `${displayName(payload)} | Material Solutions NJ`,
    descriptionSource: buildDescriptionSections(payload).join('\n\n'),
    platformSpecificFields: {
      dealer_feed_status: '[CONFIRM_WITH_CHRIS] Equipment Trader dealer feed API — TOS/credential unconfirmed. Manual CSV upload may be fallback.',
      inventory_reference: payload.unit_id,
      category_hint: 'forklifts',
      listing_condition_mapping: payload.sold_as_lot_only
        ? 'lot_sale'
        : 'used',
      price_note: payload.sold_as_lot_only
        ? 'Lot pricing — confirm with Chris before publishing per-unit price'
        : `${payload.price_usd} USD`,
    },
    postingInstructions: buildManualPostingInstructions('Equipment Trader', payload),
  });
}
