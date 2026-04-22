import { z } from 'zod';

export const canonicalSlugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const marketingOverlaySchema = z.object({
  publish_eligibility: z.boolean().optional(),
  marketing_headline: z.string().trim().min(1).max(140).optional(),
  marketing_summary: z.string().trim().min(1).max(500).optional(),
  canonical_slug_override: z.string().trim().optional(),
  make_override: z.string().trim().optional(),
  location_override: z.string().trim().optional(),
}).strict();

export type MarketingOverlay = z.infer<typeof marketingOverlaySchema>;

export const canonicalFaqEntrySchema = z.object({
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1),
  source_fields: z.array(z.string().trim().min(1)).min(1),
}).strict();

export const canonicalImageSchema = z.object({
  url: z.string().trim().min(1),
  alt: z.string().trim().min(1),
}).strict();

export const CanonicalMarketingObjectSchema = z.object({
  unit_id: z.string().trim().min(1),
  canonical_slug: canonicalSlugSchema,
  canonical_url: z.string().url(),
  source_kind: z.enum(['standalone', 'lot_member']),
  make: z.string().trim().min(1),
  model: z.string().trim().min(1),
  year: z.number().int().nullable(),
  unit_type: z.string().trim().min(1),
  location: z.string().trim().min(1),
  serial: z.string().trim().nullable(),
  status: z.string().trim().nullable(),
  hold_reason: z.string().trim().nullable(),
  hold_flag: z.boolean(),
  publish_eligibility: z.boolean(),
  lot_only_flag: z.boolean(),
  price_usd: z.number().nullable(),
  delivery_available: z.boolean().nullable(),
  capacity_lbs: z.number().nullable(),
  mast_collapsed_inches: z.number().nullable(),
  mast_extended_inches: z.number().nullable(),
  hours_approx: z.number().nullable(),
  battery: z.string().trim().nullable(),
  battery_voltage: z.number().nullable(),
  condition: z.string().trim().nullable(),
  features: z.array(z.string().trim().min(1)),
  media_paths: z.array(z.string().trim().min(1)),
  primary_image_path: z.string().trim().nullable(),
  marketing_headline: z.string().trim().min(1),
  marketing_summary: z.string().trim().min(1),
  structured_feature_list: z.array(z.string().trim().min(1)),
  long_description: z.string().trim().min(1),
  seo_title: z.string().trim().min(1),
  meta_description: z.string().trim().min(1),
  og_image_url: z.string().trim().min(1),
  images: z.array(canonicalImageSchema),
  faq_entries: z.array(canonicalFaqEntrySchema),
}).strict();

export type CanonicalMarketingObject = z.infer<typeof CanonicalMarketingObjectSchema>;
