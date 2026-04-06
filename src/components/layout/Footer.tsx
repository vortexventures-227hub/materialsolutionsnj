import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ArrowUpRight, Sparkles } from 'lucide-react';

const footerLinks = {
  equipment: [
    { href: '/inventory?fuel_type=electric', label: 'Electric Forklifts' },
    { href: '/inventory?fuel_type=propane', label: 'Propane Forklifts' },
    { href: '/inventory?fuel_type=diesel', label: 'Diesel Forklifts' },
    { href: '/inventory', label: 'View All Inventory' },
  ],
  company: [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-white/[0.06]">
      <div className="mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-block mb-5">
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-text-primary">Material</span>
                  <span className="text-accent-primary">Solutions</span>
                </span>
              </Link>
              <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-sm">
                AI-powered equipment solutions for New Jersey, Eastern PA, and NYC metro.
                Every unit analyzed. Every listing verified. Every price transparent.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20">
                <Sparkles size={12} className="text-accent-primary" />
                <span className="text-xs text-accent-primary font-medium">Powered by AI</span>
              </div>
            </div>

            {/* Equipment */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                Equipment
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.equipment.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-tertiary hover:text-accent-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-tertiary hover:text-accent-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="lg:col-span-4">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                Get in Touch
              </h4>
              <ul className="space-y-3">
                <li>
                  <a href="tel:+19735001010" className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-primary transition-colors group">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-accent-primary/10 transition-colors">
                      <Phone size={14} />
                    </span>
                    <span className="font-medium">(973) 500-1010</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:bwhite@materialsolutions.com" className="flex items-center gap-3 text-sm text-text-secondary hover:text-accent-primary transition-colors group">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-accent-primary/10 transition-colors">
                      <Mail size={14} />
                    </span>
                    <span>bwhite@materialsolutions.com</span>
                  </a>
                </li>
                <li>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04]">
                      <MapPin size={14} />
                    </span>
                    <span>New Jersey • NJ, PA, NYC Metro</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04]">
                      <Clock size={14} />
                    </span>
                    <span>Mon-Fri: 8:00 AM - 5:00 PM EST</span>
                  </div>
                </li>
              </ul>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-accent-primary text-bg-primary text-sm font-semibold rounded-xl hover:bg-accent-glow transition-colors"
              >
                Get a Free Quote
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-[1280px] px-6 md:px-8">
          <div className="py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-text-tertiary">
              &copy; {new Date().getFullYear()} Material Solutions NJ. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-text-tertiary">
              <Link href="/privacy" className="hover:text-text-secondary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-text-secondary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
