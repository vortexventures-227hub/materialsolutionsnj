'use client';

import { useState } from 'react';
import { SlidersHorizontal, ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface InventoryFilters {
  make: string;
  fuel_type: string;
  condition: string;
  min_price: string;
  max_price: string;
  min_capacity: string;
  sort: string;
}

export const defaultFilters: InventoryFilters = {
  make: '',
  fuel_type: '',
  condition: '',
  min_price: '',
  max_price: '',
  min_capacity: '',
  sort: 'newest',
};

interface FilterBarProps {
  filters: InventoryFilters;
  onFilterChange: (filters: InventoryFilters) => void;
  resultCount: number;
}

const makeOptions = [
  { value: '', label: 'All Makes' },
  { value: 'Toyota', label: 'Toyota' },
  { value: 'Hyster', label: 'Hyster' },
  { value: 'Yale', label: 'Yale' },
  { value: 'Crown', label: 'Crown' },
  { value: 'Raymond', label: 'Raymond' },
  { value: 'Caterpillar', label: 'Caterpillar' },
];

const fuelOptions = [
  { value: '', label: 'All Fuel Types' },
  { value: 'propane', label: 'Propane' },
  { value: 'electric', label: 'Electric' },
  { value: 'diesel', label: 'Diesel' },
];

const conditionOptions = [
  { value: '', label: 'All Conditions' },
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'certified', label: 'Certified Pre-Owned' },
];

const capacityOptions = [
  { value: '', label: 'Any Capacity' },
  { value: '3000', label: '3,000+ lbs' },
  { value: '5000', label: '5,000+ lbs' },
  { value: '8000', label: '8,000+ lbs' },
  { value: '12000', label: '12,000+ lbs' },
];

const priceRanges = [
  { min: '', max: '', label: 'Any Price' },
  { min: '0', max: '15000', label: 'Under $15K' },
  { min: '15000', max: '25000', label: '$15K - $25K' },
  { min: '25000', max: '40000', label: '$25K - $40K' },
  { min: '40000', max: '', label: '$40K+' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'hours_asc', label: 'Lowest Hours' },
];

const selectClass = cn(
  'w-full px-3.5 py-2.5 text-sm rounded-lg border',
  'bg-bg-tertiary border-white/[0.08] hover:border-white/[0.15]',
  'focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50',
  'text-text-primary transition-colors cursor-pointer appearance-none',
  'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M4.427%206.427l3.396%203.396a.25.25%200%200%200%20.354%200l3.396-3.396A.25.25%200%200%200%2011.396%206H4.604a.25.25%200%200%200-.177.427z%22%2F%3E%3C%2Fsvg%3E")] bg-[position:right_0.75rem_center] bg-no-repeat'
);

export default function FilterBar({ filters, onFilterChange, resultCount }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof InventoryFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handlePriceChange = (min: string, max: string) => {
    onFilterChange({ ...filters, min_price: min, max_price: max });
  };

  const clearFilters = () => {
    onFilterChange(defaultFilters);
  };

  const activeCount = Object.entries(filters).filter(
    ([key, val]) => val && key !== 'sort'
  ).length;

  return (
    <div className="mb-8">
      {/* Mobile Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-bg-secondary border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal size={16} className="text-text-tertiary" />
            <span className="font-medium text-sm text-text-primary">Filters</span>
            {activeCount > 0 && (
              <span className="bg-accent-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {activeCount}
              </span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn('text-text-tertiary transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          'lg:block lg:overflow-visible',
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-none lg:opacity-100'
        )}
      >
        <div className="bg-bg-secondary/50 border border-white/[0.06] rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-text-primary">Filter Equipment</h3>
              <span className="text-xs text-text-tertiary">
                <span className="font-semibold text-text-secondary">{resultCount}</span> results
              </span>
            </div>
            {activeCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-accent-primary hover:text-accent-glow flex items-center gap-1 font-medium transition-colors"
              >
                <X size={12} />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-1.5">Make</label>
              <select value={filters.make} onChange={(e) => handleChange('make', e.target.value)} className={selectClass}>
                {makeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-1.5">Fuel Type</label>
              <select value={filters.fuel_type} onChange={(e) => handleChange('fuel_type', e.target.value)} className={selectClass}>
                {fuelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-1.5">Capacity</label>
              <select value={filters.min_capacity} onChange={(e) => handleChange('min_capacity', e.target.value)} className={selectClass}>
                {capacityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-1.5">Price</label>
              <select
                value={`${filters.min_price}-${filters.max_price}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-');
                  handlePriceChange(min, max);
                }}
                className={selectClass}
              >
                {priceRanges.map((r) => (
                  <option key={r.label} value={`${r.min}-${r.max}`}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-1.5">Condition</label>
              <select value={filters.condition} onChange={(e) => handleChange('condition', e.target.value)} className={selectClass}>
                {conditionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-tertiary mb-1.5">Sort By</label>
              <select value={filters.sort} onChange={(e) => handleChange('sort', e.target.value)} className={selectClass}>
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
