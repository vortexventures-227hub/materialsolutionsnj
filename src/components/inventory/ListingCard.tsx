'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Zap, Ruler, CheckCircle } from 'lucide-react';
import { Inventory } from '@/lib/db/supabase';

interface ListingCardProps {
  item: Inventory;
  index?: number;
}

export default function ListingCard({ item, index = 0 }: ListingCardProps) {
  const conditionColors = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-yellow-100 text-yellow-800',
  };

  const fuelTypeLabels = {
    electric: 'Electric',
    propane: 'Propane',
    diesel: 'Diesel',
    manual: 'Manual',
  };

  const typeLabels = {
    'sit-down': 'Sit-Down Rider',
    'reach-truck': 'Reach Truck',
    'order-picker': 'Order Picker',
    'pallet-jack': 'Pallet Jack',
    'turret-truck': 'Turret Truck',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/inventory/${item.id}`}>
        <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group">
          {/* Image */}
          <div className="relative h-48 bg-gray-100 overflow-hidden">
            {item.images && item.images.length > 0 ? (
              <Image
                src={item.images[0]}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-4xl">🏗️</span>
              </div>
            )}
            {/* Featured Badge */}
            {item.is_featured && (
              <div className="absolute top-3 left-3 bg-orange-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                Featured
              </div>
            )}
            {/* Condition Badge */}
            <div className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full ${conditionColors[item.condition]}`}>
              {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Brand & Type */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-orange-600">{item.brand}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">{typeLabels[item.type]}</span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
              {item.title}
            </h3>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Clock size={14} className="text-gray-400" />
                <span>{item.hours.toLocaleString()} hrs</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Zap size={14} className="text-gray-400" />
                <span>{fuelTypeLabels[item.fuel_type]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Ruler size={14} className="text-gray-400" />
                <span>{(item.lift_height_inches / 12).toFixed(0)}ft lift</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <CheckCircle size={14} className="text-gray-400" />
                <span>{item.capacity_lbs.toLocaleString()} lbs</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${item.price.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{item.year} Model Year</p>
              </div>
              <button className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
                View Details
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
