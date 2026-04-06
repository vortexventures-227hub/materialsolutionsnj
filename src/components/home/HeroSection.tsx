'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useChatStore } from '@/stores/chatStore';

export default function HeroSection() {
  const openChat = useChatStore((state) => state.openChat);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const scrollIndicatorVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 1.2 },
    },
    animate: {
      y: [0, 8, 0],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <section className="relative w-full h-screen overflow-hidden bg-bg-primary -mt-16 lg:-mt-[72px]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(0deg, transparent 24%, rgba(232, 184, 0, 0.05) 25%, rgba(232, 184, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(232, 184, 0, 0.05) 75%, rgba(232, 184, 0, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(232, 184, 0, 0.05) 25%, rgba(232, 184, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(232, 184, 0, 0.05) 75%, rgba(232, 184, 0, 0.05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 via-transparent to-bg-primary" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-5xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="mb-6 text-center">
            <span className="inline-block font-mono text-xs sm:text-sm tracking-widest uppercase text-accent-primary">
              AI-Powered Equipment Solutions
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="mb-6 text-center text-hero font-bold text-text-primary leading-tight"
          >
            The Future of Forklift Sales
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="mb-10 text-center text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Every machine instantly analyzed by AI. Get honest appraisals in seconds. Chat with David, our AI specialist, to find exactly what you need.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/inventory"
              className={cn(
                'px-8 py-3 sm:py-4 rounded-lg font-semibold text-bg-primary',
                'bg-accent-primary hover:bg-accent-glow transition-colors',
                'shadow-glow-yellow hover:shadow-glow-yellow-lg',
                'text-sm sm:text-base'
              )}
            >
              Browse Inventory
            </Link>

            <button
              onClick={openChat}
              className={cn(
                'px-8 py-3 sm:py-4 rounded-lg font-semibold',
                'border-2 border-accent-ai text-accent-ai',
                'hover:shadow-glow-yellow transition-all hover:bg-accent-ai/10',
                'text-sm sm:text-base'
              )}
            >
              Talk to David
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          variants={scrollIndicatorVariants}
          initial="hidden"
          animate={['visible', 'animate']}
        >
          <ChevronDown className="w-6 h-6 text-accent-primary" />
        </motion.div>
      </div>
    </section>
  );
}
