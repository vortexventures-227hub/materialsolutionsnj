'use client';

import Link from 'next/link';
import { Fragment, useMemo, useState, useTransition } from 'react';

import {
  setListingLiveUrl,
  setListingPosted,
} from '@/app/admin/listing-status/actions';
import type { ListingStatusRecord } from '@/lib/marketing/listingStatusStore';
import type { ForkliftUnit } from '@/lib/marketing/schemaTransformers';
import {
  formatCurrency,
  getUnitDisplayName,
  LISTING_PLATFORM_LABELS,
  LISTING_PLATFORM_POSTING_URLS,
  LISTING_STATUS_PLATFORMS,
  parseLocation,
  sentenceCaseUnitType,
  type ListingPlatform,
} from '@/lib/marketing/pasteQueueData';

type DashboardClientProps = {
  token: string;
  units: ForkliftUnit[];
  initialStatuses: ListingStatusRecord[];
};

type ListingStatusValue = 'not_started' | 'viewed' | 'posted';

type StatusMap = Record<string, ListingStatusRecord>;

function makeKey(unitId: string, platform: ListingPlatform) {
  return `${unitId}::${platform}`;
}

function groupUnitsByLocation(units: ForkliftUnit[]) {
  return {
    baltimore: units.filter((unit) => parseLocation(unit.location).state === 'MD'),
    hamilton: units.filter((unit) => parseLocation(unit.location).state === 'NJ'),
  };
}

function statusIcon(status: ListingStatusValue) {
  if (status === 'posted') return '✅';
  if (status === 'viewed') return '🟡';
  return '⬜';
}

function statusClasses(status: ListingStatusValue) {
  if (status === 'posted') {
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200';
  }
  if (status === 'viewed') {
    return 'border-amber-300/40 bg-amber-500/15 text-amber-100';
  }
  return 'border-white/10 bg-white/[0.03] text-slate-200';
}

