import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PendingResponsesQueueClient } from '@/components/admin/david/PendingResponsesQueueClient';
import { getPendingResponses } from '@/lib/david/pendingResponses';
import { isPasteQueueAuthorized } from '@/lib/marketing/pasteQueueData';

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

  if (!isPasteQueueAuthorized(token)) {
    notFound();
  }

  return <PendingResponsesQueueClient token={token!} responses={await getPendingResponses()} />;
}
