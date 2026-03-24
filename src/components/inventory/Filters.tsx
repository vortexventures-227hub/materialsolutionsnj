'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, X } from 'lucide-react';

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
}

const defaultFilters: FilterState = {
  type: '',
  fuel_type: '',
  brand: '',
  min_price: '',
  max_price: '',
  max_hours: '',
};

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'sit-down', label: 'Sit-Down Rider' },
  { value: 'reach-truck', label: 'Reach Truck' },
  { value: 'order-picker', label: 'Order Picker' },
  { value: 'pallet-jack', label: 'Pallet Jack' },
  { value: 'turret-truck', label: 'Turret Truck' },
];

const fuelOptions = [
  { value: '', label: 'All Fuel Types' },
  { value: 'electric', label: 'Electric' },
  { value: 'propane', label: 'Propane' },
  { value: 'diesel', label: 'Diesel' },
];

const brandOptions = [
  { value: '', label: 'All Brands' },
  { value: 'Toyota', label: 'Toyota' },
  { value: 'Crown', label: 'Crown' },
  { value: 'Raymond', label: 'Raymond' },
  { value: 'Hyster', label: 'Hyster' },
  { value: 'Yale', label: 'Yale' },
  { value: 'CAT', label: 'Caterpillar' },
  { value: 'Jungheinrich', label: 'Jungheinrich' },
];

const hoursOptions = [
  { value: '', label: 'Any Hours' },
  { value: '3000', label: 'Under 3,000 hrs' },
  { value: '5000', label: 'Under 5,000 hrs' },
  { value: '8000', label: 'Under 8,000 hrs' },
  { value: '10000', label: 'Under 10,000 hrs' },
];

const priceRanges = [
  { min: '', max: '', label: 'Any Price' },
  { min: '0', max: '10000', label: 'Under $10,000' },
  { min: '10000', max: '20000', label: '$10,000 - $20,000' },
  { min: '20000', max: '35000', label: '$20,000 - $35,000' },
  { min: '35000', max: '', label: '$35,000+' },
];

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
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Filter size={18} />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        <motion.div
          initial={false}
          animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
          className={`overflow-hidden lg:!h-auto lg:!opacity-100 ${!isOpen ? 'lg:block' : ''}`}
        >
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filter Equipment</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Type
                </label>
                <select
                  value={activeFilters.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type
                </label>
                <select
                  value={activeFilters.fuel_type}
                  onChange={(e) => handleChange('fuel_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  {fuelOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <select
                  value={activeFilters.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  {brandOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range
                </label>
                <select
                  value={`${activeFilters.min_price}-${activeFilters.max_price}`}
                  onChange={(e) => {
                    const [min, max] = e.target.value.split('-');
                    handlePriceRangeChange(min, max);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  {priceRanges.map(range => (
                    <option key={range.label} value={`${range.min}-${range.max}`}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Hours
                </label>
                <select
                  value={activeFilters.max_hours}
                  onChange={(e) => handleChange('max_hours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  {hoursOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export { defaultFilters };
