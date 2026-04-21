import { createHash } from 'node:crypto';
import { appendFile, mkdir, writeFile, readFile } from 'node:fs/promises';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';

import { normalizeStandaloneUnit, type ForkliftUnit, type LotForkliftJson, type StandaloneForkliftJsonUnit } from './schemaTransformers';
import { assemblePublishPayload, type PublishTarget } from './publishAssembly';
import { formatAssembledPlatformPayload } from './formatters/index';
import type { PlatformOutput } from './formatters/shared';

// ---- Public types ----

export type PipelineMode = 'api' | 'dry_run';
export type SupportedPlatform = 'facebook_marketplace' | 'craigslist' | 'offer_up';

export interface NotificationRecord {
  to: string;
  status: 'sent' | 'skipped' | 'error';
  error?: string;
}

export interface PipelineResult {
  unitId: string;
  platform: SupportedPlatform;
  mode: PipelineMode;
  channelCopy: PlatformOutput;
  queueFilePath?: string;
  listingUrl?: string;
  receiptId: string;
  notifications: NotificationRecord[];
  warnings: string[];
}

export interface PipelineOptions {
  inventoryPath?: string;
  dryRunOverride?: boolean;
  skipNotifications?: boolean;
}

// ---- Internal types ----

interface InventoryJson {
  inventory: {
    lots: LotForkliftJson[];
    standalone_units: StandaloneForkliftJsonUnit[];
  };
}

// ---- Constants ----

const SUPPORTED_PLATFORMS: SupportedPlatform[] = ['facebook_marketplace', 'craigslist', 'offer_up'];

const DEFAULT_INVENTORY_URL = new URL('../../../data/forklift-inventory.json', import.meta.url);
const RECEIPTS_URL = new URL('../../../data/publish_receipts.jsonl', import.meta.url);

const MANUAL_QUEUE_DIR = path.join(
  os.homedir(),
  'Desktop',
  'Claude_Dispatch_Operations',
  'listings',
  '_queue',
);

const PLATFORM_TO_PUBLISH_TARGET: Record<SupportedPlatform, PublishTarget> = {
  facebook_marketplace: 'facebook_marketplace',
  craigslist: 'craigslist',
  offer_up: 'craigslist',
};

// ---- Inventory loader ----

async function loadUnit(unitId: string, inventoryPath?: string): Promise<ForkliftUnit> {
  const source = inventoryPath
    ? await readFile(inventoryPath, 'utf8')
    : await readFile(DEFAULT_INVENTORY_URL, 'utf8');
  const inventory = JSON.parse(source) as InventoryJson;

  const standalone = inventory.inventory.standalone_units.find((u) => u.unit_id === unitId);
  if (standalone) {
    return normalizeStandaloneUnit(standalone);
  }

  const lot = inventory.inventory.lots.find((l) => l.lot_id === unitId);
  if (lot) {
    return normalizeLotToPublishUnit(lot);
  }

  throw new Error(`Unit '${unitId}' not found in inventory`);
}

function normalizeLotToPublishUnit(lot: LotForkliftJson): ForkliftUnit {
  const rep = lot.units[0];
  return {
    unit_id: lot.lot_id,
    canonical_slug: lot.lot_id.toLowerCase(),
    make: rep?.make ?? 'Raymond',
    model: rep?.model ?? 'Various',
    year: null,
    unit_type: lot.unit_type,
    location: lot.location,
    serial: null,
    capacity_lbs: null,
    mast_collapsed_inches: lot.mast_collapsed_inches ?? null,
    mast_extended_inches: lot.mast_extended_inches ?? null,
    features: lot.guidance ? [lot.guidance] : [],
    battery: lot.battery_and_charger_included ? 'Battery + Charger Included' : null,
    battery_voltage: null,
    hours_approx: lot.hours_avg ?? null,
    condition: lot.condition ?? null,
    asking_price_usd: lot.sold_as_lot_only ? null : (lot.lot_asking_price_usd ?? null),
    media_paths: lot.lot_photos ?? [],
    delivery_available: true,
    status: lot.status ?? null,
    hold_reason: lot.hold_reason ?? null,
    sold_as_lot_only: Boolean(lot.sold_as_lot_only),
    lot_id: lot.lot_id,
    source_kind: 'lot_member',
  };
}

