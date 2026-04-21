import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ListingStatusDashboardClient } from '@/components/admin/listing-status/ListingStatusDashboardClient';
import { getAllPasteQueueUnits, isPasteQueueAuthorized } from '@/lib/marketing/pasteQueueData';
import { getAllListingStatuses } from '@/lib/marketing/listingStatusStore';

export const metadata: Metadata = {
  title: 'Listing Status',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function ListingStatusPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!isPasteQueueAuthorized(token)) {
    notFound();
  }

  return (
    <ListingStatusDashboardClient
      token={token!}
      units={getAllPasteQueueUnits()}
      initialStatuses={await getAllListingStatuses()}
    />
  );
}
