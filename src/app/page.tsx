import HeroSection from '@/components/home/HeroSection';
import StatsBar from '@/components/home/StatsBar';
import FeaturedInventory from '@/components/home/FeaturedInventory';
import MeetDavid from '@/components/home/MeetDavid';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import CTABanner from '@/components/home/CTABanner';

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
