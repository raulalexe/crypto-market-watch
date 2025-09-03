import { Header } from '@/components/Header';
import { CreatorPage } from '@/components/CreatorPage';

interface CreatorPageProps {
  params: {
    address: string;
  };
}

export default function CreatorPageRoute({ params }: CreatorPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreatorPage creatorAddress={params.address} />
      </main>
    </div>
  );
}