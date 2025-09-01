'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { mockCreatorSupport, SupportTier, SUPPORTED_TOKENS, TOKEN_METADATA } from '@/lib/smartContract';

interface SupportTierManagerProps {
  onTierCreated?: () => void;
}

export function SupportTierManager({ onTierCreated }: SupportTierManagerProps) {
  const { address } = useAccount();
  const [tiers, setTiers] = useState<SupportTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTier, setEditingTier] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    token: SUPPORTED_TOKENS.USDC
  });

  useEffect(() => {
    if (address) {
      loadTiers();
    }
  }, [address]);

  const loadTiers = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      const creatorTiers = await mockCreatorSupport.getCreatorTiers(address);
      setTiers(creatorTiers);
    } catch (error) {
      console.error('Error loading tiers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    try {
      const priceInWei = mockCreatorSupport.parseTokenAmount(formData.price, formData.token);
      
      if (editingTier !== null) {
        await mockCreatorSupport.updateTier(
          address,
          editingTier,
          formData.name,
          formData.description,
          priceInWei
        );
      } else {
        await mockCreatorSupport.createTier(
          address,
          formData.name,
          formData.description,
          priceInWei
        );
      }

      await loadTiers();
      resetForm();
      onTierCreated?.();
    } catch (error) {
      console.error('Error saving tier:', error);
    }
  };

  const handleEdit = (tier: SupportTier) => {
    const token = Object.keys(TOKEN_METADATA).find(
      addr => TOKEN_METADATA[addr as keyof typeof TOKEN_METADATA].decimals === 6
    ) || SUPPORTED_TOKENS.USDC;
    
    const formattedPrice = mockCreatorSupport.formatTokenAmount(tier.price, token);
    
    setFormData({
      name: tier.name,
      description: tier.description,
      price: formattedPrice,
      token
    });
    setEditingTier(tier.id);
    setShowCreateForm(true);
  };

  const handleToggleTier = async (tierId: number) => {
    if (!address) return;
    
    try {
      await mockCreatorSupport.toggleTier(address, tierId);
      await loadTiers();
    } catch (error) {
      console.error('Error toggling tier:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      token: SUPPORTED_TOKENS.USDC
    });
    setEditingTier(null);
    setShowCreateForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Support Tiers</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Create Tier
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingTier !== null ? 'Edit Tier' : 'Create New Tier'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tier Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Bronze Supporter"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe what supporters get at this tier..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="10.00"
                  required
                />
              </div>

              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                  Token
                </label>
                <select
                  id="token"
                  value={formData.token}
                  onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {Object.entries(TOKEN_METADATA).map(([address, metadata]) => (
                    <option key={address} value={address}>
                      {metadata.symbol} - {metadata.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                {editingTier !== null ? 'Update Tier' : 'Create Tier'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const token = Object.keys(TOKEN_METADATA).find(
            addr => TOKEN_METADATA[addr as keyof typeof TOKEN_METADATA].decimals === 6
          ) || SUPPORTED_TOKENS.USDC;
          const formattedPrice = mockCreatorSupport.formatTokenAmount(tier.price, token);
          const tokenMetadata = TOKEN_METADATA[token as keyof typeof TOKEN_METADATA];

          return (
            <div key={tier.id} className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(tier)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleTier(tier.id)}
                    className={`text-sm px-2 py-1 rounded ${
                      tier.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {tier.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{tier.description}</p>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">
                    {formattedPrice} {tokenMetadata.symbol}
                  </span>
                  <p className="text-sm text-gray-500">per month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Subscribers</p>
                  <p className="text-lg font-semibold text-gray-900">{tier.subscriberCount}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tiers.length === 0 && !showCreateForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Support Tiers Yet</h3>
          <p className="text-gray-600 mb-4">Create your first support tier to start receiving recurring support from your fans.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Create Your First Tier
          </button>
        </div>
      )}
    </div>
  );
}