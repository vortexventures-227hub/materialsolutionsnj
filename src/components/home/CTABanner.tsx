'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useChatStore } from '@/stores/chatStore';

export default function CTABanner() {
  const openChat = useChatStore((state) => state.openChat);
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="relative w-full overflow-hidden bg-bg-primary py-16 sm:py-24 lg:py-32">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'linear-gradient(135deg, rgba(232, 184, 0, 0.1) 0%, rgba(232, 184, 0, 0.05) 50%, rgba(232, 184, 0, 0.1) 100%)',
        }}
      />

      {/* Animated gradient shift background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(232, 184, 0, 0.15) 0%, transparent 50%)',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(0deg, transparent 24%, rgba(232, 184, 0, 0.05) 25%, rgba(232, 184, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(232, 184, 0, 0.05) 75%, rgba(232, 184, 0, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(232, 184, 0, 0.05) 25%, rgba(232, 184, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(232, 184, 0, 0.05) 75%, rgba(232, 184, 0, 0.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Heading */}
        <motion.h2
          variants={itemVariants}
          className="text-section font-bold text-text-primary mb-6"
        >
          Ready to Find Your Next Forklift?
        </motion.h2>

        {/* Subtext */}
        <motion.p
          variants={itemVariants}
          className="text-text-secondary text-lg max-w-2xl mx-auto mb-10"
        >
          Browse our current inventory or let David help you narrow down the right machine. 27+ years
          of expertise, honest pricing, and a direct path to David chat or the team.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/inventory"
            className={cn(
              'px-8 py-4 rounded-lg font-semibold',
              'bg-accent-primary text-bg-primary',
              'hover:bg-accent-glow transition-all',
              'shadow-glow-yellow hover:shadow-glow-yellow-lg',
              'text-sm sm:text-base'
            )}
          >
            Browse Inventory
          </Link>

          <button
            onClick={openChat}
            className={cn(
              'px-8 py-4 rounded-lg font-semibold',
              'border-2 border-accent-primary text-accent-primary',
              'hover:bg-accent-primary/10 transition-all',
              'text-sm sm:text-base'
            )}
          >
            Talk to David
          </button>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex items-center justify-center gap-8 text-sm text-text-secondary flex-wrap"
        >
          <span>✓ Current Inventory Data</span>
          <span>✓ Fair Pricing</span>
          <span>✓ Fast Delivery</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
