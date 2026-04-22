'use server';

import { revalidatePath } from 'next/cache';

import { applyPendingResponseDecision } from '@/lib/david/pendingResponses';

const APPROVAL_ACTOR = 'admin_token_holder';

function revalidateDavidApprovalSurfaces(id?: string) {
  revalidatePath('/admin/david/pending-responses');
  if (id) {
    revalidatePath(`/admin/david/pending-responses/${id}`);
  }
}

export async function saveDraftEdits(id: string, editedDraft: string) {
  const result = await applyPendingResponseDecision({
    id,
    action: 'save_edit',
    actor: APPROVAL_ACTOR,
    editedDraft,
  });

  revalidateDavidApprovalSurfaces(id);
  return result;
}

export async function approveAndSendDraft(id: string, editedDraft?: string) {
  const result = await applyPendingResponseDecision({
    id,
    action: 'approve',
    actor: APPROVAL_ACTOR,
    editedDraft,
  });

  revalidateDavidApprovalSurfaces(id);
  return result;
}

export async function rejectDraft(id: string, reason?: string) {
  const result = await applyPendingResponseDecision({
    id,
    action: 'reject',
    actor: APPROVAL_ACTOR,
    reason,
  });

  revalidateDavidApprovalSurfaces(id);
  return result;
}

export async function escalateDraft(id: string, editedDraft?: string) {
  const result = await applyPendingResponseDecision({
    id,
    action: 'escalate',
    actor: APPROVAL_ACTOR,
    editedDraft,
  });

  revalidateDavidApprovalSurfaces(id);
  return result;
}
