import type { PublishTarget } from '../publishAssembly';

export type CanonicalSourceKind = 'unit' | 'lot';
export type CanonicalPublishStatus = 'draft' | 'ready' | 'blocked' | 'published' | 'archived';
export type CanonicalConditionGrade = 'excellent' | 'good' | 'fair' | 'parts_only';
export type CanonicalPricePosture = 'fixed' | 'lot_only' | 'call_for_price' | 'best_offer';
export type CanonicalTwitterCard = 'summary' | 'summary_large_image';
export type CanonicalSchemaPointerKey = 'product' | 'vehicle' | 'faqPage' | 'breadcrumb';

export interface CanonicalPlatformOverride {
  channel: PublishTarget | 'machinery_trader' | 'iron_planet' | 'offer_up' | 'linkedin';
  unit_id: string;
  title: string;
  description: string;
  price: number | null;
  category: string | null;
  canonical_url: string;
  image_urls: string[];
  platform_specific_fields: Record<string, unknown>;
}

export interface CanonicalFaqEntry {
  question: string;
  answer: string;
  grounding: string[];
}

export interface CanonicalMediaAsset {
  source_path: string;
  public_url: string | null;
  alt: string;
  role: 'primary' | 'gallery' | 'lot' | 'detail' | 'video_still';
  sort_order: number;
}

export interface CanonicalFeatureItem {
  label: string;
  value: string;
  highlight: boolean;
}

export interface CanonicalKeywordTarget {
  keyword: string;
  intent: 'seo' | 'marketplace' | 'geo' | 'brand';
}

export interface CanonicalSchemaPointers {
  unit_id: string;
  product: Record<string, unknown> | null;
  vehicle: Record<string, unknown> | null;
  faqPage: Record<string, unknown> | null;
  breadcrumb: Record<string, unknown> | null;
}

export interface CanonicalContent {
  unit_id: string;
  source_kind: CanonicalSourceKind;
  source_record_id: string;
  legacy_source_ids: string[];
  inventory_status: string;
  publish_status: CanonicalPublishStatus;
  publish_eligibility: boolean;
  hold_flag: boolean;
  lot_only_flag: boolean;
  make: string;
  model: string;
  year: number | null;
  unit_type: string;
  title: string;
  subtitle: string | null;
  long_description: string;
  teaser_by_channel: Record<string, string>;
  structured_feature_list: CanonicalFeatureItem[];
  keyword_targets: CanonicalKeywordTarget[];
  faq: CanonicalFaqEntry[];
  price_justification_prose: string | null;
  condition_grade: CanonicalConditionGrade;
  condition_summary: string;
  warranty_terms_short: string | null;
  location_city: string | null;
  location_state: string | null;
  location_label: string;
  contact_email_public: string;
  contact_phone_public: string;
  serial: string | null;
  capacity_lbs: number | null;
  mast_collapsed_inches: number | null;
  mast_extended_inches: number | null;
  battery_summary: string | null;
  battery_voltage: number | null;
  hours_approx: number | null;
  asking_price_usd: number | null;
  lot_asking_price_usd: number | null;
  price_posture: CanonicalPricePosture;
  canonical_slug: string;
  canonical_url: string;
  seo_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image_url: string | null;
  twitter_card: CanonicalTwitterCard;
  images: CanonicalMediaAsset[];
  schema_pointers: CanonicalSchemaPointers;
  platform_overrides: CanonicalPlatformOverride[];
  manual_overrides: Record<string, unknown>;
  claim_safety_flags: string[];
  derivation_version: string;
  source_updated_at: string;
  generated_at: string;
}
