import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  CheckCircle,
  ArrowRight,
  Phone,
  Clock,
  Shield,
  Users,
  FileCheck,
  ClipboardCheck,
  BookOpen,
  Wrench,
  ChevronDown,
  DollarSign,
  CalendarDays,
  MapPin,
  Award,
} from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buildContactHref } from '@/lib/leadRouting';
import { toFAQPageSchema } from '@/lib/marketing/schemaTransformers';
import { CONTACT_DETAILS } from '@/lib/contactDetails';

export const metadata: Metadata = {
  title: 'OSHA Forklift Training & Certification',
  description:
    'On-site OSHA forklift training and certification in New Jersey. $799 for first 5 students. 3-year certification, classroom + hands-on instruction. Schedule in 2-3 weeks.',
  alternates: {
    canonical: '/services/osha-training',
  },
  openGraph: {
    title: 'OSHA Forklift Training | Material Solutions NJ',
    description:
      'On-site OSHA forklift training. $799 for first 5 students. 3-year certification with classroom and hands-on instruction.',
    url: 'https://www.materialsolutionsnj.com/services/osha-training',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OSHA Forklift Training | Material Solutions NJ',
    description:
      'On-site OSHA forklift training. $799 for first 5 students. 3-year certification with classroom and hands-on instruction.',
  },
};

const oshaTrainingQuoteHref = buildContactHref({
  subject: 'OSHA Training',
  source: 'osha_training_quote',
  pageOrigin: '/services/osha-training',
  ctaOrigin: 'osha_training_quote',
  serviceSlug: 'osha-training',
});
const phoneContact = CONTACT_DETAILS.find((detail) => detail.icon === 'phone');
const phoneLabel = phoneContact?.primary ?? 'Call Bill';
const phoneHref = phoneContact?.href ?? '/contact';

const trainingIncludes = [
  {
    icon: BookOpen,
    title: 'Classroom Instruction',
    description:
      'Comprehensive classroom session covering OSHA regulations, equipment types, safety protocols, and hazard awareness.',
  },
  {
    icon: Wrench,
    title: 'Hands-On Training',
    description:
      'Supervised practical training on the actual equipment your operators use daily. Real scenarios, real skills.',
  },
  {
    icon: FileCheck,
    title: 'Written Evaluation',
    description:
      'Standardized written test to confirm operators understand safety rules, operating procedures, and emergency protocols.',
  },
  {
    icon: ClipboardCheck,
    title: 'Practical Evaluation',
    description:
      'Observed driving assessment ensuring each operator can safely perform all required maneuvers and inspections.',
  },
  {
    icon: Award,
    title: 'OSHA-Compliant Certificate',
    description:
      'Each passing operator receives an official certificate valid for 3 years, keeping your facility audit-ready.',
  },
  {
    icon: MapPin,
    title: 'On-Site at Your Facility',
    description:
      'We come to you. Training happens on your equipment, in your environment, on your schedule.',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Contact Us',
    description: 'Call or fill out our form with your training needs, number of operators, and preferred dates.',
    icon: Phone,
  },
  {
    step: '02',
    title: 'Schedule & Confirm',
    description: 'We confirm a date within 2-3 weeks and send you all prep materials for your team.',
    icon: CalendarDays,
  },
  {
    step: '03',
    title: 'Training Day',
    description: 'Our certified trainer arrives at your facility. Full program runs classroom, hands-on, and evaluations.',
    icon: GraduationCap,
  },
  {
    step: '04',
    title: 'Certification',
    description: 'Operators who pass receive their 3-year OSHA-compliant certificates on the spot.',
    icon: Award,
  },
];

const faqs = [
  {
    question: 'How long does the training take?',
    answer:
      'A typical session runs 4-6 hours depending on class size and equipment types. We handle everything in a single visit so your team can get back to work quickly.',
  },
  {
    question: 'What types of forklifts do you certify for?',
    answer:
      'We certify operators on all powered industrial truck classes, including sit-down riders, reach trucks, order pickers, pallet jacks, and more. Training is conducted on your specific equipment.',
  },
  {
    question: 'Is recertification different from initial training?',
    answer:
      'OSHA requires recertification every 3 years, or sooner if an operator is involved in an accident or observed operating unsafely. Recertification follows the same comprehensive process.',
  },
  {
    question: 'What happens if an operator doesn\'t pass?',
    answer:
      'Operators who don\'t pass the evaluation receive additional coaching and can re-test. We want every operator to succeed and leave safely certified.',
  },
  {
    question: 'Do you offer train-the-trainer programs?',
    answer:
      'Yes. For larger operations, we can train one of your staff to become an in-house trainer, allowing you to certify new hires internally.',
  },
  {
    question: 'How quickly can we schedule training?',
    answer:
      'Typical lead time is 2-3 weeks. For urgent compliance needs, contact us and we will do our best to accommodate a faster timeline.',
  },
];

