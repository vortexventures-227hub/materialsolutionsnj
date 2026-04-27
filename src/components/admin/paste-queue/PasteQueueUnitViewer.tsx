'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { markListingViewed } from '@/app/admin/listing-status/actions';
import type { PublishPayload } from '@/lib/marketing/publishAssembly';
import type { ForkliftUnit } from '@/lib/marketing/schemaTransformers';
import {
  formatCurrency,
  getUnitDisplayName,
  LISTING_PLATFORM_LABELS,
  LISTING_PLATFORM_POSTING_URLS,
  LISTING_STATUS_PLATFORMS,
  parseLocation,
  type ListingPlatform,
} from '@/lib/marketing/pasteQueueData';

type PasteQueueUnitViewerProps = {
  token: string;
  unit: ForkliftUnit;
  payloads: Record<ListingPlatform, PublishPayload>;
  generatedAt: string;
  initialPlatform: ListingPlatform;
};

function CopyButton({
  label,
  text,
  onToast,
}: {
  label: string;
  text: string;
  onToast: (message: string) => void;
}) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      onToast(`${label} copied to clipboard`);
    } catch {
      onToast('Clipboard unavailable. Select and copy manually.');
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="min-h-11 rounded-lg bg-[#E8B800] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F0C800] active:translate-y-px"
    >
      Copy {label}
    </button>
  );
}

export function PasteQueueUnitViewer({
  token,
  unit,
  payloads,
  generatedAt,
  initialPlatform,
}: PasteQueueUnitViewerProps) {
  const [activeTarget, setActiveTarget] = useState<ListingPlatform>(initialPlatform);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const location = parseLocation(unit.location);
  const activePayload = payloads[activeTarget];
  const postingUrl = LISTING_PLATFORM_POSTING_URLS[activeTarget];
  const toastId = useMemo(() => `${activeTarget}-${unit.unit_id}`, [activeTarget, unit.unit_id]);

  useEffect(() => {
    startTransition(() => {
      void markListingViewed(unit.unit_id, activeTarget);
    });
  }, [activeTarget, unit.unit_id]);

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout((window as Window & { __pasteQueueToast?: number }).__pasteQueueToast);
    (window as Window & { __pasteQueueToast?: number }).__pasteQueueToast = window.setTimeout(() => {
      setToast(null);
    }, 1800);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/admin/paste-queue?token=${encodeURIComponent(token)}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
        >
          Back to paste queue
        </Link>
        {toast ? (
          <div
            key={toastId}
            className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300"
          >
            {toast}
          </div>
        ) : null}
      </div>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">
          {unit.unit_id}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          {getUnitDisplayName(unit)}
        </h1>
        <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Location:</span> {location.city}, {location.state}
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
      </section>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {LISTING_STATUS_PLATFORMS.map((target) => (
          <button
            key={target}
            type="button"
            onClick={() => setActiveTarget(target)}
            className={[
              'min-h-11 shrink-0 rounded-lg px-4 py-3 text-sm font-semibold transition',
              target === activeTarget
                ? 'bg-[#E8B800] text-black'
                : 'border border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:bg-white/[0.07]',
            ].join(' ')}
          >
            {LISTING_PLATFORM_LABELS[target]}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {LISTING_PLATFORM_LABELS[activeTarget]}
            </h2>
            <p className="mt-1 text-sm text-slate-400">Generated {generatedAt}</p>
          </div>

          {postingUrl.startsWith('http') ? (
            <a
              href={postingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#E8B800] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F0C800]"
            >
              Open posting page →
            </a>
          ) : (
            <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
              {postingUrl}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Title</h3>
            <p className="mt-2 text-base leading-7 text-slate-100">{activePayload.title}</p>
          </div>
          <CopyButton label="Title" text={activePayload.title} onToast={showToast} />
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white">Description</h3>
            {'preheader' in activePayload.platformSpecificFields &&
            typeof activePayload.platformSpecificFields.preheader === 'string' ? (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Preheader
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  {activePayload.platformSpecificFields.preheader}
                </p>
              </div>
            ) : null}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-100 sm:text-base">
              {activePayload.description}
            </p>
          </div>
          <CopyButton
            label="Description"
            text={activePayload.description}
            onToast={showToast}
          />
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-white">Images</h3>
        <div className="mt-3 flex flex-col gap-3">
          {activePayload.images.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="rounded-lg border border-white/10 bg-black/20 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Image {index + 1}
              </p>
              <p className="mt-2 break-all text-sm text-slate-100">{image.src}</p>
              <p className="mt-2 text-sm text-slate-300">Alt: {image.alt}</p>
              <div className="mt-3">
                <CopyButton label={`Image ${index + 1} URL`} text={image.src} onToast={showToast} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-white">Posting details</h3>
          <dl className="mt-3 space-y-2 text-sm text-slate-200">
            <div>
              <dt className="text-slate-500">Price</dt>
              <dd>
                {unit.sold_as_lot_only
                  ? 'Lot sale only. Use the lot listing.'
                  : activePayload.price != null
                    ? formatCurrency(activePayload.price)
                    : 'Call for price'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd>{location.city}, {location.state}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-white">Platform warnings</h3>
          {activePayload.warnings.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-amber-200">
              {activePayload.warnings.map((warning) => (
                <li key={warning} className="rounded-lg border border-amber-300/20 bg-amber-500/10 px-3 py-2">
                  {warning}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-300">No platform warnings.</p>
          )}
        </div>
      </section>
    </div>
  );
}
