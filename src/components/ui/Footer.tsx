import Link from 'next/link';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              Material<span className="text-orange-500">Solutions</span>
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              27+ years serving New Jersey with quality forklifts, OSHA training, 
              wire-guided systems, and warehouse solutions.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-green-500 w-2 h-2 rounded-full" />
              <span>David is online — Chat now!</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/inventory" className="hover:text-orange-400 transition-colors">
                  Browse Inventory
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-orange-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2 text-sm">
              <li>Forklift Sales (New & Used)</li>
              <li>OSHA Training & Certification</li>
              <li>Wire-Guided Systems</li>
              <li>Warehouse Racking</li>
              <li>Parts & Service</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone size={16} className="mt-0.5 flex-shrink-0" />
                <a href="tel:+1XXXXXXXXXX" className="hover:text-orange-400 transition-colors">
                  (XXX) XXX-XXXX
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 flex-shrink-0" />
                <a href="mailto:info@materialsolutionsnj.com" className="hover:text-orange-400 transition-colors">
                  info@materialsolutionsnj.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span>New Jersey</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock size={16} className="mt-0.5 flex-shrink-0" />
                <span>Mon-Fri: 8AM - 5PM EST</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} Material Solutions NJ. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-orange-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-orange-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
