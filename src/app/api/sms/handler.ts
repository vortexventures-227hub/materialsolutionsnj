import { NextResponse } from 'next/server';

import { backend } from '@/lib/api/backend';

type SmsProxyRequestBody = {
  leadId?: unknown;
  message?: unknown;
};

type BackendPostFn = <T>(path: string, body: unknown) => Promise<T>;

export interface SmsProxyRouteDeps {
  backendPost: BackendPostFn;
}

const defaultDeps: SmsProxyRouteDeps = { backendPost: backend.post.bind(backend) };

function fsmErrorResponse(error: unknown) {
  if (error instanceof Error && 'status' in error) {
    const e = error as Error & { status: number; body?: unknown };
    return NextResponse.json(
      {
        error: 'FSM SMS proxy failed',
        fsmStatus: e.status,
        fsmBody: e.body ?? { error: e.message },
      },
      { status: 502 },
    );
  }
  return NextResponse.json(
    {
      error: 'FSM SMS proxy failed',
      detail: error instanceof Error ? error.message : 'Unknown backend error',
    },
    { status: 502 },
  );
}

export async function handleSmsProxyRequest(
  request: Request,
  deps: SmsProxyRouteDeps = defaultDeps,
) {
  let body: SmsProxyRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.leadId !== 'string' || body.leadId.trim().length === 0) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  if (typeof body.message !== 'string' || body.message.trim().length === 0) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const payload = {
    leadId: body.leadId.trim(),
    message: body.message.trim(),
    source: 'storefront-sms-proxy',
  };

  try {
    const result = await deps.backendPost<unknown>('/api/sms/send', payload);
    return NextResponse.json(result);
  } catch (error) {
    return fsmErrorResponse(error);
  }
}
