'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import {
  approveAndSendDraft,
  escalateDraft,
  rejectDraft,
  saveDraftEdits,
} from '@/app/admin/david/pending-responses/actions';
import type { DavidPendingResponseView } from '@/lib/david/pendingResponses';

type PendingResponseDetailClientProps = {
  token: string;
  response: DavidPendingResponseView;
};

function storageKey(id: string) {
  return `david-pending-response-draft:${id}`;
}

function prettyTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PendingResponseDetailClient({
  token,
  response,
}: PendingResponseDetailClientProps) {
  const initialDraft = response.final_response ?? response.draft_response;
  const [draft, setDraft] = useState(initialDraft);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState(response.status);
  const lastSavedRef = useRef(initialDraft);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey(response.id));
    if (saved && saved !== draft) {
      setDraft(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (draft === lastSavedRef.current) return;
      window.localStorage.setItem(storageKey(response.id), draft);
      setLastAutosaveAt(new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }));
    }, 3000);

    return () => window.clearInterval(interval);
  }, [draft, response.id]);

  const actionDraft = useMemo(() => draft.trim(), [draft]);

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout((window as Window & { __davidDetailToast?: number }).__davidDetailToast);
    (window as Window & { __davidDetailToast?: number }).__davidDetailToast = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }

  function persistLocalDraft(newDraft: string) {
    lastSavedRef.current = newDraft;
    window.localStorage.setItem(storageKey(response.id), newDraft);
    setLastAutosaveAt(new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveDraftEdits(response.id, actionDraft);
      if (!result) {
        showToast('Save failed');
        return;
      }
      persistLocalDraft(actionDraft);
      setStatusLabel(result.record.status);
      showToast('Edits saved');
    });
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveAndSendDraft(response.id, actionDraft);
      if (!result) {
        showToast('Approve failed');
        return;
      }
      persistLocalDraft(actionDraft);
      setStatusLabel(result.record.status);
      showToast('Approved and queued to send');
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectDraft(response.id, rejectReason.trim() || undefined);
      if (!result) {
        showToast('Reject failed');
        return;
      }
      setStatusLabel(result.record.status);
      showToast('Draft rejected');
    });
  }

  function handleEscalate() {
    startTransition(async () => {
      const result = await escalateDraft(response.id, actionDraft);
      if (!result) {
        showToast('Escalation failed');
        return;
      }
      persistLocalDraft(actionDraft);
      setStatusLabel(result.record.status);
      showToast('Escalation queued');
    });
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/admin/david/pending-responses?token=${encodeURIComponent(token)}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          Back to queue
        </Link>
        {toast ? (
          <div className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300">
            {toast}
          </div>
        ) : null}
      </div>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">
              {response.meta.channel_label} approval
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {response.meta.prospect_name}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {response.meta.prospect_email ?? 'No email on file'}
            </p>
            {response.meta.unit_interest ? (
              <p className="mt-2 text-sm text-slate-300">
                Unit: <span className="text-white">{response.meta.unit_interest}</span>
              </p>
            ) : null}
          </div>

          <div className="grid gap-2 text-right text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Status</p>
              <p className="font-semibold capitalize text-white">{statusLabel.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Confidence</p>
              <p className="font-semibold text-white">
                {response.confidence_score != null ? response.confidence_score.toFixed(2) : 'n/a'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-white">Conversation Thread</h2>
          <div className="mt-4 flex flex-col gap-3">
            {response.meta.thread.length > 0 ? (
              response.meta.thread.map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={`rounded-lg border p-3 ${
                    message.role === 'prospect'
                      ? 'border-white/10 bg-black/20'
                      : message.role === 'david'
                        ? 'border-emerald-400/20 bg-emerald-500/10'
                        : 'border-amber-300/20 bg-amber-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                      {message.role}
                    </p>
                    <p className="text-xs text-slate-400">{prettyTimestamp(message.timestamp)}</p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                    {message.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm text-slate-300">{response.meta.prospect_last_message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Edit Draft</h2>
              <div className="text-right text-xs text-slate-400">
                <p>Autosaves locally every 3 sec</p>
                <p>{lastAutosaveAt ? `Last autosave ${lastAutosaveAt}` : 'No local autosave yet'}</p>
              </div>
            </div>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="mt-4 min-h-[240px] w-full rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white placeholder:text-slate-500"
            />

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSave}
                className="min-h-12 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Save edits
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="min-h-12 rounded-lg bg-[#E8B800] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F0C800]"
              >
                Approve + Send
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-white">Runtime Metadata</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">Template</dt>
                <dd className="mt-2 text-slate-100">{response.template_used ?? 'Not provided'}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">Escalation gate</dt>
                <dd className="mt-2 text-slate-100">
                  {response.meta.escalation_gate_evaluation ?? 'No explicit escalation evaluation provided'}
                </dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <dt className="text-xs uppercase tracking-[0.16em] text-slate-400">Reasoning notes</dt>
                <dd className="mt-2 whitespace-pre-wrap text-slate-100">
                  {response.reasoning ?? 'No runtime notes were attached to this draft.'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-white">Reject or Escalate</h2>
            <div className="mt-4 grid gap-3">
              <input
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Optional reject reason"
                className="min-h-12 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-slate-500"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="min-h-12 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleEscalate}
                  className="min-h-12 rounded-lg border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"
                >
                  Escalate
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
