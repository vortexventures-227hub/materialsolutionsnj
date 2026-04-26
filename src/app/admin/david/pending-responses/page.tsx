import type { Metadata } from 'next';

import { PendingResponsesQueueClient } from '@/components/admin/david/PendingResponsesQueueClient';
import { resolveAdminToken } from '@/lib/admin/adminAuth';
import { getPendingResponses } from '@/lib/david/pendingResponses';

export const metadata: Metadata = {
  title: 'David Approval Queue',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function DavidPendingResponsesPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const adminToken = resolveAdminToken(token) ?? '';

  return <PendingResponsesQueueClient token={adminToken} responses={await getPendingResponses()} />;
}
