import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PendingResponseDetailClient } from '@/components/admin/david/PendingResponseDetailClient';
import { resolveAdminToken } from '@/lib/admin/adminAuth';
import { getPendingResponseById } from '@/lib/david/pendingResponses';

export const metadata: Metadata = {
  title: 'Review David Draft',
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
  const adminToken = resolveAdminToken(token) ?? '';

  const response = await getPendingResponseById(decodeURIComponent(id));
  if (!response) {
    notFound();
  }

  return <PendingResponseDetailClient token={adminToken} response={response} />;
}
