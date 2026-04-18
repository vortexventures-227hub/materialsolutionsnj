import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// ─── Redis client (lazy init, graceful fallback) ───

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// ─── Rate limiters ───

// Layer 3: IP rate limiting
const ipMessageLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 messages/min
    prefix: 'rl:msg:ip',
  });
};

const ipSessionLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 sessions/hour/IP
    prefix: 'rl:sess:ip:h',
  });
};

const ipSessionDailyLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, '24 h'), // 10 sessions/day/IP
    prefix: 'rl:sess:ip:d',
  });
};

// Layer 2: Per-visitor limits
const visitorSessionLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(3, '24 h'), // 3 sessions/day/visitor
    prefix: 'rl:sess:vis',
  });
};

const visitorMessageDailyLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(100, '24 h'), // 100 messages/day/visitor
    prefix: 'rl:msg:vis:d',
  });
};

// TTS rate limiter (cost control)
const ttsLimiter = () => {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 TTS requests/min
    prefix: 'rl:tts',
  });
};

// ─── Global daily counters (Layer 5) ───

const DAILY_LIMITS = {
  maxSessions: Number(process.env.MAX_DAILY_SESSIONS) || 100,
  maxLLMRequests: Number(process.env.MAX_DAILY_LLM_REQUESTS) || 5000,
  maxTTSChars: Number(process.env.MAX_DAILY_TTS_CHARS) || 50000,
};

function getDailyKey(type: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `daily:${type}:${date}`;
}

async function incrementDaily(type: string, amount: number = 1): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  const key = getDailyKey(type);
  const val = await r.incrby(key, amount);
  // Set expiry to 48h so keys auto-clean
  await r.expire(key, 172800);
  return val;
}

async function getDailyCount(type: string): Promise<number> {
  const r = getRedis();
  if (!r) return 0;
  const val = await r.get<number>(getDailyKey(type));
  return val || 0;
}

// ─── Session tracking (Layer 1: server-side time enforcement) ───

export async function createServerSession(visitorId: string, ip: string): Promise<{
  allowed: boolean;
  reason?: string;
  sessionId?: string;
}> {
  const r = getRedis();
  if (!r) return { allowed: true, sessionId: `s_${Date.now()}` }; // No Redis = allow

  // Check global daily session cap
  const dailySessions = await getDailyCount('sessions');
  if (dailySessions >= DAILY_LIMITS.maxSessions) {
    return { allowed: false, reason: 'daily_cap' };
  }

  // Check IP session limits
  const ipHourly = ipSessionLimiter();
  if (ipHourly) {
    const { success } = await ipHourly.limit(ip);
    if (!success) return { allowed: false, reason: 'ip_rate_limit' };
  }

  const ipDaily = ipSessionDailyLimiter();
  if (ipDaily) {
    const { success } = await ipDaily.limit(ip);
    if (!success) return { allowed: false, reason: 'ip_daily_limit' };
  }

  // Check visitor session limits
  const visitorLim = visitorSessionLimiter();
  if (visitorLim) {
    const { success } = await visitorLim.limit(visitorId);
    if (!success) return { allowed: false, reason: 'visitor_session_limit' };
  }

  // Check cooldown (5 min between sessions)
  const cooldownKey = `cooldown:${visitorId}`;
  const inCooldown = await r.get(cooldownKey);
  if (inCooldown) {
    return { allowed: false, reason: 'cooldown' };
  }

  // All checks passed — create session
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sessionKey = `session:${sessionId}`;

  await r.hmset(sessionKey, {
    visitorId,
    ip,
    startedAt: Date.now(),
    messageCount: 0,
    ttsChars: 0,
  });
  await r.expire(sessionKey, 660); // 11 min TTL (10 min + buffer)

  // Set cooldown for 5 min
  await r.set(cooldownKey, '1', { ex: 300 });

  // Increment daily counter
  await incrementDaily('sessions');

  return { allowed: true, sessionId };
}

// ─── Message rate check ───

export async function checkMessageRate(
  sessionId: string,
  visitorId: string,
  ip: string,
  messageText: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const r = getRedis();
  if (!r) return { allowed: true };

  // Layer 1: Check session is still valid (time limit)
  const sessionKey = `session:${sessionId}`;
  const session = await r.hgetall(sessionKey);
  if (!session || !session.startedAt) {
    return { allowed: false, reason: 'session_expired' };
  }

  const elapsed = Date.now() - Number(session.startedAt);
  if (elapsed > 600_000) { // 10 min
    return { allowed: false, reason: 'session_timeout' };
  }

  // Layer 1: Check message count
  const msgCount = Number(session.messageCount) || 0;
  if (msgCount >= 50) {
    return { allowed: false, reason: 'message_limit' };
  }

  // Layer 3: IP message rate
  const ipLim = ipMessageLimiter();
  if (ipLim) {
    const { success } = await ipLim.limit(ip);
    if (!success) return { allowed: false, reason: 'ip_message_rate' };
  }

  // Layer 2: Visitor daily message limit
  const visLim = visitorMessageDailyLimiter();
  if (visLim) {
    const { success } = await visLim.limit(visitorId);
    if (!success) return { allowed: false, reason: 'visitor_daily_messages' };
  }

  // Layer 4: Abuse pattern detection
  const abuseCheck = await checkAbusePatterns(sessionId, visitorId, messageText, r);
  if (!abuseCheck.allowed) return abuseCheck;

  // Layer 5: Global daily LLM request cap
  const dailyLLM = await incrementDaily('llm_requests');
  if (dailyLLM > DAILY_LIMITS.maxLLMRequests) {
    return { allowed: false, reason: 'daily_cap' };
  }

  // Increment message count
  await r.hincrby(sessionKey, 'messageCount', 1);

  return { allowed: true };
}

