/**
 * Leads API — submits leads to Sales Machine backend.
 * Handles contact form submissions and David avatar lead captures.
 */

import { backend } from './backend';

export interface LeadSubmission {
  visitor_id?: string;
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  interests?: string[];
  conversation_summary?: string;
  message?: string;
  score?: number;
  source: 'contact_form' | 'david_avatar' | 'callback_request';
  timeline?: string;
  budget_confirmed?: boolean;
  use_case?: string;
}

export interface LeadResponse {
  id: string;
  status: string;
  message?: string;
}

export async function submitLead(lead: LeadSubmission): Promise<LeadResponse> {
  try {
    return await backend.post<LeadResponse>('/api/leads', lead);
  } catch (error) {
    console.error('Failed to submit lead to backend:', error);
    throw error;
  }
}

export interface CallbackRequest {
  name: string;
  phone: string;
  preferred_time?: 'morning' | 'afternoon' | 'evening';
  topic: string;
}

export async function scheduleCallback(request: CallbackRequest): Promise<LeadResponse> {
  try {
    return await backend.post<LeadResponse>('/api/leads/callback', {
      ...request,
      source: 'callback_request',
    });
  } catch (error) {
    console.error('Failed to schedule callback:', error);
    throw error;
  }
}
