'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface InventoryItem {
  id: string;
  make: string;
  model: string;
  fuelType: 'Electric' | 'LPG' | 'Gasoline' | 'Diesel';
  capacity: string;
  hours: string;
  price: number;
}

const sampleInventory: InventoryItem[] = [
  {
    id: '1',
    make: 'Raymond',
    model: 'Reach Truck RT',
    fuelType: 'Electric',
    capacity: '4,500 lbs',
    hours: '2,150 hrs',
    price: 18500,
  },
  {
    id: '2',
    make: 'Toyota',
    model: '8FGU25',
    fuelType: 'LPG',
    capacity: '5,000 lbs',
    hours: '1,890 hrs',
    price: 21000,
  },
  {
    id: '3',
    make: 'Raymond',
    model: 'Order Picker OP',
    fuelType: 'Electric',
    capacity: '3,000 lbs',
    hours: '1,450 hrs',
    price: 16800,
  },
  {
    id: '4',
    make: 'Yale',
    model: 'ERP040',
    fuelType: 'Electric',
    capacity: '4,000 lbs',
    hours: '2,300 hrs',
    price: 19200,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export default function FeaturedInventory() {
  return (
    <section className="relative w-full bg-bg-primary py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-12 flex items-end justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="text-section font-bold text-text-primary mb-2">
              Featured Equipment
            </h2>
            <p className="text-text-secondary">
              Carefully selected units ready for immediate delivery
            </p>
          </div>
          <Link
            href="/inventory"
            className="text-accent-primary hover:text-accent-glow transition-colors font-semibold text-sm sm:text-base"
          >
            View All →
          </Link>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {sampleInventory.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl',
                'bg-bg-secondary border border-white/[0.06]',
                'transition-all duration-300 hover:border-accent-primary/50'
              )}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="absolute inset-0 shadow-glow-yellow" />
              </div>

              {/* Image Area */}
              <div
                className={cn(
                  'relative w-full aspect-square overflow-hidden',
                  'bg-gradient-to-br from-accent-primary/10 to-bg-tertiary',
                  'flex items-center justify-center'
                )}
              >
                <span className="text-6xl">🚜</span>

                {/* AI Verified Badge */}
                <motion.div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full badge-ai text-xs font-semibold"
                  whileInView={{ opacity: 1, scale: 1 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  AI-Verified
                </motion.div>

                {/* Fuel Type Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-bg-tertiary border border-white/[0.1] text-xs font-semibold text-text-secondary">
                  {item.fuelType}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-4">
                {/* Title */}
                <h3 className="text-card-title font-bold text-text-primary mb-3">
                  {item.make} {item.model}
                </h3>

                {/* Specs */}
                <div className="mb-4 space-y-2 text-sm text-text-secondary flex-1">
                  <div className="flex justify-between">
                    <span>Capacity</span>
                    <span className="font-semibold text-text-primary">
                      {item.capacity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hours</span>
                    <span className="font-semibold text-text-primary">
                      {item.hours}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-semibold text-text-primary">
                      {item.fuelType}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4 pb-4 border-t border-white/[0.06]">
                  <p className="text-xs text-text-tertiary mb-1">Price</p>
                  <p className="font-mono text-2xl font-bold text-accent-success">
                    ${item.price.toLocaleString()}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={`/inventory/${(item as any).slug || item.id}`}
                  className={cn(
                    'px-4 py-2 rounded-lg font-semibold text-sm',
                    'border border-accent-primary/50 text-accent-primary',
                    'hover:bg-accent-primary/10 transition-colors text-center'
                  )}
                >
                  View Details →
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
