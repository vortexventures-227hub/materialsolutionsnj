import type { PublishPayload as AssembledPublishPayload } from '../publishAssembly';

import { CHANNEL_FORMATTERS, type ChannelFormatter, type PhaseOneChannel } from './ChannelFormatter';
import { formatForPlatform as formatCraigslist } from './craigslist';
import { formatForPlatform as formatEbay } from './ebay';
import { formatForPlatform as formatFacebookMarketplace } from './facebook_marketplace';
import { formatForPlatform as formatIronPlanet } from './iron_planet';
import { formatForPlatform as formatLinkedIn } from './linkedin';
import { formatForPlatform as formatMachineryTrader } from './machinery_trader';
import { formatForPlatform as formatOfferUp } from './offer_up';
import {
  normalizePlatformId,
  toFormatterPayload,
  type LegacyPlatformId,
  type PlatformId,
  type PlatformOutput,
  type PublishPayload,
} from './shared';

const FORMATTERS: Record<PlatformId, (payload: PublishPayload) => PlatformOutput> = {
  facebook_marketplace: formatFacebookMarketplace,
  craigslist: formatCraigslist,
  ebay: formatEbay,
  machinery_trader: formatMachineryTrader,
  iron_planet: formatIronPlanet,
  offer_up: formatOfferUp,
  linkedin: formatLinkedIn,
};

const CHANNEL_FORMATTER_REGISTRY: Record<PhaseOneChannel, ChannelFormatter> = Object.fromEntries(
  CHANNEL_FORMATTERS.map((formatter) => [formatter.channel, formatter])
) as Record<PhaseOneChannel, ChannelFormatter>;

export function formatPlatformPayload(
  platformId: PlatformId | LegacyPlatformId,
  payload: PublishPayload
): PlatformOutput {
  return FORMATTERS[normalizePlatformId(platformId)](payload);
}

export function formatAssembledPlatformPayload(
  platformId: PlatformId | LegacyPlatformId,
  payload: AssembledPublishPayload
): PlatformOutput {
  return formatPlatformPayload(platformId, toFormatterPayload(payload));
}

export function getChannelFormatter(channel: PhaseOneChannel): ChannelFormatter {
  return CHANNEL_FORMATTER_REGISTRY[channel];
}

export { CHANNEL_FORMATTERS, CHANNEL_FORMATTER_REGISTRY, FORMATTERS };
export * from './ChannelFormatter';
export * from './shared';
