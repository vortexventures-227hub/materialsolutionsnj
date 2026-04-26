import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildDescriptionSections, buildManualPostingInstructions, buildPlatformOutput, displayName, type PlatformOutput, type PublishPayload } from './shared';

export type IronPlanetPublishMode = 'api' | 'paste_queue';

export interface IronPlanetPublishReceipt {
  platform: 'iron_planet';
  mode: IronPlanetPublishMode;
  referenceId: string | null;
  url: string | null;
  queueFilePath: string | null;
  missingCredentials: string[];
  credentialNote: string;
  request: {
    url: string | null;
    body: Record<string, unknown> | null;
  };
}

export interface IronPlanetPublishContext {
  env?: Record<string, string | undefined>;
  queueDir?: string;
  postJson?: (url: string, body: Record<string, unknown>, headers?: Record<string, string>) => Promise<Record<string, unknown>>;
}

const CREDENTIAL_NOTE = '[CONFIRM_WITH_CHRIS] Confirm IronPlanet/Ritchie Bros seller API endpoint, seller ID, auth header format, and consignment/auction workflow before live publishing.';

export function formatForPlatform(payload: PublishPayload) {
  return buildPlatformOutput('iron_planet', payload, {
    titleSource: `${displayName(payload)} | Auction-ready draft`,
    descriptionSource: buildDescriptionSections(payload).join(' '),
    platformSpecificFields: {
      consignor_sheet_status: 'consignor-sheet field mapping pending',
      auction_ready: false,
      credential_marker: CREDENTIAL_NOTE,
    },
    postingInstructions: buildManualPostingInstructions('IronPlanet', payload),
  });
}

async function defaultPostJson(url: string, body: Record<string, unknown>, headers: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) as Record<string, unknown> : {};
  if (!response.ok) {
    throw new Error(`IronPlanet API HTTP ${response.status}: ${text}`);
  }
  return parsed;
}

async function writePasteQueue(payload: PublishPayload, output: PlatformOutput, queueDir?: string): Promise<string> {
  const targetDir = queueDir ?? path.join(os.homedir(), 'Desktop', 'Claude_Dispatch_Operations', 'listings', '_queue');
  await mkdir(targetDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const fileName = `${payload.unit_id}_iron_planet_${generatedAt.replace(/[:.]/g, '-')}.md`;
  const filePath = path.join(targetDir, fileName);
  await writeFile(filePath, [
    `# Manual Publish: ${payload.unit_id} → IronPlanet / Ritchie Bros`,
    `**Generated:** ${generatedAt}`,
    `**Credential note:** ${CREDENTIAL_NOTE}`,
    '',
    '## Title',
    output.title,
    '',
    '## Consignor / auction description',
    output.description,
    '',
    '## Price guidance',
    output.price != null ? `$${output.price.toLocaleString()}` : 'Call for price / auction reserve TBD',
    '',
    '## Images',
    ...output.image_urls.map((url, index) => `${index + 1}. ${url}`),
    '',
    '## Instructions',
    output.posting_instructions ?? buildManualPostingInstructions('IronPlanet', payload),
  ].join('\n'), 'utf8');
  return filePath;
}

export async function publish(payload: PublishPayload, context: IronPlanetPublishContext = {}): Promise<IronPlanetPublishReceipt> {
  const output = formatForPlatform(payload);
  const env = context.env ?? process.env;
  const missingCredentials = ['IRONPLANET_API_KEY', 'IRONPLANET_SELLER_ID', 'IRONPLANET_API_URL'].filter((key) => !env[key]);
  const body: Record<string, unknown> = {
    seller_id: env.IRONPLANET_SELLER_ID,
    external_inventory_id: payload.unit_id,
    title: output.title,
    description: output.description,
    reserve_or_asking_price_usd: output.price,
    category: output.category_mapping,
    location: payload.location,
    canonical_url: payload.canonical_url,
    images: output.image_urls,
    consignment: {
      make: payload.make,
      model: payload.model,
      year: payload.year,
      unit_type: payload.unit_type,
      condition: payload.condition,
      inspection_notes: payload.key_specs,
    },
  };

  if (missingCredentials.length > 0) {
    return {
      platform: 'iron_planet',
      mode: 'paste_queue',
      referenceId: null,
      url: null,
      queueFilePath: await writePasteQueue(payload, output, context.queueDir),
      missingCredentials,
      credentialNote: CREDENTIAL_NOTE,
      request: { url: null, body },
    };
  }

  const url = env.IRONPLANET_API_URL!;
  const response = await (context.postJson ?? defaultPostJson)(url, body, {
    Authorization: `Bearer ${env.IRONPLANET_API_KEY}`,
  });
  const referenceId = typeof response.id === 'string' ? response.id : typeof response.listing_id === 'string' ? response.listing_id : null;

  return {
    platform: 'iron_planet',
    mode: 'api',
    referenceId,
    url: typeof response.url === 'string' ? response.url : null,
    queueFilePath: null,
    missingCredentials: [],
    credentialNote: CREDENTIAL_NOTE,
    request: { url, body },
  };
}
