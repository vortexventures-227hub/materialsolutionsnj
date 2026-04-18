import { NextRequest, NextResponse } from 'next/server';
import { getDavidResponse, ConversationMessage } from '@/lib/david/core';
import { addMemory } from '@/lib/david/memory';
import { calculateLeadStatus } from '@/lib/david/scoring';
import { sendLeadNotification, shouldNotify } from '@/lib/notifications/telegram';
import { getSupabaseAdmin, Lead } from '@/lib/db/supabase';
import { checkMessageRate, getClientIP, rateLimitResponse } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// Max input length (Layer 4: abuse protection)
const MAX_INPUT_LENGTH = 500;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const body = await request.json();
    const {
      messages,
      visitorId,
      sessionId,
      currentPage,
      inventoryViewed = [],
    }: {
      messages: ConversationMessage[];
      visitorId: string;
      sessionId?: string;
      currentPage?: string;
      inventoryViewed?: string[];
    } = body;

    if (!messages || !visitorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the latest user message for abuse checking
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const messageText = lastUserMessage?.content || '';

    // Rate limit: message checks (Layers 1-5)
    if (sessionId) {
      const rateCheck = await checkMessageRate(sessionId, visitorId, ip, messageText);
      if (!rateCheck.allowed) {
        return rateLimitResponse(rateCheck.reason!);
      }
    }

    // Truncate long messages (Layer 4)
    if (lastUserMessage && lastUserMessage.content.length > MAX_INPUT_LENGTH) {
      lastUserMessage.content = lastUserMessage.content.slice(0, MAX_INPUT_LENGTH);
    }

    // Get David's response
    const response = await getDavidResponse(messages, {
      currentPage,
      inventoryViewed,
      visitorId,
    });

    const totalPoints = response.signals.reduce((sum, s) => sum + s.points, 0);

    // Store memory (async, don't block)
    if (lastUserMessage) {
      addMemory(visitorId, [
        { role: 'user', content: lastUserMessage.content },
        { role: 'assistant', content: response.message },
      ]).catch(console.error);
    }

    // Update lead in database
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const hasContactInfo = !!(response.extractedInfo.phone || response.extractedInfo.email);

      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('visitor_id', visitorId)
        .single();

      const newScore = (existingLead?.score || 0) + totalPoints;
      const status = calculateLeadStatus(newScore);

      const leadData: Partial<Lead> = {
        visitor_id: visitorId,
        score: newScore,
        status,
        source: 'david_chat',
        page_origin: currentPage ?? null,
        cta_origin: 'david_chat',
        listing_id: inventoryViewed.length > 0 ? inventoryViewed[inventoryViewed.length - 1] : null,
        last_activity: new Date().toISOString(),
        ...(response.extractedInfo.phone && { phone: response.extractedInfo.phone }),
        ...(response.extractedInfo.email && { email: response.extractedInfo.email }),
        ...(response.extractedInfo.name && { name: response.extractedInfo.name }),
        ...(response.extractedInfo.company && { company: response.extractedInfo.company }),
      };

      if (existingLead) {
        await supabaseAdmin.from('leads').update(leadData).eq('id', existingLead.id);
      } else {
        leadData.interests = inventoryViewed;
        leadData.created_at = new Date().toISOString();
        await supabaseAdmin.from('leads').insert(leadData);
      }

      // Notify on qualified leads
      const shouldSendNotification = shouldNotify(newScore, hasContactInfo) &&
        !(existingLead?.notified);

      if (shouldSendNotification) {
        const conversationSummary = messages
          .slice(-6)
          .map(m => `${m.role === 'user' ? 'Visitor' : 'David'}: ${m.content}`)
          .join('\n');

        sendLeadNotification({
          lead: { ...existingLead, ...leadData } as Lead,
          conversationSummary,
          inventoryInterests: inventoryViewed,
        }).then(sent => {
          if (sent) {
            supabaseAdmin
              .from('leads')
              .update({ notified: true })
              .eq('visitor_id', visitorId)
              .then(() => {});
          }
        }).catch(console.error);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return NextResponse.json({
      message: response.message,
      signals: response.signals,
      newPoints: totalPoints,
    });
  } catch (error) {
    console.error('David message API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
