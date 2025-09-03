'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { mockCreatorSupport, SupportTier, SUPPORTED_TOKENS, TOKEN_METADATA } from '@/lib/smartContract';

interface CreatorProfile {
  name: string;
  bio: string;
  category: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  profileImage?: string;
  walletAddress: string;
  createdAt: string;
}

interface SupportModalProps {
  creator: CreatorProfile;
  selectedTier: SupportTier | null;
  onClose: () => void;
  onComplete: () => void;
}

export function SupportModal({ creator, selectedTier, onClose, onComplete }: SupportModalProps) {
  const { address: userAddress } = useAccount();
  const [supportType, setSupportType] = useState<'tip' | 'subscription'>(
    selectedTier ? 'subscription' : 'tip'
  );
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(SUPPORTED_TOKENS.USDC);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAddress) return;

    try {
      setIsProcessing(true);
      setError('');

      if (supportType === 'tip') {
        if (!amount || parseFloat(amount) <= 0) {
          setError('Please enter a valid amount');
          return;
        }

        const amountInWei = mockCreatorSupport.parseTokenAmount(amount, token);
        await mockCreatorSupport.sendOneTimeSupport(
          creator.walletAddress,
          userAddress,
          token,
          amountInWei
        );
      } else if (supportType === 'subscription' && selectedTier) {
        await mockCreatorSupport.subscribeToTier(
          creator.walletAddress,
          userAddress,
          selectedTier.id,
          token
        );
      }

      onComplete();
    } catch (error) {
      console.error('Error processing support:', error);
      setError('Failed to process support. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const tokenMetadata = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Support {creator.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!selectedTier && (
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSupportType('tip')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    supportType === 'tip'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  One-time Tip
                </button>
                <button
                  onClick={() => setSupportType('subscription')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    supportType === 'subscription'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Subscribe
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {supportType === 'tip' && (
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="10.00"
                    required
                  />
                  <select
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.entries(TOKEN_METADATA).map(([address, metadata]) => (
                      <option key={address} value={address}>
                        {metadata.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {supportType === 'subscription' && selectedTier && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedTier.name}</h3>
                <p className="text-gray-600 mb-2">{selectedTier.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {mockCreatorSupport.formatTokenAmount(selectedTier.price, token)} {tokenMetadata.symbol}
                  </span>
                  <span className="text-sm text-gray-500">per month</span>
                </div>
              </div>
            )}

            {supportType === 'subscription' && !selectedTier && (
              <div>
                <label htmlFor="subscription-amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Amount *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    id="subscription-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="5.00"
                    required
                  />
                  <select
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.entries(TOKEN_METADATA).map(([address, metadata]) => (
                      <option key={address} value={address}>
                        {metadata.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Important:</p>
                  <p>This is a demo. In a real implementation, you would need to approve token spending and confirm the transaction in your wallet.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : supportType === 'tip' ? 'Send Tip' : 'Subscribe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}