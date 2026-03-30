import type { Metadata } from 'next';
import { Container, Section } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ContactForm } from '@/components/ui/ContactForm';
import { cn } from '@/lib/utils/cn';
import { Phone, Mail, MapPin, Clock, MessageCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact Material Solutions NJ for forklift quotes, OSHA training, wire-guided systems, and warehouse racking. Call (973) 500-1010 or send us a message. Serving NJ, PA & NYC metro.',
  openGraph: {
    title: 'Contact Us | Material Solutions NJ',
    description:
      'Get in touch for forklift quotes, OSHA training, and warehouse solutions. Call (973) 500-1010 or message us online.',
  },
};

const contactDetails = [
  {
    icon: Phone,
    title: 'Call Us',
    primary: '(973) 500-1010',
    secondary: 'Mon - Fri, 8AM - 5PM EST',
    href: 'tel:+19735001010',
  },
  {
    icon: Mail,
    title: 'Email Us',
    primary: 'bwhite@materialsolutions.com',
    secondary: 'We respond within a few hours',
    href: 'mailto:bwhite@materialsolutions.com',
  },
  {
    icon: MapPin,
    title: 'Service Area',
    primary: 'New Jersey',
    secondary: 'NJ, PA & NYC metro area',
    href: undefined,
  },
  {
    icon: Clock,
    title: 'Business Hours',
    primary: 'Monday - Friday',
    secondary: '8:00 AM - 5:00 PM EST',
    href: undefined,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-secondary-50/30">
      {/* Hero header */}
      <section className="relative overflow-hidden bg-secondary-900">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-primary-500/5 blur-3xl" />

        <Container className="relative py-20 lg:py-28 text-center">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 ring-1 ring-inset ring-primary-500/20 mb-6">
            Get in Touch
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Let&apos;s Talk{' '}
            <span className="text-primary-400">Equipment</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-secondary-300 max-w-2xl mx-auto leading-relaxed">
            Whether you need a quote on a forklift, want to schedule OSHA training,
            or have questions about our inventory — we&apos;re here to help.
          </p>
        </Container>
      </section>

      {/* Contact info cards grid */}
      <Section background="white" className="-mt-8 relative z-10 !pt-0 !pb-0">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {contactDetails.map((item) => {
            const Icon = item.icon;
            const cardClass = cn(
              'group bg-white rounded-2xl border border-secondary-100 shadow-premium p-6',
              'transition-all duration-250',
              item.href && 'hover:shadow-premium-lg hover:border-primary-200 hover:-translate-y-0.5 cursor-pointer'
            );
            const inner = (
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                    'bg-primary-50 text-primary-500',
                    'transition-colors duration-250',
                    item.href && 'group-hover:bg-primary-500 group-hover:text-white'
                  )}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400 mb-1">
                    {item.title}
                  </p>
                  <p className="font-semibold text-secondary-900 truncate">{item.primary}</p>
                  <p className="text-sm text-secondary-500 mt-0.5">{item.secondary}</p>
                </div>
              </div>
            );

            return item.href ? (
              <a key={item.title} href={item.href} className={cardClass}>
                {inner}
              </a>
            ) : (
              <div key={item.title} className={cardClass}>
                {inner}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Contact form + sidebar */}
      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            {/* Form column */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <ContactForm />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
              {/* Direct contact card */}
              <Card padding="lg" hover className="group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                    <Phone size={18} className="text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary-900">Prefer to Talk?</p>
                    <p className="text-xs text-secondary-500">Call us directly</p>
                  </div>
                </div>
                <a
                  href="tel:+19735001010"
                  className="inline-flex items-center gap-2 text-xl font-bold text-primary-500 hover:text-primary-600 transition-colors"
                >
                  (973) 500-1010
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </a>
                <p className="mt-2 text-sm text-secondary-500">
                  Mon - Fri, 8AM - 5PM EST
                </p>
              </Card>

              {/* David CTA */}
              <Card padding="none" className="overflow-hidden">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MessageCircle size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Chat with David</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                        <span className="text-xs text-white/80">Online now</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed mb-5">
                    Our AI equipment specialist is available 24/7. Get instant answers
                    about pricing, availability, specs, and more.
                  </p>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full bg-white text-primary-600 hover:bg-white/90 hover:text-primary-700 shadow-none"
                    iconRight={<ArrowRight size={16} />}
                  >
                    Start a Conversation
                  </Button>
                </div>
              </Card>

              {/* Bill White personal note */}
              <Card padding="lg" className="border-secondary-200 bg-secondary-50/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary-200 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-secondary-600">BW</span>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-600 leading-relaxed italic">
                      &ldquo;I personally review every inquiry that comes through. When you
                      reach out to Material Solutions, you&apos;re talking to real people who
                      care about getting you the right equipment.&rdquo;
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <p className="text-sm font-semibold text-secondary-900">Bill White</p>
                      <span className="text-secondary-300">|</span>
                      <p className="text-xs text-secondary-500">Owner, Material Solutions</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Service area map */}
      <section className="bg-white py-16 sm:py-20 lg:py-24 border-t border-secondary-100">
        <Container>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-200 mb-4">
                Service Area
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
                Proudly Serving the{' '}
                <span className="text-primary-500">Tri-State Area</span>
              </h2>
              <p className="text-lg text-secondary-500 leading-relaxed mb-8">
                From our home base in New Jersey, we deliver equipment and services
                across NJ, Eastern Pennsylvania, and the NYC metro area. Free delivery
                on all equipment purchases within our service area.
              </p>
              <div className="space-y-4">
                {['New Jersey — Full state coverage', 'Eastern Pennsylvania — Lehigh Valley to Philadelphia', 'NYC Metro — All five boroughs and Long Island'].map((area) => (
                  <div key={area} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-primary-500" />
                    </span>
                    <span className="text-secondary-700 font-medium">{area}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="tel:+19735001010"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors shadow-sm"
                >
                  <Phone size={16} />
                  (973) 500-1010
                </a>
                <a
                  href="mailto:bwhite@materialsolutions.com"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-100 text-secondary-700 font-semibold rounded-xl hover:bg-secondary-200 transition-colors"
                >
                  <Mail size={16} />
                  Email Us
                </a>
              </div>
            </div>

            {/* Map embed */}
            <div className="relative rounded-2xl overflow-hidden shadow-premium border border-secondary-100 aspect-[4/3] lg:aspect-square">
              <iframe
                title="Material Solutions NJ Service Area"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d776089.8963892498!2d-74.89723345!3d40.4058693!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c0fb959e00409f%3A0x2cd27b07f83f6d8d!2sNew%20Jersey!5e0!3m2!1sen!2sus!4v1711700000000!5m2!1sen!2sus"
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
