import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PendingResponseDetailClient } from '@/components/admin/david/PendingResponseDetailClient';
import { getPendingResponseById } from '@/lib/david/pendingResponses';
import { isPasteQueueAuthorized } from '@/lib/marketing/pasteQueueData';

export const metadata: Metadata = {
  title: 'David Approval Detail',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function DavidPendingResponseDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!isPasteQueueAuthorized(token)) {
    notFound();
  }

  const response = await getPendingResponseById(decodeURIComponent(id));
  if (!response) {
    notFound();
  }

  return <PendingResponseDetailClient token={token!} response={response} />;
}
