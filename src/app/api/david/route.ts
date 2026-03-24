import { NextRequest, NextResponse } from 'next/server';
import { getDavidResponse, ConversationMessage } from '@/lib/david/core';
import { addMemory } from '@/lib/david/memory';
import { calculateLeadStatus } from '@/lib/david/scoring';
import { sendLeadNotification, shouldNotify } from '@/lib/notifications/telegram';
import { getSupabaseAdmin, Lead } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      messages, 
      visitorId, 
      currentPage,
      inventoryViewed = [],
    }: {
      messages: ConversationMessage[];
      visitorId: string;
      currentPage?: string;
      inventoryViewed?: string[];
    } = body;

    if (!messages || !visitorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get David's response
    const response = await getDavidResponse(messages, {
      currentPage,
      inventoryViewed,
      visitorId,
    });

    // Calculate new score
    const totalPoints = response.signals.reduce((sum, s) => sum + s.points, 0);
    
    // Store memory in Zep (async, don't await)
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      addMemory(visitorId, [
        { role: 'user', content: lastUserMessage.content },
        { role: 'assistant', content: response.message },
      ]).catch(console.error);
    }

    // Update or create lead in Supabase (wrapped in try-catch for graceful degradation)
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const hasContactInfo = !!(response.extractedInfo.phone || response.extractedInfo.email);
      
      // Check if lead exists
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
        last_activity: new Date().toISOString(),
        ...(response.extractedInfo.phone && { phone: response.extractedInfo.phone }),
        ...(response.extractedInfo.email && { email: response.extractedInfo.email }),
        ...(response.extractedInfo.name && { name: response.extractedInfo.name }),
        ...(response.extractedInfo.company && { company: response.extractedInfo.company }),
      };

      if (existingLead) {
        await supabaseAdmin
          .from('leads')
          .update(leadData)
          .eq('id', existingLead.id);
      } else {
        leadData.interests = inventoryViewed;
        leadData.created_at = new Date().toISOString();
        await supabaseAdmin
          .from('leads')
          .insert(leadData);
      }

      // Check if we should notify
      const currentLead = existingLead ? { ...existingLead, ...leadData } : leadData;
      const shouldSendNotification = shouldNotify(newScore, hasContactInfo) && 
        !(existingLead?.notified);

      if (shouldSendNotification) {
        // Generate conversation summary from messages
        const conversationSummary = messages
          .slice(-6)
          .map(m => `${m.role === 'user' ? 'Visitor' : 'David'}: ${m.content}`)
          .join('\n');

        sendLeadNotification({
          lead: currentLead as Lead,
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
      // Continue - don't fail the chat for DB issues
    }

    return NextResponse.json({
      message: response.message,
      signals: response.signals,
      newPoints: totalPoints,
    });
  } catch (error) {
    console.error('David API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
