import test from 'node:test';
import assert from 'node:assert/strict';

import { type LeadSubmission } from '@/lib/api/leads';

test('LeadSubmission stays aligned with the real /api/leads routing fields', () => {
  const lead: LeadSubmission = {
    name: 'Jane Buyer',
    phone: '973-555-0101',
    source: 'inventory_detail_quote',
    subject: 'Quote Request: Yale ERP050',
    page_origin: '/inventory/yale-erp050',
    cta_origin: 'inventory_detail_quote',
    listing_id: 'listing-42',
    listing_slug: 'yale-erp050',
    listing_title: 'Yale ERP050',
  };

  assert.equal(lead.page_origin, '/inventory/yale-erp050');
  assert.equal(lead.cta_origin, 'inventory_detail_quote');
  assert.equal(lead.listing_slug, 'yale-erp050');
});


