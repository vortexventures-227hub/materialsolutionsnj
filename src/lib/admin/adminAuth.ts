import { cookies, headers } from 'next/headers';

import { isPasteQueueAuthorized } from '@/lib/marketing/pasteQueueData';

export const ADMIN_TOKEN_COOKIE = 'msnj_admin_token';

function bearerToken(value: string | null): string | undefined {
  if (!value?.startsWith('Bearer ')) return undefined;
  return value.slice('Bearer '.length).trim() || undefined;
}

export function resolveAdminToken(searchToken?: string): string | undefined {
  const requestHeaders = headers();
  const candidates = [
    searchToken,
    requestHeaders.get('x-msnj-admin-token') ?? undefined,
    bearerToken(requestHeaders.get('authorization')),
    cookies().get(ADMIN_TOKEN_COOKIE)?.value,
  ];

  return candidates.find((token) => isPasteQueueAuthorized(token));
}
