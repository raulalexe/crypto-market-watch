'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { mockCreatorSupport, SupportTier, SUPPORTED_TOKENS, TOKEN_METADATA } from '@/lib/smartContract';
import { SupportModal } from './SupportModal';

interface CreatorPageProps {
  creatorAddress: string;
}

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

export function CreatorPage({ creatorAddress }: CreatorPageProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [tiers, setTiers] = useState<SupportTier[]>([]);
  const [totalSupport, setTotalSupport] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SupportTier | null>(null);

  useEffect(() => {
    loadCreatorData();
  }, [creatorAddress]);

  const loadCreatorData = async () => {
    try {
      setIsLoading(true);
      
      // Load profile from localStorage (in a real app, this would come from IPFS or smart contract)
      const savedProfile = localStorage.getItem('creatorProfile');
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        if (profileData.walletAddress.toLowerCase() === creatorAddress.toLowerCase()) {
          setProfile(profileData);
        }
      }

      // Load support tiers and stats
      const creatorTiers = await mockCreatorSupport.getCreatorTiers(creatorAddress);
      const totalSupportReceived = await mockCreatorSupport.getTotalSupportReceived(creatorAddress);
      
      setTiers(creatorTiers);
      setTotalSupport(totalSupportReceived);
    } catch (error) {
      console.error('Error loading creator data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupportClick = (tier?: SupportTier) => {
    if (!isConnected) {
      // In a real app, you might want to show a wallet connection modal
      alert('Please connect your wallet to support this creator');
      return;
    }
    
    setSelectedTier(tier || null);
    setShowSupportModal(true);
  };

  const handleSupportComplete = () => {
    setShowSupportModal(false);
    setSelectedTier(null);
    loadCreatorData(); // Refresh data
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Creator Not Found</h2>
        <p className="text-gray-600 mb-8">
          This creator hasn't set up their profile yet or the address is invalid.
        </p>
        <a
          href="/app/creators"
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Browse Other Creators
        </a>
      </div>
    );
  }

  const formattedTotalSupport = mockCreatorSupport.formatTokenAmount(totalSupport, SUPPORTED_TOKENS.USDC);

  return (
    <div className="space-y-8">
      {/* Creator Header */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="w-32 h-32 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            {profile.profileImage ? (
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-4xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {profile.name}
                </h1>
                <p className="text-xl text-gray-600 mb-4">
                  {profile.category}
                </p>
              </div>
              
              <div className="flex flex-col md:items-end space-y-2">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {formattedTotalSupport} USDC
                  </p>
                  <p className="text-sm text-gray-500">Total Support Received</p>
                </div>
                
                <button
                  onClick={() => handleSupportClick()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                >
                  Support this Creator
                </button>
              </div>
            </div>

            <p className="text-gray-700 text-lg mb-6">
              {profile.bio}
            </p>
            
            <div className="flex flex-wrap gap-4">
              {profile.socialLinks.twitter && (
                <a
                  href={profile.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                  <span>Twitter</span>
                </a>
              )}
              {profile.socialLinks.instagram && (
                <a
                  href={profile.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-pink-600 hover:text-pink-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  <span>Instagram</span>
                </a>
              )}
              {profile.socialLinks.youtube && (
                <a
                  href={profile.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-red-600 hover:text-red-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z" clipRule="evenodd" />
                  </svg>
                  <span>YouTube</span>
                </a>
              )}
              {profile.socialLinks.website && (
                <a
                  href={profile.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                  </svg>
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Support Tiers */}
      {tiers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Support Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const token = Object.keys(TOKEN_METADATA).find(
                addr => TOKEN_METADATA[addr as keyof typeof TOKEN_METADATA].decimals === 6
              ) || SUPPORTED_TOKENS.USDC;
              const formattedPrice = mockCreatorSupport.formatTokenAmount(tier.price, token);
              const tokenMetadata = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA];

              return (
                <div key={tier.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-purple-500 transition-colors">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-gray-900">
                        {formattedPrice} {tokenMetadata.symbol}
                      </span>
                      <p className="text-sm text-gray-500">per month</p>
                    </div>

                    <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                      <span>{tier.subscriberCount} subscribers</span>
                      <span className={`px-2 py-1 rounded ${
                        tier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSupportClick(tier)}
                      disabled={!tier.isActive}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                        tier.isActive
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transform hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {tier.isActive ? 'Subscribe' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <SupportModal
          creator={profile}
          selectedTier={selectedTier}
          onClose={() => setShowSupportModal(false)}
          onComplete={handleSupportComplete}
        />
      )}
    </div>
  );
}