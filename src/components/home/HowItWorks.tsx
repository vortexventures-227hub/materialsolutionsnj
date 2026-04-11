'use client';

import { motion } from 'framer-motion';
import { LayoutGrid, MessageCircle, Truck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: <LayoutGrid className="w-8 h-8" />,
    title: 'Browse Our Inventory',
    description:
      'Explore our selection of quality used forklifts, reach trucks, and order pickers — all with upfront, honest pricing.',
  },
  {
    number: 2,
    icon: <MessageCircle className="w-8 h-8" />,
    title: 'Talk to an Expert',
    description:
      'Call us or chat with David, our AI assistant, available 24/7 to answer questions and help you find the right equipment.',
  },
  {
    number: 3,
    icon: <Truck className="w-8 h-8" />,
    title: 'Get Your Equipment',
    description:
      'We handle logistics, financing, and delivery options nationwide — so you can focus on running your warehouse.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
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

export default function HowItWorks() {
  return (
    <section className="relative w-full bg-bg-primary py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-section font-bold text-text-primary mb-4">
            From Listing to Loading Dock
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            A streamlined process designed for transparency and speed
          </p>
        </motion.div>

        {/* Steps Container */}
        <motion.div
          className="relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Desktop Connection Line */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="flex flex-col items-center md:items-center text-center"
              >
                {/* Number Badge */}
                <motion.div
                  className={cn(
                    'mb-6 w-16 h-16 rounded-full',
                    'flex items-center justify-center',
                    'border-2 border-accent-primary',
                    'bg-gradient-to-br from-accent-primary/20 to-accent-primary/5'
                  )}
                  whileInView={{ scale: 1, opacity: 1 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-2xl font-bold text-accent-primary">
                    {step.number}
                  </span>
                </motion.div>

                {/* Icon */}
                <div className="mb-4 text-accent-primary">{step.icon}</div>

                {/* Title */}
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>

                {/* Mobile Connector Line (between steps on mobile) */}
                {index < steps.length - 1 && (
                  <div className="md:hidden mt-8 h-12 w-0.5 bg-gradient-to-b from-accent-primary/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <button
            className={cn(
              'px-8 py-3 rounded-lg font-semibold',
              'border-2 border-accent-primary text-accent-primary',
              'hover:bg-accent-primary/10 transition-all',
              'text-sm sm:text-base'
            )}
          >
            Start Browsing Now
          </button>
        </motion.div>
      </div>
    </section>
  );
}
