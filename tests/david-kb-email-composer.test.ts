import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDavidKnowledgeBasePromptBlock,
  loadDavidKnowledgeBase,
} from '../src/lib/david/knowledge-base';
import { composeDavidFollowUpEmail } from '../src/lib/david/follow-up-email';

test('David KB exposes company, people, and canonical six inventory entries without durable memory backend', () => {
  const kb = loadDavidKnowledgeBase();

  assert.equal(kb.company.name, 'Material Solutions NJ');
  assert.equal(kb.people.chris.escalation, 'sales/owner/operator escalation');
  assert.equal(kb.people.bill.escalation, 'equipment/customer follow-up escalation');
  assert.deepEqual(
    kb.inventory.map((item) => item.id),
    [
      'MD-LOT-001',
      'RT-752R45TT-2018',
      'RT-970CSR30T-2016',
      'SR-960CSR30TT-2018',
      'RT-970CSR30T-2019',
      'BENDI-B40-LANDOLL',
    ]
  );
  assert.equal(kb.inventory[0]?.price, '$22,500 lot');
  assert.equal(kb.inventory[0]?.condition, 'Used — Running — Normal Warehouse Wear');
  assert.equal(kb.inventory[1]?.price, '$29,500');
  assert.ok(kb.inventory[1]?.photosUrl.includes('/inventory-media/Raymond_752R45TT_2018_ReachTruck_current_01.jpg'));
});

test('David KB prompt block is static session context and does not advertise persistence', () => {
  const promptBlock = buildDavidKnowledgeBasePromptBlock(loadDavidKnowledgeBase());

  assert.match(promptBlock, /## DAVID STATIC KNOWLEDGE BASE/);
  assert.match(promptBlock, /Material Solutions NJ sells and services used warehouse equipment/i);
  assert.match(promptBlock, /MD-LOT-001/);
  assert.match(promptBlock, /BENDI-B40-LANDOLL/);
  assert.match(promptBlock, /Chris/);
  assert.match(promptBlock, /Bill/);
  assert.doesNotMatch(promptBlock, /Supabase|RLS|identity_key|durable memory|persistent memory/i);
});

test('David follow-up composer sends one call-scoped summary to customer, Chris, and Bill', () => {
  const email = composeDavidFollowUpEmail({
    customer: {
      name: 'Taylor Buyer',
      email: 'taylor@example.com',
      company: 'Taylor Warehousing',
    },
    callSummary: 'Taylor asked about the 2018 Raymond 752R45TT and requested freight timing for Baltimore pickup.',
    interestedInventoryIds: ['RT-752R45TT-2018'],
    nextSteps: ['Bill should confirm availability and freight timing.', 'Send photos and payment terms.'],
  });

  assert.equal(email.from, 'david@materialsolutionsnj.com');
  assert.deepEqual(email.to, ['taylor@example.com']);
  assert.deepEqual(email.cc, ['crazzuoli@MaterialSolutions.com', 'bwhite@MaterialSolutions.com']);
  assert.match(email.subject, /Material Solutions NJ follow-up/);
  assert.match(email.text, /Taylor asked about the 2018 Raymond 752R45TT/);
  assert.match(email.text, /RT-752R45TT-2018 — 2018 Raymond 752R45TT Reach Truck — \$29,500/);
  assert.match(email.text, /Bill should confirm availability/);
  assert.doesNotMatch(email.text, /remembered from previous calls|stored memory|Supabase/i);
});
