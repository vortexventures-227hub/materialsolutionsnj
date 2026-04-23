'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Phone, Mail, ChevronRight } from 'lucide-react';
import { buildSitewideQuoteHref } from '@/lib/leadRouting';
import { cn } from '@/lib/utils/cn';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/inventory', label: 'Inventory' },
  {
    href: '/services',
    label: 'Services',
    children: [
      { href: '/services/osha-training', label: 'OSHA Training' },
      { href: '/services/wire-guided', label: 'Wire-Guided Systems' },
      { href: '/services/racking', label: 'Warehouse Racking' },
    ],
  },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const sitewideQuoteHref = buildSitewideQuoteHref({
    pageOrigin: pathname,
    ctaOrigin: 'header_quote',
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  return (
    <header className={cn(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-lg shadow-premium' : 'bg-white'
    )}>
      {/* Top Bar */}
      <div className="bg-secondary-900 text-secondary-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center h-9 text-xs">
          <p className="hidden sm:block font-medium tracking-wide">
            29+ Years of Equipment Excellence in New Jersey
          </p>
          <div className="flex items-center gap-5">
            <a
              href="mailto:info@materialsolutionsnj.com"
              className="flex items-center gap-1.5 hover:text-primary-400 transition-colors"
            >
              <Mail size={12} />
              <span className="font-medium">info@materialsolutionsnj.com</span>
            </a>
            <a
              href="tel:+19736255000"
              className="hidden md:flex items-center gap-1.5 hover:text-primary-400 transition-colors"
            >
              <Phone size={12} />
              <span className="font-medium text-secondary-400">(973) 625-5000</span>
            </a>
            <a
              href="mailto:bwhite@materialsolutions.com"
              className="hidden md:flex items-center gap-1.5 hover:text-primary-400 transition-colors"
            >
              <Mail size={12} />
              <span>bwhite@materialsolutions.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center">
              <span className="text-xl lg:text-2xl font-bold tracking-tight text-secondary-900">
                Material
              </span>
              <span className="text-xl lg:text-2xl font-bold tracking-tight text-primary-500">
                Solutions
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);

              if (link.children) {
                return (
                  <div
                    key={link.href}
                    className="relative group"
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1',
                        isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                      )}
                    >
                      {link.label}
                      <ChevronRight
                        size={14}
                        className={cn(
                          'transition-transform duration-200',
                          servicesOpen ? 'rotate-90' : ''
                        )}
                      />
                    </Link>
                    {/* Dropdown */}
                    <div className={cn(
                      'absolute top-full left-0 pt-2 w-56 transition-all duration-200',
                      servicesOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                    )}>
                      <div className="bg-white rounded-xl shadow-premium-lg border border-secondary-100 p-2">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-3 py-2.5 rounded-lg text-sm text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50 transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href={sitewideQuoteHref}
              className="hidden sm:inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-600 active:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
            >
              Get a Quote
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 -mr-2 text-secondary-600 hover:text-secondary-900 rounded-lg hover:bg-secondary-50 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
        mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      )}>
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 pb-6 space-y-1 border-t border-secondary-100 pt-4">
          {navLinks.map((link) => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);

            return (
              <div key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                  )}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2.5 rounded-lg text-sm text-secondary-500 hover:text-secondary-800 hover:bg-secondary-50 transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Link
            href={sitewideQuoteHref}
            className="block mt-4 py-3 px-5 bg-primary-500 text-white font-semibold rounded-xl text-center hover:bg-primary-600 transition-colors sm:hidden"
          >
            Get a Quote
          </Link>
        </nav>
      </div>
    </header>
  );
}
