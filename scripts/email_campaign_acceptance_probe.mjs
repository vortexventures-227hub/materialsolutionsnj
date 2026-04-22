#!/usr/bin/env -S node --import tsx

import { access } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMarketingAssets } from '../src/lib/marketing/canonical/generateMarketingAssets.ts';
import { renderColdOutreachEmail, renderInboundDripEmail } from '../src/lib/marketing/renderers/emailCampaign.ts';
import {
  normalizeLotUnitMember,
  normalizeStandaloneUnit,
} from '../src/lib/marketing/schemaTransformers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inventoryPath = path.resolve(__dirname, '../data/forklift-inventory.json');
const inventorySource = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

function resolveExecutable(commandName, pathEnv = process.env.PATH ?? '') {
  for (const directory of pathEnv.split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(directory, commandName);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // continue
    }
  }
  return null;
}

async function fileExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function buildCanonicals() {
  const standaloneUnits = inventorySource.inventory.standalone_units;
  const lot = inventorySource.inventory.lots[0];

  const inboundUnit = normalizeStandaloneUnit(
    standaloneUnits.find((unit) => unit.unit_id === 'RT-752R45TT-2018')
  );
  const coldStorageUnit = normalizeStandaloneUnit(
    standaloneUnits.find((unit) => unit.unit_id === 'SR-960CSR30TT-2018')
  );
  const contractorUnit = normalizeStandaloneUnit(
    standaloneUnits.find((unit) => unit.unit_id === 'BENDI-B40-LANDOLL')
  );

  if (!inboundUnit || !coldStorageUnit || !contractorUnit || !lot?.units?.[0]) {
    throw new Error('inventory fixtures missing required units for email acceptance probe');
  }

  return {
    inbound: generateMarketingAssets(inboundUnit),
    warehouse: generateMarketingAssets(normalizeLotUnitMember(lot, lot.units[0])),
    coldStorage: generateMarketingAssets(coldStorageUnit),
    contractor: generateMarketingAssets(contractorUnit),
  };
}

function checkCompliance(result, label) {
  const failures = [];
  if (!result.compliance.hasBusinessIdentification) {
    failures.push(`${label}: missing Material Solutions NJ business identification`);
  }
  if (!result.compliance.hasPhysicalAddress) {
    failures.push(`${label}: missing physical address footer`);
  }
  if (!result.compliance.hasUnsubscribeLink) {
    failures.push(`${label}: missing unsubscribe footer`);
  }
  if (!result.htmlBody.includes('<html>')) {
    failures.push(`${label}: html body missing <html> root`);
  }
  if (!result.headers['List-Unsubscribe']) {
    failures.push(`${label}: missing List-Unsubscribe header`);
  }
  return failures;
}

async function runPreflight() {
  const canonicals = buildCanonicals();
  const templatePaths = new Set();
  const missingTemplateFiles = new Set();
  const complianceFailures = [];
  const renderFailures = [];
  let inboundTouchesRendered = 0;
  let coldOutreachTouchesRendered = 0;

  for (const touchNumber of [1, 2, 3]) {
    try {
      const result = await renderInboundDripEmail(canonicals.inbound, {
        prospectName: 'Connor',
        prospectEmail: 'connor@ridgeops.com',
        touchNumber,
      });
      inboundTouchesRendered += 1;
      result.sourceTemplates.forEach((templatePath) => templatePaths.add(templatePath));
      checkCompliance(result, `inbound_touch_${touchNumber}`).forEach((failure) => complianceFailures.push(failure));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      renderFailures.push(`inbound_touch_${touchNumber}: ${message}`);
      const match = message.match(/ENOENT: no such file or directory, open '([^']+)'/);
      if (match?.[1]) {
        missingTemplateFiles.add(match[1]);
      }
    }
  }

  const coldOutreachCases = [
    {
      canonical: canonicals.warehouse,
      sequence: 'sequence_a_warehouse_3pl',
      prospectName: 'Marcus',
      prospectCompany: 'Atlas Warehousing',
    },
    {
      canonical: canonicals.coldStorage,
      sequence: 'sequence_b_food_beverage_coldstorage',
      prospectName: 'Megan',
      prospectCompany: 'Polar Foods',
    },
    {
      canonical: canonicals.contractor,
      sequence: 'sequence_c_construction_contractor',
      prospectName: 'Elaine',
      prospectCompany: 'Weld North',
    },
  ];

  for (const testCase of coldOutreachCases) {
    for (const touchNumber of [1, 2, 3, 4]) {
      try {
        const result = await renderColdOutreachEmail(testCase.canonical, {
          sequence: testCase.sequence,
          touchNumber,
          prospectName: testCase.prospectName,
          prospectCompany: testCase.prospectCompany,
        });
        coldOutreachTouchesRendered += 1;
        result.sourceTemplates.forEach((templatePath) => templatePaths.add(templatePath));
        checkCompliance(result, `${testCase.sequence}_touch_${touchNumber}`).forEach((failure) => complianceFailures.push(failure));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        renderFailures.push(`${testCase.sequence}_touch_${touchNumber}: ${message}`);
        const match = message.match(/ENOENT: no such file or directory, open '([^']+)'/);
        if (match?.[1]) {
          missingTemplateFiles.add(match[1]);
        }
      }
    }
  }

  const spamassassinPath = resolveExecutable('spamassassin');
  const spamcPath = resolveExecutable('spamc');
  const inventoryExists = await fileExists(inventoryPath);
  const templateFilesPresent = templatePaths.size > 0 && [...templatePaths].every((templatePath) => !missingTemplateFiles.has(templatePath));

  console.log(
    JSON.stringify(
      {
        mode: 'preflight',
        inventoryPath,
        inventoryExists,
        inboundTouchesRendered,
        coldOutreachTouchesRendered,
        totalTouchesRendered: inboundTouchesRendered + coldOutreachTouchesRendered,
        templateFilesPresent,
        templateCount: templatePaths.size,
        missingTemplateFiles: [...missingTemplateFiles],
        complianceFailures,
        renderFailures,
        spamassassinPath,
        spamcPath,
        spamassassinAvailable: Boolean(spamassassinPath),
        spamcAvailable: Boolean(spamcPath),
        readyForOfflineSpamCheck: Boolean(spamassassinPath && spamcPath),
      },
      null,
      2,
    ),
  );
}

runPreflight().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
