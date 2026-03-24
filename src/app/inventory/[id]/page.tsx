import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import PhotoGallery from '@/components/inventory/PhotoGallery';
import { CheckCircle, Clock, Zap, Ruler, Shield, Phone, MessageCircle } from 'lucide-react';

// This would come from Supabase in production
const sampleItem = {
  id: '1',
  title: '2019 Raymond 5200 Order Picker',
  brand: 'Raymond',
  model: '5200',
  year: 2019,
  type: 'order-picker',
  fuel_type: 'electric',
  capacity_lbs: 3000,
  lift_height_inches: 276,
  hours: 4200,
  price: 24500,
  condition: 'excellent',
  description: `This 2019 Raymond 5200 Order Picker is in excellent condition with low hours. Perfect for distribution centers and high-volume picking operations. The unit has been thoroughly inspected and serviced by our certified technicians.

Features wire guidance compatibility, making it ideal for narrow aisle operations. AC traction motor provides smooth, efficient operation. Full maintenance history available upon request.

This unit comes from a single-owner, climate-controlled warehouse and has been meticulously maintained. Battery load-tested at 95% capacity.`,
  features: [
    'Wire guidance ready',
    'AC traction motor',
    'Full maintenance history',
    'Height select system',
    'Ergonomic controls',
    'Recently serviced',
    'Battery load-tested 95%',
    'Single-owner history',
  ],
  images: [],
  inspection_checklist: {
    'Mast & chains': true,
    'Forks & carriage': true,
    'Hydraulic system': true,
    'Brakes & steering': true,
    'Battery & charger': true,
    'Safety systems': true,
    'Controls & gauges': true,
    'Tires & wheels': true,
    'Frame & overhead guard': true,
    'Lights & horn': true,
  },
  warranty_info: '90-day powertrain warranty included. Extended warranty options available.',
  specs: {
    'Model Year': '2019',
    'Hours': '4,200',
    'Capacity': '3,000 lbs',
    'Lift Height': '23 ft (276")',
    'Fuel Type': 'Electric',
    'Battery': '36V',
    'Aisle Width': '60" minimum',
    'Platform Size': '32" x 47"',
    'Travel Speed': '8 mph',
    'Lift Speed': '80 fpm',
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InventoryDetailPage({ params }: PageProps) {
  // In production, fetch by params.id from Supabase
  const { id } = await params;
  const item = sampleItem; // Would be: await getInventoryItem(id)
  
  // Suppress unused variable warning
  void id;

  const conditionColors = {
    excellent: 'bg-green-100 text-green-800 border-green-200',
    good: 'bg-blue-100 text-blue-800 border-blue-200',
    fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6">
            <a href="/inventory" className="hover:text-orange-600">Inventory</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{item.title}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Photos */}
            <div>
              <PhotoGallery images={item.images} title={item.title} />
            </div>

            {/* Right Column - Details */}
            <div>
              {/* Brand & Condition */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                  {item.brand}
                </span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full border ${conditionColors[item.condition as keyof typeof conditionColors]}`}>
                  {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)} Condition
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {item.title}
              </h1>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={18} className="text-gray-400" />
                  <span>{item.hours.toLocaleString()} hours</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Zap size={18} className="text-gray-400" />
                  <span>{item.fuel_type.charAt(0).toUpperCase() + item.fuel_type.slice(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Ruler size={18} className="text-gray-400" />
                  <span>{(item.lift_height_inches / 12).toFixed(0)}ft lift height</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield size={18} className="text-gray-400" />
                  <span>{item.capacity_lbs.toLocaleString()} lbs capacity</span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gray-100 rounded-xl p-6 mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ${item.price.toLocaleString()}
                  </span>
                  <span className="text-gray-500">USD</span>
                </div>
                <p className="text-sm text-gray-600">{item.warranty_info}</p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="tel:+1XXXXXXXXXX"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Phone size={20} />
                  Call Now
                </a>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <MessageCircle size={20} />
                  Ask David About This
                </button>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Features</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-gray-600">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Full Specs & Inspection */}
          <div className="grid lg:grid-cols-2 gap-8 mt-12">
            {/* Specifications */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
              <dl className="divide-y divide-gray-100">
                {Object.entries(item.specs).map(([key, value]) => (
                  <div key={key} className="py-3 flex justify-between">
                    <dt className="text-gray-500">{key}</dt>
                    <dd className="text-gray-900 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Inspection Checklist */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-green-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900">Inspection Checklist</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Every unit undergoes our comprehensive multi-point inspection.
              </p>
              <ul className="space-y-2">
                {Object.entries(item.inspection_checklist).map(([checkItem, passed]) => (
                  <li key={checkItem} className="flex items-center gap-2">
                    <CheckCircle 
                      size={18} 
                      className={passed ? 'text-green-500' : 'text-gray-300'} 
                    />
                    <span className={passed ? 'text-gray-700' : 'text-gray-400'}>
                      {checkItem}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warranty Info */}
          <div className="mt-8 bg-orange-50 rounded-xl p-6 border border-orange-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Warranty Information</h2>
            <p className="text-gray-700">{item.warranty_info}</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
