import { buildDescriptionSections, buildManualPostingInstructions, buildPlatformOutput, displayName, type PublishPayload } from './shared';

export function formatForPlatform(payload: PublishPayload) {
  return buildPlatformOutput('machinery_trader', payload, {
    titleSource: `${displayName(payload)} | Material Solutions NJ`,
    descriptionSource: buildDescriptionSections(payload).join(' '),
    platformSpecificFields: {
      dealer_feed_status: 'dealer-feed category and listing-condition mapping pending',
      inventory_reference: payload.unit_id,
    },
    postingInstructions: buildManualPostingInstructions('MachineryTrader', payload),
  });
}
