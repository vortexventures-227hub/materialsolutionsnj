import type { Metadata } from 'next';

import HeroSection from '@/components/home/HeroSection';
import StatsBar from '@/components/home/StatsBar';
import FeaturedInventory from '@/components/home/FeaturedInventory';
import MeetDavid from '@/components/home/MeetDavid';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import CTABanner from '@/components/home/CTABanner';

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
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeaturedInventory />
      <MeetDavid />
      <HowItWorks />
      <Testimonials />
      <CTABanner />
    </>
  );
}
