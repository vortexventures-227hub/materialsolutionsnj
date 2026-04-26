import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildDescriptionSections, buildManualPostingInstructions, buildPlatformOutput, displayName, type PlatformOutput, type PublishPayload } from './shared';

export type MachineryTraderPublishMode = 'api' | 'paste_queue';

export interface MachineryTraderPublishReceipt {
  platform: 'machinery_trader';
  mode: MachineryTraderPublishMode;
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

export interface MachineryTraderPublishContext {
  env?: Record<string, string | undefined>;
  queueDir?: string;
  postJson?: (url: string, body: Record<string, unknown>, headers?: Record<string, string>) => Promise<Record<string, unknown>>;
}

const CREDENTIAL_NOTE = '[CONFIRM_WITH_CHRIS] Confirm MachineryTrader dealer API endpoint, dealer ID, auth header format, and accepted forklift category mapping before live publishing.';

export function formatForPlatform(payload: PublishPayload) {
  return buildPlatformOutput('machinery_trader', payload, {
    titleSource: `${displayName(payload)} | Material Solutions NJ`,
    descriptionSource: buildDescriptionSections(payload).join(' '),
    platformSpecificFields: {
      dealer_feed_status: 'dealer-feed category and listing-condition mapping pending',
      inventory_reference: payload.unit_id,
      credential_marker: CREDENTIAL_NOTE,
    },
    postingInstructions: buildManualPostingInstructions('MachineryTrader', payload),
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
    throw new Error(`MachineryTrader API HTTP ${response.status}: ${text}`);
  }
  return parsed;
}

async function writePasteQueue(payload: PublishPayload, output: PlatformOutput, queueDir?: string): Promise<string> {
  const targetDir = queueDir ?? path.join(os.homedir(), 'Desktop', 'Claude_Dispatch_Operations', 'listings', '_queue');
  await mkdir(targetDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const fileName = `${payload.unit_id}_machinery_trader_${generatedAt.replace(/[:.]/g, '-')}.md`;
  const filePath = path.join(targetDir, fileName);
  await writeFile(filePath, [
    `# Manual Publish: ${payload.unit_id} → MachineryTrader`,
    `**Generated:** ${generatedAt}`,
    `**Credential note:** ${CREDENTIAL_NOTE}`,
    '',
    '## Title',
    output.title,
    '',
    '## Description',
    output.description,
    '',
    '## Price',
    output.price != null ? `$${output.price.toLocaleString()}` : 'Call for price',
    '',
    '## Posting URL',
    'https://www.machinerytrader.com/dealer-services',
    '',
    '## Images',
    ...output.image_urls.map((url, index) => `${index + 1}. ${url}`),
    '',
    '## Instructions',
    output.posting_instructions ?? buildManualPostingInstructions('MachineryTrader', payload),
  ].join('\n'), 'utf8');
  return filePath;
}

export async function publish(payload: PublishPayload, context: MachineryTraderPublishContext = {}): Promise<MachineryTraderPublishReceipt> {
  const output = formatForPlatform(payload);
  const env = context.env ?? process.env;
  const missingCredentials = ['MACHINERYTRADER_API_KEY', 'MACHINERYTRADER_DEALER_ID', 'MACHINERYTRADER_API_URL'].filter((key) => !env[key]);
  const body: Record<string, unknown> = {
    dealer_id: env.MACHINERYTRADER_DEALER_ID,
    external_inventory_id: payload.unit_id,
    title: output.title,
    description: output.description,
    price_usd: output.price,
    category: output.category_mapping,
    location: payload.location,
    canonical_url: payload.canonical_url,
    images: output.image_urls,
    specs: {
      make: payload.make,
      model: payload.model,
      year: payload.year,
      unit_type: payload.unit_type,
      condition: payload.condition,
      key_specs: payload.key_specs,
    },
  };

  if (missingCredentials.length > 0) {
    return {
      platform: 'machinery_trader',
      mode: 'paste_queue',
      referenceId: null,
      url: null,
      queueFilePath: await writePasteQueue(payload, output, context.queueDir),
      missingCredentials,
      credentialNote: CREDENTIAL_NOTE,
      request: { url: null, body },
    };
  }

  const url = env.MACHINERYTRADER_API_URL!;
  const response = await (context.postJson ?? defaultPostJson)(url, body, {
    Authorization: `Bearer ${env.MACHINERYTRADER_API_KEY}`,
  });
  const referenceId = typeof response.id === 'string' ? response.id : typeof response.listing_id === 'string' ? response.listing_id : null;

  return {
    platform: 'machinery_trader',
    mode: 'api',
    referenceId,
    url: typeof response.url === 'string' ? response.url : null,
    queueFilePath: null,
    missingCredentials: [],
    credentialNote: CREDENTIAL_NOTE,
    request: { url, body },
  };
}
