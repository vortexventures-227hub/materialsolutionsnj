'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Clock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import CountUp from '@/components/shared/CountUp';

interface StatItem {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  {
    icon: <Award className="w-8 h-8" />,
    value: 27,
    suffix: '+',
    label: 'Years in Business',
  },
  {
    icon: <Zap className="w-8 h-8" />,
    value: 1000,
    suffix: '+',
    label: 'Units Sold',
  },
  {
    icon: <Clock className="w-8 h-8" />,
    value: 24,
    suffix: '/7',
    label: 'David AI Available',
  },
  {
    icon: <Heart className="w-8 h-8" />,
    value: 100,
    suffix: '%',
    label: 'Satisfaction Guarantee',
  },
];

export default function StatsBar() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

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
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section
      ref={containerRef}
      className="w-full bg-bg-secondary py-8 sm:py-12 lg:py-6"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-3 text-accent-primary">{stat.icon}</div>
              <div className="mb-2">
                <span className="font-mono text-3xl sm:text-4xl font-bold text-accent-primary">
                  {isVisible && (
                    <CountUp
                      target={stat.value}
                      suffix={stat.suffix}
                      duration={2}
                    />
                  )}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary font-medium">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
