import { buildDescriptionSections, buildManualPostingInstructions, buildPlatformOutput, displayName, type PublishPayload } from './shared';

export function formatForPlatform(payload: PublishPayload) {
  return buildPlatformOutput('iron_planet', payload, {
    titleSource: `${displayName(payload)} | Auction-ready draft`,
    descriptionSource: buildDescriptionSections(payload).join(' '),
    platformSpecificFields: {
      consignor_sheet_status: 'consignor-sheet field mapping pending',
      auction_ready: false,
    },
    postingInstructions: buildManualPostingInstructions('IronPlanet', payload),
  });
}
