import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PasteQueueUnitViewer } from '@/components/admin/paste-queue/PasteQueueUnitViewer';
import {
  getPasteQueueGeneratedTimestamp,
  getPasteQueuePayloads,
  getPasteQueueUnitById,
  getUnitDisplayName,
  isPasteQueueAuthorized,
} from '@/lib/marketing/pasteQueueData';

export const metadata: Metadata = {
  title: 'Paste Queue Detail',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function PasteQueueUnitPage({ params, searchParams }: PageProps) {
  const { unitId } = await params;
  const { token } = await searchParams;

  if (!isPasteQueueAuthorized(token)) {
    notFound();
  }

  const unit = getPasteQueueUnitById(decodeURIComponent(unitId));
  if (!unit) {
    notFound();
  }

  return (
    <PasteQueueUnitViewer
      token={token!}
      unit={unit}
      payloads={getPasteQueuePayloads(unit)}
      generatedAt={getPasteQueueGeneratedTimestamp()}
    />
  );
}
