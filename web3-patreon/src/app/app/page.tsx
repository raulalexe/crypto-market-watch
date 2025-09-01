import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { CreatorOnboarding } from '@/components/CreatorOnboarding';

export default function AppPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <HeroSection />
        <CreatorOnboarding />
      </main>
    </div>
  );
}