'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import type { MarketingSummary } from '@/lib/marketing/batchMarketingAssets';
import type { ForkliftUnit } from '@/lib/marketing/schemaTransformers';
import {
  formatCurrency,
  getUnitDisplayName,
  parseLocation,
  sentenceCaseUnitType,
} from '@/lib/marketing/pasteQueueData';

type PasteQueueIndexClientProps = {
  token: string;
  units: ForkliftUnit[];
  marketingSummary: MarketingSummary | null;
};

function SummaryPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export function PasteQueueIndexClient({ token, units, marketingSummary }: PasteQueueIndexClientProps) {
  const [batchPreview, setBatchPreview] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrl = useMemo(() => {
    const params = new URLSearchParams({
      slugs: units.map((unit) => unit.canonical_slug || unit.unit_id).join(','),
      format: 'plain',
      platforms: 'facebook_marketplace,craigslist,ebay',
      eligible_only: 'true',
    });

    return `/api/inventory/marketing-assets?${params.toString()}`;
  }, [units]);

  async function handlePreviewAllCopy() {
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch(previewUrl);
      if (!response.ok) {
        throw new Error(`preview request failed (${response.status})`);
      }

      setBatchPreview(await response.text());
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'preview request failed');
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">
          Chris Mobile Queue
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          Paste Queue
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Tap a unit, pick a platform tab, copy the title or description, and jump straight to the posting flow.
        </p>
      </section>

      <section className="rounded-lg border border-[#E8B800]/20 bg-[#E8B800]/[0.08] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">
              Marketing pipeline
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Live batch copy health</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              Pull the current batch copy in one shot and sanity-check how many units are publish-ready before Chris drills into per-unit tabs.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handlePreviewAllCopy}
              disabled={previewLoading}
              className="min-h-11 rounded-lg bg-[#E8B800] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F0C800] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {previewLoading ? 'Loading preview…' : 'Preview All Copy'}
            </button>
          </div>
        </div>

        {marketingSummary ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryPill label="Publish-ready" value={marketingSummary.eligible} tone="text-emerald-300" />
            <SummaryPill label="On hold" value={marketingSummary.on_hold} tone="text-red-300" />
            <SummaryPill label="Lot-only" value={marketingSummary.lot_only} tone="text-slate-200" />
            <SummaryPill label="Total" value={marketingSummary.total} tone="text-white" />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-300">
            Live summary unavailable from this render, but the batch copy preview remains available.
          </p>
        )}

        {previewError ? <p className="mt-3 text-sm text-red-300">Preview failed: {previewError}</p> : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => {
          const location = parseLocation(unit.location);

          return (
            <Link
              key={unit.unit_id}
              href={`/admin/paste-queue/${encodeURIComponent(unit.unit_id)}?token=${encodeURIComponent(token)}`}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition duration-200 hover:border-[#E8B800]/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B800]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{getUnitDisplayName(unit)}</p>
                  <p className="mt-1 text-sm text-slate-300">{unit.unit_id}</p>
                </div>
                <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs font-medium text-slate-200">
                  5 tabs
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>
                  <span className="text-slate-500">Type:</span>{' '}
                  {sentenceCaseUnitType(unit.unit_type)}
                </p>
                <p>
                  <span className="text-slate-500">Location:</span>{' '}
                  {location.city}, {location.state}
                </p>
                <p>
                  <span className="text-slate-500">Price:</span>{' '}
                  {unit.sold_as_lot_only
                    ? 'Sold as lot only'
                    : unit.asking_price_usd != null
                      ? formatCurrency(unit.asking_price_usd)
                      : 'Call for price'}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-[#E8B800]/10 px-2 py-1 text-xs font-medium text-[#F0C800]">
                  {unit.sold_as_lot_only ? 'Lot-only' : 'Individual'}
                </span>
                {unit.status === 'hold' ? (
                  <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-300">
                    HOLD
                  </span>
                ) : (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
                    {unit.status ?? 'available'}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {batchPreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">Batch preview</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Canonical copy across the queue</h2>
              </div>
              <button
                type="button"
                onClick={() => setBatchPreview(null)}
                className="min-h-11 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 sm:px-5">
              <pre className="whitespace-pre-wrap break-words rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-100">
                {batchPreview}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
