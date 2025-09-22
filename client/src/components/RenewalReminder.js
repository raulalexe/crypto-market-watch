import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CreditCard, Bitcoin, X } from 'lucide-react';
import WalletPaymentModal from './WalletPaymentModal';

const RenewalReminder = ({ userData, onRenewalComplete }) => {
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalOptions, setRenewalOptions] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [cryptoPaymentDetails, setCryptoPaymentDetails] = useState(null);
  const [showWalletPaymentModal, setShowWalletPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData?.needsRenewal || userData?.expiredAt) {
      fetchRenewalOptions();
    }
  }, [userData]);

  const fetchRenewalOptions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/subscribe/renewal-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const options = await response.json();
        setRenewalOptions(options);
      }
    } catch (error) {
      console.error('Error fetching renewal options:', error);
    }
  };

  const handleRenewal = async (months) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (paymentMethod === 'stripe') {
        // Handle Stripe renewal
        const response = await fetch('/api/subscribe/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            planId: renewalOptions.expiredPlan,
            months: months
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          window.location.href = result.url;
        }
      } else {
        // Handle wallet payment renewal
        const network = paymentMethod.split('-')[1]; // 'base' or 'solana'
        const response = await fetch('/api/subscribe/renew', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            planId: renewalOptions.expiredPlan,
            months: months,
            network: network
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          setCryptoPaymentDetails(result);
          setShowWalletPaymentModal(true);
        }
      }
    } catch (error) {
      console.error('Renewal error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userData?.needsRenewal && !userData?.expiredAt) {
    return null;
  }

  const isExpired = userData?.expiredAt && new Date(userData.expiredAt) < new Date();
  const daysLeft = userData?.daysUntilExpiry || 0;

  return (
    <>
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 ${
        isExpired ? 'bg-red-900/20 border-red-500/30' : 'bg-yellow-900/20 border-yellow-500/30'
      } border rounded-lg p-4 backdrop-blur-sm`}>
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${isExpired ? 'text-red-400' : 'text-yellow-400'}`}>
            {isExpired ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-yellow-400'}`}>
              {isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon'}
            </h3>
            
            <p className="text-sm text-gray-300 mt-1">
              {isExpired 
                ? `Your ${renewalOptions?.planName || 'subscription'} expired on ${userData.expiredAt ? new Date(userData.expiredAt).toLocaleDateString() : 'an unknown date'}. Renew now to continue using premium features.`
                : `Your ${renewalOptions?.planName || 'subscription'} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to avoid interruption.`
              }
            </p>

            {renewalOptions && (
              <div className="mt-3 space-y-2">
                {/* Renewal Options */}
                <div className="grid grid-cols-2 gap-2">
                  {renewalOptions.renewalOptions.map((option) => (
                    <button
                      key={option.months}
                      onClick={() => setSelectedOption(option)}
                      className={`p-2 text-xs rounded border transition-colors ${
                        selectedOption?.months === option.months
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium">{option.months} month{option.months > 1 ? 's' : ''}</div>
                      <div className="text-xs opacity-75">
                        ${option.price.toFixed(2)}
                        {option.discount > 0 && (
                          <span className="text-green-400 ml-1">
                            ({Math.round(option.discount * 100)}% off)
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Payment Method Selection */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex items-center space-x-1 px-3 py-1 text-xs rounded transition-colors ${
                      paymentMethod === 'stripe'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Card</span>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('wallet-base')}
                    className={`flex items-center space-x-1 px-3 py-1 text-xs rounded transition-colors ${
                      paymentMethod === 'wallet-base'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Bitcoin className="w-3 h-3" />
                    <span>USDC (Base)</span>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('wallet-solana')}
                    className={`flex items-center space-x-1 px-3 py-1 text-xs rounded transition-colors ${
                      paymentMethod === 'wallet-solana'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Bitcoin className="w-3 h-3" />
                    <span>USDC (Solana)</span>
                  </button>
                </div>

                {/* Renew Button */}
                {selectedOption && (
                  <button
                    onClick={() => handleRenewal(selectedOption.months)}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
                  >
                    {loading ? 'Processing...' : `Renew for $${selectedOption.price.toFixed(2)}`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Payment Modal */}
      <WalletPaymentModal
        isOpen={showWalletPaymentModal}
        onClose={() => setShowWalletPaymentModal(false)}
        paymentDetails={cryptoPaymentDetails}
        onPaymentComplete={() => {
          setShowWalletPaymentModal(false);
          setCryptoPaymentDetails(null);
          onRenewalComplete?.();
          // Trigger a page refresh to update all components with new Pro status
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Small delay to show success message first
        }}
      />
    </>
  );
};

export default RenewalReminder;
