import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Warehouse,
  CheckCircle,
  ArrowRight,
  Phone,
  Ruler,
  Shield,
  Package,
  Layers,
  ChevronDown,
  HardHat,
  PencilRuler,
  ClipboardList,
  Truck,
  Wrench,
  DollarSign,
  Recycle,
  LayoutGrid,
} from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Warehouse Racking Solutions',
  description:
    'New and used warehouse racking from Material Solutions NJ. Custom design consultation, professional installation, and all racking types. Serving New Jersey warehouses for 29+ years.',
  openGraph: {
    title: 'Warehouse Racking | Material Solutions NJ',
    description:
      'New and used warehouse racking with custom design consultation and professional installation. Serving NJ for 29+ years.',
  },
};

const rackingTypes = [
  {
    title: 'Selective Racking',
    description:
      'The most versatile and widely used system. Direct access to every pallet position. Perfect for operations with high SKU diversity.',
    best: 'Best for general warehousing',
    icon: LayoutGrid,
  },
  {
    title: 'Drive-In / Drive-Through',
    description:
      'High-density storage for large quantities of the same product. Forklifts drive directly into the rack structure for loading and retrieval.',
    best: 'Best for bulk storage',
    icon: Truck,
  },
  {
    title: 'Push-Back Racking',
    description:
      'Pallets are stored on nested carts that ride on inclined rails. Load from the front, pallets push back automatically. LIFO system.',
    best: 'Best for medium variety, high density',
    icon: Layers,
  },
  {
    title: 'Pallet Flow Racking',
    description:
      'Gravity-fed roller system for FIFO inventory rotation. Load from the back, pick from the front. Ideal for perishable or date-sensitive goods.',
    best: 'Best for FIFO operations',
    icon: Package,
  },
  {
    title: 'Cantilever Racking',
    description:
      'Open-front design for long, bulky, or irregularly shaped items like lumber, pipes, furniture, and sheet goods.',
    best: 'Best for long/irregular items',
    icon: Ruler,
  },
  {
    title: 'Structural Racking',
    description:
      'Heavy-duty bolt-together construction for the most demanding environments. Higher weight capacities and greater impact resistance.',
    best: 'Best for heavy-duty applications',
    icon: Shield,
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Consultation',
    description: 'We discuss your storage needs, inventory profile, equipment, and growth plans to understand the full picture.',
    icon: ClipboardList,
  },
  {
    step: '02',
    title: 'Design & Layout',
    description: 'Our team creates a custom racking layout optimized for your space, workflow, and equipment clearances.',
    icon: PencilRuler,
  },
  {
    step: '03',
    title: 'Quote & Approval',
    description: 'Transparent pricing on everything: racking, hardware, delivery, and installation. No hidden costs.',
    icon: DollarSign,
  },
  {
    step: '04',
    title: 'Installation',
    description: 'Professional installation crew handles everything. We can work around your schedule to minimize downtime.',
    icon: HardHat,
  },
];

const advantages = [
  {
    icon: DollarSign,
    title: 'New & Used Options',
    description:
      'Save up to 50% with quality used racking, or go new for exact specs. We help you find the right balance of cost and condition.',
  },
  {
    icon: PencilRuler,
    title: 'Custom Design',
    description:
      'Every layout is designed specifically for your space, your equipment, and your operation. No cookie-cutter solutions.',
  },
  {
    icon: Wrench,
    title: 'Professional Installation',
    description:
      'Our experienced crews handle the full install, including anchoring, leveling, and safety inspections. Available as a separate service.',
  },
  {
    icon: Recycle,
    title: 'Buyback & Removal',
    description:
      'Upgrading or closing a facility? We can purchase your existing racking and handle the removal.',
  },
];

