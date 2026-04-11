'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  Forklift,
  GraduationCap,
  Cable,
  Warehouse,
  Wrench,
  ArrowRight,
  Phone,
  Shield,
  Clock,
  Award,
  Zap,
  Search,
  FileCheck,
  Truck,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AnimatedSection, StaggeredContainer, StaggeredChild } from '@/components/shared/AnimatedSection';
import { useChatStore } from '@/stores/chatStore';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const services = [
  {
    icon: Truck,
    title: 'Forklift Sales',
    description:
      'Quality used and new forklifts from the brands that matter most in narrow aisle operations. Every unit passes a rigorous multi-point inspection before it earns a spot on our floor.',
    points: [
      '50-75 reconditioned units in stock',
      'Raymond, Bendi/Landoll, Toyota, Crown & Hyster',
      'Multi-point mechanical inspection',
      '90-day full warranty included',
    ],
    cta: { label: 'Browse Inventory', href: '/inventory' },
    accent: 'from-accent-primary/20 to-accent-primary/5',
  },
  {
    icon: Clock,
    title: 'Equipment Rentals',
    description:
      'Short and long-term forklift rentals for seasonal surges, special projects, or while your equipment is being serviced. Flexible terms, no long-term lock-in.',
    points: [
      'Daily, weekly & monthly rates',
      'Narrow aisle specialists available',
      'Delivery & pickup included',
      'Rent-to-own options',
    ],
    cta: { label: 'Get Rental Quote', href: '/contact' },
    accent: 'from-accent-success/20 to-accent-success/5',
  },
  {
    icon: GraduationCap,
    title: 'OSHA Certification Training',
    description:
      'OSHA requires every forklift operator to be certified. We provide on-site and classroom training to keep your operators safe and your business fully compliant.',
    points: [
      'On-site training at your facility',
      '3-year OSHA certification issued',
      'Classroom + hands-on evaluation',
      'Available for all forklift types',
    ],
    cta: { label: 'Schedule Training', href: '/contact' },
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: Cable,
    title: 'Wire-Guided VNA Systems',
    description:
      'Our specialty. We design and install wire-guided Very Narrow Aisle systems that maximize storage density and eliminate steering errors — a true competitive advantage for 3PL operations.',
    points: [
      '30-40% more storage density',
      'Wire guidance eliminates steering error',
      'Reduced product & rack damage',
      'Full installation & commissioning',
    ],
    cta: { label: 'Learn More', href: '/contact' },
    accent: 'from-blue-400/20 to-blue-400/5',
  },
  {
    icon: Warehouse,
    title: 'Warehouse Racking',
    description:
      'Partnered with one of the largest racking installers in the United States. New and used racking solutions designed for your operation — from consultation through full installation.',
    points: [
      'Partnered with a top national installer',
      'New & used options available',
      'Custom design & layout consultation',
      'All racking types supported',
    ],
    cta: { label: 'Request Quote', href: '/contact' },
    accent: 'from-purple-400/20 to-purple-400/5',
  },
  {
    icon: Wrench,
    title: 'Technician Services',
    description:
      'Keep your fleet running at peak performance. Our experienced technicians handle routine maintenance, emergency breakdowns, and battery/charger service on-site.',
    points: [
      'Scheduled maintenance plans',
      'Emergency breakdown service',
      'Battery & charger reconditioning',
      'On-site service available',
    ],
    cta: { label: 'Request Service', href: '/contact' },
    accent: 'from-orange-400/20 to-orange-400/5',
  },
];

