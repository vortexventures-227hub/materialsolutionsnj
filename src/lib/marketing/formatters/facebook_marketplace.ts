import { buildDescriptionSections, buildPlatformOutput, compactLocation, displayName, type PublishPayload } from './shared';

export function formatForPlatform(payload: PublishPayload) {
  return buildPlatformOutput('facebook_marketplace', payload, {
    titleSource: `${displayName(payload)} — ${compactLocation(payload.location)}`,
    descriptionSource: buildDescriptionSections(payload).join(' '),
    platformSpecificFields: {
      commerce_category_todo: 'TODO: map to Facebook Commerce category IDs before auto-publish.',
      inventory_reference: payload.unit_id,
    },
  });
}
