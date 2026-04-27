import { NextResponse } from 'next/server';

import { BackendError, backendPost } from '@/lib/api/backend';

type EmailProxyRequestBody = {
  leadId?: unknown;
  inventoryId?: unknown;
  sequenceType?: unknown;
};

type BackendPostFn = <T>(path: string, body: unknown) => Promise<T>;

export interface EmailProxyRouteDeps {
  backendPost: BackendPostFn;
}

const defaultDeps: EmailProxyRouteDeps = { backendPost };

function fsmErrorResponse(error: unknown) {
  if (error instanceof BackendError) {
    return NextResponse.json(
      {
        error: 'FSM email proxy failed',
        fsmStatus: error.status,
        fsmBody: error.body ?? { error: error.message },
      },
      { status: 502 },
    );
  }
  return NextResponse.json(
    {
      error: 'FSM email proxy failed',
      detail: error instanceof Error ? error.message : 'Unknown backend error',
    },
    { status: 502 },
  );
}

export async function handleEmailProxyRequest(
  request: Request,
  deps: EmailProxyRouteDeps = defaultDeps,
) {
  let body: EmailProxyRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.leadId !== 'string' || body.leadId.trim().length === 0) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  if (typeof body.inventoryId !== 'string' || body.inventoryId.trim().length === 0) {
    return NextResponse.json({ error: 'inventoryId is required' }, { status: 400 });
  }

  const payload = {
    leadId: body.leadId.trim(),
    inventoryId: body.inventoryId.trim(),
    ...(typeof body.sequenceType === 'string' ? { sequenceType: body.sequenceType } : {}),
    source: 'storefront-email-proxy',
  };

  try {
    const result = await deps.backendPost<unknown>('/api/email/trigger-sequence', payload);
    return NextResponse.json(result);
  } catch (error) {
    return fsmErrorResponse(error);
  }
}
