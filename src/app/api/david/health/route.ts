import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ProviderCheck = {
  ok: boolean;
  reason?: string;
};

type ProviderStatus = {
  state: 'healthy' | 'degraded' | 'offline';
  reason?: string;
};

async function verifyAnthropicAuth(apiKey: string): Promise<ProviderCheck> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://api.anthropic.com/v1/models?limit=1', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'ANTHROPIC_API_KEY failed authentication' };
    }
    if (!res.ok) {
      return { ok: false, reason: `Anthropic API returned ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `Anthropic API unreachable: ${msg}` };
  }
}

async function verifyGeminiAuth(apiKey: string): Promise<ProviderCheck> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      {
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'GEMINI_API_KEY failed authentication' };
    }
    if (!res.ok) {
      return { ok: false, reason: `Gemini API returned ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `Gemini API unreachable: ${msg}` };
  }
}

function toProviderStatus(apiKey: string | undefined, auth: ProviderCheck | null): ProviderStatus {
  if (!apiKey) {
    return { state: 'offline', reason: 'not configured' };
  }

  if (!auth?.ok) {
    return { state: 'degraded', reason: auth?.reason ?? 'authentication failed' };
  }

  return { state: 'healthy' };
}

export async function GET() {
  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    const [anthropicAuth, geminiAuth] = await Promise.all([
      anthropicApiKey ? verifyAnthropicAuth(anthropicApiKey) : Promise.resolve(null),
      geminiApiKey ? verifyGeminiAuth(geminiApiKey) : Promise.resolve(null),
    ]);

    const anthropic = toProviderStatus(anthropicApiKey, anthropicAuth);
    const gemini = toProviderStatus(geminiApiKey, geminiAuth);
    const healthyProviders = [anthropic, gemini].filter((provider) => provider.state === 'healthy').length;

    if (healthyProviders === 2) {
      return NextResponse.json({
        healthState: 'healthy',
        contractSummary: 'Mounted /api/david/chat and fallback /api/david/message are both configured.',
        anthropic,
        gemini,
      });
    }

    const healthState = healthyProviders === 0 ? 'offline' : 'degraded';
    const reasonParts = [];
    if (anthropic.state !== 'healthy') {
      reasonParts.push(`mounted /api/david/chat unavailable: ${anthropic.reason}`);
    }
    if (gemini.state !== 'healthy') {
      reasonParts.push(`fallback /api/david/message unavailable: ${gemini.reason}`);
    }

    return NextResponse.json(
      {
        healthState,
        reason: reasonParts.join('; '),
        contractSummary:
          'Mounted /api/david/chat depends on Anthropic. Fallback /api/david/message depends on Gemini.',
        anthropic,
        gemini,
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json({ healthState: 'offline' }, { status: 503 });
  }
}
