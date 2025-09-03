'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

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
}

interface CreatorProfileFormProps {
  onComplete: () => void;
}

export function CreatorProfileForm({ onComplete }: CreatorProfileFormProps) {
  const { address } = useAccount();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<CreatorProfile>({
    name: '',
    bio: '',
    category: '',
    socialLinks: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Art & Design',
    'Music & Audio',
    'Video & Film',
    'Writing & Blogging',
    'Gaming',
    'Education',
    'Technology',
    'Photography',
    'Podcasting',
    'Other'
  ];

  const handleInputChange = (field: keyof CreatorProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, this would save to a smart contract or IPFS
      const creatorData = {
        ...profile,
        walletAddress: address,
        createdAt: new Date().toISOString(),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Creator profile created:', creatorData);
      
      // Store in localStorage for demo purposes
      localStorage.setItem('creatorProfile', JSON.stringify(creatorData));
      
      onComplete();
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return profile.name.trim() !== '' && profile.category !== '';
      case 2:
        return profile.bio.trim().length >= 50;
      case 3:
        return true; // Social links are optional
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Create Your Profile</h3>
          <span className="text-sm text-gray-500">Step {step} of 3</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-gray-900">Basic Information</h4>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Creator Name *
              </label>
              <input
                type="text"
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your creator name"
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={profile.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">
                Profile Image URL (optional)
              </label>
              <input
                type="url"
                id="profileImage"
                value={profile.profileImage || ''}
                onChange={(e) => handleInputChange('profileImage', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com/your-image.jpg"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-gray-900">Tell Your Story</h4>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio * (minimum 50 characters)
              </label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell your audience about yourself, your content, and what makes you unique..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {profile.bio.length}/50 characters minimum
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-gray-900">Social Links (Optional)</h4>
            <p className="text-gray-600">Add your social media profiles to help fans find you elsewhere.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  id="twitter"
                  value={profile.socialLinks.twitter || ''}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://twitter.com/yourusername"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  id="instagram"
                  value={profile.socialLinks.instagram || ''}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://instagram.com/yourusername"
                />
              </div>

              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube
                </label>
                <input
                  type="url"
                  id="youtube"
                  value={profile.socialLinks.youtube || ''}
                  onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://youtube.com/c/yourchannel"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  value={profile.socialLinks.website || ''}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}
          
          <div className="ml-auto">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid(step)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}