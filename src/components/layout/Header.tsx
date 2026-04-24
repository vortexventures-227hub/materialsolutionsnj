'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, Sparkles } from 'lucide-react';
import { PUBLIC_PHONE_HREF, PUBLIC_PHONE_LABEL } from '@/lib/contactDetails';
import { cn } from '@/lib/utils/cn';
import { useChatStore } from '@/stores/chatStore';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const openChat = useChatStore((state) => state.openChat);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Use the public-facing tel: phone CTA — CONTACT_DETAILS.phone is email-first for David surfaces
  const phoneLabel = PUBLIC_PHONE_LABEL;
  const phoneHref = PUBLIC_PHONE_HREF;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-bg-primary/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/10'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            {/* Forklift icon */}
            <svg
              viewBox="0 0 48 40"
              className="w-8 h-7 text-accent-primary shrink-0"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Forklift body */}
              <rect x="10" y="18" width="22" height="14" rx="2" />
              {/* Cab / operator area */}
              <rect x="24" y="10" width="8" height="12" rx="1.5" />
              {/* Mast vertical */}
              <rect x="7" y="6" width="3" height="26" rx="1" />
              {/* Forks */}
              <rect x="1" y="29" width="12" height="2.5" rx="1" />
              <rect x="1" y="33" width="12" height="2.5" rx="1" />
              {/* Carriage cross-piece */}
              <rect x="7" y="26" width="7" height="3" rx="1" />
              {/* Rear wheel */}
              <circle cx="37" cy="32" r="4" />
              <circle cx="37" cy="32" r="1.8" fill="var(--color-bg-primary, #0A0A0F)" />
              {/* Front wheel */}
              <circle cx="17" cy="32" r="4" />
              <circle cx="17" cy="32" r="1.8" fill="var(--color-bg-primary, #0A0A0F)" />
              {/* Counterweight bump */}
              <rect x="30" y="22" width="8" height="8" rx="1.5" />
            </svg>
            <div className="flex items-center">
              <span className="text-xl lg:text-2xl font-bold tracking-tight text-text-primary">
                Material
              </span>
              <span className="text-xl lg:text-2xl font-bold tracking-tight text-accent-primary">
                Solutions
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-text-primary bg-white/[0.08]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <a
              href={phoneHref}
              className="hidden md:flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <Phone size={14} />
              <span className="font-medium">{phoneLabel}</span>
            </a>

            <button
              type="button"
              onClick={openChat}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary/20 hover:border-accent-primary/30"
            >
              <Sparkles size={14} />
              Talk to David
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 -mr-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden fixed inset-0 top-16 bg-bg-primary/95 backdrop-blur-xl z-40"
          >
            <nav className="flex flex-col px-6 pt-8 gap-2">
              {navLinks.map((link) => {
                const isActive = link.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-4 py-4 rounded-xl text-lg font-medium transition-colors',
                      isActive
                        ? 'text-text-primary bg-white/[0.06]'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-3">
                <button
                  type="button"
                  onClick={openChat}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-primary text-bg-primary font-semibold rounded-xl"
                >
                  <Sparkles size={16} />
                  Talk to David
                </button>
                <a
                  href={phoneHref}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white/[0.06] text-text-primary font-semibold rounded-xl border border-white/[0.08]"
                >
                  <Phone size={16} />
                  Call {phoneLabel}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
