import { NextResponse } from 'next/server';

import { BackendError, backendPost } from '@/lib/api/backend';

type DripProxyRequestBody = {
  leadId?: unknown;
  campaignType?: unknown;
};

type BackendPostFn = <T>(path: string, body: unknown) => Promise<T>;

export interface DripProxyRouteDeps {
  backendPost: BackendPostFn;
}

const defaultDeps: DripProxyRouteDeps = { backendPost };

function fsmErrorResponse(error: unknown) {
  if (error instanceof BackendError) {
    return NextResponse.json(
      {
        error: 'FSM drip proxy failed',
        fsmStatus: error.status,
        fsmBody: error.body ?? { error: error.message },
      },
      { status: 502 },
    );
  }
  return NextResponse.json(
    {
      error: 'FSM drip proxy failed',
      detail: error instanceof Error ? error.message : 'Unknown backend error',
    },
    { status: 502 },
  );
}

export async function handleDripProxyRequest(
  request: Request,
  deps: DripProxyRouteDeps = defaultDeps,
) {
  let body: DripProxyRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.leadId !== 'string' || body.leadId.trim().length === 0) {
    return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
  }

  const payload = {
    leadId: body.leadId.trim(),
    campaignType: typeof body.campaignType === 'string' ? body.campaignType : 'welcome',
    source: 'storefront-drip-proxy',
  };

  try {
    const result = await deps.backendPost<unknown>('/api/drip/schedule', payload);
    return NextResponse.json(result);
  } catch (error) {
    return fsmErrorResponse(error);
  }
}
