import type { CanonicalContent, CanonicalPlatformOverride } from './canonical/types';
import type { PublishTarget } from './publishAssembly';

export const EXEC2_OVERRIDE_TARGETS: PublishTarget[] = [
  'facebook_marketplace',
  'craigslist',
  'ebay',
  'website',
  'email_campaign',
];

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalPath(canonical: CanonicalContent): string {
  return `/inventory/${canonical.canonical_slug}`;
}

function publicImageUrls(canonical: CanonicalContent): string[] {
  return canonical.images
    .map((image) => image.public_url)
    .filter((url): url is string => Boolean(url));
}

function fallbackImageUrls(canonical: CanonicalContent): string[] {
  const images = publicImageUrls(canonical);
  return images.length > 0 ? images : [`${canonical.canonical_url}/opengraph-image`];
}

function descriptionForTarget(canonical: CanonicalContent, target: PublishTarget): string {
  if (target === 'craigslist') {
    return stripHtml(canonical.long_description);
  }

  if (target === 'email_campaign') {
    return [
      canonical.teaser_by_channel.email_campaign ?? canonical.teaser_by_channel.website,
      canonical.long_description,
      `View listing: ${canonical.canonical_url}`,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return canonical.long_description;
}

function baseOverride(canonical: CanonicalContent, target: PublishTarget): CanonicalPlatformOverride {
  const existing = canonical.platform_overrides.find(
    (override) => override.channel === target
  );

  if (existing) {
    return {
      ...existing,
      image_urls: existing.image_urls.length > 0 ? existing.image_urls : fallbackImageUrls(canonical),
    };
  }

  return {
    channel: target,
    unit_id: canonical.unit_id,
    title: target === 'email_campaign'
      ? canonical.teaser_by_channel.email_campaign ?? canonical.title
      : canonical.title,
    description: descriptionForTarget(canonical, target),
    price: canonical.lot_only_flag ? null : canonical.asking_price_usd,
    category: target === 'website' ? canonical.unit_type : null,
    canonical_url: target === 'website' ? canonicalPath(canonical) : canonical.canonical_url,
    image_urls: fallbackImageUrls(canonical),
    platform_specific_fields: {},
  };
}

export function resolvePlatformOverride(
  canonical: CanonicalContent,
  target: PublishTarget
): CanonicalPlatformOverride {
  const override = baseOverride(canonical, target);
  const image_urls = override.image_urls.length > 0 ? override.image_urls : fallbackImageUrls(canonical);

  switch (target) {
    case 'facebook_marketplace':
      return {
        ...override,
        category: 'VEHICLES > FORKLIFTS',
        image_urls,
        platform_specific_fields: {
          ...override.platform_specific_fields,
          category_slug: 'VEHICLES > FORKLIFTS',
          contact_method: 'marketplace_inbox',
          canonical_reference: canonical.canonical_url,
        },
      };

    case 'craigslist':
      return {
        ...override,
        description: descriptionForTarget(canonical, target),
        image_urls,
        platform_specific_fields: {
          ...override.platform_specific_fields,
          posting_format: 'plain_text',
          category_slug: 'heavy equipment > forklifts',
          area: canonical.location_label,
          canonical_reference: canonical.canonical_url,
        },
      };

    case 'ebay':
      return {
        ...override,
        category: '26491',
        image_urls,
        platform_specific_fields: {
          ...override.platform_specific_fields,
          category_id: '26491',
          item_specifics: {
            Brand: canonical.make,
            Model: canonical.model,
            Type: canonical.unit_type,
            Year: canonical.year,
            Capacity: canonical.capacity_lbs != null ? `${canonical.capacity_lbs} lb` : null,
            Location: canonical.location_label,
          },
        },
      };

    case 'website':
      return {
        ...override,
        category: canonical.unit_type,
        canonical_url: canonicalPath(canonical),
        image_urls,
        platform_specific_fields: {
          ...override.platform_specific_fields,
          canonical_path: canonicalPath(canonical),
          indexable: canonical.publish_eligibility,
          hold_flag: canonical.hold_flag,
          publish_eligibility: canonical.publish_eligibility,
        },
      };

    case 'email_campaign':
      return {
        ...override,
        category: 'email_campaign',
        image_urls: image_urls.slice(0, 4),
        platform_specific_fields: {
          ...override.platform_specific_fields,
          preheader:
            canonical.teaser_by_channel.email_campaign
              ? String(canonical.teaser_by_channel.email_campaign).replace(/is live now/i, 'is available now')
              : canonical.teaser_by_channel.website
                ? String(canonical.teaser_by_channel.website).replace(/is live now/i, 'is available now')
                : `${canonical.title} is available now.`,
          cta_label: 'View equipment details',
          compliance_footer:
            'Material Solutions NJ • 457 Oberlin Ave South, Lakewood, NJ 08701 • Reply STOP or unsubscribe to opt out.',
        },
      };

    default:
      return { ...override, image_urls };
  }
}

export function buildPlatformOverrides(canonical: CanonicalContent): CanonicalPlatformOverride[] {
  return EXEC2_OVERRIDE_TARGETS.map((target) => resolvePlatformOverride(canonical, target));
}
