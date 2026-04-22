/**
 * channelFormatters.ts
 * Per-channel copy generation for marketplace surfaces.
 * Feeds: Facebook Marketplace, Craigslist, eBay, LinkedIn,
 *        MachineryTrader, IronPlanet, OfferUp.
 *
 * Constraints sourced from per-platform listing rules.
 * Canonical ForkliftUnit shape from schemaTransformers.ts.
 */

import { toAltText, type ForkliftUnit } from './schemaTransformers';
import { CONTACT_DETAILS } from '@/lib/contactDetails';

// ── Shared helpers ─────────────────────────────────────────────────────────────

const SITE_URL = 'https://www.materialsolutionsnj.com';
const CONTACT_EMAIL = 'info@materialsolutionsnj.com';

/** Resolves to the provisioned phone or null when still pending.
 *  Callers omit the field rather than surfacing a raw placeholder string. */
function contactPhone(): string | null {
  const phoneEntry = CONTACT_DETAILS.find((entry) => entry.icon === 'phone');
  if (!phoneEntry) return null;
  return phoneEntry.href?.startsWith('tel:') ? phoneEntry.href.replace(/^tel:/, '') : phoneEntry.primary ?? null;
}

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function shortLoc(location: string): string {
  return location
    .replace('Baltimore, Maryland', 'Baltimore, MD')
    .replace('Hamilton, New Jersey', 'Hamilton, NJ')
    .replace('Hamilton, NJ (Material Solutions Inc.)', 'Hamilton, NJ');
}

function displayName(unit: ForkliftUnit): string {
  const type = unit.unit_type.toLowerCase();
  let compactType = unit.unit_type;
  if (type.includes('order picker')) compactType = 'Order Picker';
  else if (type.includes('reach truck')) compactType = 'Reach Truck';
  else if (type.includes('bendi') || type.includes('articulated')) compactType = 'Articulated Forklift';
  else if (type.includes('swing reach')) compactType = 'Swing Reach';
  return [unit.year, unit.make, unit.model, compactType].filter(Boolean).join(' ');
}

function priceLabel(unit: ForkliftUnit): string {
  if (unit.sold_as_lot_only) return 'Lot sale only — call for pricing';
  if (!unit.asking_price_usd) return 'Call for price';
  return fmt(unit.asking_price_usd);
}

