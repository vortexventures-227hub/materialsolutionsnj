import { upsertCanonicalContent, type InventoryMarketingRow } from '../canonical/persist';
import type { CanonicalContent, CanonicalPlatformOverride } from '../canonical/types';
import { resolvePlatformOverride } from '../platformOverrides';
import { PLATFORM_SPECS, type PlatformOutput } from './shared';

export type PhaseOneChannel = 'website' | 'facebook_marketplace' | 'ebay';
export type FormatterPublishMode = 'storage' | 'http';

export interface ChannelPublishReceipt {
  channel: PhaseOneChannel;
  mode: FormatterPublishMode;
  referenceId: string | null;
  summary: string;
  request: {
    url: string | null;
    body: Record<string, unknown> | null;
  };
}

export interface ChannelFormatterPublishContext {
  persistCanonical?: (content: CanonicalContent) => Promise<InventoryMarketingRow>;
  postJson?: (url: string, body: Record<string, unknown>, headers?: Record<string, string>) => Promise<Record<string, unknown>>;
  env?: Record<string, string | undefined>;
}

export interface ChannelFormatter {
  channel: PhaseOneChannel;
  tier: 'auto' | 'template';
  contentFormat: 'database_record' | 'social_listing';
  render(canonical: CanonicalContent): PlatformOutput;
  publish(canonical: CanonicalContent, context?: ChannelFormatterPublishContext): Promise<ChannelPublishReceipt>;
}

function defaultPostJson(_url: string, _body: Record<string, unknown>): Promise<Record<string, unknown>> {
  throw new Error('postJson context is required for remote publishing');
}

function getPrimaryImage(canonical: CanonicalContent): string {
  return canonical.images[0]?.public_url ?? `${canonical.canonical_url}/opengraph-image`;
}

abstract class BaseChannelFormatter implements ChannelFormatter {
  abstract readonly channel: PhaseOneChannel;
  abstract readonly contentFormat: 'database_record' | 'social_listing';
  readonly tier = 'auto' as const;

  protected getOverride(canonical: CanonicalContent, channel: Exclude<PhaseOneChannel, 'website'>): CanonicalPlatformOverride {
    return resolvePlatformOverride(canonical, channel);
  }

  protected toPlatformOutput(override: CanonicalPlatformOverride): PlatformOutput {
    const spec = PLATFORM_SPECS[override.channel === 'facebook_marketplace' ? 'facebook_marketplace' : 'ebay'];
    return {
      title: override.title.slice(0, spec.titleMax),
      description: override.description.slice(0, spec.descriptionMax),
      price: override.price,
      primary_image_url: override.image_urls[0] ?? '',
      image_urls: override.image_urls.slice(0, spec.imageMax),
      category_mapping: override.category,
      platform_specific_fields: override.platform_specific_fields,
      posting_instructions: null,
      char_limit_warnings: [],
    };
  }

  abstract render(canonical: CanonicalContent): PlatformOutput;
  abstract publish(canonical: CanonicalContent, context?: ChannelFormatterPublishContext): Promise<ChannelPublishReceipt>;
}

export class WebsiteChannelFormatter extends BaseChannelFormatter {
  readonly channel = 'website' as const;
  readonly contentFormat = 'database_record' as const;

  render(canonical: CanonicalContent): PlatformOutput {
    return {
      title: canonical.title,
      description: canonical.long_description,
      price: canonical.asking_price_usd,
      primary_image_url: getPrimaryImage(canonical),
      image_urls: canonical.images.map((image) => image.public_url).filter((url): url is string => Boolean(url)),
      category_mapping: canonical.unit_type,
      platform_specific_fields: {
        canonical_slug: canonical.canonical_slug,
        publish_eligibility: canonical.publish_eligibility,
        hold_flag: canonical.hold_flag,
      },
      posting_instructions: null,
      char_limit_warnings: [],
    };
  }

  async publish(
    canonical: CanonicalContent,
    context: ChannelFormatterPublishContext = {},
  ): Promise<ChannelPublishReceipt> {
    const persistCanonical = context.persistCanonical ?? upsertCanonicalContent;
    const row = await persistCanonical(canonical);
    return {
      channel: this.channel,
      mode: 'storage',
      referenceId: row.id,
      summary: `Persisted canonical content to inventory_marketing for ${canonical.unit_id}`,
      request: {
        url: 'inventory_marketing',
        body: {
          unit_id: canonical.unit_id,
          canonical_slug: canonical.canonical_slug,
          publish_eligibility: canonical.publish_eligibility,
        },
      },
    };
  }
}

