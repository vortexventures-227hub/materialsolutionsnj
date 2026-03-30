import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Cable,
  Warehouse,
  ArrowRight,
  CheckCircle,
  Phone,
  Shield,
  Clock,
  Award,
  Zap,
} from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'OSHA forklift training, wire-guided systems, and warehouse racking from Material Solutions NJ. 29+ years of trusted warehouse solutions across New Jersey.',
  openGraph: {
    title: 'Services | Material Solutions NJ',
    description:
      'OSHA forklift training, wire-guided systems, and warehouse racking. Trusted warehouse solutions across New Jersey.',
  },
};

const services = [
  {
    icon: GraduationCap,
    title: 'OSHA Forklift Training',
    description:
      'Comprehensive on-site certification programs that keep your operators safe and your business compliant. 3-year OSHA certification included.',
    price: 'From $799',
    priceNote: 'first 5 students',
    href: '/services/osha-training',
    features: [
      'On-site at your facility',
      '3-year OSHA certification',
      'Classroom + hands-on training',
      'Written & practical evaluations',
    ],
    gradient: 'from-emerald-500/10 to-emerald-500/5',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Cable,
    title: 'Wire-Guided Systems',
    description:
      'Maximize storage density and eliminate steering errors with precision wire-guided aisle systems. Perfect for narrow-aisle 3PL operations.',
    price: '$4.25',
    priceNote: 'per linear foot',
    href: '/services/wire-guided',
    features: [
      '30-40% more storage density',
      'Reduced product damage',
      'Faster travel speeds',
      'Ideal for 3PL warehouses',
    ],
    gradient: 'from-blue-500/10 to-blue-500/5',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: Warehouse,
    title: 'Warehouse Racking',
    description:
      'New and used racking solutions designed for your specific operation. Custom consultation, design, and professional installation available.',
    price: 'Custom',
    priceNote: 'quote',
    href: '/services/racking',
    features: [
      'New & used options',
      'Custom design consultation',
      'Professional installation',
      'All racking types available',
    ],
    gradient: 'from-primary-500/10 to-primary-500/5',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
  },
];

const whyChooseUs = [
  {
    icon: Shield,
    title: '29+ Years Experience',
    description:
      'Nearly three decades of solving warehouse challenges across New Jersey and beyond.',
  },
  {
    icon: Award,
    title: 'Transparent Pricing',
    description:
      'No hidden fees or surprise charges. Every price is upfront and competitive.',
  },
  {
    icon: Clock,
    title: 'Fast Turnaround',
    description:
      'Most services scheduled within 2-3 weeks. We move at the speed of your business.',
  },
  {
    icon: Zap,
    title: 'One-Stop Shop',
    description:
      'Equipment, training, guidance systems, and racking. Everything under one roof.',
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(249,115,22,0.08),transparent_60%)]" />
        <Container className="relative">
          <div className="max-w-3xl">
            <Badge variant="primary" className="mb-6 bg-primary-500/20 text-primary-300 ring-primary-500/30">
              Full-Service Solutions
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Warehouse Services{' '}
              <span className="text-primary-400">You Can Trust</span>
            </h1>
            <p className="text-xl text-secondary-300 leading-relaxed max-w-2xl">
              From OSHA training to wire-guided systems and racking installations,
              Material Solutions provides everything your warehouse operation needs
              to run safely and efficiently.
            </p>
          </div>
        </Container>
      </section>

      {/* Services Grid */}
      <Section background="muted">
        <SectionHeader
          badge="Our Services"
          title="Solutions for Every Warehouse Need"
          subtitle="Each service is backed by decades of experience and a commitment to getting the job done right the first time."
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Link key={service.title} href={service.href} className="group block">
              <Card hover padding="none" className="h-full overflow-hidden">
                {/* Gradient Header */}
                <div className={`bg-gradient-to-br ${service.gradient} p-8 pb-6`}>
                  <div className={`w-14 h-14 ${service.iconBg} rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                    <service.icon className={service.iconColor} size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {service.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold text-primary-600">{service.price}</span>
                    <span className="text-sm text-secondary-500">{service.priceNote}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 pt-5">
                  <p className="text-secondary-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <CheckCircle size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-secondary-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                    Learn More <ArrowRight size={16} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Why Choose Us */}
      <Section background="white">
        <SectionHeader
          badge="Why Material Solutions"
          title="The Partner Your Warehouse Deserves"
          subtitle="We don't just provide services. We build relationships that help your operation grow."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {whyChooseUs.map((item) => (
            <div key={item.title} className="text-center group">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary-100 group-hover:scale-105 transition-all duration-300 shadow-sm">
                <item.icon className="text-primary-600" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
        <Container className="relative text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Upgrade Your Operation?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Tell us what you need and we&apos;ll put together a custom solution.
            No pressure, no obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get a Free Quote <ArrowRight size={18} />
            </Link>
            <a
              href="tel:9735001010"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 transition-all duration-200"
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
