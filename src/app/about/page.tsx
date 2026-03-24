import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Clock, Shield, Award, Users, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const milestones = [
  { year: '1998', event: 'Founded in New Jersey' },
  { year: '2005', event: 'Added OSHA Training Services' },
  { year: '2010', event: 'Expanded to Wire-Guided Systems' },
  { year: '2015', event: 'Warehouse Racking Division Launched' },
  { year: '2024', event: 'AI-Powered Customer Service with David' },
];

const values = [
  {
    icon: Shield,
    title: 'Quality First',
    description: 'Every piece of equipment is thoroughly inspected and serviced before it reaches you.',
  },
  {
    icon: Award,
    title: 'Transparent Pricing',
    description: 'No games, no hidden fees. Every price is shown upfront on every listing.',
  },
  {
    icon: Clock,
    title: 'Fast Response',
    description: 'David is available 24/7, and our team responds to inquiries within hours, not days.',
  },
  {
    icon: Users,
    title: 'Relationship Driven',
    description: "We're not just selling equipment — we're building partnerships that last decades.",
  },
];

const services = [
  {
    title: 'Forklift Sales',
    description: 'New and used equipment from all major brands. Every unit inspected, serviced, and warrantied.',
    features: ['All major brands', 'Used & new options', 'Financing available', '90-day warranty'],
  },
  {
    title: 'OSHA Training & Certification',
    description: 'Complete compliance programs that protect your business and your people.',
    features: ['On-site training', 'All equipment types', 'Recertification', 'Train-the-trainer'],
  },
  {
    title: 'Wire-Guided Systems',
    description: 'Maximize storage density and eliminate steering errors with automated guidance.',
    features: ['50% narrower aisles', 'Reduced damage', 'Faster operation', 'Installation included'],
  },
  {
    title: 'Warehouse Racking',
    description: 'Storage solutions designed for your specific operation and equipment.',
    features: ['Selective racking', 'Drive-in systems', 'Cantilever', 'Professional install'],
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Clock size={16} />
                27+ Years of Excellence
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Built on Trust.<br />
                <span className="text-orange-500">Driven by Service.</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                For nearly three decades, Material Solutions has been New Jersey&apos;s 
                trusted partner for forklifts, training, and warehouse solutions. 
                We don&apos;t just sell equipment — we solve problems.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Material Solutions was founded in 1998 with a simple mission: 
                    provide quality equipment and honest service to New Jersey businesses.
                  </p>
                  <p>
                    What started as a small forklift sales operation has grown into a 
                    full-service material handling company. We&apos;ve added OSHA training, 
                    wire-guided systems, and warehouse racking — all because our customers 
                    asked and we listened.
                  </p>
                  <p>
                    Today, we serve hundreds of businesses across New Jersey and beyond. 
                    From small warehouses to massive distribution centers, we&apos;ve helped 
                    operations of every size find the right equipment and solutions.
                  </p>
                  <p className="font-medium text-gray-900">
                    Our philosophy hasn&apos;t changed: treat every customer like family, 
                    stand behind what we sell, and never compromise on quality.
                  </p>
                </div>
              </div>
              
              {/* Timeline */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Our Journey</h3>
                <div className="space-y-6">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.year} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                          {milestone.year.slice(2)}
                        </div>
                        {index < milestones.length - 1 && (
                          <div className="w-0.5 h-full bg-orange-200 my-2" />
                        )}
                      </div>
                      <div className="pt-3">
                        <p className="text-sm text-orange-600 font-medium">{milestone.year}</p>
                        <p className="text-gray-900">{milestone.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                What We Stand For
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These aren&apos;t just words on a wall — they&apos;re how we operate every day.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => (
                <div key={value.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <value.icon className="text-orange-600" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Our Services
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Everything you need for your material handling operation, under one roof.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service) => (
                <div key={service.title} className="bg-gray-50 rounded-xl p-8 border border-gray-100">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-orange-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Work Together?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Whether you need equipment, training, or solutions — we&apos;re here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/inventory"
                className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                Browse Inventory <ArrowRight size={18} />
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
