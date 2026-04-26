/**
 * youtube.ts
 * AXIS-004 — Publish Button: next 5 platform formatters
 *
 * Platform: YouTube — inventory video listing via YouTube Data API v3
 * Tier: auto (API-based upload + metadata assignment)
 *
 * API: YouTube Data API v3 (www.googleapis.com/youtube/v3)
 * Credential needed: [CONFIRM_WITH_CHRIS] Google Cloud project with YouTube Data API v3 enabled
 *   + OAuth2 user credentials (not service account — YouTube API requires user authorization
 *     for video upload via the v3 API unless using a brand account with content owner)
 *
 * Platform notes:
 *   - YouTube Data API v3 free quota: 10,000 units/day
 *   - Requires video file upload (not just listing) — product is a video
 *   - Title / description mapped from canonical; video asset must exist at canonical.video_url
 *   - Category: 'Autos & Vehicles' (ID 2) or 'Education' (ID 27) — forklift content maps to 2
 *   - Tags: make, model, unit_type, year, condition
 *
 * Reference: https://developers.google.com/youtube/v3/docs/videos/insert
 */

import type { CanonicalContent } from '../canonical/types';
import {
  type ChannelFormatter,
  type ChannelFormatterPublishContext,
  type ChannelPublishReceipt,
  defaultPostJson,
} from './ChannelFormatter';
import { buildDescriptionSections, formatCurrency, compactLocation, type PlatformOutput } from './shared';

export class YouTubeChannelFormatter implements ChannelFormatter {
  readonly channel = 'youtube' as const;
  readonly contentFormat = 'social_listing' as const;
  readonly tier = 'auto' as const;

  render(canonical: CanonicalContent): PlatformOutput {
    const title = [
      canonical.year,
      canonical.make,
      canonical.model,
      canonical.unit_type,
      '| Material Solutions NJ',
    ].filter(Boolean).join(' ');

    const description = [
      canonical.long_description,
      '',
      `💰 Price: ${formatCurrency(canonical.asking_price_usd)}`,
      `📍 Location: ${compactLocation(canonical.location_label)}`,
      canonical.warranty_terms_short ? `🛡️ Warranty: ${canonical.warranty_terms_short}` : '',
      '',
      `🔗 Full listing: ${canonical.canonical_url}`,
      '',
      canonical.make && canonical.model ? `#${canonical.make.replace(/\s/g, '')} #${canonical.model.replace(/\s/g, '')} #forklift` : '#forklift',
    ].filter(Boolean).join('\n');

    // Map canonical images as thumbnail references
    const imageUrls = canonical.images.map((img) => img.public_url).filter((url): url is string => Boolean(url));

    return {
      title,
      description,
      price: canonical.asking_price_usd,
      primary_image_url: imageUrls[0] ?? '',
      image_urls: imageUrls,
      category_mapping: 'Autos & Vehicles',
      platform_specific_fields: {
        video_asset_required: true,
        canonical_video_url: (canonical as unknown as { canonical_video_url?: string }).canonical_video_url ?? null,
        youtube_category_id: '2', // Autos & Vehicles
        youtube_tags: [
          canonical.make,
          canonical.model,
          canonical.unit_type,
          canonical.year?.toString(),
          canonical.condition_summary ?? 'used',
          'forklift',
          'material handling',
        ].filter(Boolean),
        publish_eligibility: canonical.publish_eligibility,
      },
      posting_instructions: null,
      char_limit_warnings: [],
    };
  }

  async publish(
    canonical: CanonicalContent,
    context: ChannelFormatterPublishContext = {},
  ): Promise<ChannelPublishReceipt> {
    const env = context.env ?? process.env;

    // [CONFIRM_WITH_CHRIS] YouTube API credentials
    const youtubeApiKey = env.YOUTUBE_DATA_API_KEY;
    const youtubeChannelId = env.YOUTUBE_CHANNEL_ID;
    const videoAssetUrl = (canonical as unknown as { canonical_video_url?: string }).canonical_video_url ?? null;

    if (!youtubeApiKey || !youtubeChannelId) {
      throw new Error(
        '[CONFIRM_WITH_CHRIS] Missing YouTube credentials: YOUTUBE_DATA_API_KEY and YOUTUBE_CHANNEL_ID must be set. ' +
        'Confirm with Chris whether a Google Cloud project with YouTube Data API v3 is configured.'
      );
    }

    if (!videoAssetUrl) {
      return {
        channel: this.channel,
        mode: 'http',
        referenceId: null,
        summary: `YouTube publish deferred for ${canonical.unit_id}: no video asset URL in canonical. Upload video first.`,
        request: { url: null, body: null },
      };
    }

    const output = this.render(canonical);
    const snippet: Record<string, unknown> = {
      title: output.title,
      description: output.description,
      categoryId: '2',
      tags: (output.platform_specific_fields.youtube_tags as string[]).slice(0, 500),
      channelId: youtubeChannelId,
    };

    // Step 1: Initialize video upload (POST https://www.googleapis.com/youtube/v3/videos + part=snippet,status)
    const initUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet%2Cstatus&key=${youtubeApiKey}`;
    const initBody: Record<string, unknown> = {
      snippet,
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    let response: Record<string, unknown>;
    try {
      response = await (context.postJson ?? defaultPostJson)(initUrl, initBody, {
        'Content-Type': 'application/json',
      });
    } catch (err) {
      return {
        channel: this.channel,
        mode: 'http',
        referenceId: null,
        summary: `[CONFIRM_WITH_CHRIS] YouTube API error: ${err instanceof Error ? err.message : String(err)}. Confirm API key is valid and YouTube Data API v3 is enabled in Google Cloud console.`,
        request: { url: initUrl, body: initBody },
      };
    }

    const videoId = (response as { id?: string }).id ?? null;

    return {
      channel: this.channel,
      mode: 'http',
      referenceId: videoId,
      summary: videoId
        ? `YouTube video metadata initialized for ${canonical.unit_id}: videoId=${videoId}. Video file upload (from ${videoAssetUrl}) must be completed via resumable upload session.`
        : `YouTube API response missing videoId for ${canonical.unit_id}`,
      request: { url: initUrl, body: initBody },
    };
  }
}

export const YOUTUBE_FORMATTER = new YouTubeChannelFormatter();
