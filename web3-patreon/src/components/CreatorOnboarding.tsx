'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CreatorProfileForm } from './CreatorProfileForm';

export function CreatorOnboarding() {
  const { isConnected, address } = useAccount();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (!isConnected) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Your Creator Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Connect your wallet to create your creator profile and start receiving support from your fans.
          </p>
          <div className="bg-gray-50 rounded-lg p-8">
            <ConnectButton />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome, Creator!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Your wallet is connected: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{address}</span>
          </p>
          
          {!showOnboarding && (
            <button
              onClick={() => setShowOnboarding(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              Create Your Creator Profile
            </button>
          )}
        </div>

        {showOnboarding && (
          <div className="bg-gray-50 rounded-lg p-8">
            <CreatorProfileForm onComplete={() => setShowOnboarding(false)} />
          </div>
        )}
      </div>
    </section>
  );
}