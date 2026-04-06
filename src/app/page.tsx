import Link from 'next/link';
import {
  Shield,
  Clock,
  Award,
  Truck,
  CheckCircle,
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Cable,
  Warehouse,
  Phone,
  MessageCircle,
  Star,
  Zap,
  Ruler,
  Weight,
  ChevronRight,
} from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DavidHero } from '@/components/david/DavidHero';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const trustSignals = [
  { icon: Clock, value: '29+', label: 'Years in Business' },
  { icon: Shield, value: '75+', label: 'Units in Stock' },
  { icon: Award, value: '3', label: 'Major Brands' },
  { icon: Truck, value: 'Free', label: 'Local Delivery' },
];

const featuredInventory = [
  {
    id: '4',
    title: '2021 Raymond 7500 Reach Truck',
    brand: 'Raymond',
    type: 'Reach Truck',
    price: 22000,
    hours: 2100,
    capacity: '4,500 lbs',
    lift: '25 ft',
    condition: 'excellent' as const,
    image: null,
    emoji: '🏗️',
  },
  {
    id: '1',
    title: '2019 Raymond 5200 Order Picker',
    brand: 'Raymond',
    type: 'Order Picker',
    price: 24500,
    hours: 4200,
    capacity: '3,000 lbs',
    lift: '23 ft',
    condition: 'excellent' as const,
    image: null,
    emoji: '📦',
  },
  {
    id: '2',
    title: '2020 Toyota 8FGCU25 Cushion Tire',
    brand: 'Toyota',
    type: 'Sit-Down',
    price: 19800,
    hours: 3100,
    capacity: '5,000 lbs',
    lift: '15 ft',
    condition: 'excellent' as const,
    image: null,
    emoji: '🚜',
  },
];

const equipmentTypes = [
  {
    name: 'Reach Trucks',
    description: 'High-lift narrow aisle specialists. Up to 30+ feet.',
    count: '20+',
    price: 'From $15,000',
    href: '/inventory?type=reach_truck',
    icon: '🏗️',
    color: 'from-orange-500/10 to-orange-600/5',
    border: 'hover:border-orange-200',
  },
  {
    name: 'Order Pickers',
    description: 'Operator elevates with forks. E-commerce fulfillment.',
    count: '15+',
    price: 'From $14,000',
    href: '/inventory?type=order_picker',
    icon: '📦',
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'hover:border-blue-200',
  },
  {
    name: 'Sit-Down Riders',
    description: 'The warehouse workhorse. Indoor and outdoor ready.',
    count: '25+',
    price: 'From $12,000',
    href: '/inventory?type=sit_down',
    icon: '🚜',
    color: 'from-green-500/10 to-green-600/5',
    border: 'hover:border-green-200',
  },
  {
    name: 'Pallet Jacks',
    description: 'Ground-level material movement. Electric and manual.',
    count: '15+',
    price: 'From $4,000',
    href: '/inventory?type=pallet_jack',
    icon: '🔧',
    color: 'from-purple-500/10 to-purple-600/5',
    border: 'hover:border-purple-200',
  },
];

const services = [
  {
    icon: GraduationCap,
    name: 'OSHA Training',
    price: '$799',
    detail: 'for 5 students',
    description: 'On-site certified training with 3-year certification. Additional students $79 each.',
    href: '/services/osha-training',
    accent: 'bg-blue-50 text-blue-600',
    ring: 'ring-blue-100',
  },
  {
    icon: Cable,
    name: 'Wire-Guided Systems',
    price: '$4.25',
    detail: 'per linear foot',
    description: 'Increase storage density 30-40%. Professional installation in 2-3 weeks.',
    href: '/services/wire-guided',
    accent: 'bg-green-50 text-green-600',
    ring: 'ring-green-100',
  },
  {
    icon: Warehouse,
    name: 'Warehouse Racking',
    price: 'Custom',
    detail: 'quote',
    description: 'New and used systems. Full design consultation, delivery, and installation.',
    href: '/services/racking',
    accent: 'bg-purple-50 text-purple-600',
    ring: 'ring-purple-100',
  },
];

const advantages = [
  { label: 'Transparent pricing on every listing', icon: Star },
  { label: 'Multi-point inspection on every unit', icon: CheckCircle },
  { label: '90-day full warranty, 6-month major, 1-year battery', icon: Shield },
  { label: '4-5 week lead time vs competitors\' 8-12', icon: Zap },
  { label: 'Financing and lease-to-own available', icon: Award },
  { label: 'Free delivery in NJ, PA, NYC metro', icon: Truck },
];