function keySpecs(unit: ForkliftUnit): string {
  const parts: string[] = [];
  if (unit.capacity_lbs) parts.push(`${unit.capacity_lbs.toLocaleString()} lb capacity`);
  if (unit.hours_approx) parts.push(`${unit.hours_approx.toLocaleString()} hours`);
  if (unit.battery) parts.push(unit.battery);
  return parts.join(' | ');
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function cw(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function primaryAltText(unit: ForkliftUnit): string | null {
  return unit.media_paths[0] ? toAltText(unit.media_paths[0], unit) : null;
}

// ── Channel definitions ────────────────────────────────────────────────────────

export type MarketingChannel =
  | 'facebook_marketplace'
  | 'craigslist'
  | 'ebay'
  | 'linkedin'
  | 'machinerytrader'
  | 'ironplanet'
  | 'offerup';

export interface ChannelCopy {
  channel: MarketingChannel;
  title: string;        // channel-specific title / subject line
  body: string;        // channel-specific listing body
  priceLabel: string;   // human-readable price or pricing note
  imageUrl: string | null;
  canonicalUrl: string;
  altText: string | null; // primary image alt text for this channel
}

export interface ChannelConstraints {
  titleMax: number;
  bodyMax: number;
}

// ── Per-channel formatters ────────────────────────────────────────────────────

function formatFacebook(unit: ForkliftUnit): ChannelCopy {
  const title = truncate(`${displayName(unit)} — ${shortLoc(unit.location)}`, 100);
  const body = truncate(
    cw(`${displayName(unit)} in ${shortLoc(unit.location)}.
${unit.asking_price_usd && !unit.sold_as_lot_only ? `Price: ${fmt(unit.asking_price_usd)}` : 'Call for pricing.'}${unit.capacity_lbs ? ` ${unit.capacity_lbs.toLocaleString()} lb capacity.` : ''}${unit.hours_approx ? ` Approx. ${unit.hours_approx.toLocaleString()} hours.` : ''}${unit.battery ? ` ${unit.battery}.` : ''}
${shortLoc(unit.location)}${unit.delivery_available ? ' Delivery available.' : ''}
${contactPhone() ? `Contact: ${contactPhone()} | ${CONTACT_EMAIL}` : `Contact: ${CONTACT_EMAIL}`}
${SITE_URL}/inventory/${unit.canonical_slug}`),
    500
  );
  return {
    channel: 'facebook_marketplace',
    title,
    body,
    priceLabel: priceLabel(unit),
    imageUrl: unit.media_paths[0] ?? null,
    canonicalUrl: `${SITE_URL}/inventory/${unit.canonical_slug}`,
    altText: primaryAltText(unit),
  };
}

function formatCraigslist(unit: ForkliftUnit): ChannelCopy {
  const title = truncate(
    `${displayName(unit)} — ${shortLoc(unit.location)}${unit.asking_price_usd && !unit.sold_as_lot_only ? ` ${fmt(unit.asking_price_usd)}` : ''}`,
    70
  );
  const specs = keySpecs(unit);
  const body = truncate(
    cw(`${displayName(unit)}
Location: ${shortLoc(unit.location)}
${unit.asking_price_usd && !unit.sold_as_lot_only ? `Price: ${fmt(unit.asking_price_usd)}\n` : ''}${unit.sold_as_lot_only ? 'Sold as lot only — contact for pricing.\n' : ''}${unit.capacity_lbs ? `Capacity: ${unit.capacity_lbs.toLocaleString()} lbs\n` : ''}${unit.hours_approx ? `Hours: approx. ${unit.hours_approx.toLocaleString()}\n` : ''}${unit.battery ? `Battery / Charger: ${unit.battery}\n` : ''}${unit.condition ? `Condition: ${unit.condition}\n` : ''}${specs ? `Key Specs: ${specs}\n` : ''}
${shortLoc(unit.location)}${unit.delivery_available ? '\nDelivery available — contact to arrange.' : ''}
${contactPhone() ? `\nContact: ${contactPhone()} | ${CONTACT_EMAIL}` : `\nContact: ${CONTACT_EMAIL}`}
More details: ${SITE_URL}/inventory/${unit.canonical_slug}`),
    5000
  );
  return {
    channel: 'craigslist',
    title,
    body,
    priceLabel: priceLabel(unit),
    imageUrl: unit.media_paths[0] ?? null,
    canonicalUrl: `${SITE_URL}/inventory/${unit.canonical_slug}`,
    altText: primaryAltText(unit),
  };
}

function formatEbay(unit: ForkliftUnit): ChannelCopy {
  // eBay title: ≤80 chars, year + make + model + type is the safe pattern
  const title = truncate(
    `${unit.year ?? ''} ${unit.make} ${unit.model} ${unit.unit_type}`.trim(),
    80
  );
  const body = truncate(
    cw(`${displayName(unit)} — ${shortLoc(unit.location)}
${unit.asking_price_usd && !unit.sold_as_lot_only ? `Buy It Now: ${fmt(unit.asking_price_usd)}\n` : ''}${unit.sold_as_lot_only ? 'Lot sale — make offer.\n' : ''}${unit.capacity_lbs ? `Capacity: ${unit.capacity_lbs.toLocaleString()} lbs\n` : ''}${unit.hours_approx ? `Hours: ${unit.hours_approx.toLocaleString()} (approx.)\n` : ''}${unit.battery ? `Battery / Charger: ${unit.battery}\n` : ''}${unit.condition ? `Condition: ${unit.condition}\n` : ''}
Location: ${shortLoc(unit.location)}${unit.delivery_available ? '\nDelivery available.' : ''}
${contactPhone() ? `Contact: ${contactPhone()} | ${CONTACT_EMAIL}` : `Contact: ${CONTACT_EMAIL}`}
See full listing: ${SITE_URL}/inventory/${unit.canonical_slug}`),
    1000
  );
  return {
    channel: 'ebay',
    title,
    body,
    priceLabel: priceLabel(unit),
    imageUrl: unit.media_paths[0] ?? null,
    canonicalUrl: `${SITE_URL}/inventory/${unit.canonical_slug}`,
    altText: primaryAltText(unit),
  };
}

function formatLinkedIn(unit: ForkliftUnit): ChannelCopy {
  const title = `${displayName(unit)} — ${shortLoc(unit.location)} | Material Solutions NJ`;
  const body = truncate(
    cw(`${displayName(unit)} is available for purchase from Material Solutions NJ.

${unit.asking_price_usd && !unit.sold_as_lot_only ? `Price: ${fmt(unit.asking_price_usd)}\n` : ''}${unit.sold_as_lot_only ? 'This unit is sold as part of a lot — contact us for lot pricing.\n' : ''}
Equipment Overview
${'─'.repeat(40)}
Make / Model: ${unit.make} ${unit.model}
Year: ${unit.year ?? 'Not specified'}
Type: ${unit.unit_type}
Location: ${shortLoc(unit.location)}
${unit.capacity_lbs ? `Lift Capacity: ${unit.capacity_lbs.toLocaleString()} lbs\n` : ''}${unit.hours_approx ? `Operating Hours: approx. ${unit.hours_approx.toLocaleString()}\n` : ''}${unit.battery ? `Battery / Charger: ${unit.battery}\n` : ''}${unit.condition ? `Condition: ${unit.condition}\n` : ''}
${shortLoc(unit.location)}${unit.delivery_available ? '\nDelivery available — contact us to arrange logistics.' : ''}

${displayName(unit)} is listed in our current inventory. Units are sold as-is unless otherwise noted. Contact the team to schedule inspection or discuss purchase.

${contactPhone() ? `Contact: ${contactPhone()} | ${CONTACT_EMAIL}` : `Contact: ${CONTACT_EMAIL}`}
View full listing and photos: ${SITE_URL}/inventory/${unit.canonical_slug}

${'#forklift'} ${'#materialhandling'} ${'#warehousetequipment'} ${'#usedforklift'} ${unit.make.toLowerCase()} ${unit.unit_type.toLowerCase().replace(/\s+/g, '')}`),
    3000
  );
  return {
    channel: 'linkedin',
    title: truncate(title, 200),
    body,
    priceLabel: priceLabel(unit),
    imageUrl: unit.media_paths[0] ?? null,
    canonicalUrl: `${SITE_URL}/inventory/${unit.canonical_slug}`,
    altText: primaryAltText(unit),
  };
}

function formatMachineryTrader(unit: ForkliftUnit): ChannelCopy {
  // MT title: ≤70 chars, priority to make+model+type
  const title = truncate(`${unit.make} ${unit.model} ${unit.unit_type} ${unit.year ?? ''}`.trim(), 70);
  const body = truncate(
    cw(`${unit.make} ${unit.model} (${unit.year ?? 'N/A'}) ${unit.unit_type}
Location: ${shortLoc(unit.location)}
${unit.asking_price_usd && !unit.sold_as_lot_only ? `Price: ${fmt(unit.asking_price_usd)}\n` : ''}${unit.sold_as_lot_only ? 'Sold as lot only — call for pricing.\n' : ''}${unit.capacity_lbs ? `Capacity: ${unit.capacity_lbs.toLocaleString()} lbs\n` : ''}${unit.hours_approx ? `Hours: ${unit.hours_approx.toLocaleString()} (approx.)\n` : ''}${unit.battery ? `Battery: ${unit.battery}\n` : ''}${unit.condition ? `Condition: ${unit.condition}\n` : ''}
${unit.delivery_available ? 'Delivery available.\n' : ''}
${contactPhone() ? `Contact: ${contactPhone()} | ${CONTACT_EMAIL}` : `Contact: ${CONTACT_EMAIL}`}
Listing: ${SITE_URL}/inventory/${unit.canonical_slug}`),
    2000
  );
  return {
    channel: 'machinerytrader',
    title,
    body,
    priceLabel: priceLabel(unit),
    imageUrl: unit.media_paths[0] ?? null,
    canonicalUrl: `${SITE_URL}/inventory/${unit.canonical_slug}`,
    altText: primaryAltText(unit),
  };
}

function formatIronPlanet(unit: ForkliftUnit): ChannelCopy {
  const title = truncate(`${unit.year ?? ''} ${unit.make} ${unit.model} ${unit.unit_type}`.trim(), 70);
  const body = truncate(
    cw(`${unit.make} ${unit.model} ${unit.unit_type} — ${unit.year ?? 'N/A'}
Location: ${shortLoc(unit.location)}
${unit.asking_price_usd && !unit.sold_as_lot_only ? `Current Price: ${fmt(unit.asking_price_usd)}\n` : ''}${unit.sold_as_lot_only ? 'Sold as lot only — call for pricing.\n' : ''}${unit.capacity_lbs ? `Capacity: ${unit.capacity_lbs.toLocaleString()} lbs\n` : ''}${unit.hours_approx ? `Hours: ${unit.hours_approx.toLocaleString()} (approx.)\n` : ''}${unit.battery ? `Battery / Charger: ${unit.battery}\n` : ''}${unit.condition ? `Condition: ${unit.condition}\n` : ''}
${unit.delivery_available ? 'Delivery available — contact to arrange.\n' : ''}
${contactPhone() ? `Contact: ${contactPhone()} | ${CONTACT_EMAIL}` : `Contact: ${CONTACT_EMAIL}`}
View listing: ${SITE_URL}/inventory/${unit.canonical_slug}`),
    2000
  );
  return {
    channel: 'ironplanet',
    title,
    body,
    priceLabel: priceLabel(unit),
    imageUrl: unit.media_paths[0] ?? null,
    canonicalUrl: `${SITE_URL}/inventory/${unit.canonical_slug}`,
    altText: primaryAltText(unit),
  };
}

function formatOfferUp(unit: ForkliftUnit): ChannelCopy {
  // OfferUp title: ≤100 chars, punchy
  const title = truncate(
    `${displayName(unit)} — ${shortLoc(unit.location)}`,
    100
  );
  const body = truncate(
    cw(`${displayName(unit)}
${unit.asking_price_usd && !unit.sold_as_lot_only ? `$${unit.asking_price_usd.toLocaleString()}` : 'Call for price'}
${shortLoc(unit.location)}${unit.delivery_available ? ' | Delivery available' : ''}
${unit.hours_approx ? ` | ~${unit.hours_approx.toLocaleString()} hrs` : ''}${unit.capacity_lbs ? ` | ${unit.capacity_lbs.toLocaleString()} lb cap` : ''}
${unit.battery ? ` | ${unit.battery}` : ''}
${unit.condition ? ` | ${unit.condition}` : ''}
${contactPhone() ? `Contact: ${contactPhone()} | ${CONTACT_EMAIL}` : `Contact: ${CONTACT_EMAIL}`}
More: ${SITE_URL}/inventory/${unit.canonical_slug}`),
    500
  );
  return {
    channel: 'offerup',
    title,
    body,
    priceLabel: priceLabel(unit),
    imageUrl: unit.media_paths[0] ?? null,
    canonicalUrl: `${SITE_URL}/inventory/${unit.canonical_slug}`,
    altText: primaryAltText(unit),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export const CHANNEL_CONSTRAINTS: Record<MarketingChannel, ChannelConstraints> = {
  facebook_marketplace: { titleMax: 100, bodyMax: 500 },
  craigslist:           { titleMax: 70,  bodyMax: 5000 },
  ebay:                 { titleMax: 80,  bodyMax: 1000 },
  linkedin:             { titleMax: 200, bodyMax: 3000 },
  machinerytrader:      { titleMax: 70,  bodyMax: 2000 },
  ironplanet:           { titleMax: 70,  bodyMax: 2000 },
  offerup:             { titleMax: 100, bodyMax: 500 },
};

const FORMATTERS: Record<MarketingChannel, (unit: ForkliftUnit) => ChannelCopy> = {
  facebook_marketplace: formatFacebook,
  craigslist:           formatCraigslist,
  ebay:                 formatEbay,
  linkedin:             formatLinkedIn,
  machinerytrader:      formatMachineryTrader,
  ironplanet:           formatIronPlanet,
  offerup:              formatOfferUp,
};

/**
 * Generate per-channel copy for a single ForkliftUnit.
 */
export function formatForChannel(unit: ForkliftUnit, channel: MarketingChannel): ChannelCopy {
  return FORMATTERS[channel](unit);
}

/**
 * Generate copy for all channels at once.
 * Useful for bulk export or feed generation.
 */
export function formatAllChannels(unit: ForkliftUnit): ChannelCopy[] {
  return (Object.keys(FORMATTERS) as MarketingChannel[]).map((ch) =>
    FORMATTERS[ch](unit)
  );
}
