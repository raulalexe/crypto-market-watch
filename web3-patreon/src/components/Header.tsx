'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useAccount } from 'wagmi';

export function Header() {
  const { isConnected } = useAccount();

  return (
    <header className="bg-white shadow-sm border-b">
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
            <Link href="/creators" className="text-gray-700 hover:text-purple-600 transition-colors">
              Creators
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-purple-600 transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isConnected && (
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-purple-600 transition-colors"
              >
                Dashboard
              </Link>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}