'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ListingCard from '@/components/inventory/ListingCard';
import Filters, { FilterState, defaultFilters } from '@/components/inventory/Filters';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Search, MessageCircle, ArrowUpDown, Phone } from 'lucide-react';

type SortOption = 'price_asc' | 'price_desc' | 'hours_asc' | 'newest' | 'capacity_desc';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'hours_asc', label: 'Lowest Hours' },
  { value: 'newest', label: 'Newest First' },
  { value: 'capacity_desc', label: 'Highest Capacity' },
];

// Sample data for demo (replaced by backend data when available)
const sampleInventory = [
  {
    id: '1',
    title: '2019 Raymond 5200 Order Picker',
    brand: 'Raymond',
    model: '5200',
    year: 2019,
    type: 'order_picker',
    fuel_type: 'electric',
    capacity_lbs: 3000,
    lift_height_inches: 276,
    hours: 4200,
    price: 24500,
    condition: 'excellent',
    description: 'Low-hour Raymond 5200 in excellent condition.',
    features: ['Wire guidance ready', 'AC traction motor', 'Full maintenance history'],
    images: [],
    inspection_checklist: {},
    warranty_info: '90-day powertrain warranty included',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_available: true,
  },
  {
    id: '2',
    title: '2020 Toyota 8FGCU25 Cushion Tire',
    brand: 'Toyota',
    model: '8FGCU25',
    year: 2020,
    type: 'sit_down',
    fuel_type: 'propane',
    capacity_lbs: 5000,
    lift_height_inches: 189,
    hours: 3100,
    price: 19800,
    condition: 'excellent',
    description: 'Toyota reliability with low hours.',
    features: ['SAS stability system', 'Side shift', 'Recently serviced'],
    images: [],
    inspection_checklist: {},
    warranty_info: '90-day powertrain warranty included',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_available: true,
  },
  {
    id: '3',
    title: '2018 Crown RC 5500 Reach Truck',
    brand: 'Crown',
    model: 'RC 5500',
    year: 2018,
    type: 'reach_truck',
    fuel_type: 'electric',
    capacity_lbs: 4500,
    lift_height_inches: 312,
    hours: 6800,
    price: 18500,
    condition: 'good',
    description: 'Well-maintained Crown reach truck. 26ft lift height.',
    features: ['InfoLink ready', 'Ergonomic controls', 'Good battery'],
    images: [],
    inspection_checklist: {},
    warranty_info: '60-day warranty included',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    is_available: true,
  },
  {
    id: '4',
    title: '2021 Raymond 7500 Reach Truck',
    brand: 'Raymond',
    model: '7500',
    year: 2021,
    type: 'reach_truck',
    fuel_type: 'electric',
    capacity_lbs: 4500,
    lift_height_inches: 300,
    hours: 2100,
    price: 22000,
    condition: 'excellent',
    description: 'Low-hour Raymond reach with 25ft lift.',
    features: ['iWarehouse ready', 'AC controls', 'New battery'],
    images: [],
    inspection_checklist: {},
    warranty_info: '90-day full warranty',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_available: true,
  },
  {
    id: '5',
    title: '2021 Yale MPB045VG Electric Pallet Jack',
    brand: 'Yale',
    model: 'MPB045VG',
    year: 2021,
    type: 'pallet_jack',
    fuel_type: 'electric',
    capacity_lbs: 4500,
    lift_height_inches: 8,
    hours: 1200,
    price: 4800,
    condition: 'excellent',
    description: 'Like-new electric pallet jack.',
    features: ['Lithium battery option', 'Low hours', 'Full warranty'],
    images: [],
    inspection_checklist: {},
    warranty_info: '90-day full warranty',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    is_available: true,
  },
  {
    id: '6',
    title: '2016 Raymond 5400 High-Level Order Picker',
    brand: 'Raymond',
    model: '5400',
    year: 2016,
    type: 'order_picker',
    fuel_type: 'electric',
    capacity_lbs: 3000,
    lift_height_inches: 360,
    hours: 9500,
    price: 21000,
    condition: 'good',
    description: '30ft reach order picker for high-bay picking.',
    features: ['Wire guidance', 'Height select', 'Good battery'],
    images: [],
    inspection_checklist: {},
    warranty_info: '60-day warranty included',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    is_available: true,
  },
];

