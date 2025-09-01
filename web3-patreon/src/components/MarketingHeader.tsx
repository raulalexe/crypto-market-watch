'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export function MarketingHeader() {
  const { isConnected } = useAccount();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W3</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Web3 Patreon</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 transition-colors">
              How it Works
            </a>
            <Link href="/app/creators" className="text-gray-700 hover:text-purple-600 transition-colors">
              Creators
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <Link 
                href="/app/dashboard" 
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                href="/app" 
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Get Started
              </Link>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}