const whyChooseUs = [
  {
    icon: Shield,
    title: '27+ Years of Trust',
    description:
      'Nearly three decades in the narrow aisle business. We\'ve seen it all and we\'ve solved it all.',
    stat: '1996',
    statLabel: 'Founded',
  },
  {
    icon: Award,
    title: 'Transparent Pricing',
    description:
      'No games, no bait-and-switch. Every price is upfront on every listing. What you see is what you pay.',
    stat: '100%',
    statLabel: 'Upfront',
  },
  {
    icon: Zap,
    title: 'Fast Turnaround',
    description:
      '4-5 week lead times vs. the 8-12 week industry standard. We move at the speed of your business.',
    stat: '4-5',
    statLabel: 'Week Lead',
  },
  {
    icon: FileCheck,
    title: 'One-Stop Shop',
    description:
      'Equipment, training, wire-guided systems, racking, and service — everything your warehouse needs under one roof.',
    stat: '6',
    statLabel: 'Services',
  },
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function ServicesPage() {
  const openChat = useChatStore((state) => state.openChat);

  const heroContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const heroItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  return (
    <main className="bg-bg-primary">
      {/* ═══════════════════════════════════════
          HERO
          ═══════════════════════════════════════ */}
      <section className="relative w-full min-h-[60vh] flex items-center overflow-hidden -mt-16 lg:-mt-[72px] pt-16 lg:pt-[72px]">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 via-transparent to-bg-primary" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-accent-primary/3 rounded-full blur-3xl" />

        <div className="relative z-10 w-full px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto py-20 lg:py-28">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div variants={heroItem}>
              <span className="inline-block font-mono text-xs sm:text-sm tracking-widest uppercase text-accent-primary mb-6">
                Full-Service Equipment Solutions
              </span>
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="text-hero text-text-primary mb-6"
            >
              Services Built for{' '}
              <span className="gradient-text-yellow">Your Warehouse</span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed mb-10"
            >
              From acquisition to maintenance, training to installation — we&apos;ve
              been solving warehouse challenges for 27+ years. One call handles it all.
            </motion.p>

            <motion.div
              variants={heroItem}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/contact"
                className={cn(
                  'px-8 py-4 rounded-lg font-semibold text-bg-primary',
                  'bg-accent-primary hover:bg-accent-glow transition-colors',
                  'shadow-glow-yellow hover:shadow-glow-yellow-lg',
                  'text-sm sm:text-base inline-flex items-center gap-2'
                )}
              >
                Get a Free Quote <ArrowRight size={16} />
              </Link>
              <a
                href="tel:9735001010"
                className={cn(
                  'px-8 py-4 rounded-lg font-semibold',
                  'border-2 border-white/10 text-text-primary',
                  'hover:border-accent-primary/30 hover:bg-white/5 transition-all',
                  'text-sm sm:text-base inline-flex items-center gap-2'
                )}
              >
                <Phone size={16} className="text-accent-primary" />
                (973) 500-1010
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SERVICES GRID
          ═══════════════════════════════════════ */}
      <section className="pt-10 pb-20 lg:pt-14 lg:pb-28">
        <div className="px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block font-mono text-2xl tracking-widest uppercase text-accent-primary mb-4">
              What We Do
            </span>
            <h2 className="text-section text-text-primary mb-4">
              Solutions for Every Warehouse Need
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Each service is backed by decades of hands-on experience and a commitment
              to getting the job done right the first time.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <AnimatedSection key={service.title} delay={index * 0.1}>
                <div className="card-dark card-dark-hover h-full flex flex-col p-0 overflow-hidden group">
                  {/* Gradient top accent */}
                  <div className={cn('h-1 bg-gradient-to-r', service.accent)} />

                  <div className="p-6 lg:p-8 flex-1 flex flex-col">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-5 group-hover:bg-accent-primary/20 transition-colors">
                      <service.icon size={22} className="text-accent-primary" />
                    </div>

                    {/* Title */}
                    <h3 className="text-card-title text-text-primary mb-3">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-text-secondary text-sm leading-relaxed mb-6">
                      {service.description}
                    </p>

                    {/* Key Points */}
                    <div className="space-y-2.5 mb-6 flex-1">
                      {service.points.map((point) => (
                        <div key={point} className="flex items-start gap-2.5">
                          <CheckCircle2 size={15} className="text-accent-success mt-0.5 shrink-0" />
                          <span className="text-text-secondary text-sm">{point}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link
                      href={service.cta.href}
                      className="inline-flex items-center gap-2 text-accent-primary font-semibold text-sm group-hover:gap-3 transition-all"
                    >
                      {service.cta.label} <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHY CHOOSE US
          ═══════════════════════════════════════ */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-bg-secondary" />
        <div className="absolute inset-0 bg-grid-dark" />

        <div className="relative px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2
              className="font-bold text-text-primary mb-4 leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
            >
              Why{' '}
              <span className="gradient-text-yellow">Material Solutions?</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              We don&apos;t just provide services. We build relationships that help
              your operation grow.
            </p>
          </AnimatedSection>

          <StaggeredContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {whyChooseUs.map((item) => (
              <StaggeredChild key={item.title}>
                <div className="card-dark card-dark-hover p-6 lg:p-8 text-center h-full">
                  {/* Stat */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-accent-primary font-mono">
                      {item.stat}
                    </span>
                    <span className="block text-xs text-text-tertiary uppercase tracking-wider mt-1">
                      {item.statLabel}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon size={22} className="text-accent-primary" />
                  </div>

                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </StaggeredChild>
            ))}
          </StaggeredContainer>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════ */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-bg-primary to-accent-secondary/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-primary/5 rounded-full blur-3xl" />

        <div className="relative px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto text-center">
          <AnimatedSection>
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
              Let&apos;s Get Started
            </span>
            <h2 className="text-section text-text-primary mb-4">
              Ready to Upgrade Your Operation?
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-10">
              Tell us what you need and we&apos;ll put together a custom solution.
              No pressure, no obligation — just straight talk from people who know warehouses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className={cn(
                  'px-8 py-4 rounded-lg font-semibold text-bg-primary',
                  'bg-accent-primary hover:bg-accent-glow transition-colors',
                  'shadow-glow-yellow hover:shadow-glow-yellow-lg',
                  'inline-flex items-center gap-2'
                )}
              >
                Get a Free Quote <ArrowRight size={16} />
              </Link>
              <button
                onClick={openChat}
                className={cn(
                  'px-8 py-4 rounded-lg font-semibold',
                  'border-2 border-accent-primary text-accent-primary',
                  'hover:bg-accent-primary/10 hover:shadow-glow-yellow transition-all',
                  'inline-flex items-center gap-2 justify-center'
                )}
              >
                <MessageSquare size={16} />
                Talk to David
              </button>
              <a
                href="tel:9735001010"
                className={cn(
                  'px-8 py-4 rounded-lg font-semibold',
                  'border-2 border-white/10 text-text-primary',
                  'hover:border-white/20 hover:bg-white/5 transition-all',
                  'inline-flex items-center gap-2 justify-center'
                )}
              >
                <Phone size={16} />
                (973) 500-1010
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
