import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PasteQueueIndexClient } from '@/components/admin/paste-queue/PasteQueueIndexClient';
import {
  buildBatchMarketingAssetsForUnits,
  summarizeBatchMarketingResults,
} from '@/lib/marketing/batchMarketingAssets';
import { getAllPasteQueueUnits, isPasteQueueAuthorized } from '@/lib/marketing/pasteQueueData';

export const metadata: Metadata = {
  title: 'Paste Queue',
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

  if (!isPasteQueueAuthorized(token)) {
    notFound();
  }

  const units = getAllPasteQueueUnits();
  const marketingSummary = summarizeBatchMarketingResults(
    buildBatchMarketingAssetsForUnits(units, ['facebook_marketplace', 'craigslist', 'ebay']).results
  );

  return <PasteQueueIndexClient token={token!} units={units} marketingSummary={marketingSummary} />;
}
