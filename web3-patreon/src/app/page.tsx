import { MarketingHeader } from '@/components/MarketingHeader';
import { HeroSection } from '@/components/HeroSection';
import { ValuePropositions } from '@/components/ValuePropositions';
import { FeaturesSection } from '@/components/FeaturesSection';
import { HowItWorks } from '@/components/HowItWorks';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main>
        <HeroSection />
        <ValuePropositions />
        <FeaturesSection />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
