'use client';

import Link from 'next/link';

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
};

export function PasteQueueIndexClient({ token, units }: PasteQueueIndexClientProps) {
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
    </div>
  );
}
