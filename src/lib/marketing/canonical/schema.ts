import { z } from 'zod';

export const CanonicalPlatformOverrideSchema = z.object({
  channel: z.enum([
    'facebook_marketplace',
    'craigslist',
    'ebay',
    'website',
    'email_campaign',
    'machinery_trader',
    'iron_planet',
    'offer_up',
    'linkedin',
  ]),
  unit_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive().nullable(),
  category: z.string().min(1).nullable(),
  canonical_url: z.string().url(),
  image_urls: z.array(z.string().min(1)).min(1),
  platform_specific_fields: z.record(z.string(), z.unknown()),
});

export const CanonicalFaqEntrySchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  grounding: z.array(z.string().min(1)).min(1),
});

export const CanonicalMediaAssetSchema = z.object({
  source_path: z.string().min(1),
  public_url: z.string().url().nullable(),
  alt: z.string().min(1),
  role: z.enum(['primary', 'gallery', 'lot', 'detail', 'video_still']),
  sort_order: z.number().int().nonnegative(),
});

export const CanonicalFeatureItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  highlight: z.boolean(),
});

export const CanonicalKeywordTargetSchema = z.object({
  keyword: z.string().min(1),
  intent: z.enum(['seo', 'marketplace', 'geo', 'brand']),
});

export const CanonicalSchemaPointersSchema = z.object({
  unit_id: z.string().min(1),
  product: z.record(z.string(), z.unknown()).nullable(),
  vehicle: z.record(z.string(), z.unknown()).nullable(),
  faqPage: z.record(z.string(), z.unknown()).nullable(),
  breadcrumb: z.record(z.string(), z.unknown()).nullable(),
});

export const CanonicalContentSchema = z
  .object({
    unit_id: z.string().min(1),
    source_kind: z.enum(['unit', 'lot']),
    source_record_id: z.string().min(1),
    legacy_source_ids: z.array(z.string().min(1)),
    inventory_status: z.string().min(1),
    publish_status: z.enum(['draft', 'ready', 'blocked', 'published', 'archived']),
    publish_eligibility: z.boolean(),
    hold_flag: z.boolean(),
    lot_only_flag: z.boolean(),
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().nullable(),
    unit_type: z.string().min(1),
    title: z.string().trim().min(1),
    subtitle: z.string().trim().min(1).nullable(),
    long_description: z.string().min(1),
    teaser_by_channel: z.record(z.string(), z.string().min(1)),
    structured_feature_list: z.array(CanonicalFeatureItemSchema),
    keyword_targets: z.array(CanonicalKeywordTargetSchema),
    faq: z.array(CanonicalFaqEntrySchema),
    price_justification_prose: z.string().min(1).nullable(),
    condition_grade: z.enum(['excellent', 'good', 'fair', 'parts_only']),
    condition_summary: z.string().min(1),
    warranty_terms_short: z.string().min(1).nullable(),
    location_city: z.string().min(1).nullable(),
    location_state: z.string().min(1).nullable(),
    location_label: z.string().min(1),
    contact_email_public: z.string().email(),
    contact_phone_public: z.string().min(1),
    serial: z.string().min(1).nullable(),
    capacity_lbs: z.number().int().positive().nullable(),
    mast_collapsed_inches: z.number().int().positive().nullable(),
    mast_extended_inches: z.number().int().positive().nullable(),
    battery_summary: z.string().min(1).nullable(),
    battery_voltage: z.number().int().positive().nullable(),
    hours_approx: z.number().int().positive().nullable(),
    asking_price_usd: z.number().positive().nullable(),
    lot_asking_price_usd: z.number().positive().nullable(),
    price_posture: z.enum(['fixed', 'lot_only', 'call_for_price', 'best_offer']),
    canonical_slug: z.string().min(1),
    canonical_url: z.string().url(),
    seo_title: z.string().min(1),
    meta_description: z.string().min(1),
    og_title: z.string().min(1),
    og_description: z.string().min(1),
    og_image_url: z.string().url().nullable(),
    twitter_card: z.enum(['summary', 'summary_large_image']),
    images: z.array(CanonicalMediaAssetSchema).min(1),
    schema_pointers: CanonicalSchemaPointersSchema,
    platform_overrides: z.array(CanonicalPlatformOverrideSchema),
    manual_overrides: z.record(z.string(), z.unknown()),
    claim_safety_flags: z.array(z.string()),
    derivation_version: z.string().min(1),
    source_updated_at: z.string().min(1),
    generated_at: z.string().min(1),
  })
  .superRefine((content, ctx) => {
    if (!content.title.trim()) {
      ctx.addIssue({ code: 'custom', message: 'title must not be empty', path: ['title'] });
    }

    if (content.price_posture === 'fixed' && (content.asking_price_usd == null || content.asking_price_usd <= 0)) {
      ctx.addIssue({
        code: 'custom',
        message: 'fixed-price listings require asking_price_usd > 0',
        path: ['asking_price_usd'],
      });
    }

    if (content.source_kind === 'lot' && content.lot_asking_price_usd != null && content.lot_asking_price_usd <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'lot_asking_price_usd must be > 0 when present',
        path: ['lot_asking_price_usd'],
      });
    }

    if (content.images.length < 1) {
      ctx.addIssue({ code: 'custom', message: 'at least one image is required', path: ['images'] });
    }

    if (content.schema_pointers.unit_id !== content.unit_id) {
      ctx.addIssue({
        code: 'custom',
        message: 'schema_pointers.unit_id must match unit_id',
        path: ['schema_pointers', 'unit_id'],
      });
    }

    content.platform_overrides.forEach((override, index) => {
      if (override.unit_id !== content.unit_id) {
        ctx.addIssue({
          code: 'custom',
          message: 'platform override unit_id must match unit_id',
          path: ['platform_overrides', index, 'unit_id'],
        });
      }
    });
  });

export type CanonicalContentInput = z.infer<typeof CanonicalContentSchema>;
