'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  Clock,
  Award,
  Target,
  Wrench,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Heart,
  Handshake,
  Building2,
  TrendingUp,
  Users,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AnimatedSection, StaggeredContainer, StaggeredChild } from '@/components/shared/AnimatedSection';
import { CONTACT_DETAILS } from '@/lib/contactDetails';
import { useChatStore } from '@/stores/chatStore';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const stats = [
  { value: '27+', label: 'Years in Business', icon: Clock },
  { value: 'Live', label: 'Listings Updated', icon: Building2 },
  { value: '1000+', label: 'Units Sold', icon: TrendingUp },
  { value: '3', label: 'Trusted Brands', icon: Award },
];

const milestones = [
  {
    year: '1996',
    title: 'Founded in New Jersey',
    description:
      'Bill launches Material Solutions with a singular focus: honest equipment, fair prices, and service that earns trust.',
  },
  {
    year: '2003',
    title: 'Narrow Aisle Specialization',
    description:
      'Doubled down on Raymond, Crown, and Toyota reach trucks and order pickers — becoming the region\'s go-to narrow aisle experts.',
  },
  {
    year: '2008',
    title: 'OSHA Training Services',
    description:
      'Added certified forklift operator training to serve the full lifecycle of customers\' warehouse operations.',
  },
  {
    year: '2013',
    title: 'Wire-Guided Systems Division',
    description:
      'Pioneered wire-guided aisle installation in the tri-state area, helping warehouses unlock 30-40% more storage density.',
  },
  {
    year: '2018',
    title: 'Warehouse Racking Solutions',
    description:
      'Expanded into racking design, supply, and installation — giving customers a true one-stop material handling partner.',
  },
  {
    year: '2025',
    title: 'Digital Buyer Support',
    description:
      'Launched David to help buyers browse listings, ask equipment questions, and reach the team faster after hours.',
  },
];

const values = [
  {
    icon: Shield,
    title: 'Quality Without Compromise',
    description:
      'Every unit goes through a rigorous multi-point inspection and reconditioning process before it earns a spot on our floor. We sell what we\'d use ourselves.',
  },
  {
    icon: Target,
    title: 'Transparent Pricing',
    description:
      'No games, no bait-and-switch. Every price is listed upfront on every listing. What you see is what you pay — we built our reputation on that.',
  },
  {
    icon: Heart,
    title: 'Relationship Over Transaction',
    description:
      'We\'re not optimizing for a single sale. We\'re building partnerships that span decades. Most of our business comes from repeat customers and referrals.',
  },
  {
    icon: Wrench,
    title: 'Specialist Knowledge',
    description:
      'Narrow aisle equipment is all we do. That focus means we know Raymond, Crown, and Toyota machines inside and out — and we pass that expertise to you.',
  },
];

