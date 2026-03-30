import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkTTSRate, getClientIP, rateLimitResponse } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const TTS_VOICE = (process.env.OPENAI_TTS_VOICE || 'onyx') as 'onyx' | 'alloy' | 'echo' | 'fable' | 'nova' | 'shimmer';
const TTS_MODEL = (process.env.OPENAI_TTS_MODEL || 'tts-1-hd') as 'tts-1' | 'tts-1-hd';

// Lazy init OpenAI client to prevent build-time errors
let openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Max characters per TTS request to control cost
const MAX_TTS_CHARS = 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing text field' },
        { status: 400 }
      );
    }

    // Truncate to prevent abuse
    const truncatedText = text.slice(0, MAX_TTS_CHARS);

    // Rate limit: TTS checks (Layer 3 + Layer 5)
    const ttsCheck = await checkTTSRate(ip, truncatedText.length);
    if (!ttsCheck.allowed) {
      return rateLimitResponse(ttsCheck.reason!);
    }

    // Generate speech with OpenAI TTS - onyx voice (professional, warm male)
    const client = getOpenAIClient();
    const mp3Response = await client.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: truncatedText,
      response_format: 'pcm',  // Raw PCM for Simli lip-sync
      speed: 1.0,
    });

    // Get audio as ArrayBuffer
    const audioBuffer = await mp3Response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/pcm',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
