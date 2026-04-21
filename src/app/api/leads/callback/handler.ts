import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, type Lead } from '@/lib/db/supabase';
import {
  sendLeadNotification,
  type NotificationPayload,
} from '@/lib/notifications/telegram';
import type { SupabaseClient } from '@supabase/supabase-js';

export type CallbackHandlerDependencies = {
  getSupabaseAdmin: () => SupabaseClient;
  sendLeadNotification: (payload: NotificationPayload) => Promise<boolean>;
};

const defaultCallbackHandlerDependencies: CallbackHandlerDependencies = {
  getSupabaseAdmin,
  sendLeadNotification,
};

export function createCallbackHandler(
  deps: CallbackHandlerDependencies = defaultCallbackHandlerDependencies
) {
  return async function callbackHandler(request: Request | NextRequest) {
    try {
      const body = await request.json();
      const { leadId } = body;

      if (!leadId || typeof leadId !== 'string') {
        return NextResponse.json(
          { success: false, error: 'leadId is required and must be a string.' },
          { status: 400 }
        );
      }

      const supabaseAdmin = deps.getSupabaseAdmin();
      const now = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('leads')
        .update({
          status: 'contacted',
          last_activity: now,
          updated_at: now,
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('[LeadsCallback] DB update error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update lead status.' },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { success: false, error: `Lead ${leadId} not found.` },
          { status: 404 }
        );
      }

      const lead = data as Lead;
      const operatorAlerted = await deps.sendLeadNotification({
        lead,
        conversationSummary:
          lead.conversation_summary ||
          `Callback completed for lead ${lead.id}. Status moved to contacted.`,
        inventoryInterests: lead.interests ?? ['callback_request'],
      });

      if (!operatorAlerted) {
        return NextResponse.json(
          {
            success: true,
            lead,
            operator_alerted: false,
            message:
              'Callback status was saved, but the operator alert failed. Follow-up may be delayed.',
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          lead,
          operator_alerted: true,
          message: 'Callback status was saved and routed to the team.',
        },
        { status: 200 }
      );
    } catch (err) {
      console.error('[LeadsCallback] Unhandled error:', err);
      return NextResponse.json(
        { success: false, error: 'Internal server error.' },
        { status: 500 }
      );
    }
  };
}
