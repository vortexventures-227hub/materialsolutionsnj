import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CanonicalContent } from '../canonical/types';
import { resolvePlatformOverride } from '../platformOverrides';

export type InboundDripTouch = 1 | 2 | 3;
export type ColdOutreachTouch = 1 | 2 | 3 | 4;
export type EmailCampaignSequence = 'inbound_drip' | 'sequence_a_warehouse_3pl' | 'sequence_b_food_beverage_coldstorage' | 'sequence_c_construction_contractor';
export type EmailCampaignKind = 'inbound' | 'cold_outreach';

export interface EmailCampaignRenderOptions {
  prospectName: string;
  prospectCompany?: string | null;
  prospectEmail?: string | null;
  touchNumber: InboundDripTouch | ColdOutreachTouch;
  sequence?: Exclude<EmailCampaignSequence, 'inbound_drip'>;
  matchedCanonical?: CanonicalContent;
  davidMailbox?: string;
  billName?: string;
  billEmail?: string;
  businessWebsiteUrl?: string;
  unsubscribeUrl?: string;
  physicalAddress?: string;
}

export interface EmailCampaignRenderResult {
  kind: EmailCampaignKind;
  sequence: EmailCampaignSequence;
  touchNumber: InboundDripTouch | ColdOutreachTouch;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  headers: Record<string, string>;
  compliance: {
    hasPhysicalAddress: boolean;
    hasUnsubscribeLink: boolean;
    hasBusinessIdentification: boolean;
  };
  sourceTemplates: string[];
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAVID_PROMPTS_ROOT = path.resolve(
  __dirname,
  '../../../../../../../VVMaterialSolutionsOps/agents/david/prompts'
);

const DEFAULTS = {
  davidMailbox: 'david@materialsolutionsnj.com',
  billName: 'Bill White',
  billEmail: 'bwhite@materialsolutionsnj.com',
  businessWebsiteUrl: 'https://www.materialsolutionsnj.com',
  unsubscribeUrl: '{{unsubscribe_link}}',
  physicalAddress: '{{physical_address}}',
};

const SEQUENCE_TEMPLATE_PATHS: Record<EmailCampaignSequence, string[]> = {
  inbound_drip: [
    path.join(DAVID_PROMPTS_ROOT, 'drip/drip_touch_1_immediate.md'),
    path.join(DAVID_PROMPTS_ROOT, 'drip/drip_touch_2_24h_email.md'),
    path.join(DAVID_PROMPTS_ROOT, 'drip/drip_touch_3_72h_email.md'),
  ],
  sequence_a_warehouse_3pl: [path.join(DAVID_PROMPTS_ROOT, 'cold_outreach/sequence_a_warehouse_3pl.md')],
  sequence_b_food_beverage_coldstorage: [path.join(DAVID_PROMPTS_ROOT, 'cold_outreach/sequence_b_food_beverage_coldstorage.md')],
  sequence_c_construction_contractor: [path.join(DAVID_PROMPTS_ROOT, 'cold_outreach/sequence_c_construction_contractor.md')],
};

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sentenceCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatCurrency(value: number | null): string {
  if (value == null) {
    return 'call for price';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function deriveUnitReference(canonical: CanonicalContent): string {
  return collapseWhitespace([canonical.year, canonical.make, canonical.model].filter(Boolean).join(' ')) || canonical.title;
}

function deriveValueProp(canonical: CanonicalContent): string {
  const detailBits = [
    canonical.hours_approx != null ? `${canonical.hours_approx.toLocaleString()} hours` : null,
    canonical.capacity_lbs != null ? `${canonical.capacity_lbs.toLocaleString()} lb capacity` : null,
    canonical.location_label ? `available in ${canonical.location_label}` : null,
  ].filter(Boolean);

  if (canonical.lot_only_flag) {
    return collapseWhitespace(
      `It is a lot-only opportunity with ${canonical.images.length} current media assets and ${canonical.make} inventory that stays grouped together for one coordinated buy.`
    );
  }

  return collapseWhitespace(
    `It is one of the stronger current fits because it pairs ${detailBits.join(', ')} with ${canonical.condition_summary.toLowerCase()}.`
  );
}

function deriveQuestionBack(canonical: CanonicalContent): string {
  if (canonical.lot_only_flag) {
    return 'Are you evaluating one site or a broader fleet refresh?';
  }

  if (canonical.asking_price_usd != null) {
    return 'Do you want specs, price, or delivery next?';
  }

  return 'Do you want specs or a quick walk-through next?';
}

function deriveFinalValueProp(canonical: CanonicalContent): string {
  if (canonical.lot_only_flag) {
    return collapseWhitespace(
      `${canonical.make} lot packaging keeps the fleet together and avoids piecemeal sourcing when a team needs multiple compatible units at once.`
    );
  }

  return collapseWhitespace(
    `${deriveUnitReference(canonical)} combines ${canonical.capacity_lbs != null ? `${canonical.capacity_lbs.toLocaleString()} lb capacity` : 'current inventory specs'} with ${canonical.condition_summary.toLowerCase()}.`
  );
}

function deriveMatchedPitch(canonical: CanonicalContent): string {
  const price = canonical.lot_only_flag ? 'lot-sale only' : formatCurrency(canonical.asking_price_usd);
  return collapseWhitespace(`${deriveUnitReference(canonical)} in ${canonical.location_label} — ${price}. ${canonical.condition_summary}`);
}

function buildComplianceFooter(options: Required<Pick<EmailCampaignRenderOptions, 'businessWebsiteUrl' | 'physicalAddress' | 'unsubscribeUrl'>>): {
  text: string;
  html: string;
} {
  const text = `${options.businessWebsiteUrl} · Material Solutions NJ · ${options.physicalAddress}\nTo unsubscribe: ${options.unsubscribeUrl}`;
  const html = `<hr style="border:none;border-top:1px solid #d1d5db;margin:24px 0" /><p style="font-size:12px;line-height:18px;color:#4b5563">${escapeHtml(options.businessWebsiteUrl)} · Material Solutions NJ · ${escapeHtml(options.physicalAddress)}<br />To unsubscribe: <a href="${escapeHtml(options.unsubscribeUrl)}">${escapeHtml(options.unsubscribeUrl)}</a></p>`;
  return { text, html };
}

function renderHtmlEmail(paragraphs: string[], footerHtml: string): string {
  return [
    '<!doctype html>',
    '<html>',
    '<body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#111827">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">',
    '<table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:32px">',
    ...paragraphs.map((paragraph) => `<tr><td style="font-size:16px;line-height:24px;padding:0 0 16px 0">${escapeHtml(paragraph)}</td></tr>`),
    `<tr><td>${footerHtml}</td></tr>`,
    '</table>',
    '</td></tr></table>',
    '</body>',
    '</html>',
  ].join('');
}

function buildHeaders(result: {
  kind: EmailCampaignKind;
  sequence: EmailCampaignSequence;
  touchNumber: number;
  davidMailbox: string;
  unsubscribeUrl: string;
  prospectEmail?: string | null;
}): Record<string, string> {
  return {
    'Reply-To': result.davidMailbox,
    'X-David-Campaign-Kind': result.kind,
    'X-David-Sequence': result.sequence,
    'X-David-Touch-Number': String(result.touchNumber),
    'List-Unsubscribe': `<${result.unsubscribeUrl}>`,
    'X-MaterialSolutions-Prospect': result.prospectEmail ?? 'unknown',
  };
}

async function assertTemplateFilesExist(sequence: EmailCampaignSequence): Promise<string[]> {
  const paths = SEQUENCE_TEMPLATE_PATHS[sequence];
  await Promise.all(paths.map(async (templatePath) => readFile(templatePath, 'utf8')));
  return paths;
}

function finalizeResult(args: {
  kind: EmailCampaignKind;
  sequence: EmailCampaignSequence;
  touchNumber: number;
  subject: string;
  preheader: string;
  paragraphs: string[];
  sourceTemplates: string[];
  options: Required<Pick<EmailCampaignRenderOptions, 'davidMailbox' | 'businessWebsiteUrl' | 'unsubscribeUrl' | 'physicalAddress'>> & {
    prospectEmail?: string | null;
  };
}): EmailCampaignRenderResult {
  const footer = buildComplianceFooter(args.options);
  const textBody = [...args.paragraphs, '', footer.text].join('\n\n');
  const htmlBody = renderHtmlEmail(args.paragraphs, footer.html);
  const headers = buildHeaders({
    kind: args.kind,
    sequence: args.sequence,
    touchNumber: args.touchNumber,
    davidMailbox: args.options.davidMailbox,
    unsubscribeUrl: args.options.unsubscribeUrl,
    prospectEmail: args.options.prospectEmail,
  });

  return {
    kind: args.kind,
    sequence: args.sequence,
    touchNumber: args.touchNumber as InboundDripTouch | ColdOutreachTouch,
    subject: args.subject,
    preheader: args.preheader,
    htmlBody,
    textBody,
    headers,
    compliance: {
      hasPhysicalAddress: textBody.includes(args.options.physicalAddress),
      hasUnsubscribeLink: textBody.includes(args.options.unsubscribeUrl),
      hasBusinessIdentification: textBody.includes('Material Solutions NJ'),
    },
    sourceTemplates: args.sourceTemplates,
  };
}

export async function renderInboundDripEmail(
  canonical: CanonicalContent,
  options: Omit<EmailCampaignRenderOptions, 'sequence'> & { touchNumber: InboundDripTouch }
): Promise<EmailCampaignRenderResult> {
  const sourceTemplates = await assertTemplateFilesExist('inbound_drip');
  const emailOverride = resolvePlatformOverride(canonical, 'email_campaign');
  const resolved = {
    davidMailbox: options.davidMailbox ?? DEFAULTS.davidMailbox,
    billName: options.billName ?? DEFAULTS.billName,
    billEmail: options.billEmail ?? DEFAULTS.billEmail,
    businessWebsiteUrl: options.businessWebsiteUrl ?? DEFAULTS.businessWebsiteUrl,
    unsubscribeUrl: options.unsubscribeUrl ?? DEFAULTS.unsubscribeUrl,
    physicalAddress: options.physicalAddress ?? DEFAULTS.physicalAddress,
  };
  const unitReference = deriveUnitReference(canonical);
  const valueProp = deriveValueProp(canonical);
  const questionBack = deriveQuestionBack(canonical);
  const finalValueProp = deriveFinalValueProp(canonical);
  const subjectByTouch: Record<InboundDripTouch, string> = {
    1: `${unitReference} — thanks for reaching out`,
    2: `Following up on ${unitReference}`,
    3: `Last follow-up on ${unitReference}`,
  };
  const paragraphsByTouch: Record<InboundDripTouch, string[]> = {
    1: [
      `Hi ${options.prospectName},`,
      `I'm David — AI sales agent for Material Solutions NJ. Thanks for reaching out about ${unitReference}.`,
      `${canonical.teaser_by_channel.email_campaign ?? canonical.teaser_by_channel.website} ${valueProp}`,
      `If you want, I can send specs, photos, pricing context, or help compare it against the rest of the current inventory.`,
      `David | Material Solutions NJ`,
      `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
    ],
    2: [
      `Hi ${options.prospectName}, circling back on ${unitReference} in case my last note got buried. ${valueProp}`,
      `Happy to answer any questions or help you compare it against the rest of the current inventory. ${questionBack}`,
      `David | Material Solutions NJ`,
      `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
    ],
    3: [
      `Hi ${options.prospectName}, this is my last follow-up on ${unitReference} for now. If now is not the right time, no pressure — just reply pause and I'll back off.`,
      `If you're still interested, here's the main reason buyers keep this one on the shortlist: ${finalValueProp}`,
      `Reply pause if you want the drip to stop.`,
      `David | Material Solutions NJ`,
      `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
    ],
  };

  return finalizeResult({
    kind: 'inbound',
    sequence: 'inbound_drip',
    touchNumber: options.touchNumber,
    subject: subjectByTouch[options.touchNumber],
    preheader: String(emailOverride.platform_specific_fields.preheader ?? canonical.teaser_by_channel.email_campaign ?? canonical.title),
    paragraphs: paragraphsByTouch[options.touchNumber],
    sourceTemplates,
    options: {
      ...resolved,
      prospectEmail: options.prospectEmail,
    },
  });
}

export async function renderColdOutreachEmail(
  canonical: CanonicalContent,
  options: Omit<EmailCampaignRenderOptions, 'sequence'> & {
    sequence: Exclude<EmailCampaignSequence, 'inbound_drip'>;
    touchNumber: ColdOutreachTouch;
  }
): Promise<EmailCampaignRenderResult> {
  const sourceTemplates = await assertTemplateFilesExist(options.sequence);
  const resolved = {
    davidMailbox: options.davidMailbox ?? DEFAULTS.davidMailbox,
    billName: options.billName ?? DEFAULTS.billName,
    billEmail: options.billEmail ?? DEFAULTS.billEmail,
    businessWebsiteUrl: options.businessWebsiteUrl ?? DEFAULTS.businessWebsiteUrl,
    unsubscribeUrl: options.unsubscribeUrl ?? DEFAULTS.unsubscribeUrl,
    physicalAddress: options.physicalAddress ?? DEFAULTS.physicalAddress,
  };
  const matched = options.matchedCanonical ?? canonical;
  const matchedUnitReference = deriveUnitReference(matched);
  const matchedPitch = deriveMatchedPitch(matched);
  const matchedLocation = matched.location_label;
  const subjectMap: Record<Exclude<EmailCampaignSequence, 'inbound_drip'>, Record<ColdOutreachTouch, string>> = {
    sequence_a_warehouse_3pl: {
      1: `${options.prospectCompany ?? 'Your warehouse'} forklift fleet — quick question`,
      2: `${matched.year ?? 'Used'} ${matched.model} available in ${matchedLocation}`,
      3: `15 minutes, ${options.prospectName}?`,
      4: `Closing the loop on ${options.prospectCompany ?? 'your operation'}`,
    },
    sequence_b_food_beverage_coldstorage: {
      1: `${options.prospectCompany ?? 'Cold storage ops'} — quick forklift question`,
      2: `${matched.year ?? 'Used'} ${matched.model} available in ${matchedLocation}`,
      3: `Worth a quick call this week, ${options.prospectName}?`,
      4: `Last note on ${options.prospectCompany ?? 'your team'}`,
    },
    sequence_c_construction_contractor: {
      1: `${options.prospectCompany ?? 'Your crew'} equipment timing question`,
      2: `${matched.year ?? 'Used'} ${matched.model} available in ${matchedLocation}`,
      3: `Open to a 15-minute equipment call?`,
      4: `Closing the loop on equipment timing`,
    },
  };

  const bodyMap: Record<Exclude<EmailCampaignSequence, 'inbound_drip'>, Record<ColdOutreachTouch, string[]>> = {
    sequence_a_warehouse_3pl: {
      1: [
        `Hi ${options.prospectName},`,
        `I'm David — AI sales agent for Material Solutions NJ. ${resolved.billName} has been moving certified used forklifts to warehouses and 3PLs for 29 years.`,
        `Quick question: are any units in your fleet due for replacement in the next 6–12 months? We currently have a Raymond lot in Baltimore that simplifies maintenance planning when a team wants multiple compatible units.`,
        `Happy to pull specs if anything fits your setup.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      2: [
        `Hi ${options.prospectName},`,
        `Following up with something concrete: we have ${matchedPitch} currently available.`,
        `For a warehouse operation your size, a lot purchase often pencils out versus retail per-unit — one negotiation, one delivery coordination, consistent parts inventory.`,
        `Bill can put together a walk-through if you want eyes on the units before committing. What does your timeline look like?`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      3: [
        `Hi ${options.prospectName},`,
        `${resolved.billName} has been in used industrial equipment for 29 years — most of his 3PL buyers come back on the next replacement cycle because the units hold up and the process is straightforward.`,
        `If you have 15 minutes this week, I can set up a call between you and ${resolved.billName} to talk through your fleet needs, no commitment required.`,
        `Just reply with a window that works.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      4: [
        `Hi ${options.prospectName},`,
        `Last note from me — I know timing is not always right.`,
        `If your fleet replacement window opens up, ${resolved.businessWebsiteUrl.replace(/^https?:\/\//, '')} has current inventory and ${resolved.billName} is reachable at ${resolved.billEmail}. No hoops.`,
        `If email is not the right channel, just hit unsubscribe below and I'll leave you alone.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
    },
    sequence_b_food_beverage_coldstorage: {
      1: [
        `Hi ${options.prospectName},`,
        `I'm David — AI sales agent for Material Solutions NJ. We regularly hear from cold-storage and food operators who need reliable replacement equipment without stretching budget timing.`,
        `Are any of your reach-truck or narrow-aisle units aging out this quarter? We have current inventory that fits cold-storage replacement cycles without forcing a brand-new capex decision.`,
        `If helpful, I can pull the best current fit and send specs.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      2: [
        `Hi ${options.prospectName},`,
        `Following up with one concrete match: ${matchedPitch}.`,
        `For food and beverage operators, the main draw is keeping a narrow-aisle profile in service without waiting on a long OEM replacement cycle.`,
        `Would it help if I sent photos, key specs, or price context next?`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      3: [
        `Hi ${options.prospectName},`,
        `${resolved.billName} has spent almost three decades helping operators buy used industrial equipment with fewer surprises. That matters when downtime in refrigerated or food-grade space gets expensive fast.`,
        `If you want, I can line up a short call with ${resolved.billName} and keep it focused on replacement timing and budget range.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      4: [
        `Hi ${options.prospectName},`,
        `Last note from me for now. If equipment timing shifts later, ${resolved.businessWebsiteUrl.replace(/^https?:\/\//, '')} keeps the inventory current and ${resolved.billName} is at ${resolved.billEmail}.`,
        `If this is not relevant, feel free to use the unsubscribe link below and I will stop reaching out.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
    },
    sequence_c_construction_contractor: {
      1: [
        `Hi ${options.prospectName},`,
        `I'm David — AI sales agent for Material Solutions NJ. We talk with contractors and site-services teams that need used lift equipment without blowing up seasonal budgets.`,
        `Are you expecting any staging, narrow-aisle, or warehouse-support equipment needs in the next 6–12 months? We have current inventory that can cover that gap quickly.`,
        `If a quick fit check is useful, I can send one.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      2: [
        `Hi ${options.prospectName},`,
        `One concrete fit from current inventory: ${matchedPitch}.`,
        `For contractor teams, the usual appeal is getting a capable unit into rotation without waiting on a longer procurement cycle.`,
        `Do you want specs, pricing context, or availability next?`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      3: [
        `Hi ${options.prospectName},`,
        `${resolved.billName} has been in used industrial equipment for 29 years and usually keeps the conversation straightforward — fit, timing, budget, then yes or no.`,
        `If you are open to it, I can set up a short call with ${resolved.billName} and keep it focused on your current equipment need.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
      4: [
        `Hi ${options.prospectName},`,
        `Closing the loop from my side. If a project opens up later, ${resolved.businessWebsiteUrl.replace(/^https?:\/\//, '')} has current inventory and ${resolved.billName} is available at ${resolved.billEmail}.`,
        `If email is not useful here, unsubscribe below and I will leave you alone.`,
        `David | Material Solutions NJ`,
        `${resolved.davidMailbox} | ${resolved.businessWebsiteUrl}`,
      ],
    },
  };

  return finalizeResult({
    kind: 'cold_outreach',
    sequence: options.sequence,
    touchNumber: options.touchNumber,
    subject: subjectMap[options.sequence][options.touchNumber],
    preheader: collapseWhitespace(`${sentenceCase(options.sequence.replace(/^sequence_[abc]_/, '').replace(/_/g, ' '))} outreach — ${matchedUnitReference} — ${matched.location_label}`),
    paragraphs: bodyMap[options.sequence][options.touchNumber],
    sourceTemplates,
    options: {
      ...resolved,
      prospectEmail: options.prospectEmail,
    },
  });
}

export async function renderEmailCampaign(
  canonical: CanonicalContent,
  options: EmailCampaignRenderOptions
): Promise<EmailCampaignRenderResult> {
  if (!options.sequence) {
    return renderInboundDripEmail(canonical, { ...options, touchNumber: options.touchNumber as InboundDripTouch });
  }

  return renderColdOutreachEmail(canonical, {
    ...options,
    sequence: options.sequence,
    touchNumber: options.touchNumber as ColdOutreachTouch,
  });
}
