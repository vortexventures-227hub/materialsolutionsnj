import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildDescriptionSections, buildPlatformOutput, compactLocation, displayName, formatCurrency, type PlatformOutput, type PublishPayload } from './shared';

export type LinkedInPublishMode = 'api' | 'paste_queue';

export interface LinkedInPublishReceipt {
  platform: 'linkedin';
  mode: LinkedInPublishMode;
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

export interface LinkedInPublishContext {
  env?: Record<string, string | undefined>;
  queueDir?: string;
  postJson?: (url: string, body: Record<string, unknown>, headers?: Record<string, string>) => Promise<Record<string, unknown>>;
}

const CREDENTIAL_NOTE = '[CONFIRM_WITH_CHRIS] Confirm LinkedIn Organization URN and w_organization_social scope before live API publishing.';

export function formatForPlatform(payload: PublishPayload) {
  const socialLead = `${displayName(payload)} is available from Material Solutions NJ in ${compactLocation(payload.location)}.`;
  const priceLine = payload.sold_as_lot_only ? 'Lot-sale structure available on request.' : `Asking ${formatCurrency(payload.price_usd)}.`;

  return buildPlatformOutput('linkedin', payload, {
    titleSource: `${displayName(payload)} | Material Solutions NJ`,
    descriptionSource: [
      socialLead,
      priceLine,
      buildDescriptionSections(payload).join(' '),
      '#forklift #materialhandling #usedequipment #warehousing',
    ].join(' '),
    platformSpecificFields: {
      post_type: 'organic_social',
      hashtags: ['forklift', 'materialhandling', 'usedequipment', 'warehousing'],
    },
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
    throw new Error(`LinkedIn API HTTP ${response.status}: ${text}`);
  }
  return parsed;
}

async function writePasteQueue(payload: PublishPayload, output: PlatformOutput, queueDir?: string): Promise<string> {
  const targetDir = queueDir ?? path.join(os.homedir(), 'Desktop', 'Claude_Dispatch_Operations', 'listings', '_queue');
  await mkdir(targetDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const fileName = `${payload.unit_id}_linkedin_${generatedAt.replace(/[:.]/g, '-')}.md`;
  const filePath = path.join(targetDir, fileName);
  await writeFile(filePath, [
    `# Manual Publish: ${payload.unit_id} → LinkedIn`,
    `**Generated:** ${generatedAt}`,
    `**Credential note:** ${CREDENTIAL_NOTE}`,
    '',
    '## Post copy',
    output.description,
    '',
    '## Link',
    payload.canonical_url,
    '',
    '## Images',
    ...output.image_urls.map((url, index) => `${index + 1}. ${url}`),
  ].join('\n'), 'utf8');
  return filePath;
}

export async function publish(payload: PublishPayload, context: LinkedInPublishContext = {}): Promise<LinkedInPublishReceipt> {
  const output = formatForPlatform(payload);
  const env = context.env ?? process.env;
  const missingCredentials = ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_ORGANIZATION_URN'].filter((key) => !env[key]);

  const body: Record<string, unknown> = {
    author: env.LINKEDIN_ORGANIZATION_URN,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: output.description },
        shareMediaCategory: 'ARTICLE',
        media: [{ status: 'READY', originalUrl: payload.canonical_url, title: { text: output.title } }],
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  if (missingCredentials.length > 0) {
    return {
      platform: 'linkedin',
      mode: 'paste_queue',
      referenceId: null,
      url: null,
      queueFilePath: await writePasteQueue(payload, output, context.queueDir),
      missingCredentials,
      credentialNote: CREDENTIAL_NOTE,
      request: { url: null, body },
    };
  }

  const url = 'https://api.linkedin.com/v2/ugcPosts';
  const response = await (context.postJson ?? defaultPostJson)(url, body, {
    Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
    'X-Restli-Protocol-Version': '2.0.0',
  });
  const referenceId = typeof response.id === 'string' ? response.id : null;

  return {
    platform: 'linkedin',
    mode: 'api',
    referenceId,
    url: referenceId ? `https://www.linkedin.com/feed/update/${encodeURIComponent(referenceId)}` : null,
    queueFilePath: null,
    missingCredentials: [],
    credentialNote: CREDENTIAL_NOTE,
    request: { url, body },
  };
}
