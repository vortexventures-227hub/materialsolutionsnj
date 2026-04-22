import React from 'react';
import { cn } from '@/lib/utils/cn';
import { toFAQPageSchema } from '@/lib/marketing/schemaTransformers';

export type FAQItem = {
  question: string;
  answer: string;
};

type FAQBlockProps = {
  faqs: FAQItem[];
  heading?: string;
  className?: string;
};

export function buildFaqPageJsonLd(faqs: FAQItem[]) {
  return toFAQPageSchema(faqs);
}

export function FAQBlock({ faqs, heading = 'Frequently Asked Questions', className }: FAQBlockProps) {
  const faqSchema = buildFaqPageJsonLd(faqs);

  return (
    <section className={cn('flex flex-col gap-6', className)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-text-primary">{heading}</h2>
        <p className="text-sm text-text-secondary">
          Honest answers about inventory, buying, delivery, financing, and how to work with Material Solutions NJ.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <details
            key={`${faq.question}-${index}`}
            className="group rounded-xl border border-white/[0.06] bg-bg-secondary/50 p-0 transition-colors open:border-accent-primary/30 open:bg-accent-primary/[0.04]"
          >
            <summary
              aria-controls={`faq-answer-${index}`}
              className="cursor-pointer list-none px-5 py-4 font-semibold text-text-primary marker:content-none"
            >
              {faq.question}
            </summary>
            <div id={`faq-answer-${index}`} className="border-t border-white/[0.06] px-5 pb-5 pt-3 text-sm leading-relaxed text-text-secondary">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
