import type { Metadata } from 'next';

import { ListingStatusDashboardClient } from '@/components/admin/listing-status/ListingStatusDashboardClient';
import { resolveAdminToken } from '@/lib/admin/adminAuth';
import { getAllPasteQueueUnits } from '@/lib/marketing/pasteQueueData';
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
  const adminToken = resolveAdminToken(token) ?? '';

  return (
    <ListingStatusDashboardClient
      token={adminToken}
      units={getAllPasteQueueUnits()}
      initialStatuses={await getAllListingStatuses()}
    />
  );
}
