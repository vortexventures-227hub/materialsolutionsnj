'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface QuickChipsProps {
  onSelect: (chip: string) => void;
  isHidden?: boolean;
}

const DEFAULT_CHIPS = [
  'What forklifts do you have?',
  'I need a quote',
  'Tell me about financing',
  'I want to speak with someone',
];

export function QuickChips({ onSelect, isHidden = false }: QuickChipsProps) {
  if (isHidden) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, staggerChildren: 0.05 }}
      className="flex flex-col gap-2 px-4 py-3"
    >
      {DEFAULT_CHIPS.map((chip, index) => (
        <motion.button
          key={chip}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          onClick={() => onSelect(chip)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-full border border-white/10 bg-bg-secondary text-text-primary text-sm transition-all duration-200 hover:border-accent-primary hover:bg-bg-primary active:scale-95',
            'group'
          )}
        >
          <span className="group-hover:text-accent-primary transition-colors">
            {chip}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
