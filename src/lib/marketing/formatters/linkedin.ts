import { buildDescriptionSections, buildPlatformOutput, compactLocation, displayName, formatCurrency, type PublishPayload } from './shared';

export function formatForPlatform(payload: PublishPayload) {
  const socialLead = `${displayName(payload)} is available from Material Solutions NJ in ${compactLocation(payload.location)}.`;
  const priceLine = payload.sold_as_lot_only ? 'Lot-sale structure available on request.' : `Asking ${formatCurrency(payload.price_usd)}.`;

  return buildPlatformOutput('linkedin', payload, {
    titleSource: `${displayName(payload)} | Material Solutions NJ`,
    descriptionSource: [
      socialLead,
      priceLine,
      buildDescriptionSections(payload).join(' '),
      '#forklift #materialhandling #usedequipment #warehousing',
    ].join(' '),
    platformSpecificFields: {
      post_type: 'organic_social',
      hashtags: ['forklift', 'materialhandling', 'usedequipment', 'warehousing'],
    },
  });
}