// ─── TTS rate check ───

export async function checkTTSRate(
  ip: string,
  charCount: number,
): Promise<{ allowed: boolean; reason?: string }> {
  const r = getRedis();
  if (!r) return { allowed: true };

  // TTS rate limiter
  const lim = ttsLimiter();
  if (lim) {
    const { success } = await lim.limit(ip);
    if (!success) return { allowed: false, reason: 'tts_rate_limit' };
  }

  // Global daily TTS char cap
  const dailyChars = await incrementDaily('tts_chars', charCount);
  if (dailyChars > DAILY_LIMITS.maxTTSChars) {
    return { allowed: false, reason: 'daily_cap' };
  }

  return { allowed: true };
}

// ─── Layer 4: Abuse pattern detection ───

async function checkAbusePatterns(
  sessionId: string,
  visitorId: string,
  message: string,
  r: Redis,
): Promise<{ allowed: boolean; reason?: string }> {
  // Long input → truncation handled by caller, but flag it
  if (message.length > 500) {
    // We'll truncate in the route, but track strikes
    const strikeKey = `strikes:long:${visitorId}`;
    const strikes = await r.incr(strikeKey);
    await r.expire(strikeKey, 3600);
    if (strikes > 5) return { allowed: false, reason: 'abuse_long_input' };
  }

  // Rapid-fire detection: track timestamps
  const rapidKey = `rapid:${sessionId}`;
  const now = Date.now();
  await r.lpush(rapidKey, now);
  await r.ltrim(rapidKey, 0, 9); // Keep last 10
  await r.expire(rapidKey, 60);

  const timestamps = await r.lrange<number>(rapidKey, 0, 4);
  if (timestamps.length >= 5) {
    const oldest = timestamps[timestamps.length - 1];
    if (now - oldest < 10_000) { // 5 messages in 10 seconds
      return { allowed: false, reason: 'rapid_fire' };
    }
  }

  // Repeated messages detection
  const repeatKey = `repeat:${sessionId}`;
  const lastMsg = await r.get<string>(repeatKey);
  if (lastMsg === message) {
    const repeatCount = await r.incr(`repeat:count:${sessionId}`);
    await r.expire(`repeat:count:${sessionId}`, 600);
    if (repeatCount >= 3) return { allowed: false, reason: 'repeated_messages' };
  } else {
    await r.set(repeatKey, message, { ex: 600 });
    await r.set(`repeat:count:${sessionId}`, 0, { ex: 600 });
  }

  // Gibberish detection (very basic: high ratio of non-alpha chars)
  const alphaRatio = (message.match(/[a-zA-Z\s]/g) || []).length / Math.max(message.length, 1);
  if (message.length > 20 && alphaRatio < 0.4) {
    const gibKey = `gib:${sessionId}`;
    const gibStrikes = await r.incr(gibKey);
    await r.expire(gibKey, 600);
    if (gibStrikes >= 3) return { allowed: false, reason: 'gibberish' };
  }

  return { allowed: true };
}

// ─── Helpers ───

export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export const RATE_LIMIT_MESSAGES: Record<string, { message: string; status: number }> = {
    daily_cap: {
      message: "David is offline for the day. Please call (973) 500-1010.",
      status: 503,
    },
    ip_rate_limit: {
      message: "Too many requests. Please wait a moment.",
      status: 429,
    },
    ip_daily_limit: {
      message: "Daily session limit reached. Call (973) 500-1010.",
      status: 429,
    },
    visitor_session_limit: {
      message: "You've used all your sessions today. Please call (973) 500-1010 or email info@materialsolutionsnj.com for direct help.",
      status: 429,
    },
    cooldown: {
      message: "Please wait a few minutes before starting a new session.",
      status: 429,
    },
    session_expired: {
      message: "Session expired. Please start a new conversation.",
      status: 410,
    },
    session_timeout: {
      message: "Session time limit reached. Please call (973) 500-1010 or email info@materialsolutionsnj.com if you need direct help.",
      status: 410,
    },
    message_limit: {
      message: "Message limit reached for this session.",
      status: 429,
    },
    ip_message_rate: {
      message: "Slow down! Give me a moment to respond.",
      status: 429,
    },
    visitor_daily_messages: {
      message: "Daily message limit reached. Call (973) 500-1010.",
      status: 429,
    },
    rapid_fire: {
      message: "Whoa, slow down! Let me catch up.",
      status: 429,
    },
    repeated_messages: {
      message: "Having technical difficulties. Call (973) 500-1010.",
      status: 429,
    },
    gibberish: {
      message: "Having technical difficulties. Call (973) 500-1010.",
      status: 429,
    },
    abuse_long_input: {
      message: "Having technical difficulties. Call (973) 500-1010.",
      status: 429,
    },
    tts_rate_limit: {
      message: "Voice is temporarily unavailable.",
      status: 429,
    },
  };

export function rateLimitResponse(reason: string): NextResponse {
  const messages = RATE_LIMIT_MESSAGES;

  const info = messages[reason] || { message: "Please try again later.", status: 429 };

  return NextResponse.json(
    { error: info.message, reason },
    { status: info.status }
  );
}
