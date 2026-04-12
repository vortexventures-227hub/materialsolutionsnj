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

// OpenAI TTS PCM output is always 24000 Hz; Simli expects 16000 Hz.
// Downsample using linear interpolation to fix slow/deep "Jabba the Hutt" audio.
function downsamplePCM16(input: ArrayBuffer, fromRate: number, toRate: number): ArrayBuffer {
  const src = new Int16Array(input);
  const ratio = fromRate / toRate;
  const outLen = Math.floor(src.length / ratio);
  const out = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, src.length - 1);
    const frac = pos - lo;
    out[i] = Math.round(src[lo] * (1 - frac) + src[hi] * frac);
  }
  return out.buffer;
}

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

    // Get audio as ArrayBuffer — OpenAI PCM is 24000 Hz, Simli expects 16000 Hz
    const audioBuffer = await mp3Response.arrayBuffer();
    const resampledBuffer = downsamplePCM16(audioBuffer, 24000, 16000);

    return new Response(resampledBuffer, {
      headers: {
        'Content-Type': 'audio/pcm',
        'Content-Length': resampledBuffer.byteLength.toString(),
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
