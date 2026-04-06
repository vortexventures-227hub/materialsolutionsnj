'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Zap, Ruler, Weight, ArrowRight, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface InventoryItem {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  fuel_type: string;
  capacity_lbs: number;
  lift_height_inches: number;
  hours: number;
  price: number;
  condition: string;
  description: string;
  features: string[];
  images: string[];
  is_featured: boolean;
  is_available: boolean;
}

interface ListingCardProps {
  item: InventoryItem;
  index?: number;
}

const typeLabels: Record<string, string> = {
  'sit-down': 'Sit-Down',
  'sit_down': 'Sit-Down',
  'reach-truck': 'Reach Truck',
  'reach_truck': 'Reach Truck',
  'order-picker': 'Order Picker',
  'order_picker': 'Order Picker',
  'pallet-jack': 'Pallet Jack',
  'pallet_jack': 'Pallet Jack',
  'turret-truck': 'Turret Truck',
  'turret_truck': 'Turret Truck',
  'stand_up': 'Stand-Up',
};

const typeEmoji: Record<string, string> = {
  reach_truck: '🏗️',
  'reach-truck': '🏗️',
  order_picker: '📦',
  'order-picker': '📦',
  pallet_jack: '🔧',
  'pallet-jack': '🔧',
  sit_down: '🚜',
  'sit-down': '🚜',
  turret_truck: '🏗️',
  'turret-truck': '🏗️',
  stand_up: '🚜',
};

const conditionVariant: Record<string, 'success' | 'primary' | 'warning'> = {
  excellent: 'success',
  good: 'primary',
  fair: 'warning',
};

export default function ListingCard({ item, index = 0 }: ListingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
    >
      <Link href={`/inventory/${(item as any).slug || item.id}`} className="group block h-full">
        <div className="bg-white rounded-2xl overflow-hidden border border-secondary-100 shadow-premium hover:shadow-premium-lg hover:border-secondary-200 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
          {/* Image */}
          <div className="relative h-48 bg-secondary-50 overflow-hidden">
            {item.images && item.images.length > 0 ? (
              <Image
                src={item.images[0]}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100">
                <span className="text-5xl opacity-30 group-hover:scale-110 transition-transform duration-500">
                  {typeEmoji[item.type] || '🚜'}
                </span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {item.is_featured && (
                <Badge variant="primary" dot>Featured</Badge>
              )}
            </div>
            <div className="absolute top-3 right-3">
              <Badge variant={conditionVariant[item.condition] || 'secondary'}>
                {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
              </Badge>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-1">
            {/* Brand & Type */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                {item.brand}
              </span>
              <span className="text-secondary-300">&middot;</span>
              <span className="text-xs text-secondary-500">
                {typeLabels[item.type] || item.type}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-3">
              {item.title}
            </h3>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                <Clock size={12} className="text-secondary-400 flex-shrink-0" />
                <span>{item.hours.toLocaleString()} hrs</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                <Zap size={12} className="text-secondary-400 flex-shrink-0" />
                <span className="capitalize">{item.fuel_type}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                <Ruler size={12} className="text-secondary-400 flex-shrink-0" />
                <span>{Math.round(item.lift_height_inches / 12)}ft lift</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                <Weight size={12} className="text-secondary-400 flex-shrink-0" />
                <span>{item.capacity_lbs.toLocaleString()} lbs</span>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Price + CTA */}
            <div className="flex items-end justify-between pt-4 border-t border-secondary-100">
              <div>
                <p className="text-xl font-bold text-secondary-900">
                  ${item.price.toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-secondary-400">{item.year} Model</span>
                  <span className="text-secondary-200">&middot;</span>
                  <span className="flex items-center gap-0.5 text-xs text-secondary-400">
                    <Shield size={10} />
                    Warranty
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                View
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
