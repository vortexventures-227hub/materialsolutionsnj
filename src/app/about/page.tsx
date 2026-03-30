import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Clock,
  Award,
  Users,
  Target,
  Wrench,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Building2,
  TrendingUp,
  Heart,
  Handshake,
} from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Material Solutions NJ — 29+ years of honest equipment, fair prices, and service that earns trust. Meet Bill White and learn our story as New Jersey\'s premier narrow aisle forklift specialists.',
  openGraph: {
    title: 'About Us | Material Solutions NJ',
    description:
      'Meet the team behind 29+ years of trusted forklift sales, OSHA training, wire-guided systems, and warehouse racking in New Jersey.',
  },
};

const milestones = [
  {
    year: '1997',
    title: 'Founded in New Jersey',
    description:
      'Bill White launches Material Solutions with a singular focus: honest equipment, fair prices, and service that earns trust.',
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
      'Added certified forklift operator training to serve the full lifecycle of our customers\' warehouse operations.',
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
    title: 'AI-Powered Customer Experience',
    description:
      'Launched David, our AI equipment specialist, making 29 years of expertise available 24/7 to every customer.',
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
  { label: '29+ years in the narrow aisle business', icon: Clock },
  { label: '~75 reconditioned units in stock at all times', icon: Building2 },
  { label: '4-5 week lead time vs. industry standard 8-12', icon: TrendingUp },
  { label: '90-day full warranty, 6-month major, 1-year battery', icon: Shield },
  { label: 'Free delivery across NJ, PA, and NYC metro', icon: MapPin },
  { label: 'Financing and lease-to-own options available', icon: Handshake },
];

const stats = [
  { value: '29+', label: 'Years in Business' },
  { value: '~75', label: 'Units in Stock' },
  { value: '3', label: 'Trusted Brands' },
  { value: '1000+', label: 'Units Sold' },
];

export default function AboutPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden gradient-hero">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl" />
        </div>

        <Container className="relative py-20 lg:py-32 xl:py-40">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
              <Clock size={14} className="text-primary-400" />
              <span className="text-sm text-secondary-300 font-medium">
                Serving the Tri-State Area Since 1997
              </span>
            </div>

            <h1 className="text-display-lg md:text-display-xl text-white mb-6">
              Built on Trust.{' '}
              <span className="gradient-text">Driven by Service.</span>
              <br />
              29 Years Strong.
            </h1>

            <p className="text-lg md:text-xl text-secondary-400 max-w-2xl mb-10 leading-relaxed">
              Material Solutions is New Jersey&apos;s premier narrow aisle forklift
              specialist. For nearly three decades, we&apos;ve been the partner
              warehouses trust for quality reconditioned equipment, honest pricing,
              and service that goes the distance.
            </p>

            {/* Stats Bar */}
            <div className="mt-4 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl md:text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-secondary-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          OUR STORY
          ═══════════════════════════════════════════ */}
      <Section background="white">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-200 mb-4">
              Our Story
            </span>
            <h2 className="text-display-md text-secondary-900 mb-6">
              From One Man&apos;s Vision to the Region&apos;s{' '}
              <span className="gradient-text">Trusted Partner</span>
            </h2>
            <div className="space-y-5 text-body-lg text-secondary-500 leading-relaxed">
              <p>
                In 1997, Bill White started Material Solutions with a straightforward
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
                Twenty-nine years later, that approach has grown Material Solutions
                into one of the tri-state area&apos;s most respected names in material
                handling. We carry roughly 75 reconditioned units from Raymond,
                Toyota, and Crown at any given time. We&apos;ve expanded into OSHA
                training, wire-guided systems, and warehouse racking. But the
                foundation hasn&apos;t changed.
              </p>
              <p className="text-secondary-900 font-semibold">
                We still believe the best business is built on handshakes, not
                hard sells. And we still pick up the phone.
              </p>
            </div>
          </div>

          {/* Leadership Card */}
          <div className="lg:sticky lg:top-32">
            <Card padding="none" className="overflow-hidden">
              <div className="bg-gradient-to-br from-secondary-900 to-secondary-800 p-8 lg:p-10">
                <Badge variant="primary" className="mb-6">
                  Founder &amp; Owner
                </Badge>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  Bill White
                </h3>
                <p className="text-secondary-400 text-lg mb-6">
                  29 years of narrow aisle expertise
                </p>
                <p className="text-secondary-300 leading-relaxed mb-8">
                  Bill has personally overseen the sale and reconditioning of
                  thousands of forklifts. His hands-on knowledge of Raymond, Crown,
                  and Toyota equipment is unmatched in the region. When you call
                  Material Solutions, you&apos;re getting direct access to one of the
                  most experienced narrow aisle specialists in the Northeast.
                </p>
                <div className="space-y-3">
                  <a
                    href="tel:+19735001010"
                    className="flex items-center gap-3 text-white hover:text-primary-400 transition-colors"
                  >
                    <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={16} />
                    </span>
                    <span>
                      <span className="block text-xs text-secondary-500 font-medium uppercase tracking-wider">Phone</span>
                      <span className="font-semibold">(973) 500-1010</span>
                    </span>
                  </a>
                  <a
                    href="mailto:bwhite@materialsolutions.com"
                    className="flex items-center gap-3 text-white hover:text-primary-400 transition-colors"
                  >
                    <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Mail size={16} />
                    </span>
                    <span>
                      <span className="block text-xs text-secondary-500 font-medium uppercase tracking-wider">Email</span>
                      <span className="font-semibold">bwhite@materialsolutions.com</span>
                    </span>
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          TIMELINE
          ═══════════════════════════════════════════ */}
      <Section background="muted">
        <SectionHeader
          badge="Our Journey"
          title="29 Years of Milestones"
          subtitle="From a small forklift operation to a full-service material handling partner — every step driven by what our customers needed."
        />

        <div className="relative">
          {/* Center line (desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-secondary-200" />

          <div className="space-y-8 lg:space-y-12">
            {milestones.map((milestone, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div
                  key={milestone.year}
                  className={cn(
                    'relative lg:grid lg:grid-cols-2 lg:gap-12 items-center',
                  )}
                >
                  {/* Desktop: alternating layout */}
                  <div
                    className={cn(
                      'hidden lg:block',
                      isLeft ? 'text-right pr-12' : 'order-2 pl-12',
                    )}
                  >
                    <Card padding="lg" hover>
                      <span className="text-sm font-bold text-primary-600 tracking-wider">
                        {milestone.year}
                      </span>
                      <h3 className="text-heading text-secondary-900 mt-1 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-secondary-500 leading-relaxed">
                        {milestone.description}
                      </p>
                    </Card>
                  </div>

                  {/* Center dot (desktop) */}
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary-500 items-center justify-center shadow-glow-orange z-10">
                    <span className="text-xs font-bold text-white">
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
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shadow-glow-orange">
                        <span className="text-xs font-bold text-white">
                          {milestone.year.slice(2)}
                        </span>
                      </div>
                      {index < milestones.length - 1 && (
                        <div className="w-px flex-1 bg-secondary-200 my-2" />
                      )}
                    </div>
                    <Card padding="lg" className="flex-1 mb-0">
                      <span className="text-sm font-bold text-primary-600 tracking-wider">
                        {milestone.year}
                      </span>
                      <h3 className="text-heading text-secondary-900 mt-1 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-secondary-500 leading-relaxed">
                        {milestone.description}
                      </p>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          VALUES
          ═══════════════════════════════════════════ */}
      <Section background="white">
        <SectionHeader
          badge="Our Values"
          title="What We Stand For"
          subtitle="These aren't words on a wall. They're the principles we operate by every single day — and the reason customers keep coming back."
        />

        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value) => (
            <Card key={value.title} hover padding="lg" className="h-full">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-6">
                <value.icon size={24} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                {value.title}
              </h3>
              <p className="text-secondary-500 leading-relaxed">
                {value.description}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          DIFFERENTIATORS
          ═══════════════════════════════════════════ */}
      <Section background="muted">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-200 mb-4">
              Why Material Solutions
            </span>
            <h2 className="text-display-md text-secondary-900 mb-6">
              The Difference is in{' '}
              <span className="gradient-text">the Details</span>
            </h2>
            <p className="text-body-lg text-secondary-500 mb-8">
              We&apos;re not a generalist dealer trying to be everything to everyone.
              We&apos;re narrow aisle specialists who have spent 29 years perfecting
              one thing: getting the right reconditioned forklift into your warehouse,
              fast, at a price that makes sense.
            </p>
            <ul className="space-y-4">
              {differentiators.map(({ label, icon: Icon }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center">
                    <Icon size={13} className="text-primary-600" />
                  </span>
                  <span className="text-secondary-700 font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <Card padding="lg" className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-secondary-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Award size={22} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Raymond, Crown &amp; Toyota
                  </h3>
                  <p className="text-secondary-400 text-sm leading-relaxed">
                    We exclusively carry the three most trusted names in narrow aisle
                    equipment. Every unit is reconditioned to our standards — not
                    factory cosmetic, but mechanically sound and operationally ready.
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="lg" className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-secondary-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Users size={22} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    NJ, PA &amp; NYC Metro Coverage
                  </h3>
                  <p className="text-secondary-400 text-sm leading-relaxed">
                    Free delivery across the entire tri-state service area. From
                    central New Jersey to the Pennsylvania border to the five boroughs
                    — we&apos;ll get your equipment to you.
                  </p>
                </div>
              </div>
            </Card>
            <Card padding="lg" className="bg-gradient-to-br from-secondary-900 to-secondary-800 border-secondary-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={22} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Used &amp; Reconditioned Only
                  </h3>
                  <p className="text-secondary-400 text-sm leading-relaxed">
                    New forklifts are overpriced and backordered. Our reconditioned
                    units deliver the same performance at a fraction of the cost, with
                    lead times 2-3x faster than ordering new.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="gradient-primary">
          <Container className="py-16 lg:py-24 text-center relative">
            <Badge variant="primary" className="bg-white/10 text-white ring-white/20 mb-6">
              Let&apos;s Work Together
            </Badge>
            <h2 className="text-display-md text-white mb-4">
              Ready to Find Your Equipment?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Whether you need a single reach truck or a fleet of order pickers,
              Bill and the team are ready to help. Browse our inventory online or
              give us a call — we&apos;ll find the right fit for your operation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/inventory"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-sm"
              >
                Browse Inventory
                <ArrowRight size={18} />
              </Link>
              <a
                href="tel:+19735001010"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 transition-colors"
              >
                <Phone size={16} />
                (973) 500-1010
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </Container>
        </div>
      </section>
    </>
  );
}
