'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Phone, Mail } from 'lucide-react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/inventory', label: 'Inventory' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm">
          <p className="hidden sm:block">27+ Years Serving New Jersey</p>
          <div className="flex items-center gap-6">
            <a href="tel:+1XXXXXXXXXX" className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              <Phone size={14} />
              <span>(XXX) XXX-XXXX</span>
            </a>
            <a href="mailto:info@materialsolutionsnj.com" className="hidden md:flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              <Mail size={14} />
              <span>info@materialsolutionsnj.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              Material<span className="text-orange-600">Solutions</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="px-5 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
              Get a Quote
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-gray-600 hover:text-orange-600 font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block mt-4 py-3 px-5 bg-orange-600 text-white font-medium rounded-lg text-center hover:bg-orange-700"
            >
              Get a Quote
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
