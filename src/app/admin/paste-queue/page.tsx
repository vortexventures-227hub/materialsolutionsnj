import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PasteQueueIndexClient } from '@/components/admin/paste-queue/PasteQueueIndexClient';
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

  return <PasteQueueIndexClient token={token!} units={getAllPasteQueueUnits()} />;
}
