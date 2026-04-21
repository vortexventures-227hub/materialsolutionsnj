import type { Metadata } from 'next';
import { FAQBlock } from '@/components/marketing/FAQBlock';

const SITE_URL = 'https://www.materialsolutionsnj.com';

const faqs = [
  {
    question: 'How do I purchase equipment from your inventory?',
    answer:
      'Browse the live inventory on our website, then contact us directly by phone at (973) 500-1010, through our contact form, or by chatting with David for real-time guidance. We do not process transactions through the website — this keeps pricing honest and lets us give you accurate, up-to-date information on each listing.',
  },
  {
    question: 'Do you offer financing for equipment purchases?',
    answer:
      'Yes. We work with several equipment financing partners and can connect you with options for both short-term and long-term financing. Contact the team with the equipment you are interested in and we will walk you through the available paths.',
  },
  {
    question: 'Do you deliver equipment?',
    answer:
      'We handle logistics and can arrange delivery nationwide. Delivery costs depend on distance, equipment type, and urgency. Contact us before or after your purchase to arrange logistics.',
  },
  {
    question: 'What types of forklifts and equipment do you carry?',
    answer:
      'Our inventory includes propane, electric, and diesel forklifts, as well as reach trucks, order pickers, and pallet jacks. Brands we regularly carry include Toyota, Hyster, Yale, Crown, and others. Browse the live inventory for current availability.',
  },
  {
    question: 'Can I trade in my current equipment?',
    answer:
      'Yes, we accept trade-ins. Describe your current equipment when you contact us and we will give you a valuation as part of the purchase conversation.',
  },
  {
    question: 'Do you offer warranties on used equipment?',
    answer:
      'Warranty availability varies by unit and age. Some equipment carries a limited warranty; others are sold as-is. We are transparent about the condition of every listing. Ask the team or David about the specific unit you are interested in.',
  },
  {
    question: 'What is David and how can he help me?',
    answer:
      'David is our AI sales assistant available on the site. He can answer equipment questions, help you navigate the inventory, clarify specifications, and route you directly to the team when you are ready to move forward. Click the chat button in the bottom-right corner to start a conversation.',
  },
  {
    question: 'How often does your inventory update?',
    answer:
      'Our inventory refreshes daily. Units that are sold are removed from the live feed. If a unit shows as unavailable or you do not see what you need, contact the team — we have access to equipment before it is listed publicly.',
  },
];

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers to common questions about buying forklifts, financing, delivery, warranties, and working with Material Solutions NJ.',
  alternates: {
    canonical: `${SITE_URL}/faq`,
  },
  openGraph: {
    title: 'Frequently Asked Questions | Material Solutions NJ',
    description:
      'Answers to common questions about buying forklifts, financing, delivery, warranties, and working with Material Solutions NJ.',
    url: `${SITE_URL}/faq`,
    type: 'website',
  },
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Page Header */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/[0.03] to-transparent" />
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="relative mx-auto max-w-[1280px] px-6 md:px-8 py-12 lg:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-4">
              <span className="text-xs text-accent-primary font-semibold">
                Buyer Resource
              </span>
            </div>
            <h1 className="text-section text-text-primary mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-text-secondary text-lg">
              Straight answers about inventory, pricing, financing, and how to
              work with our team.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <div className="mx-auto max-w-[800px] px-6 md:px-8 py-12 lg:py-16">
        <FAQBlock faqs={faqs} />
      </div>
    </div>
  );
}