export class FacebookMarketplaceChannelFormatter extends BaseChannelFormatter {
  readonly channel = 'facebook_marketplace' as const;
  readonly contentFormat = 'social_listing' as const;

  render(canonical: CanonicalContent): PlatformOutput {
    return this.toPlatformOutput(this.getOverride(canonical, this.channel));
  }

  async publish(
    canonical: CanonicalContent,
    context: ChannelFormatterPublishContext = {},
  ): Promise<ChannelPublishReceipt> {
    const override = this.getOverride(canonical, this.channel);
    const env = context.env ?? process.env;
    const token = env.FACEBOOK_ACCESS_TOKEN;
    const catalogId = env.FACEBOOK_CATALOG_ID;
    if (!token || !catalogId) {
      throw new Error('FACEBOOK_ACCESS_TOKEN and FACEBOOK_CATALOG_ID are required');
    }

    const body: Record<string, unknown> = {
      id: canonical.unit_id,
      title: override.title,
      description: override.description,
      image_link: override.image_urls[0] ?? getPrimaryImage(canonical),
      availability: canonical.publish_eligibility ? 'in stock' : 'out of stock',
      condition: 'used',
      category: override.category ?? 'Vehicles & Parts',
      url: canonical.canonical_url,
    };
    if (override.price != null) {
      body.price = `${Math.round(override.price * 100)} USD`;
    }

    const url = `https://graph.facebook.com/v21.0/${catalogId}/items?access_token=${encodeURIComponent(token)}`;
    const response = await (context.postJson ?? defaultPostJson)(url, body, {
      'Content-Type': 'application/json',
    });

    return {
      channel: this.channel,
      mode: 'http',
      referenceId: typeof response.id === 'string' ? response.id : null,
      summary: `Prepared Facebook Marketplace catalog payload for ${canonical.unit_id}`,
      request: { url, body },
    };
  }
}

export class EbayChannelFormatter extends BaseChannelFormatter {
  readonly channel = 'ebay' as const;
  readonly contentFormat = 'social_listing' as const;

  render(canonical: CanonicalContent): PlatformOutput {
    return this.toPlatformOutput(this.getOverride(canonical, this.channel));
  }

  async publish(
    canonical: CanonicalContent,
    context: ChannelFormatterPublishContext = {},
  ): Promise<ChannelPublishReceipt> {
    const override = this.getOverride(canonical, this.channel);
    const env = context.env ?? process.env;
    const locationKey = env.EBAY_INVENTORY_LOCATION_KEY ?? 'materialsolutionsnj-main';
    const body: Record<string, unknown> = {
      sku: canonical.unit_id,
      locale: 'en_US',
      availability: {
        shipToLocationAvailability: {
          quantity: canonical.publish_eligibility ? 1 : 0,
        },
      },
      condition: 'USED_EXCELLENT',
      product: {
        title: override.title,
        description: override.description,
        imageUrls: override.image_urls,
        aspects: {
          Brand: [canonical.make],
          Model: [canonical.model],
          Type: [canonical.unit_type],
          Location: [canonical.location_label],
        },
      },
      merchantLocationKey: locationKey,
      pricingSummary: override.price != null ? { price: { value: override.price.toFixed(2), currency: 'USD' } } : undefined,
    };

    const url = `https://api.ebay.com/sell/inventory/v1/inventory_item/${encodeURIComponent(canonical.unit_id)}`;
    const response = await (context.postJson ?? defaultPostJson)(url, body, {
      'Content-Type': 'application/json',
    });

    return {
      channel: this.channel,
      mode: 'http',
      referenceId: typeof response.sku === 'string' ? response.sku : canonical.unit_id,
      summary: `Prepared eBay inventory payload for ${canonical.unit_id}`,
      request: { url, body },
    };
  }
}

export const CHANNEL_FORMATTERS: ChannelFormatter[] = [
  new WebsiteChannelFormatter(),
  new FacebookMarketplaceChannelFormatter(),
  new EbayChannelFormatter(),
];
