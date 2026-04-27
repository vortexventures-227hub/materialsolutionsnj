export class BackendError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

export interface BackendFetchOptions extends RequestInit {
  timeout?: number;
}

export async function backendFetch<T>(
  path: string,
  options: BackendFetchOptions = {},
): Promise<T> {
  const base = (
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    'https://vortex-forklift-api-production.up.railway.app'
  ).replace(/\/$/, '');

  const apiKey = process.env.BACKEND_API_KEY;

  const { timeout = 30000, ...init } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };

  async function attempt(): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(`${base}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  let response: Response;
  try {
    response = await attempt();
  } catch {
    // Retry once on network/timeout error; 4xx/5xx propagate below
    response = await attempt();
  }

  if (!response.ok) {
    let message: string;
    let body: unknown;
    try {
      body = await response.json();
      const parsedBody = body as { message?: string; error?: string };
      message = parsedBody.message ?? parsedBody.error ?? response.statusText;
    } catch {
      message = response.statusText;
    }
    throw new BackendError(response.status, message, body);
  }

  return response.json() as Promise<T>;
}

export function backendGet<T>(path: string, options?: BackendFetchOptions): Promise<T> {
  return backendFetch<T>(path, { ...options, method: 'GET' });
}

export function backendPost<T>(
  path: string,
  body: unknown,
  options?: BackendFetchOptions,
): Promise<T> {
  return backendFetch<T>(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function backendPut<T>(
  path: string,
  body: unknown,
  options?: BackendFetchOptions,
): Promise<T> {
  return backendFetch<T>(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function backendPatch<T>(
  path: string,
  body: unknown,
  options?: BackendFetchOptions,
): Promise<T> {
  return backendFetch<T>(path, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function backendDelete<T>(path: string, options?: BackendFetchOptions): Promise<T> {
  return backendFetch<T>(path, { ...options, method: 'DELETE' });
}

export const backend = {
  get<T>(path: string, params?: Record<string, string>, options?: BackendFetchOptions): Promise<T> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return backendGet<T>(`${path}${query}`, options);
  },
  post<T>(path: string, body: unknown, options?: BackendFetchOptions): Promise<T> {
    return backendPost<T>(path, body, options);
  },
  put<T>(path: string, body: unknown, options?: BackendFetchOptions): Promise<T> {
    return backendPut<T>(path, body, options);
  },
  patch<T>(path: string, body: unknown, options?: BackendFetchOptions): Promise<T> {
    return backendPatch<T>(path, body, options);
  },
  delete<T>(path: string, options?: BackendFetchOptions): Promise<T> {
    return backendDelete<T>(path, options);
  },
};
