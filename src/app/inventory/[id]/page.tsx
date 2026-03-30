'use client';

import { use } from 'react';
import PhotoGallery from '@/components/inventory/PhotoGallery';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import {
  CheckCircle,
  Clock,
  Zap,
  Ruler,
  Shield,
  Phone,
  MessageCircle,
  FileText,
  ChevronRight,
  Calendar,
  Gauge,
  Weight,
  ArrowLeft,
  ShieldCheck,
  Wrench,
  Star,
  BadgeCheck,
} from 'lucide-react';

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

export default function InventoryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const item = sampleItem; // Would be: await getInventoryItem(id)

  // Suppress unused variable warning
  void id;

  const conditionVariant: Record<string, 'success' | 'primary' | 'warning'> = {
    excellent: 'success',
    good: 'primary',
    fair: 'warning',
  };

  const quickSpecs = [
    { icon: Calendar, label: 'Year', value: String(item.year) },
    { icon: Clock, label: 'Hours', value: item.hours.toLocaleString() },
    { icon: Weight, label: 'Capacity', value: `${item.capacity_lbs.toLocaleString()} lbs` },
    { icon: Ruler, label: 'Lift Height', value: `${(item.lift_height_inches / 12).toFixed(0)} ft` },
    { icon: Zap, label: 'Fuel', value: item.fuel_type.charAt(0).toUpperCase() + item.fuel_type.slice(1) },
    { icon: Gauge, label: 'Speed', value: '8 mph' },
  ];

  return (
    <main className="min-h-screen bg-secondary-50/30">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-secondary-100">
        <Container>
          <nav className="flex items-center gap-2 py-4 text-sm">
            <a
              href="/inventory"
              className="flex items-center gap-1.5 text-secondary-500 hover:text-primary-600 transition-colors font-medium"
            >
              <ArrowLeft size={14} />
              Inventory
            </a>
            <ChevronRight size={14} className="text-secondary-300" />
            <span className="text-secondary-400">{item.brand}</span>
            <ChevronRight size={14} className="text-secondary-300" />
            <span className="text-secondary-800 font-medium truncate max-w-[200px] sm:max-w-none">
              {item.model}
            </span>
          </nav>
        </Container>
      </div>

      <Container className="py-8 lg:py-12">
        {/* Main Layout: Gallery + Sidebar */}
        <div className="grid lg:grid-cols-[1fr,420px] gap-8 lg:gap-10">
          {/* Left Column - Gallery + Content */}
          <div className="space-y-8">
            {/* Photo Gallery */}
            <PhotoGallery images={item.images} title={item.title} />

            {/* Title (mobile only, hidden on desktop) */}
            <div className="lg:hidden">
              <div className="flex items-center gap-2.5 mb-3">
                <Badge variant="primary">{item.brand}</Badge>
                <Badge variant={conditionVariant[item.condition] || 'secondary'} dot>
                  {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-secondary-900">
                {item.title}
              </h1>
              <p className="text-3xl font-bold text-secondary-900 mt-3">
                ${item.price.toLocaleString()}
              </p>
            </div>

            {/* Description */}
            <Card padding="lg">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                  <FileText size={16} className="text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900">Description</h2>
              </div>
              <div className="text-secondary-600 leading-relaxed whitespace-pre-line text-[15px]">
                {item.description}
              </div>
            </Card>

            {/* Features */}
            <Card padding="lg">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Star size={16} className="text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900">Key Features</h2>
              </div>
              <ul className="grid sm:grid-cols-2 gap-3">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={13} className="text-green-500" />
                    </div>
                    <span className="text-sm text-secondary-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Full Specifications Table */}
            <Card padding="lg">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                  <Wrench size={16} className="text-secondary-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900">Full Specifications</h2>
              </div>
              <dl className="divide-y divide-secondary-100">
                {Object.entries(item.specs).map(([key, value]) => (
                  <div key={key} className="py-3.5 flex items-center justify-between">
                    <dt className="text-sm text-secondary-500">{key}</dt>
                    <dd className="text-sm text-secondary-900 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            {/* Inspection Checklist */}
            <Card padding="lg">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900">Inspection Checklist</h2>
              </div>
              <p className="text-sm text-secondary-500 mb-5 ml-[42px]">
                Every unit undergoes our comprehensive multi-point inspection before sale.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(item.inspection_checklist).map(([checkItem, passed]) => (
                  <div
                    key={checkItem}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-colors',
                      passed
                        ? 'bg-green-50/50 border-green-200/60'
                        : 'bg-secondary-50 border-secondary-200/60'
                    )}
                  >
                    <CheckCircle
                      size={16}
                      className={cn(
                        passed ? 'text-green-500' : 'text-secondary-300'
                      )}
                    />
                    <span className={cn(
                      'text-sm font-medium',
                      passed ? 'text-secondary-700' : 'text-secondary-400'
                    )}>
                      {checkItem}
                    </span>
                    {passed && (
                      <span className="ml-auto text-xs text-green-600 font-semibold">PASS</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-8 space-y-5">
              {/* Main Details Card */}
              <Card padding="lg" className="overflow-hidden">
                {/* Badges */}
                <div className="flex items-center gap-2.5 mb-4">
                  <Badge variant="primary">{item.brand}</Badge>
                  <Badge variant={conditionVariant[item.condition] || 'secondary'} dot>
                    {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)} Condition
                  </Badge>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-secondary-900 mb-5 leading-tight">
                  {item.title}
                </h1>

                {/* Price Block */}
                <div className="bg-gradient-to-br from-secondary-900 to-secondary-800 rounded-2xl p-5 mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      ${item.price.toLocaleString()}
                    </span>
                    <span className="text-secondary-400 text-sm font-medium">USD</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <BadgeCheck size={14} className="text-primary-400" />
                    <span className="text-secondary-300 text-xs">Inspected &amp; Certified</span>
                  </div>
                </div>

                {/* Quick Specs Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {quickSpecs.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="bg-secondary-50/80 rounded-xl px-3.5 py-3 border border-secondary-100/80"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className="text-secondary-400" />
                        <span className="text-xs text-secondary-400 font-medium">{label}</span>
                      </div>
                      <p className="text-sm font-semibold text-secondary-900">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Warranty Banner */}
                <div className="bg-primary-50/60 border border-primary-100 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield size={16} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-secondary-900">Warranty Included</p>
                      <p className="text-xs text-secondary-500 mt-0.5 leading-relaxed">
                        {item.warranty_info}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <a href="tel:+1XXXXXXXXXX" className="block">
                    <Button
                      variant="primary"
                      size="xl"
                      icon={<Phone size={18} />}
                      className="w-full"
                    >
                      Call Now
                    </Button>
                  </a>
                  <Button
                    variant="secondary"
                    size="xl"
                    icon={<MessageCircle size={18} />}
                    className="w-full"
                  >
                    Chat with David
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    icon={<FileText size={16} />}
                    className="w-full"
                  >
                    Get a Quote
                  </Button>
                </div>
              </Card>

              {/* Trust Signals */}
              <Card padding="md" className="bg-secondary-50/50">
                <div className="flex items-center gap-4 text-xs text-secondary-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Inspected</span>
                  </div>
                  <div className="w-px h-3 bg-secondary-200" />
                  <div className="flex items-center gap-1.5">
                    <Wrench size={14} className="text-primary-500" />
                    <span>Serviced</span>
                  </div>
                  <div className="w-px h-3 bg-secondary-200" />
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-primary-500" />
                    <span>Warranty</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile Sticky CTA Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-secondary-200 px-4 py-3">
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-secondary-900 truncate">
                  ${item.price.toLocaleString()}
                </p>
              </div>
              <a href="tel:+1XXXXXXXXXX">
                <Button variant="primary" size="lg" icon={<Phone size={16} />}>
                  Call
                </Button>
              </a>
              <Button variant="secondary" size="lg" icon={<MessageCircle size={16} />}>
                Chat
              </Button>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </main>
  );
}
