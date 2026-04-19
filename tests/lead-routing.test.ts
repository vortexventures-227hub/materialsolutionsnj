import test from 'node:test';
import assert from 'node:assert/strict';

import { buildContactHref, buildSitewideQuoteHref } from '@/lib/leadRouting';

test('buildContactHref preserves inventory detail routing context', () => {
  const href = buildContactHref({
    subject: 'Quote Request: 2021 Yale GLC050VX',
    source: 'inventory_detail_quote',
    pageOrigin: '/inventory/yale-glc050vx',
    ctaOrigin: 'inventory_detail_quote',
    listingId: 'forklift-42',
    listingSlug: 'yale-glc050vx',
    listingTitle: '2021 Yale GLC050VX',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Quote Request: 2021 Yale GLC050VX');
  assert.equal(url.searchParams.get('source'), 'inventory_detail_quote');
  assert.equal(url.searchParams.get('page_origin'), '/inventory/yale-glc050vx');
  assert.equal(url.searchParams.get('cta_origin'), 'inventory_detail_quote');
  assert.equal(url.searchParams.get('listing_id'), 'forklift-42');
  assert.equal(url.searchParams.get('listing_slug'), 'yale-glc050vx');
  assert.equal(url.searchParams.get('listing_title'), '2021 Yale GLC050VX');
});

test('buildContactHref omits empty optional fields', () => {
  const href = buildContactHref({
    subject: 'Service Request',
    source: 'services_overview_quote',
    serviceSlug: 'services-overview',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.searchParams.get('subject'), 'Service Request');
  assert.equal(url.searchParams.get('source'), 'services_overview_quote');
  assert.equal(url.searchParams.get('service_slug'), 'services-overview');
  assert.equal(url.searchParams.get('listing_id'), null);
  assert.equal(url.searchParams.get('page_origin'), null);
});

test('buildContactHref preserves service detail routing context', () => {
  const href = buildContactHref({
    subject: 'Wire-Guided Systems',
    source: 'wire_guided_quote',
    pageOrigin: '/services/wire-guided',
    ctaOrigin: 'wire_guided_quote',
    serviceSlug: 'wire-guided',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Wire-Guided Systems');
  assert.equal(url.searchParams.get('source'), 'wire_guided_quote');
  assert.equal(url.searchParams.get('page_origin'), '/services/wire-guided');
  assert.equal(url.searchParams.get('cta_origin'), 'wire_guided_quote');
  assert.equal(url.searchParams.get('service_slug'), 'wire-guided');
});

test('buildContactHref preserves services overview hero routing context', () => {
  const href = buildContactHref({
    subject: 'Service Request',
    source: 'services_overview_quote',
    pageOrigin: '/services',
    ctaOrigin: 'services_hero_quote',
    serviceSlug: 'services-overview',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Service Request');
  assert.equal(url.searchParams.get('source'), 'services_overview_quote');
  assert.equal(url.searchParams.get('page_origin'), '/services');
  assert.equal(url.searchParams.get('cta_origin'), 'services_hero_quote');
  assert.equal(url.searchParams.get('service_slug'), 'services-overview');
});

test('buildContactHref preserves services overview footer routing context', () => {
  const href = buildContactHref({
    subject: 'Service Request',
    source: 'services_overview_quote',
    pageOrigin: '/services',
    ctaOrigin: 'services_footer_quote',
    serviceSlug: 'services-overview',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Service Request');
  assert.equal(url.searchParams.get('source'), 'services_overview_quote');
  assert.equal(url.searchParams.get('page_origin'), '/services');
  assert.equal(url.searchParams.get('cta_origin'), 'services_footer_quote');
  assert.equal(url.searchParams.get('service_slug'), 'services-overview');
});

test('buildContactHref preserves inventory overview help routing context', () => {
  const href = buildContactHref({
    subject: 'Inventory Help Request',
    source: 'inventory_contact',
    pageOrigin: '/inventory',
    ctaOrigin: 'inventory_results_contact',
    serviceSlug: 'inventory-overview',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Inventory Help Request');
  assert.equal(url.searchParams.get('source'), 'inventory_contact');
  assert.equal(url.searchParams.get('page_origin'), '/inventory');
  assert.equal(url.searchParams.get('cta_origin'), 'inventory_results_contact');
  assert.equal(url.searchParams.get('service_slug'), 'inventory-overview');
});

test('buildContactHref preserves inventory detail help routing context', () => {
  const href = buildContactHref({
    subject: 'Inventory Question: 2021 Yale GLC050VX',
    source: 'inventory_detail_contact',
    pageOrigin: '/inventory/yale-glc050vx',
    ctaOrigin: 'inventory_detail_ask_david',
    listingId: 'forklift-42',
    listingSlug: 'yale-glc050vx',
    listingTitle: '2021 Yale GLC050VX',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Inventory Question: 2021 Yale GLC050VX');
  assert.equal(url.searchParams.get('source'), 'inventory_detail_contact');
  assert.equal(url.searchParams.get('page_origin'), '/inventory/yale-glc050vx');
  assert.equal(url.searchParams.get('cta_origin'), 'inventory_detail_ask_david');
  assert.equal(url.searchParams.get('listing_id'), 'forklift-42');
  assert.equal(url.searchParams.get('listing_slug'), 'yale-glc050vx');
  assert.equal(url.searchParams.get('listing_title'), '2021 Yale GLC050VX');
});

test('buildSitewideQuoteHref preserves current page context for global footer CTA', () => {
  const href = buildSitewideQuoteHref({
    pageOrigin: '/inventory/hyster-h50xt',
    ctaOrigin: 'footer_quote',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Quote Request');
  assert.equal(url.searchParams.get('source'), 'sitewide_quote');
  assert.equal(url.searchParams.get('page_origin'), '/inventory/hyster-h50xt');
  assert.equal(url.searchParams.get('cta_origin'), 'footer_quote');
});

test('buildSitewideQuoteHref falls back to root when page origin is blank', () => {
  const href = buildSitewideQuoteHref({
    pageOrigin: '   ',
    ctaOrigin: 'footer_quote',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.searchParams.get('page_origin'), '/');
  assert.equal(url.searchParams.get('cta_origin'), 'footer_quote');
});

test('buildContactHref preserves inventory detail contact routing context', () => {
  const href = buildContactHref({
    subject: 'Inventory Question: 2021 Yale GLC050VX',
    source: 'inventory_detail_contact',
    pageOrigin: '/inventory/yale-glc050vx',
    ctaOrigin: 'inventory_detail_ask_david',
    listingId: 'forklift-42',
    listingSlug: 'yale-glc050vx',
    listingTitle: '2021 Yale GLC050VX',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Inventory Question: 2021 Yale GLC050VX');
  assert.equal(url.searchParams.get('source'), 'inventory_detail_contact');
  assert.equal(url.searchParams.get('page_origin'), '/inventory/yale-glc050vx');
  assert.equal(url.searchParams.get('cta_origin'), 'inventory_detail_ask_david');
  assert.equal(url.searchParams.get('listing_id'), 'forklift-42');
  assert.equal(url.searchParams.get('listing_slug'), 'yale-glc050vx');
  assert.equal(url.searchParams.get('listing_title'), '2021 Yale GLC050VX');
});

test('buildContactHref preserves inventory index contact routing context', () => {
  const href = buildContactHref({
    subject: 'Inventory Help Request',
    source: 'inventory_contact',
    pageOrigin: '/inventory',
    ctaOrigin: 'inventory_results_contact',
  });

  const url = new URL(href, 'https://example.com');

  assert.equal(url.pathname, '/contact');
  assert.equal(url.searchParams.get('subject'), 'Inventory Help Request');
  assert.equal(url.searchParams.get('source'), 'inventory_contact');
  assert.equal(url.searchParams.get('page_origin'), '/inventory');
  assert.equal(url.searchParams.get('cta_origin'), 'inventory_results_contact');
});
