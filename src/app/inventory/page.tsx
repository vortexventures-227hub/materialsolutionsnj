'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import ListingCard from '@/components/inventory/ListingCard';
import Filters, { FilterState, defaultFilters } from '@/components/inventory/Filters';
import { Inventory } from '@/lib/db/supabase';
import { Loader2 } from 'lucide-react';

// Sample data for demo (will be replaced with Supabase data)
const sampleInventory: Inventory[] = [
  {
    id: '1',
    title: '2019 Raymond 5200 Order Picker',
    brand: 'Raymond',
    model: '5200',
    year: 2019,
    type: 'order-picker',
    fuel_type: 'electric',
    capacity_lbs: 3000,
    lift_height_inches: 276,
    hours: 4200,
    price: 24500,
    condition: 'excellent',
    description: 'Low-hour Raymond 5200 in excellent condition. Perfect for distribution centers.',
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
    type: 'sit-down',
    fuel_type: 'propane',
    capacity_lbs: 5000,
    lift_height_inches: 189,
    hours: 3100,
    price: 19800,
    condition: 'excellent',
    description: 'Toyota reliability with low hours. Ideal for indoor warehouse operations.',
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
    type: 'reach-truck',
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
    title: '2017 Hyster H50FT Pneumatic Tire',
    brand: 'Hyster',
    model: 'H50FT',
    year: 2017,
    type: 'sit-down',
    fuel_type: 'diesel',
    capacity_lbs: 5000,
    lift_height_inches: 189,
    hours: 8200,
    price: 14500,
    condition: 'good',
    description: 'Built tough for outdoor use. Diesel reliability.',
    features: ['Pneumatic tires', 'Full cab available', 'Recently serviced'],
    images: [],
    inspection_checklist: {},
    warranty_info: '30-day warranty included',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: false,
    is_available: true,
  },
  {
    id: '5',
    title: '2021 Yale MPB045VG Electric Pallet Jack',
    brand: 'Yale',
    model: 'MPB045VG',
    year: 2021,
    type: 'pallet-jack',
    fuel_type: 'electric',
    capacity_lbs: 4500,
    lift_height_inches: 8,
    hours: 1200,
    price: 4800,
    condition: 'excellent',
    description: 'Like-new electric pallet jack. Great for dock work.',
    features: ['Lithium battery option', 'Low hours', 'Full warranty'],
    images: [],
    inspection_checklist: {},
    warranty_info: '90-day full warranty',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_featured: true,
    is_available: true,
  },
  {
    id: '6',
    title: '2016 Raymond 5400 High-Level Order Picker',
    brand: 'Raymond',
    model: '5400',
    year: 2016,
    type: 'order-picker',
    fuel_type: 'electric',
    capacity_lbs: 3000,
    lift_height_inches: 360,
    hours: 9500,
    price: 21000,
    condition: 'good',
    description: '30ft reach order picker. Great for high-bay picking.',
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
  const [inventory, setInventory] = useState<Inventory[]>(sampleInventory);
  const [filteredInventory, setFilteredInventory] = useState<Inventory[]>(sampleInventory);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => {
    // Initialize filters from URL params
    return {
      type: searchParams.get('type') || '',
      fuel_type: searchParams.get('fuel_type') || '',
      brand: searchParams.get('brand') || '',
      min_price: searchParams.get('min_price') || '',
      max_price: searchParams.get('max_price') || '',
      max_hours: searchParams.get('max_hours') || '',
    };
  });

  // Apply filters
  useEffect(() => {
    let filtered = [...inventory];

    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    if (filters.fuel_type) {
      filtered = filtered.filter(item => item.fuel_type === filters.fuel_type);
    }
    if (filters.brand) {
      filtered = filtered.filter(item => item.brand === filters.brand);
    }
    if (filters.min_price) {
      filtered = filtered.filter(item => item.price >= parseInt(filters.min_price));
    }
    if (filters.max_price) {
      filtered = filtered.filter(item => item.price <= parseInt(filters.max_price));
    }
    if (filters.max_hours) {
      filtered = filtered.filter(item => item.hours <= parseInt(filters.max_hours));
    }

    setFilteredInventory(filtered);
  }, [filters, inventory]);

  // Fetch from API (when Supabase is configured)
  useEffect(() => {
    const fetchInventory = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });

        const response = await fetch(`/api/inventory?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.inventory && data.inventory.length > 0) {
            setInventory(data.inventory);
          }
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
        // Keep sample data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Equipment Inventory
            </h1>
            <p className="text-gray-600">
              Browse our selection of quality used forklifts and equipment. Every price shown. Every unit inspected.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <Filters 
            onFilterChange={setFilters}
            activeFilters={filters}
          />

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{filteredInventory.length}</span> items
            </p>
          </div>

          {/* Inventory Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600 mb-4">No equipment matches your filters</p>
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-orange-600 font-medium hover:text-orange-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventory.map((item, index) => (
                <ListingCard key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    }>
      <InventoryContent />
    </Suspense>
  );
}
