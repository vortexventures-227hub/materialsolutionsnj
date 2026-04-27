import type { Metadata } from 'next';

import { PasteQueueIndexClient } from '@/components/admin/paste-queue/PasteQueueIndexClient';
import { resolveAdminToken } from '@/lib/admin/adminAuth';
import {
  buildBatchMarketingAssetsForUnits,
  summarizeBatchMarketingResults,
} from '@/lib/marketing/batchMarketingAssets';
import { getAllPasteQueueUnits } from '@/lib/marketing/pasteQueueData';

export const metadata: Metadata = {
  title: 'Admin Paste Queue',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function PasteQueueIndexPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const adminToken = resolveAdminToken(token) ?? '';

  const units = getAllPasteQueueUnits();
  const marketingSummary = summarizeBatchMarketingResults(
    buildBatchMarketingAssetsForUnits(units, ['facebook_marketplace', 'craigslist', 'ebay']).results
  );

  return <PasteQueueIndexClient token={adminToken} units={units} marketingSummary={marketingSummary} />;
}
