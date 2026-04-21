import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Cable,
  CheckCircle,
  ArrowRight,
  Phone,
  Clock,
  Shield,
  Gauge,
  TrendingUp,
  Package,
  Zap,
  ChevronDown,
  Ruler,
  CalendarDays,
  Warehouse,
  BarChart3,
  AlertTriangle,
  CircleDot,
} from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buildContactHref } from '@/lib/leadRouting';

export const metadata: Metadata = {
  title: 'Wire-Guided Systems',
  description:
    'Wire-guided aisle systems at $4.25/linear foot. Increase storage density 30-40%, reduce product damage, and boost travel speeds. Ideal for 3PL warehouses in New Jersey.',
  openGraph: {
    title: 'Wire-Guided Systems | Material Solutions NJ',
    description:
      'Wire-guided aisle systems starting at $4.25/linear foot. 30-40% more storage density for 3PL warehouses.',
  },
};

const wireGuidedQuoteHref = buildContactHref({
  subject: 'Wire-Guided Systems',
  source: 'wire_guided_quote',
  pageOrigin: '/services/wire-guided',
  ctaOrigin: 'wire_guided_quote',
  serviceSlug: 'wire-guided',
});

const benefits = [
  {
    icon: TrendingUp,
    title: '30-40% More Storage',
    description:
      'Narrow aisles mean more racking. Wire guidance allows safe operation in aisles as narrow as 66 inches.',
    stat: '30-40%',
    statLabel: 'increased density',
  },
  {
    icon: Package,
    title: 'Reduced Product Damage',
    description:
      'Automated steering eliminates side-shift errors and rack strikes. Your product and your racking stay intact.',
    stat: '90%+',
    statLabel: 'less rack damage',
  },
  {
    icon: Gauge,
    title: 'Faster Travel Speeds',
    description:
      'Operators can safely travel at higher speeds in guided aisles. More picks per hour, more throughput per shift.',
    stat: '25%+',
    statLabel: 'faster travel',
  },
  {
    icon: Shield,
    title: 'Operator Fatigue Reduction',
    description:
      'Let the wire do the steering. Operators focus on picking and placing, not fighting the wheel all day.',
    stat: 'Less',
    statLabel: 'operator strain',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Site Assessment',
    description: 'We survey your warehouse floor, measure aisles, and evaluate your current equipment and racking configuration.',
    icon: Ruler,
  },
  {
    step: '02',
    title: 'System Design',
    description: 'Our team designs a custom wire path layout optimized for your traffic patterns and equipment types.',
    icon: CircleDot,
  },
  {
    step: '03',
    title: 'Installation',
    description: 'Professional installation with minimal disruption. Wire is cut into the floor and sealed for a clean, permanent guide path.',
    icon: Cable,
  },
  {
    step: '04',
    title: 'Equipment Calibration',
    description: 'We calibrate your forklifts to the new wire system and train your operators on guided-aisle procedures.',
    icon: Gauge,
  },
];

const idealFor = [
  '3PL warehouses with high SKU density',
  'Cold storage / freezer operations',
  'Narrow-aisle reach truck operations',
  'High-throughput distribution centers',
  'Facilities looking to maximize cube utilization',
  'Operations with high operator turnover',
];

const faqs = [
  {
    question: 'What is a wire-guided system?',
    answer:
      'A wire-guided system uses a wire embedded in the warehouse floor that communicates with sensors on the forklift. The system automatically steers the truck down the aisle, keeping it centered and preventing contact with racking or product.',
  },
  {
    question: 'Will it work with our existing forklifts?',
    answer:
      'Most reach trucks and turret trucks can be retrofitted with wire-guidance sensors. We will assess your specific equipment during the site survey and let you know what is needed.',
  },
  {
    question: 'How long does installation take?',
    answer:
      'Installation time depends on the total linear footage and complexity of your layout. Most projects are completed within 1-2 weeks. We can work around your shifts to minimize downtime.',
  },
  {
    question: 'Does the wire require maintenance?',
    answer:
      'Wire-guided systems are very low maintenance. The wire is embedded and sealed in the floor. Occasional signal checks ensure everything is operating correctly, but there are no moving parts to wear out.',
  },
  {
    question: 'Can we install it in phases?',
    answer:
      'Absolutely. Many customers start with their highest-traffic aisles and expand over time. The system is modular and can grow with your operation.',
  },
  {
    question: 'What is the ROI timeline?',
    answer:
      'Most operations see ROI within 6-12 months through increased storage density, reduced product damage, and higher throughput. The exact timeline depends on your volume and current efficiency.',
  },
];

