import { buildDescriptionSections, buildPlatformOutput, displayName, type PublishPayload } from './shared';

export function formatForPlatform(payload: PublishPayload) {
  return buildPlatformOutput('ebay', payload, {
    titleSource: displayName(payload),
    descriptionSource: buildDescriptionSections(payload).join(' '),
    platformSpecificFields: {
      item_specifics_status: 'schema mapping pending for capacity, mast height, power source, and serial fields',
      listing_format: 'fixed_price_or_best_offer',
    },
  });
}
