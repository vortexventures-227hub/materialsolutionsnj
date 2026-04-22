import { buildDescriptionSections, buildManualPostingInstructions, buildPlatformOutput, compactLocation, displayName, formatCurrency, type PublishPayload } from './shared';

export function formatForPlatform(payload: PublishPayload) {
  const titleBits = [`${displayName(payload)}`, compactLocation(payload.location)];
  if (!payload.sold_as_lot_only && payload.price_usd != null) {
    titleBits.push(formatCurrency(payload.price_usd));
  }

  return buildPlatformOutput('craigslist', payload, {
    titleSource: titleBits.join(' — '),
    descriptionSource: [
      buildDescriptionSections(payload).join(' '),
      'Use plain text only; Craigslist strips rich formatting.',
    ].join(' '),
    platformSpecificFields: {
      plain_text_required: true,
      reply_email_todo: 'TODO: confirm Craigslist relay/reply mailbox before publishing.',
    },
    postingInstructions: buildManualPostingInstructions('Craigslist', payload),
  });
}
