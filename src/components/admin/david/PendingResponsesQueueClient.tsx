'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';

import {
  approveAndSendDraft,
  escalateDraft,
  rejectDraft,
} from '@/app/admin/david/pending-responses/actions';
import type { DavidPendingResponseView } from '@/lib/david/pendingResponses';

type PendingResponsesQueueClientProps = {
  token: string;
  responses: DavidPendingResponseView[];
};

function relativeAge(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));

  if (diffMin < 60) return `${diffMin}m old`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h old`;
  return `${Math.round(diffHours / 24)}d old`;
}

function priorityBadge(priority: DavidPendingResponseView['meta']['priority']) {
  if (priority === 'urgent') {
    return 'border-rose-400/30 bg-rose-500/15 text-rose-200';
  }
  if (priority === 'high') {
    return 'border-amber-300/30 bg-amber-500/15 text-amber-100';
  }
  return 'border-white/10 bg-white/[0.04] text-slate-200';
}

function confidenceTone(confidence: number | null) {
  if (confidence == null) return 'text-slate-300';
  if (confidence >= 0.85) return 'text-emerald-300';
  if (confidence >= 0.7) return 'text-amber-200';
  return 'text-rose-200';
}

export function PendingResponsesQueueClient({
  token,
  responses,
}: PendingResponsesQueueClientProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const counts = useMemo(() => {
    return responses.reduce(
      (acc, response) => {
        acc.total += 1;
        acc[response.meta.priority] += 1;
        return acc;
      },
      { total: 0, urgent: 0, high: 0, normal: 0 }
    );
  }, [responses]);

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout((window as Window & { __davidQueueToast?: number }).__davidQueueToast);
    (window as Window & { __davidQueueToast?: number }).__davidQueueToast = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }

  function handleApprove(id: string, currentDraft?: string | null) {
    setBusyId(id);
    startTransition(async () => {
      const result = await approveAndSendDraft(id, currentDraft ?? undefined);
      setBusyId(null);
      showToast(result ? 'Approved for send queue' : 'Approval did not complete');
    });
  }

  function handleReject(id: string) {
    setBusyId(id);
    startTransition(async () => {
      const result = await rejectDraft(id);
      setBusyId(null);
      showToast(result ? 'Draft rejected' : 'Rejection did not complete');
    });
  }

  function handleEscalate(id: string, currentDraft?: string | null) {
    setBusyId(id);
    startTransition(async () => {
      const result = await escalateDraft(id, currentDraft ?? undefined);
      setBusyId(null);
      showToast(result ? 'Escalation queued for review' : 'Escalation did not complete');
    });
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">
              David Draft Review
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Pending David Drafts
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Review every David draft before it leaves the queue. Urgent escalation candidates stay at the top.
            </p>
          </div>
          {toast ? (
            <div className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300">
              {toast}
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Open</p>
            <p className="mt-2 text-2xl font-semibold text-white">{counts.total}</p>
          </div>
          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-rose-200">Urgent</p>
            <p className="mt-2 text-2xl font-semibold text-white">{counts.urgent}</p>
          </div>
          <div className="rounded-lg border border-amber-300/20 bg-amber-500/10 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100">High</p>
            <p className="mt-2 text-2xl font-semibold text-white">{counts.high}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Normal</p>
            <p className="mt-2 text-2xl font-semibold text-white">{counts.normal}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        {responses.map((response) => (
          <article
            key={response.id}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${priorityBadge(response.meta.priority)}`}
                    >
                      {response.meta.priority}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                      {response.meta.channel_label}
                    </span>
                    <span className="text-xs text-slate-400">{relativeAge(response.created_at)}</span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold text-white">
                    {response.meta.prospect_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {response.meta.prospect_email ?? 'No customer email on file'}
                  </p>
                  {response.meta.unit_interest ? (
                    <p className="mt-2 text-sm text-slate-300">
                      Unit: <span className="text-white">{response.meta.unit_interest}</span>
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Confidence</p>
                  <p className={`mt-1 text-lg font-semibold ${confidenceTone(response.confidence_score)}`}>
                    {response.confidence_score != null
                      ? response.confidence_score.toFixed(2)
                      : 'n/a'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Customer Message
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-100">
                    {response.meta.prospect_last_message}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    David Draft
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-100">
                    {response.final_response ?? response.draft_response}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleApprove(response.id, response.final_response)}
                  disabled={busyId === response.id}
                  className="min-h-12 rounded-lg bg-[#E8B800] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F0C800] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve for send
                </button>
                <Link
                  href={`/admin/david/pending-responses/${encodeURIComponent(response.id)}?token=${encodeURIComponent(token)}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  Review draft
                </Link>
                <button
                  type="button"
                  onClick={() => handleReject(response.id)}
                  disabled={busyId === response.id}
                  className="min-h-12 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reject draft
                </button>
                <button
                  type="button"
                  onClick={() => handleEscalate(response.id, response.final_response)}
                  disabled={busyId === response.id}
                  className="min-h-12 rounded-lg border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Escalate to team
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
