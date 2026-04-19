'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AnimatedSection, StaggeredContainer, StaggeredChild } from '@/components/shared/AnimatedSection';
import { ContactForm } from '@/components/ui/ContactForm';
import { CONTACT_DETAILS as RAW_CONTACT_DETAILS } from '@/lib/contactDetails';
import { useChatStore } from '@/stores/chatStore';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

const contactDetails = RAW_CONTACT_DETAILS.map((detail) => ({
  ...detail,
  icon:
    detail.icon === 'phone'
      ? Phone
      : detail.icon === 'mail'
        ? Mail
        : detail.icon === 'map-pin'
          ? MapPin
          : Clock,
}));

/* ═══════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════ */

export default function ContactPage() {
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
      <section className="relative w-full overflow-hidden -mt-16 lg:-mt-[72px] pt-16 lg:pt-[72px]">
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/5 via-transparent to-bg-primary" />
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-accent-primary/3 blur-3xl" />

        <div className="relative z-10 px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto py-20 lg:py-28 text-center">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={heroItem}
              className="font-bold text-text-primary mb-6 leading-tight"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)' }}
            >
              Get In Touch
            </motion.h1>
            <motion.h2
              variants={heroItem}
              className="text-2xl sm:text-3xl font-semibold text-text-secondary mb-4"
            >
              Let&apos;s Talk{' '}
              <span className="gradient-text-yellow">Equipment</span>
            </motion.h2>

            <motion.p
              variants={heroItem}
              className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
            >
              Whether you need a quote on a forklift, want to schedule OSHA training,
              or have questions about our inventory — we&apos;re here to help.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CONTACT INFO CARDS
          ═══════════════════════════════════════ */}
      <section className="relative z-10 -mt-4 pb-10">
        <div className="px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <StaggeredContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" staggerDelay={0.08}>
            {contactDetails.map((item) => {
              const Icon = item.icon;
              const inner = (
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-accent-primary/10 flex items-center justify-center shrink-0 group-hover:bg-accent-primary/20 transition-colors">
                    <Icon size={20} className="text-accent-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-1">
                      {item.title}
                    </p>
                    <p className="font-semibold text-text-primary truncate text-sm">
                      {item.primary}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {item.secondary}
                    </p>
                  </div>
                </div>
              );

              return (
                <StaggeredChild key={item.title}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="card-dark card-dark-hover p-5 block group"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="card-dark p-5 group">{inner}</div>
                  )}
                </StaggeredChild>
              );
            })}
          </StaggeredContainer>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FORM + SIDEBAR
          ═══════════════════════════════════════ */}
      <section className="py-16 lg:py-24">
        <div className="px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            {/* Form */}
            <AnimatedSection direction="left" className="lg:col-span-3 order-2 lg:order-1">
              <ContactForm dark showSubject onChatOpen={openChat} />
            </AnimatedSection>

            {/* Sidebar */}
            <AnimatedSection direction="right" className="lg:col-span-2 order-1 lg:order-2 space-y-6">
              {/* Direct call card */}
              <div className="card-dark card-dark-hover p-6 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center">
                    <Phone size={18} className="text-accent-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Prefer to Talk?</p>
                    <p className="text-xs text-text-tertiary">Call us directly</p>
                  </div>
                </div>
                <a
                  href="tel:9735001010"
                  className="inline-flex items-center gap-2 text-xl font-bold text-accent-primary hover:text-accent-glow transition-colors"
                >
                  (973) 500-1010
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
                <p className="mt-2 text-sm text-text-tertiary">
                  Phone support: Mon–Fri, 8AM–6PM EST
                </p>
                <p className="mt-1 text-sm text-accent-primary">
                  Use David chat for equipment questions or contact the team directly
                </p>
              </div>

              {/* David CTA */}
              <div className="card-dark overflow-hidden">
                <div className="bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                      <MessageSquare size={18} className="text-accent-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">Chat with David</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 bg-accent-success rounded-full animate-pulse" />
                        <span className="text-xs text-text-tertiary">David chat</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed mb-5">
                    Use David chat to browse inventory, ask equipment questions,
                    and reach the right team contact.
                    Or chat with David now for equipment questions and team contact help.
                  </p>
                  <button
                    onClick={openChat}
                    className={cn(
                      'w-full px-6 py-3 rounded-lg font-semibold text-bg-primary',
                      'bg-accent-primary hover:bg-accent-glow transition-colors',
                      'shadow-glow-yellow hover:shadow-glow-yellow-lg',
                      'inline-flex items-center justify-center gap-2'
                    )}
                  >
                    Start a Conversation
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* Bill personal note */}
              <div className="card-dark p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-accent-primary">B</span>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary leading-relaxed italic">
                      &ldquo;When you reach out to Material Solutions, our team reviews the
                      details and helps match you with the right equipment for your
                      operation.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">Bill</p>
                      <span className="text-text-tertiary">|</span>
                      <p className="text-xs text-text-tertiary">Owner, Material Solutions</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          SERVICE AREA MAP
          ═══════════════════════════════════════ */}
      <section className="py-20 lg:py-28 relative">
        <div className="absolute inset-0 bg-bg-secondary" />
        <div className="absolute inset-0 bg-grid-dark" />

        <div className="relative px-6 md:px-8 lg:px-16 xl:px-24 max-w-[1280px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <AnimatedSection direction="left">
              <span className="inline-block font-mono text-xs tracking-widest uppercase text-accent-primary mb-4">
                Service Area
              </span>
              <h2 className="text-section text-text-primary mb-4">
                Proudly Serving the{' '}
                <span className="gradient-text-yellow">Tri-State Area</span>
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-8">
                From our home base in New Jersey, we deliver equipment and services
                across NJ, Eastern Pennsylvania, and the NYC metro area. Free delivery
                on all equipment purchases within our service area.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  'New Jersey — Full state coverage',
                  'Eastern Pennsylvania — Lehigh Valley to Philadelphia',
                  'NYC Metro — All five boroughs and Long Island',
                ].map((area) => (
                  <div key={area} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center shrink-0">
                      <MapPin size={14} className="text-accent-primary" />
                    </span>
                    <span className="text-text-primary font-medium text-sm">{area}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <a
                  href="tel:9735001010"
                  className={cn(
                    'px-6 py-3 rounded-lg font-semibold text-bg-primary',
                    'bg-accent-primary hover:bg-accent-glow transition-colors',
                    'shadow-glow-yellow inline-flex items-center gap-2 text-sm'
                  )}
                >
                  <Phone size={16} />
                  (973) 500-1010
                </a>
                <a
                  href="mailto:info@materialsolutionsnj.com"
                  className={cn(
                    'px-6 py-3 rounded-lg font-semibold',
                    'border border-white/10 text-text-primary',
                    'hover:border-white/20 hover:bg-white/5 transition-all',
                    'inline-flex items-center gap-2 text-sm'
                  )}
                >
                  <Mail size={16} />
                  Email Us
                </a>
              </div>
            </AnimatedSection>

            {/* Map */}
            <AnimatedSection direction="right">
              <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/3] lg:aspect-square shadow-card-dark">
                <iframe
                  title="Material Solutions NJ Service Area"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d776089.8963892498!2d-74.89723345!3d40.4058693!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c0fb959e00409f%3A0x2cd27b07f83f6d8d!2sNew%20Jersey!5e0!3m2!1sen!2sus!4v1711700000000!5m2!1sen!2sus"
                  className="absolute inset-0 w-full h-full"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.9) contrast(1.1)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {/* Dark overlay frame */}
                <div className="absolute inset-0 border border-white/5 rounded-xl pointer-events-none" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </main>
  );
}