// ---- Facebook Graph API ----

async function postToFacebookCatalog(channelCopy: PlatformOutput, unitId: string): Promise<string> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN!;
  const catalogId = process.env.FACEBOOK_CATALOG_ID!;

  const body = JSON.stringify({
    id: unitId,
    title: channelCopy.title,
    description: channelCopy.description,
    ...(channelCopy.price != null && { price: `${channelCopy.price * 100} USD` }),
    image_link: channelCopy.primary_image_url,
    availability: 'in stock',
    condition: 'used',
    category: channelCopy.category_mapping ?? 'Vehicles & Parts',
  });

  return new Promise<string>((resolve, reject) => {
    const urlPath = `/v21.0/${catalogId}/items?access_token=${encodeURIComponent(accessToken)}`;
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: urlPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          const result = JSON.parse(data) as { id?: string; error?: { message: string; code: number } };
          if (result.error) {
            reject(new Error(`FB API error ${result.error.code}: ${result.error.message}`));
          } else if (result.id) {
            resolve(`https://www.facebook.com/marketplace/item/${result.id}`);
          } else {
            reject(new Error(`FB API unexpected response: ${data}`));
          }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---- SendGrid notifications ----

async function sendNotificationEmail(subject: string, body: string): Promise<NotificationRecord[]> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const recipients = ['crazzuoli@MaterialSolutions.com', 'bwhite@MaterialSolutions.com'];

  if (!apiKey) {
    return recipients.map((email) => ({
      to: email,
      status: 'skipped' as const,
      error: 'SENDGRID_API_KEY not set',
    }));
  }

  const payload = JSON.stringify({
    personalizations: [{ to: recipients.map((email) => ({ email })) }],
    from: { email: 'noreply@materialsolutionsnj.com', name: 'Material Solutions Publish Bot' },
    subject,
    content: [{ type: 'text/plain', value: body }],
  });

  return new Promise<NotificationRecord[]>((resolve) => {
    const req = https.request(
      {
        hostname: 'api.sendgrid.com',
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        if (res.statusCode === 202) {
          resolve(recipients.map((email) => ({ to: email, status: 'sent' as const })));
          return;
        }
        let data = '';
        res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
        res.on('end', () => {
          const err = `HTTP ${res.statusCode}: ${data}`;
          resolve(recipients.map((email) => ({ to: email, status: 'error' as const, error: err })));
        });
      },
    );
    req.on('error', (err: Error) =>
      resolve(recipients.map((email) => ({ to: email, status: 'error' as const, error: err.message }))),
    );
    req.write(payload);
    req.end();
  });
}

// ---- Receipt writer (interim JSONL file; swap for Supabase when publish_receipts table lands) ----

async function writeReceiptEntry(entry: Record<string, unknown>): Promise<string> {
  const receiptId = createHash('sha256')
    .update(`${String(entry.unitId)}:${String(entry.platform)}:${String(entry.timestamp)}`)
    .digest('hex')
    .slice(0, 12);

  const record = JSON.stringify({ receiptId, ...entry }) + '\n';
  await appendFile(RECEIPTS_URL, record, 'utf8');
  return receiptId;
}

// ---- Manual queue writer ----

async function writeManualQueueFile(
  unitId: string,
  platform: string,
  channelCopy: PlatformOutput,
): Promise<string> {
  await mkdir(MANUAL_QUEUE_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(MANUAL_QUEUE_DIR, `${unitId}_${platform}_${ts}.md`);

  const sections: string[] = [
    `# Manual Publish: ${unitId} → ${platform}`,
    `**Generated:** ${new Date().toISOString()}`,
    '',
    '## Title',
    channelCopy.title,
    '',
    '## Description',
    channelCopy.description,
    '',
    '## Price',
    channelCopy.price != null ? `$${channelCopy.price.toLocaleString()}` : 'Call for price',
    '',
    '## Primary Image',
    channelCopy.primary_image_url,
    '',
    '## All Images',
    ...channelCopy.image_urls.map((u, i) => `${i + 1}. ${u}`),
    '',
    '## Category',
    channelCopy.category_mapping ?? '(none)',
    '',
  ];

  if (channelCopy.posting_instructions) {
    sections.push('## Posting Instructions', channelCopy.posting_instructions, '');
  }

  if (channelCopy.char_limit_warnings.length > 0) {
    sections.push(
      '## Character Limit Warnings',
      ...channelCopy.char_limit_warnings.map((w) => `- ${w}`),
      '',
    );
  }

  await writeFile(filePath, sections.join('\n'), 'utf8');
  return filePath;
}

// ---- Main export ----

export async function runPublishPipeline(
  unitId: string,
  platformRaw: string,
  options: PipelineOptions = {},
): Promise<PipelineResult> {
  if (!SUPPORTED_PLATFORMS.includes(platformRaw as SupportedPlatform)) {
    throw new Error(
      `Platform '${platformRaw}' not supported. Supported: ${SUPPORTED_PLATFORMS.join(', ')}`,
    );
  }
  const platform = platformRaw as SupportedPlatform;
  const warnings: string[] = [];
  const timestamp = new Date().toISOString();

  const unit = await loadUnit(unitId, options.inventoryPath);

  const publishTarget = PLATFORM_TO_PUBLISH_TARGET[platform];
  const assembled = assemblePublishPayload(unit, publishTarget);
  warnings.push(...assembled.warnings);

  const channelCopy = formatAssembledPlatformPayload(platform, assembled);
  warnings.push(...channelCopy.char_limit_warnings);

  const hasFbCredentials = Boolean(
    process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_CATALOG_ID,
  );
  const mode: PipelineMode =
    platform === 'facebook_marketplace' && hasFbCredentials && !options.dryRunOverride
      ? 'api'
      : 'dry_run';

  let listingUrl: string | undefined;
  let queueFilePath: string | undefined;

  if (mode === 'api') {
    listingUrl = await postToFacebookCatalog(channelCopy, unitId);
  } else {
    queueFilePath = await writeManualQueueFile(unitId, platform, channelCopy);
  }

  const receiptId = await writeReceiptEntry({
    unitId,
    platform,
    mode,
    listingUrl: listingUrl ?? null,
    queueFilePath: queueFilePath ?? null,
    timestamp,
  });

  const emailSubject =
    mode === 'api'
      ? `Published ${unitId} to Facebook Marketplace — ${listingUrl}`
      : `Publish Button generated manual-post for ${unitId} → ${platform}; paste from ${queueFilePath}`;

  const emailBody =
    mode === 'api'
      ? `Unit ${unitId} published to Facebook Marketplace.\nURL: ${listingUrl}\nReceipt: ${receiptId}`
      : `Manual-post file generated for ${unitId} → ${platform}.\nFile: ${queueFilePath}\nReceipt: ${receiptId}`;

  const notifications: NotificationRecord[] = options.skipNotifications
    ? [
        { to: 'crazzuoli@MaterialSolutions.com', status: 'skipped', error: 'skipNotifications=true' },
        { to: 'bwhite@MaterialSolutions.com', status: 'skipped', error: 'skipNotifications=true' },
      ]
    : await sendNotificationEmail(emailSubject, emailBody);

  return {
    unitId,
    platform,
    mode,
    channelCopy,
    queueFilePath,
    listingUrl,
    receiptId,
    notifications,
    warnings,
  };
}
