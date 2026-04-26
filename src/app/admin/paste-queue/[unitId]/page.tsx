import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PasteQueueUnitViewer } from '@/components/admin/paste-queue/PasteQueueUnitViewer';
import { resolveAdminToken } from '@/lib/admin/adminAuth';
import {
  getPasteQueueGeneratedTimestamp,
  getPasteQueueUnitById,
  LISTING_STATUS_PLATFORMS,
  type ListingPlatform,
} from '@/lib/marketing/pasteQueueData';
import { getCanonicalPasteQueuePayloads } from '@/lib/marketing/pasteQueuePayloads';

export const metadata: Metadata = {
  title: 'Paste Queue Detail',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ token?: string; platform?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function PasteQueueUnitPage({ params, searchParams }: PageProps) {
  const { unitId } = await params;
  const { token, platform } = await searchParams;
  const adminToken = resolveAdminToken(token);

  if (!adminToken) {
    notFound();
  }

  const unit = getPasteQueueUnitById(decodeURIComponent(unitId));
  if (!unit) {
    notFound();
  }

  return (
    <PasteQueueUnitViewer
      token={adminToken}
      unit={unit}
      payloads={getCanonicalPasteQueuePayloads(unit)}
      generatedAt={getPasteQueueGeneratedTimestamp()}
      initialPlatform={
        LISTING_STATUS_PLATFORMS.includes(platform as ListingPlatform)
          ? (platform as ListingPlatform)
          : 'facebook_marketplace'
      }
    />
  );
}
