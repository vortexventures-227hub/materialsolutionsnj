import { createCallbackHandler } from './handler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leads/callback
 *
 * Marks a lead as "contacted" — called by an operator after they have
 * followed up by phone. This is the canonical-row metadata durability
 * path: the operator-visible receipt that a callback was completed.
 *
 * Request body: { leadId: string }
 * Response: { success: true, lead: Lead, operator_alerted: boolean } | { success: false, error: string }
 */
export const POST = createCallbackHandler();
