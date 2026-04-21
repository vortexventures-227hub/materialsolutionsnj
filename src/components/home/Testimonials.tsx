'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  company: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      'Material Solutions helped us find the perfect reach truck for our warehouse. David made the whole process incredibly smooth—no pressure, just honest advice.',
    author: 'Michael Rodriguez',
    company: 'Metro Logistics Inc.',
    role: 'Operations Manager',
  },
  {
    id: 2,
    quote:
      "We've worked with Material Solutions for years. Their equipment is reliable, their pricing is fair, and their service is unmatched. Highly recommended.",
    author: 'Sarah Chen',
    company: 'Northeast Warehouse Co.',
    role: 'Facility Director',
  },
  {
    id: 3,
    quote:
      "The equipment notes helped us spot the right fit quickly. We got a clear assessment of the machine and next steps without the sales pitch.",
    author: 'James Patterson',
    company: 'Crown Distribution',
    role: 'Purchasing Manager',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoplay]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setAutoplay(false);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="relative w-full bg-bg-secondary py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-section font-bold text-text-primary mb-4">
            What Our Customers Say
          </h2>
          <p className="text-text-secondary">
            See why businesses trust Material Solutions NJ
          </p>
        </motion.div>

        {/* Testimonial Card */}
        <div className="relative">
          {/* Large Quotation Mark */}
          <div className="absolute -top-8 -left-4 sm:-left-8 opacity-10 pointer-events-none">
            <svg
              className="w-20 h-20 sm:w-32 sm:h-32 text-accent-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-4.716-5-7-5-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3-7 1.75-7 5c0 7 4 8 7 8zm14 0c3 0 7-1 7-8V5c0-1.25-4.716-5-7-5-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3-7 1.75-7 5c0 7 4 8 7 8z" />
            </svg>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className={cn(
                'rounded-2xl border border-white/[0.1]',
                'bg-bg-primary p-8 sm:p-12',
                'shadow-card-dark'
              )}
            >
              {/* Quote */}
              <p className="mb-8 text-lg sm:text-xl text-text-primary italic font-light leading-relaxed">
                &ldquo;{current.quote}&rdquo;
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-bg-primary font-bold text-lg">
                  {current.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">
                    {current.author}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {current.role} • {current.company}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Dots */}
        <div className="mt-8 flex justify-center gap-3">
          {testimonials.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-accent-primary w-8'
                  : 'bg-white/[0.2] hover:bg-white/[0.4]'
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
        </div>

        {/* Auto-play Toggle Hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-tertiary">
            {autoplay ? 'Auto-rotating' : 'Click dots to navigate'}
          </p>
        </div>
      </div>
    </section>
  );
}