const differentiators = [
  '27+ years in the narrow aisle business',
  'Current listings updated regularly',
  '4-5 week lead time vs. industry standard 8-12',
  '90-day full warranty, 6-month major, 1-year battery',
  'Free delivery across NJ, PA, and NYC metro',
  'Financing and lease-to-own options available',
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function AboutPage() {
  const openChat = useChatStore((state) => state.openChat);
  const phoneContact = CONTACT_DETAILS.find((detail) => detail.icon === 'phone');
  const emailContact = CONTACT_DETAILS.find((detail) => detail.icon === 'mail');
  const phoneHref = phoneContact?.href ?? emailContact?.href;
  const phoneLabel = phoneContact?.primary ?? emailContact?.primary ?? 'info@materialsolutionsnj.com';
  const emailHref = emailContact?.href;
  const emailLabel = emailContact?.primary ?? 'Email Us';

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
      <section className="relative w-full min-h-[65vh] flex items-center overflow-hidden -mt-16 lg:-mt-[72px] pt-16 lg:pt-[72px]">
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 via-transparent to-bg-primary" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-accent-primary/3 rounded-full blur-3xl" />

        <div className="relative z-10 w-full px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto py-20 lg:py-28">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
            className="max-w-4xl"
          >
            <motion.div variants={heroItem}>
              <span className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm tracking-widest uppercase text-accent-primary mb-6">
                <Clock size={14} />
                Serving the Tri-State Area Since 1996
              </span>
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="text-hero text-text-primary mb-6"
            >
              Built on Trust.
              <br />
              <span className="gradient-text-yellow">Driven by Service.</span>
              <br />
              <span className="gradient-text-yellow">Over 27 Years Strong.</span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed mb-10"
            >
              Material Solutions NJ is the tri-state area&apos;s premier narrow aisle
              forklift specialist. For nearly 3 decades, we&apos;ve been the partner
              warehouses trust for quality reconditioned equipment, competitive pricing, and
              service that goes the distance.
            </motion.p>

            {/* Stats Bar */}
            <motion.div
              variants={heroItem}
              className="pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <stat.icon size={18} className="text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary font-mono">
                      {stat.value}
                    </p>
                    <p className="text-xs text-text-tertiary">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          OUR STORY
          ═══════════════════════════════════════ */}
      <section className="py-20 lg:py-28">
        <div className="px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Story Text */}
            <AnimatedSection direction="left">
              {/* TODO: Update to include Greg as co-founder alongside Bill. Sit down with Bill to get Greg's story. */}
              <span className="inline-block font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
                Our Story
              </span>
              <h2 className="text-section text-text-primary mb-6">
                From One Man&apos;s Vision to the Region&apos;s{' '}
                <span className="gradient-text-yellow">Trusted Partner</span>
              </h2>
              <div className="space-y-5 text-text-secondary leading-relaxed">
                <p>
                  In 1996, Bill started Material Solutions with a straightforward
                  belief: warehouse operators deserved better than what the equipment
                  market was giving them. Too many hidden costs. Too many machines that
                  looked good on paper but fell apart on the floor. Too little honesty.
                </p>
                <p>
                  He set out to change that. Starting with a handful of reconditioned
                  narrow aisle forklifts and a commitment to transparency, Bill built
                  the business one relationship at a time. No advertising gimmicks, no
                  pressure tactics — just quality machines at fair prices, backed by
                  someone who would answer the phone when something went wrong.
                </p>
                <p>
                  Twenty-seven years later, that approach has grown Material Solutions
                  into one of the tri-state area&apos;s most respected names in material
                  handling. Our current listings regularly include Raymond, Toyota,
                  Crown, and other warehouse equipment, alongside OSHA training,
                  wire-guided systems, and warehouse racking support. But the
                  foundation hasn&apos;t changed.
                </p>
                <p className="text-text-primary font-semibold text-lg border-l-2 border-accent-primary pl-4">
                  We still believe the best business is built on handshakes, not
                  hard sells. And we still pick up the phone.
                </p>
              </div>
            </AnimatedSection>

            {/* Bill White Card */}
            <AnimatedSection direction="right" className="lg:sticky lg:top-32">
              <div className="card-dark overflow-hidden">
                <div className="bg-gradient-to-br from-bg-tertiary to-bg-secondary p-8 lg:p-10">
                  <span className="badge-dark badge-ai text-xs mb-6 inline-flex">
                    Founder & Owner
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                    Bill
                  </h3>
                  <p className="text-text-tertiary text-lg mb-6">
                    27+ years of narrow aisle expertise
                  </p>
                  <p className="text-text-secondary leading-relaxed mb-8">
                    Bill has personally overseen the sale and reconditioning of
                    thousands of forklifts. His hands-on knowledge of Raymond, Crown,
                    and Toyota equipment is unmatched in the region. When you call
                    Material Solutions, you&apos;ll reach a team that can help you get
                    the right equipment information and next steps for your operation.
                  </p>
                  <div className="space-y-3">
                    <a
                      href={phoneHref}
                      className="flex items-center gap-3 text-text-primary hover:text-accent-primary transition-colors"
                    >
                      <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Phone size={16} className="text-accent-primary" />
                      </span>
                      <span>
                        <span className="block text-xs text-text-tertiary font-medium uppercase tracking-wider">Phone</span>
                        <span className="font-semibold">{phoneLabel}</span>
                      </span>
                    </a>
                    <a
                      href={emailHref}
                      className="flex items-center gap-3 text-text-primary hover:text-accent-primary transition-colors"
                    >
                      <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <Mail size={16} className="text-accent-primary" />
                      </span>
                      <span>
                        <span className="block text-xs text-text-tertiary font-medium uppercase tracking-wider">Email</span>
                        <span className="font-semibold">{emailLabel}</span>
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          TIMELINE
          ═══════════════════════════════════════ */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-bg-secondary" />
        <div className="absolute inset-0 bg-grid-dark" />

        <div className="relative px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
              Our Journey
            </span>
            <h2 className="text-section text-text-primary mb-4">
              27 Years of Milestones
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              From a small forklift operation to a full-service material handling
              partner — every step driven by what our customers needed.
            </p>
          </AnimatedSection>

          <div className="relative">
            {/* Center line (desktop) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />

            <div className="space-y-8 lg:space-y-12">
              {milestones.map((milestone, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <AnimatedSection
                    key={milestone.year}
                    direction={isLeft ? 'left' : 'right'}
                    delay={index * 0.1}
                  >
                    <div className="relative lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                      {/* Desktop card */}
                      <div
                        className={cn(
                          'hidden lg:block',
                          isLeft ? 'text-right pr-12' : 'order-2 pl-12',
                        )}
                      >
                        <div className="card-dark card-dark-hover p-6">
                          <span className="text-sm font-bold text-accent-primary tracking-wider font-mono">
                            {milestone.year}
                          </span>
                          <h3 className="text-lg font-semibold text-text-primary mt-1 mb-2">
                            {milestone.title}
                          </h3>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {milestone.description}
                          </p>
                        </div>
                      </div>

                      {/* Center dot */}
                      <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-accent-primary items-center justify-center shadow-glow-yellow z-10">
                        <span className="text-xs font-bold text-bg-primary font-mono">
                          {milestone.year.slice(2)}
                        </span>
                      </div>

                      <div
                        className={cn(
                          'hidden lg:block',
                          isLeft ? 'order-2 pl-12' : 'text-right pr-12',
                        )}
                      />

                      {/* Mobile layout */}
                      <div className="lg:hidden flex gap-4">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center shadow-glow-yellow">
                            <span className="text-xs font-bold text-bg-primary font-mono">
                              {milestone.year.slice(2)}
                            </span>
                          </div>
                          {index < milestones.length - 1 && (
                            <div className="w-px flex-1 bg-white/10 my-2" />
                          )}
                        </div>
                        <div className="card-dark p-5 flex-1 mb-0">
                          <span className="text-sm font-bold text-accent-primary tracking-wider font-mono">
                            {milestone.year}
                          </span>
                          <h3 className="text-lg font-semibold text-text-primary mt-1 mb-2">
                            {milestone.title}
                          </h3>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          VALUES
          ═══════════════════════════════════════ */}
      <section className="py-20 lg:py-28">
        <div className="px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
              Our Values
            </span>
            <h2 className="text-section text-text-primary mb-4">
              What We Stand For
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              These aren&apos;t words on a wall. They&apos;re the principles we
              operate by every single day — and the reason customers keep coming back.
            </p>
          </AnimatedSection>

          <StaggeredContainer className="grid md:grid-cols-2 gap-6" staggerDelay={0.1}>
            {values.map((value) => (
              <StaggeredChild key={value.title}>
                <div className="card-dark card-dark-hover p-6 lg:p-8 h-full">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-5">
                    <value.icon size={22} className="text-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary mb-3">
                    {value.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </StaggeredChild>
            ))}
          </StaggeredContainer>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          DIFFERENTIATORS
          ═══════════════════════════════════════ */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-bg-secondary" />
        <div className="absolute inset-0 bg-grid-dark" />

        <div className="relative px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection direction="left">
              <span className="inline-block font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
                Why Material Solutions
              </span>
              <h2 className="text-section text-text-primary mb-6">
                The Difference is in{' '}
                <span className="gradient-text-yellow">the Details</span>
              </h2>
              <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                We&apos;re not a generalist dealer trying to be everything to everyone.
                We&apos;re narrow aisle specialists who have spent 27 years perfecting
                one thing: getting the right reconditioned forklift into your warehouse,
                fast, at a price that makes sense.
              </p>
              <ul className="space-y-4">
                {differentiators.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-accent-success mt-0.5 shrink-0" />
                    <span className="text-text-primary font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </AnimatedSection>

            <AnimatedSection direction="right" className="space-y-5">
              {/* Brand cards */}
              <div className="card-dark p-6 gradient-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <Award size={22} className="text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      Raymond, Crown & Toyota
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      We exclusively carry the three most trusted names in narrow aisle
                      equipment. Every unit is reconditioned to our standards — mechanically
                      sound and operationally ready.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-dark p-6 gradient-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={22} className="text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      NJ, PA & NYC Metro Coverage
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      Free delivery across the entire tri-state service area. From
                      central New Jersey to the Pennsylvania border to the five boroughs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-dark p-6 gradient-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles size={22} className="text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      Used & Reconditioned Only
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      New forklifts are overpriced and backordered. Our reconditioned
                      units deliver the same performance at a fraction of the cost, with
                      lead times 2-3x faster.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
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
              Let&apos;s Work Together
            </span>
            <h2 className="text-section text-text-primary mb-4">
              Ready to Find Your Equipment?
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Whether you need a single reach truck or a fleet of order pickers,
              Bill and the team are ready to help. Browse our inventory online or
              give us a call — we&apos;ll find the right fit for your operation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/inventory"
                className={cn(
                  'px-8 py-4 rounded-lg font-semibold text-bg-primary',
                  'bg-accent-primary hover:bg-accent-glow transition-colors',
                  'shadow-glow-yellow hover:shadow-glow-yellow-lg',
                  'inline-flex items-center gap-2'
                )}
              >
                Browse Inventory <ArrowRight size={16} />
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
                href={phoneHref}
                className={cn(
                  'px-8 py-4 rounded-lg font-semibold',
                  'border-2 border-white/10 text-text-primary',
                  'hover:border-white/20 hover:bg-white/5 transition-all',
                  'inline-flex items-center gap-2 justify-center'
                )}
              >
                <Phone size={16} />
                {phoneLabel}
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