export default function OSHATrainingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toFAQPageSchema(faqs)) }}
      />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.1),transparent_50%)]" />
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
              <Badge variant="primary" className="mb-6 bg-emerald-500/20 text-emerald-300 ring-emerald-500/30">
                OSHA Compliant
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Forklift Training{' '}
                <span className="text-emerald-400">&amp; Certification</span>
              </h1>
              <p className="text-xl text-secondary-300 leading-relaxed mb-8">
                On-site OSHA forklift training that keeps your operators safe and your
                business compliant. We come to your facility with everything needed
                for a complete certification program.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={oshaTrainingQuoteHref}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Schedule Training <ArrowRight size={18} />
                </Link>
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                >
                  <Phone size={18} />
                  {phoneLabel}
                </a>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="lg:justify-self-end w-full max-w-md">
              <Card padding="none" className="overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-white">
                  <p className="text-emerald-100 text-sm font-medium mb-2">Starting at</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">$799</span>
                    <span className="text-emerald-200">/ first 5 students</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-emerald-100">
                    <Users size={16} />
                    <span className="text-sm">$79 each additional student</span>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <Shield size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">3-Year Certification</p>
                      <p className="text-xs text-secondary-500">OSHA-compliant certificate</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">On-Site Training</p>
                      <p className="text-xs text-secondary-500">We come to your facility</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <Clock size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 text-sm">2-3 Week Lead Time</p>
                      <p className="text-xs text-secondary-500">Quick scheduling turnaround</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* What's Included */}
      <Section background="white">
        <SectionHeader
          badge="Complete Program"
          title="What Training Includes"
          subtitle="Every session is a full OSHA-compliant certification program. No shortcuts, no gaps."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainingIncludes.map((item) => (
            <Card key={item.title} hover padding="lg" className="group">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-100 group-hover:scale-105 transition-all duration-300">
                <item.icon className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-secondary-500 leading-relaxed">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Process Timeline */}
      <Section background="muted">
        <SectionHeader
          badge="How It Works"
          title="From Call to Certified"
          subtitle="A straightforward process designed to get your team certified with minimal disruption."
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

      {/* Pricing Breakdown */}
      <Section background="white">
        <SectionHeader
          badge="Transparent Pricing"
          title="Simple, Honest Pricing"
          subtitle="No hidden fees. No surprise charges. You know exactly what you're paying before we show up."
        />

        <div className="max-w-3xl mx-auto">
          <Card padding="none" className="overflow-hidden">
            <div className="bg-gradient-to-r from-secondary-900 to-secondary-800 p-8 text-white">
              <h3 className="text-2xl font-bold mb-1">OSHA Forklift Training Package</h3>
              <p className="text-secondary-300">Complete on-site certification program</p>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between py-4 border-b border-secondary-100">
                <div className="flex items-center gap-3">
                  <DollarSign size={20} className="text-primary-500" />
                  <span className="font-medium text-secondary-900">Base Package (up to 5 students)</span>
                </div>
                <span className="text-2xl font-bold text-secondary-900">$799</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-secondary-100">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-primary-500" />
                  <span className="font-medium text-secondary-900">Each Additional Student</span>
                </div>
                <span className="text-2xl font-bold text-secondary-900">$79</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-secondary-100">
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-primary-500" />
                  <span className="font-medium text-secondary-900">Certification Validity</span>
                </div>
                <span className="text-lg font-bold text-emerald-600">3 Years</span>
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-primary-500" />
                  <span className="font-medium text-secondary-900">Scheduling Lead Time</span>
                </div>
                <span className="text-lg font-bold text-secondary-700">2-3 Weeks</span>
              </div>

              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm text-emerald-800">
                  <strong>Example:</strong> 10 students = $799 + (5 x $79) = <strong>$1,194</strong> total.
                  That&apos;s just $119.40 per operator for a full 3-year certification.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* FAQ */}
      <Section background="muted">
        <SectionHeader
          badge="FAQ"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about our OSHA training program."
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
      <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
        <Container className="relative text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Get Your Team Certified
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Protect your operators and your business. Schedule on-site OSHA training
            and get certified in a single visit.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={oshaTrainingQuoteHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Schedule Training <ArrowRight size={18} />
            </Link>
            <a
              href={phoneHref}
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-800 transition-all duration-200"
            >
              <Phone size={18} />
              {phoneLabel}
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