const conditionColor = {
  excellent: 'success' as const,
  good: 'primary' as const,
  fair: 'warning' as const,
};

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */

export default function Home() {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden gradient-hero">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/5 w-[400px] h-[400px] bg-primary-600/5 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/3 w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-[60px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <Container className="relative py-16 lg:py-24">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-center">

            {/* ── LEFT: Hero copy (3/5) ── */}
            <div className="lg:col-span-3">
              {/* David Online Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-sm text-secondary-300 font-medium">
                  David is online — Talk to our AI equipment specialist
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-display-lg md:text-display-xl text-white mb-6 animate-fade-in-up">
                Quality Equipment.{' '}
                <span className="gradient-text">Honest Prices.</span>
                <br />
                29 Years of Trust.
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-secondary-400 max-w-xl mb-10 leading-relaxed animate-fade-in-up">
                New Jersey&apos;s narrow aisle specialists. Reconditioned forklifts from
                Raymond, Crown, and Toyota — every unit inspected, every price transparent.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 animate-fade-in-up">
                <Link
                  href="/inventory"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all shadow-glow-orange hover:shadow-glow-orange-lg hover:-translate-y-0.5 duration-200"
                >
                  Browse Inventory
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 border border-white/10 transition-all backdrop-blur-sm hover:-translate-y-0.5 duration-200"
                >
                  Get a Free Quote
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="mt-12 pt-8 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-6">
                {trustSignals.map((signal) => (
                  <div key={signal.label} className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <signal.icon size={16} className="text-primary-400" />
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-white">{signal.value}</p>
                    </div>
                    <p className="text-sm text-secondary-500 ml-12">{signal.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: David inline chat (2/5) ── */}
            <div className="lg:col-span-2 w-full">
              <DavidHero />
            </div>

          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED INVENTORY
          ═══════════════════════════════════════════ */}
      <Section background="white">
        <SectionHeader
          badge="Featured"
          title="Ready to Ship"
          subtitle="Hand-picked units in excellent condition. Every price includes inspection and warranty."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredInventory.map((item) => (
            <Link key={item.id} href={`/inventory/${item.id}`} className="group">
              <Card hover padding="none" className="overflow-hidden h-full">
                {/* Image Area */}
                <div className="relative h-52 bg-gradient-to-br from-secondary-50 to-secondary-100 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-500">
                      {item.emoji}
                    </span>
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="primary" dot>Featured</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant={conditionColor[item.condition]}>
                      {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                      {item.brand}
                    </span>
                    <span className="text-secondary-300">&middot;</span>
                    <span className="text-xs text-secondary-500">{item.type}</span>
                  </div>

                  <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors mb-3">
                    {item.title}
                  </h3>

                  {/* Specs row */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                      <Clock size={12} className="text-secondary-400" />
                      <span>{item.hours.toLocaleString()} hrs</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                      <Weight size={12} className="text-secondary-400" />
                      <span>{item.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                      <Ruler size={12} className="text-secondary-400" />
                      <span>{item.lift} lift</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-secondary-500">
                      <Shield size={12} className="text-secondary-400" />
                      <span>Warranty</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end justify-between pt-4 border-t border-secondary-100">
                    <p className="text-xl font-bold text-secondary-900">
                      ${item.price.toLocaleString()}
                    </p>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 px-6 py-3 text-primary-600 font-semibold hover:text-primary-700 transition-colors rounded-xl hover:bg-primary-50"
          >
            View all 75+ units
            <ArrowRight size={16} />
          </Link>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          EQUIPMENT TYPES
          ═══════════════════════════════════════════ */}
      <Section background="muted">
        <SectionHeader
          badge="Equipment"
          title="Find the Right Machine"
          subtitle="From high-reach warehousing to ground-level transport. Raymond, Crown, and Toyota — reconditioned and warranty-backed."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {equipmentTypes.map((type) => (
            <Link key={type.name} href={type.href} className="group">
              <Card hover padding="none" className={`overflow-hidden h-full ${type.border}`}>
                <div className={`bg-gradient-to-br ${type.color} p-6 pb-4`}>
                  <div className="flex items-start justify-between">
                    <span className="text-5xl">{type.icon}</span>
                    <span className="text-xs font-semibold text-secondary-400 bg-white/60 px-2 py-0.5 rounded-full">
                      {type.count} units
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                    {type.name}
                  </h3>
                  <p className="text-sm text-secondary-500 mt-1.5 leading-relaxed">
                    {type.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-600">{type.price}</span>
                    <ArrowRight
                      size={16}
                      className="text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          WHY CHOOSE US
          ═══════════════════════════════════════════ */}
      <Section background="white">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-200 mb-4">
              Why Material Solutions
            </span>
            <h2 className="text-display-md text-secondary-900 mb-6">
              The Difference is in the Details
            </h2>
            <p className="text-body-lg text-secondary-500 mb-8">
              We&apos;re not just another dealer. With 29 years in the business and
              a specialization in narrow aisle equipment, we deliver what others can&apos;t:
              quality you can verify, prices you can trust, and lead times that beat the industry.
            </p>
            <ul className="space-y-4">
              {advantages.map(({ label, icon: Icon }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center">
                    <Icon size={13} className="text-primary-600" />
                  </span>
                  <span className="text-secondary-700">{label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Learn about us <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* David CTA Card */}
          <div className="relative">
            <Card padding="lg" className="text-center bg-gradient-to-br from-secondary-900 to-secondary-800 border-secondary-700">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Online Now
                </span>
              </div>
              <div className="pt-4">
                <div className="w-20 h-20 rounded-2xl bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={32} className="text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Meet David
                </h3>
                <p className="text-secondary-400 mb-2">
                  AI Equipment Specialist
                </p>
                <p className="text-sm text-secondary-500 mb-8 max-w-sm mx-auto">
                  28 years of forklift expertise, available 24/7. Ask about inventory,
                  get recommendations, or schedule a callback with Bill.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
                    aria-label="Chat with David"
                  >
                    <MessageCircle size={16} />
                    Chat with David
                  </button>
                  <a
                    href="tel:+19735001010"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <Phone size={16} />
                    Call Direct
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          SERVICES
          ═══════════════════════════════════════════ */}
      <Section background="muted">
        <SectionHeader
          badge="Services"
          title="Beyond Equipment Sales"
          subtitle="Complete warehouse solutions: OSHA training, wire-guided systems, and racking installation."
        />

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link key={service.name} href={service.href} className="group">
              <Card hover padding="lg" className="h-full">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl ${service.accent} flex items-center justify-center`}>
                    <service.icon size={22} />
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-secondary-900">{service.price}</p>
                    <p className="text-xs text-secondary-400">{service.detail}</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-secondary-500 leading-relaxed">
                  {service.description}
                </p>
                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary-600">
                  Learn more
                  <ArrowUpRight
                    size={14}
                    className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════
          TRUST BAR
          ═══════════════════════════════════════════ */}
      <section className="bg-white border-y border-secondary-100">
        <Container className="py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-sm font-semibold text-secondary-900">Raymond</p>
              <p className="text-xs text-secondary-400 mt-0.5">Primary Brand</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-900">Crown</p>
              <p className="text-xs text-secondary-400 mt-0.5">Authorized Dealer</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-900">Toyota</p>
              <p className="text-xs text-secondary-400 mt-0.5">Full Inventory</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-900">M2M Financing</p>
              <p className="text-xs text-secondary-400 mt-0.5">Lease-to-Own</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════
          BOTTOM CTA
          ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="gradient-primary">
          <Container className="py-16 lg:py-20 text-center relative">
            <h2 className="text-display-md text-white mb-4">
              Ready to Find Your Equipment?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Browse our inventory with transparent pricing, or talk to David for personalized
              recommendations. No pressure, just expertise.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/inventory"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-primary-600 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-sm hover:-translate-y-0.5 duration-200"
              >
                Browse Inventory
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 border border-white/20 transition-colors hover:-translate-y-0.5 duration-200"
              >
                Contact Us
              </Link>
            </div>

            {/* Quick contact */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <a href="tel:+19735001010" className="flex items-center gap-2 hover:text-white/90 transition-colors">
                <Phone size={14} />
                (973) 500-1010
              </a>
              <span className="hidden sm:inline text-white/20">|</span>
              <a href="mailto:bwhite@materialsolutions.com" className="flex items-center gap-2 hover:text-white/90 transition-colors">
                bwhite@materialsolutions.com
              </a>
            </div>
          </Container>
        </div>
      </section>
    </>
  );
}
