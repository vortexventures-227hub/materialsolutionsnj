export interface FsmChatForwardRequest {
  message: string;
  leadId?: string;
}

export interface FsmChatForwardResponse {
  response: string;
  timestamp: string;
}

export class FsmChatError extends Error {
  constructor(
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'FsmChatError';
  }
}

// Forward a single user message to the FSM keyword-intent classifier.
// Auth: uses FSM_SERVICE_JWT (a long-lived Bearer JWT signed by the FSM's
// JWT_SECRET). /api/chat requires verifyToken middleware — BACKEND_API_KEY
// is not a JWT and would be rejected. FSM_SERVICE_JWT is separate.
export async function fsmChatForward(
  body: FsmChatForwardRequest,
): Promise<FsmChatForwardResponse> {
  const serviceJwt = process.env.FSM_SERVICE_JWT;
  if (!serviceJwt) {
    throw new FsmChatError(null, 'FSM_SERVICE_JWT not configured');
  }

  const base = (
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    'https://vortex-forklift-api-production.up.railway.app'
  ).replace(/\/$/, '');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(`${base}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceJwt}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new FsmChatError(
      null,
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let message: string;
    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.error ?? payload.message ?? response.statusText;
    } catch {
      message = response.statusText;
    }
    throw new FsmChatError(response.status, message);
  }

  return response.json() as Promise<FsmChatForwardResponse>;
}
