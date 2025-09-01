'use client';

import { useState, useEffect } from 'react';

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

export function CreatorsList() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from a smart contract or API
    const savedProfile = localStorage.getItem('creatorProfile');
    if (savedProfile) {
      setCreators([JSON.parse(savedProfile)]);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Creators Yet
        </h3>
        <p className="text-gray-600 mb-8">
          Be the first to create a profile and start receiving support!
        </p>
        <a
          href="/"
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Become a Creator
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creators.map((creator) => (
        <div key={creator.walletAddress} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              {creator.profileImage ? (
                <img
                  src={creator.profileImage}
                  alt={creator.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xl font-bold">
                  {creator.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {creator.name}
              </h3>
              <p className="text-sm text-gray-600">
                {creator.category}
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-4 line-clamp-3">
            {creator.bio}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {creator.socialLinks.twitter && (
              <a
                href={creator.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Twitter
              </a>
            )}
            {creator.socialLinks.instagram && (
              <a
                href={creator.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-800 text-sm"
              >
                Instagram
              </a>
            )}
            {creator.socialLinks.youtube && (
              <a
                href={creator.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-800 text-sm"
              >
                YouTube
              </a>
            )}
            {creator.socialLinks.website && (
              <a
                href={creator.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Website
              </a>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {new Date(creator.createdAt).toLocaleDateString()}
            </span>
            <a
              href={`/creator/${creator.walletAddress}`}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              View Profile
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}