export default function WireGuidedPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <Container className="relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-secondary-400 hover:text-primary-400 text-sm font-medium mb-6 transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" />
                All Services
              </Link>
              <Badge variant="primary" className="mb-6 bg-blue-500/20 text-blue-300 ring-blue-500/30">
                Precision Guidance
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Wire-Guided{' '}
                <span className="text-blue-400">Aisle Systems</span>
              </h1>
              <p className="text-xl text-secondary-300 leading-relaxed mb-8">
                Maximize your warehouse storage density and eliminate costly
                steering errors with precision wire-guided technology. The
                gold standard for narrow-aisle 3PL operations.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={wireGuidedQuoteHref}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Get a Quote <ArrowRight size={18} />
                </Link>
                <a
                  href="tel:9735001010"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                  <Phone size={18} />
                  (973) 500-1010
                </a>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="lg:justify-self-end w-full max-w-md">
              <Card padding="none" className="overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white">
                  <p className="text-blue-100 text-sm font-medium mb-2">Installed at</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">$4.25</span>
                    <span className="text-blue-200">/ linear foot</span>
                  </div>
                  <p className="mt-3 text-blue-100 text-sm">
                    Complete installation including wire, cutting, sealing, and calibration.
                  </p>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Clock size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">2-3 Week Lead Time</p>
                      <p className="text-xs text-secondary-500">From survey to installation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Warehouse size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">Best for 3PL</p>
                      <p className="text-xs text-secondary-500">Narrow-aisle specialists</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <BarChart3 size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">6-12 Month ROI</p>
                      <p className="text-xs text-secondary-500">Typical payback period</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <Section background="white">
        <SectionHeader
          badge="Key Benefits"
          title="Why Wire-Guided?"
          subtitle="Wire guidance transforms your narrow-aisle operation from a liability into a competitive advantage."
        />

        <div className="grid sm:grid-cols-2 gap-8">
          {benefits.map((benefit) => (
            <Card key={benefit.title} hover padding="lg" className="group">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:scale-105 transition-all duration-300">
                  <benefit.icon className="text-blue-600" size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {benefit.title}
                    </h3>
                    <Badge variant="primary" className="bg-blue-50 text-blue-700 ring-blue-200">
                      {benefit.stat} {benefit.statLabel}
                    </Badge>
                  </div>
                  <p className="text-secondary-500 leading-relaxed text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Ideal For */}
      <Section background="muted">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHeader
              badge="Ideal Applications"
              title="Is Wire-Guided Right for You?"
              subtitle="Wire-guided systems deliver the most value in high-density, high-throughput environments."
              align="left"
            />
            <ul className="space-y-4">
              {idealFor.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-secondary-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card padding="lg" className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle size={24} className="text-primary-500" />
              <h3 className="text-xl font-bold text-secondary-900">Without Wire Guidance</h3>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2.5 text-secondary-600">
                <span className="text-error-500 mt-1 font-bold shrink-0">x</span>
                Wider aisles waste 30-40% of floor space
              </li>
              <li className="flex items-start gap-2.5 text-secondary-600">
                <span className="text-error-500 mt-1 font-bold shrink-0">x</span>
                Frequent rack strikes and product damage
              </li>
              <li className="flex items-start gap-2.5 text-secondary-600">
                <span className="text-error-500 mt-1 font-bold shrink-0">x</span>
                Slower travel speeds for safety
              </li>
              <li className="flex items-start gap-2.5 text-secondary-600">
                <span className="text-error-500 mt-1 font-bold shrink-0">x</span>
                Higher operator fatigue and turnover
              </li>
            </ul>
            <div className="flex items-center gap-3 mb-6">
              <Zap size={24} className="text-blue-500" />
              <h3 className="text-xl font-bold text-secondary-900">With Wire Guidance</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-secondary-700">
                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                Narrow aisles maximize every square foot
              </li>
              <li className="flex items-start gap-2.5 text-secondary-700">
                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                Virtually zero rack contact events
              </li>
              <li className="flex items-start gap-2.5 text-secondary-700">
                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                Safe high-speed aisle travel
              </li>
              <li className="flex items-start gap-2.5 text-secondary-700">
                <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                Happier operators, lower turnover
              </li>
            </ul>
          </Card>
        </div>
      </Section>

      {/* Process */}
      <Section background="white">
        <SectionHeader
          badge="Our Process"
          title="From Assessment to Activation"
          subtitle="A proven installation process that minimizes disruption and maximizes results."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {processSteps.map((step, index) => (
            <div key={step.step} className="relative">
              {index < processSteps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-blue-300 to-blue-100" />
              )}
              <div className="text-center">
                <div className="relative inline-flex">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-premium border border-secondary-100 mb-5">
                    <step.icon className="text-blue-600" size={32} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-secondary-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section background="muted">
        <SectionHeader
          badge="FAQ"
          title="Frequently Asked Questions"
          subtitle="Common questions about wire-guided aisle systems."
        />

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.question} padding="lg" className="group">
              <h3 className="text-lg font-semibold text-secondary-900 mb-3 flex items-start gap-3">
                <ChevronDown size={20} className="text-blue-500 mt-1 shrink-0" />
                {faq.question}
              </h3>
              <p className="text-secondary-600 leading-relaxed pl-8">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
        <Container className="relative text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Unlock Your Warehouse&apos;s Full Potential
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get a free site assessment and see how much storage density you could gain
            with wire-guided aisle systems.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={wireGuidedQuoteHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Request Site Assessment <ArrowRight size={18} />
            </Link>
            <a
              href="tel:9735001010"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-all duration-200"
            >
              <Phone size={18} />
              (973) 500-1010
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
