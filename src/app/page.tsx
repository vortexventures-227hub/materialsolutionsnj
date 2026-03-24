import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import Link from 'next/link';
import { Shield, Clock, Award, Truck, CheckCircle, ArrowRight } from 'lucide-react';

// Trust signals data
const trustSignals = [
  { icon: Clock, label: '27+ Years', description: 'Serving New Jersey' },
  { icon: Shield, label: 'OSHA Certified', description: 'Training Programs' },
  { icon: Award, label: 'Quality Assured', description: 'Inspected Equipment' },
  { icon: Truck, label: 'Fast Delivery', description: 'Throughout NJ' },
];

// Featured equipment types
const equipmentTypes = [
  {
    name: 'Sit-Down Riders',
    description: 'The workhorse of any warehouse. Indoor/outdoor versatility.',
    image: '🚜',
    href: '/inventory?type=sit-down',
  },
  {
    name: 'Reach Trucks',
    description: 'High-rise warehouse specialists. Up to 30+ feet.',
    image: '📦',
    href: '/inventory?type=reach-truck',
  },
  {
    name: 'Order Pickers',
    description: 'E-commerce fulfillment. Operator elevates with forks.',
    image: '🏗️',
    href: '/inventory?type=order-picker',
  },
  {
    name: 'Pallet Jacks',
    description: 'Ground-level material movement. Electric & manual.',
    image: '🔧',
    href: '/inventory?type=pallet-jack',
  },
];

// Why choose us points
const whyChooseUs = [
  'Transparent pricing on every listing',
  'Complete maintenance history provided',
  'Multi-point inspection on every unit',
  '90-day warranty on select equipment',
  'OSHA training included options',
  'Financing and leasing available',
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-5" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="bg-orange-500 w-2 h-2 rounded-full animate-pulse" />
                David is online — Chat with our AI expert
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Quality Forklifts.<br />
                <span className="text-orange-500">Honest Prices.</span><br />
                27+ Years of Trust.
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                New Jersey&apos;s premier source for used forklifts, OSHA training, 
                and warehouse solutions. Every unit inspected. Every price transparent.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/inventory"
                  className="px-8 py-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  Browse Inventory
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors backdrop-blur"
                >
                  Get a Quote
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals Bar */}
        <section className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {trustSignals.map((signal) => (
                <div key={signal.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <signal.icon className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{signal.label}</p>
                    <p className="text-sm text-gray-500">{signal.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Equipment Types */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Find Your Equipment
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From sit-down riders to order pickers, we have the right equipment for your operation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {equipmentTypes.map((type) => (
                <Link
                  key={type.name}
                  href={type.href}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all group border border-gray-100"
                >
                  <div className="text-5xl mb-4">{type.image}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {type.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{type.description}</p>
                  <div className="mt-4 text-orange-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Inventory <ArrowRight size={16} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Why Buyers Choose Material Solutions
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  We&apos;re not just another dealer. With nearly 28 years in the business, 
                  we understand what matters: transparency, quality, and service you can trust.
                </p>
                <ul className="space-y-4">
                  {whyChooseUs.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-gray-700">{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                  >
                    Learn more about us <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
              <div className="bg-gray-100 rounded-2xl p-8 lg:p-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Talk to David
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Our AI equipment specialist is available 24/7 to answer questions, 
                    help you find the right equipment, and get you connected with our team.
                  </p>
                  <p className="text-sm text-gray-500">
                    Click the chat button in the bottom right corner to start →
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-20 bg-orange-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Find Your Equipment?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Browse our inventory with transparent pricing, or chat with David for personalized recommendations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/inventory"
                className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Inventory
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-orange-700 text-white font-semibold rounded-lg hover:bg-orange-800 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
