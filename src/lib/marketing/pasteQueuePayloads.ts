import { generateMarketingAssets } from './canonical/generateMarketingAssets';
import {
  getPasteQueuePayloads,
  type ListingPlatform,
} from './pasteQueueData';
import type { PublishPayload } from './publishAssembly';
import type { ForkliftUnit } from './schemaTransformers';

const CANONICAL_OVERRIDE_CHANNELS: Partial<Record<ListingPlatform, string>> = {
  facebook_marketplace: 'facebook_marketplace',
  craigslist: 'craigslist',
  ebay: 'ebay',
  offer_up: 'offer_up',
  linkedin: 'linkedin',
};

export function getCanonicalPasteQueuePayloads(
  unit: ForkliftUnit
): Record<ListingPlatform, PublishPayload> {
  const payloads = getPasteQueuePayloads(unit);
  const canonical = generateMarketingAssets(unit);

  for (const [target, channel] of Object.entries(CANONICAL_OVERRIDE_CHANNELS) as Array<
    [ListingPlatform, string]
  >) {
    const override = canonical.platform_overrides.find((entry) => entry.channel === channel);
    if (!override) {
      continue;
    }

    payloads[target] = {
      ...payloads[target],
      title: override.title,
      description: override.description,
      images: canonical.images
        .map((image) => ({
          src: image.public_url ?? image.source_path,
          alt: image.alt,
        }))
        .filter((image) => Boolean(image.src)),
      price: override.price,
      platformSpecificFields: override.platform_specific_fields,
    };
  }

  return payloads;
}
