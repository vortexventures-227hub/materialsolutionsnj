import assert from 'node:assert/strict';
import test from 'node:test';

import inventorySource from '../../../../data/forklift-inventory.json';
import { generateMarketingAssets } from '../canonical/generateMarketingAssets';
import { renderColdOutreachEmail, renderInboundDripEmail } from '../renderers/emailCampaign';
import { normalizeLotUnitMember, normalizeStandaloneUnit, type LotForkliftJson, type StandaloneForkliftJsonUnit } from '../schemaTransformers';

const standaloneUnit = normalizeStandaloneUnit(
  (inventorySource.inventory.standalone_units as StandaloneForkliftJsonUnit[]).find(
    (unit) => unit.unit_id === 'RT-752R45TT-2018'
  )!
);
const coldStorageUnit = normalizeStandaloneUnit(
  (inventorySource.inventory.standalone_units as StandaloneForkliftJsonUnit[]).find(
    (unit) => unit.unit_id === 'SR-960CSR30TT-2018'
  )!
);
const contractorUnit = normalizeStandaloneUnit(
  (inventorySource.inventory.standalone_units as StandaloneForkliftJsonUnit[]).find(
    (unit) => unit.unit_id === 'BENDI-B40-LANDOLL'
  )!
);
const lot = inventorySource.inventory.lots[0] as LotForkliftJson;
const lotCanonical = generateMarketingAssets(normalizeLotUnitMember(lot, lot.units[0]!));
const standaloneCanonical = generateMarketingAssets(standaloneUnit);
const coldStorageCanonical = generateMarketingAssets(coldStorageUnit);
const contractorCanonical = generateMarketingAssets(contractorUnit);

function assertCompliance(result: Awaited<ReturnType<typeof renderInboundDripEmail>>) {
  assert.ok(result.subject.length > 0);
  assert.ok(result.preheader.length > 0);
  assert.ok(result.htmlBody.includes('Material Solutions NJ'));
  assert.ok(result.textBody.includes('{{physical_address}}'));
  assert.ok(result.textBody.includes('{{unsubscribe_link}}'));
  assert.equal(result.compliance.hasBusinessIdentification, true);
  assert.equal(result.compliance.hasPhysicalAddress, true);
  assert.equal(result.compliance.hasUnsubscribeLink, true);
  assert.equal(result.headers['List-Unsubscribe'], '<{{unsubscribe_link}}>');
}

test('renderInboundDripEmail renders all 3 inbound touches without error', async () => {
  for (const touchNumber of [1, 2, 3] as const) {
    const result = await renderInboundDripEmail(standaloneCanonical, {
      prospectName: 'Connor',
      prospectEmail: 'connor@ridgeops.com',
      touchNumber,
    });

    assertCompliance(result);
    assert.equal(result.sequence, 'inbound_drip');
    assert.equal(result.kind, 'inbound');
    assert.equal(result.touchNumber, touchNumber);
    assert.ok(result.sourceTemplates.length >= 3);
    assert.match(result.textBody, /Connor/);
  }
});

test('renderColdOutreachEmail renders all 12 cold-outreach touches with compliance footer intact', async () => {
  const cases = [
    {
      canonical: lotCanonical,
      sequence: 'sequence_a_warehouse_3pl' as const,
      prospectName: 'Marcus',
      prospectCompany: 'Atlas Warehousing',
    },
    {
      canonical: coldStorageCanonical,
      sequence: 'sequence_b_food_beverage_coldstorage' as const,
      prospectName: 'Megan',
      prospectCompany: 'Polar Foods',
    },
    {
      canonical: contractorCanonical,
      sequence: 'sequence_c_construction_contractor' as const,
      prospectName: 'Elaine',
      prospectCompany: 'Weld North',
    },
  ];

  for (const testCase of cases) {
    for (const touchNumber of [1, 2, 3, 4] as const) {
      const result = await renderColdOutreachEmail(testCase.canonical, {
        sequence: testCase.sequence,
        touchNumber,
        prospectName: testCase.prospectName,
        prospectCompany: testCase.prospectCompany,
      });

      assertCompliance(result);
      assert.equal(result.kind, 'cold_outreach');
      assert.equal(result.sequence, testCase.sequence);
      assert.equal(result.touchNumber, touchNumber);
      assert.equal(result.sourceTemplates.length, 1);
      assert.match(result.textBody, new RegExp(testCase.prospectName));
      assert.match(result.htmlBody, /<html>/i);
    }
  }
});
