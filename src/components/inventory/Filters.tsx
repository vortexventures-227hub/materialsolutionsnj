'use client';

import { useState } from 'react';
import { Filter, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FiltersProps {
  onFilterChange: (filters: FilterState) => void;
  activeFilters: FilterState;
}

export interface FilterState {
  type: string;
  fuel_type: string;
  brand: string;
  min_price: string;
  max_price: string;
  max_hours: string;
  min_capacity: string;
}

const defaultFilters: FilterState = {
  type: '',
  fuel_type: '',
  brand: '',
  min_price: '',
  max_price: '',
  max_hours: '',
  min_capacity: '',
};

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'reach_truck', label: 'Reach Truck' },
  { value: 'order_picker', label: 'Order Picker' },
  { value: 'sit_down', label: 'Sit-Down Rider' },
  { value: 'pallet_jack', label: 'Pallet Jack' },
  { value: 'turret_truck', label: 'Turret Truck' },
  { value: 'stand_up', label: 'Stand-Up Counterbalance' },
];

const fuelOptions = [
  { value: '', label: 'All Power' },
  { value: 'electric', label: 'Electric' },
];

const brandOptions = [
  { value: '', label: 'All Brands' },
  { value: 'Raymond', label: 'Raymond' },
  { value: 'Crown', label: 'Crown' },
  { value: 'Toyota', label: 'Toyota' },
  { value: 'Hyster', label: 'Hyster' },
  { value: 'Yale', label: 'Yale' },
];

const hoursOptions = [
  { value: '', label: 'Any Hours' },
  { value: '3000', label: 'Under 3,000' },
  { value: '5000', label: 'Under 5,000' },
  { value: '8000', label: 'Under 8,000' },
  { value: '10000', label: 'Under 10,000' },
];

const priceRanges = [
  { min: '', max: '', label: 'Any Price' },
  { min: '0', max: '10000', label: 'Under $10K' },
  { min: '10000', max: '20000', label: '$10K - $20K' },
  { min: '20000', max: '35000', label: '$20K - $35K' },
  { min: '35000', max: '', label: '$35K+' },
];

const capacityOptions = [
  { value: '', label: 'Any Capacity' },
  { value: '3000', label: '3,000+ lbs' },
  { value: '4000', label: '4,000+ lbs' },
  { value: '5000', label: '5,000+ lbs' },
  { value: '6000', label: '6,000+ lbs' },
];

const selectClass = cn(
  'w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white',
  'border-secondary-200 hover:border-secondary-300',
  'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
  'text-secondary-800 transition-colors cursor-pointer appearance-none',
  'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M4.427%206.427l3.396%203.396a.25.25%200%200%200%20.354%200l3.396-3.396A.25.25%200%200%200%2011.396%206H4.604a.25.25%200%200%200-.177.427z%22%2F%3E%3C%2Fsvg%3E")] bg-[position:right_0.75rem_center] bg-no-repeat'
);

export default function Filters({ onFilterChange, activeFilters }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...activeFilters, [key]: value });
  };

  const handlePriceRangeChange = (min: string, max: string) => {
    onFilterChange({ ...activeFilters, min_price: min, max_price: max });
  };

  const clearFilters = () => {
    onFilterChange(defaultFilters);
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="mb-8">
      {/* Mobile Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-secondary-200 rounded-xl hover:border-secondary-300 transition-colors shadow-premium"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal size={16} className="text-secondary-500" />
            <span className="font-medium text-sm text-secondary-800">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown
            size={16}
            className={cn(
              'text-secondary-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Filter Panel */}
      <div className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        'lg:block lg:overflow-visible',
        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-none lg:opacity-100'
      )}>
        <div className="bg-white border border-secondary-100 rounded-2xl p-5 shadow-premium">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-secondary-400" />
              <h3 className="text-sm font-semibold text-secondary-900">Filter Equipment</h3>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium transition-colors"
              >
                <X size={12} />
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary-500 mb-1.5">Type</label>
              <select
                value={activeFilters.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className={selectClass}
              >
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-500 mb-1.5">Brand</label>
              <select
                value={activeFilters.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                className={selectClass}
              >
                {brandOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-500 mb-1.5">Price</label>
              <select
                value={`${activeFilters.min_price}-${activeFilters.max_price}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-');
                  handlePriceRangeChange(min, max);
                }}
                className={selectClass}
              >
                {priceRanges.map(range => (
                  <option key={range.label} value={`${range.min}-${range.max}`}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-500 mb-1.5">Capacity</label>
              <select
                value={activeFilters.min_capacity}
                onChange={(e) => handleChange('min_capacity', e.target.value)}
                className={selectClass}
              >
                {capacityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-500 mb-1.5">Hours</label>
              <select
                value={activeFilters.max_hours}
                onChange={(e) => handleChange('max_hours', e.target.value)}
                className={selectClass}
              >
                {hoursOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-500 mb-1.5">Power</label>
              <select
                value={activeFilters.fuel_type}
                onChange={(e) => handleChange('fuel_type', e.target.value)}
                className={selectClass}
              >
                {fuelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter pills */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-secondary-100">
              {activeFilters.type && (
                <FilterPill
                  label={typeOptions.find(o => o.value === activeFilters.type)?.label || activeFilters.type}
                  onRemove={() => handleChange('type', '')}
                />
              )}
              {activeFilters.brand && (
                <FilterPill
                  label={activeFilters.brand}
                  onRemove={() => handleChange('brand', '')}
                />
              )}
              {(activeFilters.min_price || activeFilters.max_price) && (
                <FilterPill
                  label={priceRanges.find(r => r.min === activeFilters.min_price && r.max === activeFilters.max_price)?.label || 'Price filter'}
                  onRemove={() => handlePriceRangeChange('', '')}
                />
              )}
              {activeFilters.min_capacity && (
                <FilterPill
                  label={capacityOptions.find(o => o.value === activeFilters.min_capacity)?.label || activeFilters.min_capacity}
                  onRemove={() => handleChange('min_capacity', '')}
                />
              )}
              {activeFilters.max_hours && (
                <FilterPill
                  label={hoursOptions.find(o => o.value === activeFilters.max_hours)?.label || activeFilters.max_hours}
                  onRemove={() => handleChange('max_hours', '')}
                />
              )}
              {activeFilters.fuel_type && (
                <FilterPill
                  label={fuelOptions.find(o => o.value === activeFilters.fuel_type)?.label || activeFilters.fuel_type}
                  onRemove={() => handleChange('fuel_type', '')}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-200">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-primary-900 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

export { defaultFilters };
