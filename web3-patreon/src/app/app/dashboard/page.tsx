'use client';

import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { CreatorDashboard } from '@/components/CreatorDashboard';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function DashboardPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Please connect your wallet to access your creator dashboard.
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreatorDashboard />
      </main>
    </div>
  );
}