export function ListingStatusDashboardClient({
  token,
  units,
  initialStatuses,
}: DashboardClientProps) {
  const [statusMap, setStatusMap] = useState<StatusMap>(() =>
    Object.fromEntries(
      initialStatuses.map((record) => [makeKey(record.unit_id, record.platform), record])
    )
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(units[0]?.unit_id ?? null);
  const [selectedPlatform, setSelectedPlatform] = useState<ListingPlatform>('facebook_marketplace');
  const [liveUrlDrafts, setLiveUrlDrafts] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const groupedUnits = useMemo(() => groupUnitsByLocation(units), [units]);
  const totalCells = units.length * LISTING_STATUS_PLATFORMS.length;
  const postedCount = Object.values(statusMap).filter((record) => record.status === 'posted').length;
  const viewedCount = Object.values(statusMap).filter((record) => record.status === 'viewed').length;
  const selectedUnit = units.find((unit) => unit.unit_id === selectedUnitId) ?? null;

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout((window as Window & { __listingToast?: number }).__listingToast);
    (window as Window & { __listingToast?: number }).__listingToast = window.setTimeout(() => {
      setToast(null);
    }, 1800);
  }

  function getRecord(unitId: string, platform: ListingPlatform): ListingStatusRecord {
    return (
      statusMap[makeKey(unitId, platform)] ?? {
        unit_id: unitId,
        platform,
        status: 'not_started',
        live_url: null,
        posted_at: null,
        notes: null,
        updated_at: null,
      }
    );
  }

  function updateRecord(record: ListingStatusRecord | null) {
    if (!record) return;
    setStatusMap((current) => ({
      ...current,
      [makeKey(record.unit_id, record.platform)]: record,
    }));
  }

  function togglePosted(unitId: string, platform: ListingPlatform) {
    const current = getRecord(unitId, platform);
    const nextPosted = current.status !== 'posted';

    startTransition(async () => {
      const result = await setListingPosted(unitId, platform, nextPosted);
      updateRecord(result as ListingStatusRecord | null);
      showToast(nextPosted ? 'Marked posted' : 'Marked unposted');
    });
  }

  function saveLiveUrl(unitId: string, platform: ListingPlatform) {
    const key = makeKey(unitId, platform);
    const draft = liveUrlDrafts[key] ?? getRecord(unitId, platform).live_url ?? '';

    startTransition(async () => {
      const result = await setListingLiveUrl(unitId, platform, draft);
      updateRecord(result as ListingStatusRecord | null);
      showToast(draft.trim() ? 'Live URL saved' : 'Live URL cleared');
    });
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-6 sm:px-6">
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">
              Chris Status Board
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Listing Status Dashboard
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Track what’s posted, what’s been viewed, and where the live URLs already exist.
            </p>
          </div>
          {toast ? (
            <div className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300">
              {toast}
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>{postedCount} of {totalCells} cells posted</span>
            <span>{viewedCount} viewed</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#E8B800] transition-all"
              style={{ width: `${(postedCount / totalCells) * 100}%` }}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/20">
                <th className="sticky left-0 z-10 bg-black/40 px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Unit
                </th>
                {LISTING_STATUS_PLATFORMS.map((platform) => (
                  <th key={platform} className="px-2 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedPlatform(platform)}
                      className="min-h-11 rounded-lg px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                    >
                      {LISTING_PLATFORM_LABELS[platform]}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                ['Baltimore, MD', groupedUnits.baltimore],
                ['Hamilton, NJ', groupedUnits.hamilton],
              ] as Array<[string, ForkliftUnit[]]>).map(([label, locationUnits]) => (
                <Fragment key={label}>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <td
                      colSpan={LISTING_STATUS_PLATFORMS.length + 1}
                      className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]"
                    >
                      {label}
                    </td>
                  </tr>
                  {locationUnits.map((unit) => (
                    <tr key={unit.unit_id} className="border-b border-white/5">
                      <td className="sticky left-0 z-10 bg-[#0A0A0F] px-3 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedUnitId(unit.unit_id)}
                          className="w-full rounded-lg text-left transition hover:bg-white/[0.04]"
                        >
                          <p className="text-sm font-semibold text-white">{getUnitDisplayName(unit)}</p>
                          <p className="mt-1 text-xs text-slate-400">{unit.unit_id}</p>
                        </button>
                      </td>
                      {LISTING_STATUS_PLATFORMS.map((platform) => {
                        const record = getRecord(unit.unit_id, platform);
                        return (
                          <td key={platform} className="px-2 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => togglePosted(unit.unit_id, platform)}
                              className={`min-h-14 min-w-14 rounded-lg border text-lg transition ${statusClasses(record.status)}`}
                              title={`${LISTING_PLATFORM_LABELS[platform]} — ${record.status}`}
                            >
                              <span>{statusIcon(record.status)}</span>
                              {record.live_url ? (
                                <span className="mt-1 block text-[10px] text-slate-300">🔗</span>
                              ) : null}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUnit ? (
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">
                Unit Drill-Down
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {getUnitDisplayName(selectedUnit)}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {selectedUnit.unit_id} · {sentenceCaseUnitType(selectedUnit.unit_type)} ·{' '}
                {parseLocation(selectedUnit.location).city}, {parseLocation(selectedUnit.location).state}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {LISTING_STATUS_PLATFORMS.map((platform) => {
              const record = getRecord(selectedUnit.unit_id, platform);
              const key = makeKey(selectedUnit.unit_id, platform);

              return (
                <div
                  key={platform}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {LISTING_PLATFORM_LABELS[platform]}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Status: {record.status.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/paste-queue/${encodeURIComponent(selectedUnit.unit_id)}?token=${encodeURIComponent(token)}&platform=${platform}`}
                        className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
                      >
                        Open paste queue
                      </Link>
                      <button
                        type="button"
                        onClick={() => togglePosted(selectedUnit.unit_id, platform)}
                        className="min-h-11 rounded-lg bg-[#E8B800] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F0C800]"
                      >
                        {record.status === 'posted' ? 'Mark unposted' : 'Mark posted'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      value={liveUrlDrafts[key] ?? record.live_url ?? ''}
                      onChange={(event) =>
                        setLiveUrlDrafts((current) => ({ ...current, [key]: event.target.value }))
                      }
                      placeholder="Paste live listing URL"
                      className="min-h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => saveLiveUrl(selectedUnit.unit_id, platform)}
                      className="min-h-11 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      Save URL
                    </button>
                  </div>

                  {record.live_url ? (
                    <a
                      href={record.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm text-[#F0C800] underline-offset-2 hover:underline"
                    >
                      Open live URL →
                    </a>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      Posting target: {LISTING_PLATFORM_POSTING_URLS[platform]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E8B800]">
          Platform Drill-Down
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          {LISTING_PLATFORM_LABELS[selectedPlatform]}
        </h2>
        <div className="mt-4 grid gap-3">
          {units.map((unit) => {
            const record = getRecord(unit.unit_id, selectedPlatform);
            return (
              <div key={`${unit.unit_id}-${selectedPlatform}`} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{getUnitDisplayName(unit)}</p>
                    <p className="mt-1 text-xs text-slate-400">{unit.unit_id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg border px-3 py-2 text-sm ${statusClasses(record.status)}`}>
                      {statusIcon(record.status)} {record.status.replace('_', ' ')}
                    </span>
                    <Link
                      href={`/admin/paste-queue/${encodeURIComponent(unit.unit_id)}?token=${encodeURIComponent(token)}&platform=${selectedPlatform}`}
                      className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
