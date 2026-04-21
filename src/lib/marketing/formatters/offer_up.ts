import { buildDescriptionSections, buildManualPostingInstructions, buildPlatformOutput, compactLocation, displayName, type PublishPayload } from './shared';

export function formatForPlatform(payload: PublishPayload) {
  return buildPlatformOutput('offer_up', payload, {
    titleSource: `${displayName(payload)} ${compactLocation(payload.location)}`,
    descriptionSource: [
      buildDescriptionSections(payload).join(' '),
      'Keep the first sentence tight; OfferUp buyers skim on mobile.',
    ].join(' '),
    platformSpecificFields: {
      mobile_first: true,
      meetup_region: compactLocation(payload.location),
    },
    postingInstructions: buildManualPostingInstructions('OfferUp', payload),
  });
}
