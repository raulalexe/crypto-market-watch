import { Header } from '@/components/Header';
import { CreatorsList } from '@/components/CreatorsList';

export default function CreatorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Creators
          </h1>
          <p className="text-xl text-gray-600">
            Support your favorite creators and get exclusive content
          </p>
        </div>
        <CreatorsList />
      </main>
    </div>
  );
}