import { ImageResponse } from 'next/og';

import inventorySource from '../../../data/forklift-inventory.json';
import {
  normalizeStandaloneUnit,
  normalizeLotUnitMember,
  type ForkliftUnit,
} from '@/lib/marketing/schemaTransformers';

const SITE_URL = 'https://www.materialsolutionsnj.com';

type LotMemberJson = {
  unit_index: number;
  make: string;
  model: string;
  serial?: string | null;
  year: number | null;
};

type LotJson = {
  lot_id: string;
  status?: string | null;
  hold_reason?: string | null;
  sold_as_lot_only?: boolean | null;
  per_unit_price_usd?: number | null;
  location: string;
  unit_type: string;
  guidance?: string | null;
  mast_collapsed_inches?: number | null;
  mast_extended_inches?: number | null;
  battery_and_charger_included?: boolean | null;
  hours_avg?: number | null;
  condition?: string | null;
  units: LotMemberJson[];
};

type StandaloneUnitJson = {
  unit_id: string;
  make: string;
  model: string;
  year: number | null;
  unit_type: string;
  location: string;
  serial?: string | null;
  capacity_lbs?: number | null;
  mast_collapsed_inches?: number | null;
  mast_extended_inches?: number | null;
  features?: string[] | null;
  battery?: string | null;
  battery_voltage?: number | null;
  hours_approx?: number | null;
  condition?: string | null;
  asking_price_usd?: number | null;
  media_paths?: string[] | null;
  delivery_available?: boolean | null;
  status?: string | null;
  hold_reason?: string | null;
};

type InventorySource = {
  inventory: {
    lots: LotJson[];
    standalone_units: StandaloneUnitJson[];
  };
};

const inventoryData = inventorySource as InventorySource;

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findUnitBySlug(slug: string): ForkliftUnit | null {
  const normalized = normalizeSlug(slug);

  const standalone = inventoryData.inventory.standalone_units.find(
    (unit) => normalizeSlug(unit.unit_id) === normalized
  );
  if (standalone) {
    return normalizeStandaloneUnit(standalone);
  }

  for (const lot of inventoryData.inventory.lots) {
    for (const member of lot.units) {
      const memberId = `${lot.lot_id}-unit-${member.unit_index}`;
      if (normalizeSlug(memberId) === normalized) {
        return normalizeLotUnitMember(lot, member);
      }
    }
  }

  return null;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getDisplayName(unit: ForkliftUnit): string {
  return [unit.year, unit.make, unit.model, unit.unit_type]
    .filter(Boolean)
    .join(' ');
}

function getShortLocation(location: string): string {
  return location
    .replace('Baltimore, Maryland', 'Baltimore, MD')
    .replace('Hamilton, New Jersey', 'Hamilton, NJ')
    .replace('Hamilton, NJ (Material Solutions Inc.)', 'Hamilton, NJ');
}

export function renderInventoryOGImage(slug: string): Promise<ImageResponse> {
  const unit = findUnitBySlug(slug);

  if (!unit) {
    return Promise.resolve(
      new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
              padding: '60px 80px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '0.05em',
              }}
            >
              Material Solutions NJ
            </div>
            <div style={{ marginTop: '16px', fontSize: '20px', color: 'rgba(255,255,255,0.3)' }}>
              Listing not found
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      )
    );
  }

  const priceLabel = unit.asking_price_usd ? formatUsd(unit.asking_price_usd) : 'Call for price';
  const locationLabel = getShortLocation(unit.location);
  const conditionLabel = unit.condition ?? 'Used';
  const hoursLabel = unit.hours_approx ? `${unit.hours_approx.toLocaleString()} hrs` : null;
  const capacityLabel = unit.capacity_lbs
    ? `${unit.capacity_lbs.toLocaleString()} lb capacity`
    : null;

  const specLabels = [locationLabel, conditionLabel, hoursLabel, capacityLabel].filter(Boolean);

  return Promise.resolve(
    new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
            padding: '52px 72px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '7px',
              height: '100%',
              background: 'linear-gradient(180deg, #00d4aa 0%, #00a389 100%)',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                background: 'rgba(0, 212, 170, 0.12)',
                border: '1px solid rgba(0, 212, 170, 0.25)',
                borderRadius: '999px',
                padding: '5px 14px',
                fontSize: '13px',
                color: '#00d4aa',
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {unit.unit_type}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: '#00d4aa', letterSpacing: '-0.01em' }}>
              {priceLabel}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div
              style={{
                fontSize: '62px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                marginBottom: '6px',
              }}
            >
              {unit.year ?? '—'} {unit.make}
            </div>
            <div
              style={{
                fontSize: '62px',
                fontWeight: 700,
                color: '#00d4aa',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                marginBottom: '24px',
              }}
            >
              {unit.model}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {specLabels.map((label, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '15px',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '18px',
            }}
          >
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.35)' }}>
              {SITE_URL}/inventory/{unit.canonical_slug}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.03em',
              }}
            >
              Material Solutions NJ
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  );
}