function InventoryContent() {
  const searchParams = useSearchParams();
  const [inventory] = useState(sampleInventory);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<FilterState>(() => ({
    type: searchParams.get('type') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    brand: searchParams.get('brand') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    max_hours: searchParams.get('max_hours') || '',
    min_capacity: searchParams.get('min_capacity') || '',
  }));

  const filteredInventory = useMemo(() => {
    let filtered = [...inventory];

    if (filters.type) filtered = filtered.filter(item => item.type === filters.type);
    if (filters.fuel_type) filtered = filtered.filter(item => item.fuel_type === filters.fuel_type);
    if (filters.brand) filtered = filtered.filter(item => item.brand === filters.brand);
    if (filters.min_price) filtered = filtered.filter(item => item.price >= parseInt(filters.min_price));
    if (filters.max_price) filtered = filtered.filter(item => item.price <= parseInt(filters.max_price));
    if (filters.max_hours) filtered = filtered.filter(item => item.hours <= parseInt(filters.max_hours));
    if (filters.min_capacity) filtered = filtered.filter(item => item.capacity_lbs >= parseInt(filters.min_capacity));

    // Sort
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'hours_asc':
        filtered.sort((a, b) => a.hours - b.hours);
        break;
      case 'newest':
        filtered.sort((a, b) => b.year - a.year);
        break;
      case 'capacity_desc':
        filtered.sort((a, b) => b.capacity_lbs - a.capacity_lbs);
        break;
    }

    // Featured items first within each sort
    filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));

    return filtered;
  }, [filters, inventory, sortBy]);

  return (
    <>
      {/* Page Header */}
      <div className="bg-secondary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-primary-500/5 rounded-full blur-[80px]" />
        </div>

        <Container className="relative py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <Badge variant="primary" className="mb-4 bg-primary-500/20 text-primary-400 ring-primary-500/30">
                ~75 Units in Stock
              </Badge>
              <h1 className="text-display-md text-white mb-3">
                Equipment Inventory
              </h1>
              <p className="text-secondary-400 text-body-lg">
                Every price transparent. Every unit inspected. Raymond, Crown, and Toyota specialists.
              </p>
            </div>

            <div className="flex gap-3">
              <a
                href="tel:+19735001010"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 text-white text-sm font-medium rounded-xl hover:bg-white/10 border border-white/10 transition-colors"
              >
                <Phone size={14} />
                Call Bill
              </a>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors">
                <MessageCircle size={14} />
                Ask David
              </button>
            </div>
          </div>
        </Container>
      </div>

      <div className="bg-secondary-50/50 min-h-screen">
        <Container className="py-8">
          <Filters onFilterChange={setFilters} activeFilters={filters} />

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-secondary-500">
              <span className="font-semibold text-secondary-800">{filteredInventory.length}</span>{' '}
              {filteredInventory.length === 1 ? 'unit' : 'units'} available
            </p>

            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-secondary-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm text-secondary-700 font-medium bg-transparent border-none cursor-pointer focus:outline-none focus:ring-0 pr-6 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M4.427%206.427l3.396%203.396a.25.25%200%200%200%20.354%200l3.396-3.396A.25.25%200%200%200%2011.396%206H4.604a.25.25%200%200%200-.177.427z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0_center] bg-no-repeat"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {filteredInventory.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-secondary-400" />
              </div>
              <p className="text-lg font-semibold text-secondary-800 mb-2">No equipment found</p>
              <p className="text-secondary-500 mb-6 max-w-md mx-auto">
                Try adjusting your filters or browse all inventory. You can also ask David for help finding the right machine.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Clear all filters
                </button>
                <button className="text-sm font-semibold text-secondary-600 hover:text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-100 transition-colors inline-flex items-center gap-1.5">
                  <MessageCircle size={14} />
                  Ask David
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredInventory.map((item, index) => (
                <ListingCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          {filteredInventory.length > 0 && (
            <div className="mt-12 text-center">
              <p className="text-sm text-secondary-500 mb-2">
                Don&apos;t see what you need?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="tel:+19735001010"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Phone size={14} />
                  Call (973) 500-1010
                </a>
                <span className="text-secondary-300">|</span>
                <button className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  <MessageCircle size={14} />
                  Ask David to find it
                </button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-secondary-50">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
