import { NextRequest, NextResponse } from 'next/server';
import { generateSimliSessionToken, generateIceServers } from 'simli-client';
import { createServerSession, getClientIP, rateLimitResponse } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const SIMLI_API_KEY = process.env.SIMLI_API_KEY!;
const SIMLI_FACE_ID = process.env.SIMLI_FACE_ID || '80d84fc6-e2e3-4a09-8259-30ecede1a41f';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const body = await request.json().catch(() => ({}));
    const visitorId = body.visitorId || ip;

    // Rate limit: session creation checks (Layers 2, 3, 5)
    const sessionCheck = await createServerSession(visitorId, ip);
    if (!sessionCheck.allowed) {
      return rateLimitResponse(sessionCheck.reason!);
    }

    if (!SIMLI_API_KEY) {
      return NextResponse.json(
        { error: 'Simli API key not configured' },
        { status: 500 }
      );
    }

    // Generate session token from Simli
    const { session_token } = await generateSimliSessionToken({
      apiKey: SIMLI_API_KEY,
      config: {
        faceId: SIMLI_FACE_ID,
        handleSilence: true,
        maxSessionLength: 600,  // 10 minutes
        maxIdleTime: 120,       // 2 minutes idle
      },
    });

    // Generate ICE servers for WebRTC
    const iceServers = await generateIceServers(SIMLI_API_KEY);

    return NextResponse.json({
      sessionToken: session_token,
      sessionId: sessionCheck.sessionId,
      iceServers,
      expiresIn: 600000, // 10 min in ms
    });
  } catch (error) {
    console.error('Simli session error:', error);
    return NextResponse.json(
      { error: 'Failed to create avatar session' },
      { status: 500 }
    );
  }
}
