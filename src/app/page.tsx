import type { Metadata } from 'next';

import LeadCaptureForm, { type LeadCaptureOption } from '@/components/LeadCaptureForm';
import HeroSection from '@/components/home/HeroSection';
import StatsBar from '@/components/home/StatsBar';
import FeaturedInventory from '@/components/home/FeaturedInventory';
import MeetDavid from '@/components/home/MeetDavid';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import CTABanner from '@/components/home/CTABanner';
import { getAllPasteQueueUnits, getUnitDisplayName } from '@/lib/marketing/pasteQueueData';

export const metadata: Metadata = {
  title: 'Used Forklifts and Warehouse Equipment',
  description:
    'Current inventory, equipment sales, OSHA training, wire-guided systems, and warehouse support for New Jersey operators.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.materialsolutionsnj.com/',
    title: 'Used Forklifts and Warehouse Equipment | Material Solutions NJ',
    description:
      'Current inventory, equipment sales, OSHA training, wire-guided systems, and warehouse support for New Jersey operators.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Used Forklifts and Warehouse Equipment | Material Solutions NJ',
    description:
      'Current inventory, equipment sales, OSHA training, wire-guided systems, and warehouse support for New Jersey operators.',
  },
};

export default function Home() {
  const units: LeadCaptureOption[] = getAllPasteQueueUnits().map((unit) => ({
    id: unit.unit_id,
    label: getUnitDisplayName(unit),
  }));

  return (
    <>
      <HeroSection />
      <div className="mx-auto max-w-[1280px] px-6 py-8 md:px-8 md:py-10">
        <LeadCaptureForm
          units={units}
          formSource="home"
          pageOrigin="/"
          title="Need the right truck fast?"
          description="Tell us what you need to move and David will point you toward the best-fit equipment, current pricing, and next steps."
        />
      </div>
      <StatsBar />
      <FeaturedInventory />
      <MeetDavid />
      <HowItWorks />
      <Testimonials />
      <CTABanner />
    </>
  );
}
