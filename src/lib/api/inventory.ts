/**
 * Inventory API — fetches from Sales Machine backend on Render.
 * Falls back to Supabase if backend is unavailable.
 */

import { backend } from './backend';

export interface InventoryItem {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  type: 'reach_truck' | 'order_picker' | 'sit_down' | 'pallet_jack' | 'turret_truck' | 'stand_up';
  fuel_type: 'electric' | 'propane' | 'diesel';
  capacity_lbs: number;
  lift_height_inches: number;
  hours: number;
  price: number;
  condition: 'excellent' | 'good' | 'fair';
  description: string;
  features: string[];
  images: string[];
  inspection_checklist?: Record<string, boolean>;
  warranty_info?: string;
  is_featured: boolean;
  is_available: boolean;
  created_at?: string;
}

export interface InventoryFilters {
  type?: string;
  brand?: string;
  fuel_type?: string;
  min_capacity?: string;
  max_capacity?: string;
  min_price?: string;
  max_price?: string;
  max_hours?: string;
  sort?: string;
  featured?: string;
}

export async function fetchInventory(filters: InventoryFilters = {}): Promise<InventoryItem[]> {
  try {
    // Clean empty params
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value) params[key] = value;
    }

    const data = await backend.get<{ inventory: InventoryItem[] } | InventoryItem[]>('/api/inventory', params);
    return Array.isArray(data) ? data : data.inventory || [];
  } catch (error) {
    console.error('Failed to fetch inventory from backend:', error);
    return [];
  }
}

export async function fetchInventoryItem(id: string): Promise<InventoryItem | null> {
  try {
    return await backend.get<InventoryItem>(`/api/inventory/${id}`);
  } catch (error) {
    console.error('Failed to fetch inventory item:', error);
    return null;
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatHours(hours: number): string {
  return new Intl.NumberFormat('en-US').format(hours);
}

export function getEquipmentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    reach_truck: 'Reach Truck',
    order_picker: 'Order Picker',
    sit_down: 'Sit-Down Rider',
    pallet_jack: 'Pallet Jack',
    turret_truck: 'Turret Truck',
    stand_up: 'Stand-Up Counterbalance',
  };
  return labels[type] || type;
}

export function getConditionColor(condition: string): string {
  const colors: Record<string, string> = {
    excellent: 'text-success-500 bg-success-50',
    good: 'text-primary-600 bg-primary-50',
    fair: 'text-warning-600 bg-warning-50',
  };
  return colors[condition] || 'text-secondary-500 bg-secondary-50';
}