const faqs = [
  {
    question: 'Should I buy new or used racking?',
    answer:
      'It depends on your budget and requirements. Used racking in good condition performs identically to new and can save 40-50%. We inspect all used racking and only sell what meets safety standards. For specialized configurations or exact color matching, new may be the better choice.',
  },
  {
    question: 'Do you handle permits and inspections?',
    answer:
      'We can guide you through the permitting process and ensure your installation meets all local building codes and fire marshal requirements. Many municipalities require permits for racking installations, and we help navigate that.',
  },
  {
    question: 'Can you work with our existing racking?',
    answer:
      'Absolutely. We can expand, reconfigure, or supplement your existing system. We will assess compatibility and ensure everything works together safely.',
  },
  {
    question: 'How long does a typical installation take?',
    answer:
      'Timeline depends on the scope. A small selective racking job might be a few days. A full warehouse fit-out could be 2-4 weeks. We provide a detailed timeline with every quote.',
  },
  {
    question: 'Do you offer rack inspections and repair?',
    answer:
      'Yes. Damaged racking is a serious safety hazard. We offer inspection services and can repair or replace damaged uprights, beams, and hardware to keep your operation safe and compliant.',
  },
  {
    question: 'What is the installation charge?',
    answer:
      'Installation is quoted separately based on the scope of work, racking type, and facility conditions. We provide a clear, all-inclusive installation quote so there are no surprises.',
  },
];

export default function RackingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_80%,rgba(249,115,22,0.1),transparent_50%)]" />
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
              <Badge variant="primary" className="mb-6 bg-primary-500/20 text-primary-300 ring-primary-500/30">
                New & Used Available
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Warehouse{' '}
                <span className="text-primary-400">Racking Solutions</span>
              </h1>
              <p className="text-xl text-secondary-300 leading-relaxed mb-8">
                From selective pallet racking to drive-in systems and cantilever,
                we design and install storage solutions tailored to your specific
                operation. New and quality used options available.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Request a Quote <ArrowRight size={18} />
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

            {/* Quick Info Card */}
            <div className="lg:justify-self-end w-full max-w-md">
              <Card padding="none" className="overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-white">
                  <p className="text-primary-100 text-sm font-medium mb-2">Custom Solutions</p>
                  <h3 className="text-3xl font-bold mb-2">Designed for You</h3>
                  <p className="text-primary-200 text-sm">
                    Every racking layout is custom-designed for your space, equipment, and workflow.
                  </p>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                      <DollarSign size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">New & Used Options</p>
                      <p className="text-xs text-secondary-500">Save up to 50% with used</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                      <PencilRuler size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">Custom Design</p>
                      <p className="text-xs text-secondary-500">Free consultation included</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                      <HardHat size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">Professional Install</p>
                      <p className="text-xs text-secondary-500">Separate installation service</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Racking Types */}
      <Section background="white">
        <SectionHeader
          badge="Racking Types"
          title="Solutions for Every Storage Challenge"
          subtitle="We supply and install all major racking systems. Not sure which type is right? That is what our consultation is for."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {rackingTypes.map((type) => (
            <Card key={type.title} hover padding="lg" className="group">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary-100 group-hover:scale-105 transition-all duration-300">
                <type.icon className="text-primary-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                {type.title}
              </h3>
              <p className="text-sm text-secondary-500 leading-relaxed mb-4">
                {type.description}
              </p>
              <Badge variant="primary">{type.best}</Badge>
            </Card>
          ))}
        </div>
      </Section>

      {/* Advantages */}
      <Section background="muted">
        <SectionHeader
          badge="Why Material Solutions"
          title="More Than Just Racking"
          subtitle="We handle the entire process from design to installation, so you can focus on running your operation."
        />

        <div className="grid sm:grid-cols-2 gap-8">
          {advantages.map((item) => (
            <Card key={item.title} hover padding="lg" className="group">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary-100 group-hover:scale-105 transition-all duration-300">
                  <item.icon className="text-primary-600" size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-secondary-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section background="white">
        <SectionHeader
          badge="Our Process"
          title="From Consultation to Installation"
          subtitle="A proven process that delivers the right racking solution for your operation."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {processSteps.map((step, index) => (
            <div key={step.step} className="relative">
              {index < processSteps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gradient-to-r from-primary-300 to-primary-100" />
              )}
              <div className="text-center">
                <div className="relative inline-flex">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-premium border border-secondary-100 mb-5">
                    <step.icon className="text-primary-600" size={32} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
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
          subtitle="Common questions about our warehouse racking services."
        />

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.question} padding="lg" className="group">
              <h3 className="text-lg font-semibold text-secondary-900 mb-3 flex items-start gap-3">
                <ChevronDown size={20} className="text-primary-500 mt-1 shrink-0" />
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
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
        <Container className="relative text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Let&apos;s Design Your Storage Solution
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Tell us about your space and your needs. We&apos;ll put together a custom
            racking plan with transparent, competitive pricing.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get a Free Consultation <ArrowRight size={18} />
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
