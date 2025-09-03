import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Own Your Revenue Stream?
        </h2>
        <p className="text-xl md:text-2xl mb-8 text-purple-100">
          Join the Web3 creator revolution. No middlemen, no censorship, just direct support from your fans.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/app"
            className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/app/creators"
            className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-600 transition-colors"
          >
            Browse Creators
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold mb-2">0%</div>
            <div className="text-purple-200">Platform Fees</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">$0.01</div>
            <div className="text-purple-200">Transaction Cost</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">∞</div>
            <div className="text-purple-200">Portability</div>
          </div>
        </div>
      </div>
    </section>
  );
}