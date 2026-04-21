type ContactLeadContext = {
  subject: string;
  source: string;
  pageOrigin?: string;
  ctaOrigin?: string;
  listingId?: string | null;
  listingSlug?: string | null;
  listingTitle?: string | null;
  serviceSlug?: string | null;
};

type SitewideQuoteContext = {
  pageOrigin?: string | null;
  ctaOrigin: string;
  subject?: string;
  source?: string;
};

export function buildContactHref(context: ContactLeadContext): string {
  const params = new URLSearchParams({
    subject: context.subject,
    source: context.source,
  });

  const optionalFields = {
    page_origin: context.pageOrigin,
    cta_origin: context.ctaOrigin,
    listing_id: context.listingId,
    listing_slug: context.listingSlug,
    listing_title: context.listingTitle,
    service_slug: context.serviceSlug,
  };

  for (const [key, value] of Object.entries(optionalFields)) {
    if (value) {
      params.set(key, value);
    }
  }

  return `/contact?${params.toString()}`;
}

export function buildSitewideQuoteHref(context: SitewideQuoteContext): string {
  const normalizedPageOrigin = context.pageOrigin?.trim() || '/';

  return buildContactHref({
    subject: context.subject ?? 'Quote Request',
    source: context.source ?? 'sitewide_quote',
    pageOrigin: normalizedPageOrigin,
    ctaOrigin: context.ctaOrigin,
  });
}
