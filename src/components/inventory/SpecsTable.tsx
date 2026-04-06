'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { type ListingSpec } from '@/lib/types';

interface SpecsTableProps {
  specs: ListingSpec[];
}

const categoryLabels: Record<string, string> = {
  general: 'General',
  performance: 'Performance',
  mast: 'Mast',
  power: 'Power',
  tires: 'Tires',
  dimensions: 'Dimensions',
};

const categoryOrder = ['general', 'performance', 'mast', 'power', 'tires', 'dimensions'];

export default function SpecsTable({ specs }: SpecsTableProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(['general', 'performance']));

  const groupedSpecs = specs.reduce((acc, spec) => {
    if (!acc[spec.category]) acc[spec.category] = [];
    acc[spec.category].push(spec);
    return acc;
  }, {} as Record<string, ListingSpec[]>);

  // Sort specs within each group
  Object.values(groupedSpecs).forEach((group) => {
    group.sort((a, b) => a.sort_order - b.sort_order);
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const orderedCategories = categoryOrder.filter((cat) => groupedSpecs[cat]);

  if (orderedCategories.length === 0) return null;

  return (
    <div className="space-y-2">
      {orderedCategories.map((category) => {
        const isOpen = openCategories.has(category);
        return (
          <div key={category} className="bg-bg-secondary rounded-xl border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-sm font-semibold text-text-primary">
                {categoryLabels[category] || category}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  'text-text-tertiary transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-4">
                <dl className="divide-y divide-white/[0.04]">
                  {groupedSpecs[category].map((spec) => (
                    <div key={spec.id} className="py-3 flex items-center justify-between">
                      <dt className="text-sm text-text-tertiary">{spec.spec_key}</dt>
                      <dd className="text-sm text-text-primary font-semibold">{spec.spec_value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
