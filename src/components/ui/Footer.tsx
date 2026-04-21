'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { buildSitewideQuoteHref } from '@/lib/leadRouting';
import { Container } from './Container';

const footerLinks = {
  equipment: [
    { href: '/inventory?type=reach_truck', label: 'Reach Trucks' },
    { href: '/inventory?type=order_picker', label: 'Order Pickers' },
    { href: '/inventory?type=sit_down', label: 'Sit-Down Riders' },
    { href: '/inventory?type=pallet_jack', label: 'Pallet Jacks' },
    { href: '/inventory', label: 'View All Inventory' },
  ],
  services: [
    { href: '/services/osha-training', label: 'OSHA Training' },
    { href: '/services/wire-guided', label: 'Wire-Guided Systems' },
    { href: '/services/racking', label: 'Warehouse Racking' },
    { href: '/services', label: 'All Services' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/inventory', label: 'Browse Equipment' },
  ],
};

export function Footer() {
  const pathname = usePathname();
  const sitewideQuoteHref = buildSitewideQuoteHref({
    pageOrigin: pathname,
    ctaOrigin: 'footer_quote',
  });

  return (
    <footer className="bg-secondary-900 text-secondary-400">
      {/* Main Footer */}
      <Container>
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block mb-5">
                <span className="text-xl font-bold text-white tracking-tight">
                  Material<span className="text-primary-500">Solutions</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed mb-6 max-w-sm">
                29+ years serving New Jersey, Eastern PA, and NYC metro with quality
                reconditioned forklifts and complete warehouse solutions. Narrow aisle specialists.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-secondary-300">David is online — Ask him anything</span>
              </div>
            </div>

            {/* Equipment */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold text-secondary-200 uppercase tracking-wider mb-4">
                Equipment
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.equipment.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold text-secondary-200 uppercase tracking-wider mb-4">
                Services
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.services.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="lg:col-span-4">
              <h4 className="text-xs font-semibold text-secondary-200 uppercase tracking-wider mb-4">
                Get in Touch
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="tel:9735001010"
                    className="flex items-center gap-3 text-sm hover:text-primary-400 transition-colors group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary-800 group-hover:bg-secondary-700 transition-colors">
                      <Phone size={14} />
                    </span>
                    <span className="font-medium text-secondary-200">(973) 500-1010</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:bwhite@materialsolutions.com"
                    className="flex items-center gap-3 text-sm hover:text-primary-400 transition-colors group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary-800 group-hover:bg-secondary-700 transition-colors">
                      <Mail size={14} />
                    </span>
                    <span>bwhite@materialsolutions.com</span>
                  </a>
                </li>
                <li>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary-800">
                      <MapPin size={14} />
                    </span>
                    <span>New Jersey &bull; Serving NJ, PA, NYC Metro</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary-800">
                      <Clock size={14} />
                    </span>
                    <span>Mon-Fri: 8:00 AM - 5:00 PM EST</span>
                  </div>
                </li>
              </ul>

              {/* CTA */}
              <Link
                href={sitewideQuoteHref}
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-primary-500 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition-colors"
              >
                Get a Free Quote
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom Bar */}
      <div className="border-t border-secondary-800">
        <Container>
          <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-secondary-500">
              &copy; {new Date().getFullYear()} Material Solutions NJ. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-secondary-500">
              <Link href="/privacy" className="hover:text-secondary-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-secondary-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
