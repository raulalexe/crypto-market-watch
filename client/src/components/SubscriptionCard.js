import React, { useState, useEffect } from 'react';
import { CreditCard, Bitcoin, Zap, Check, X, Loader } from 'lucide-react';
import axios from 'axios';

const SubscriptionCard = ({ subscriptionStatus = null, onSubscriptionUpdate = null }) => {
  const [plans, setPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/plans');
      setPlans(response.data?.plans || []);
      setPaymentMethods(response.data?.paymentMethods || {});
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
      setPaymentMethods({});
    }
  };

  const handleSubscribe = async (planId, paymentMethod) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      switch (paymentMethod) {
        case 'stripe':
          // For Stripe, you'd typically use Stripe Elements
          // This is a simplified version - in production, you'd collect payment method from Stripe Elements
          result = await axios.post('/api/subscribe/stripe', {
            planId,
            paymentMethodId: null // Would be collected from Stripe Elements in production
          });
          break;
          
          
        default:
          throw new Error('Invalid payment method');
      }

      if (onSubscriptionUpdate) {
        onSubscriptionUpdate();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setShowCancelModal(false);
    setLoading(true);
    try {
      await axios.post('/api/subscribe/cancel');
      if (onSubscriptionUpdate) {
        onSubscriptionUpdate();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getPlanFeatures = (planId) => {
    const features = {
      admin: [
        'All Premium+ features',
        'Admin access and controls',
        'Error logs access',
        'Unlimited API calls',
        'Data export capabilities',
        'Custom integrations',
        'System management tools'
      ],
      free: [
        'Basic dashboard access',
        'Real-time crypto prices',
        'Basic market metrics',
        'Fear & Greed Index',
        'Community support'
      ],
      pro: [
        'All Free features',
        'AI market analysis (short, medium, long-term)',
        'Real-time market alerts',
        'Email notifications',
        'Push notifications',
        'Telegram bot alerts',
        'Advanced metrics (VIX, DXY, Treasury yields)',
        'Exchange flow data',
        'Stablecoin metrics (SSR)',
        'Data exports (CSV, JSON)',
        'API access (1,000 calls/day)',
        'Upcoming market events tracking'
      ],
      premium: [
        'All Pro features',
        'Unlimited API calls',
        'White-label options',
        'Advanced analytics',
        'Priority notification delivery',
        'Custom alert thresholds',
        'Advanced data exports',
        'Webhook integrations'
      ],
      api: [
        'All Premium+ features',
        '100,000 API calls per day',
        'Real-time data streaming',
        'Webhook support',
        'Custom data endpoints',
        'Bulk data export',
        'Advanced analytics',
        'SLA guarantee'
      ]
    };
    return features[planId] || [];
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'stripe':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <Zap className="w-6 h-6 text-crypto-blue" />
        <h3 className="text-lg font-semibold text-white">Subscription Plans</h3>
      </div>

      {/* Current Subscription Status */}
      {subscriptionStatus && (
        <div className="mb-6 p-4 bg-slate-700 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-white font-medium">
                Current Plan: {subscriptionStatus.planName || 'Free'}
              </h4>
              <p className="text-slate-400 text-sm">
                Status: {subscriptionStatus.status}
              </p>
              {subscriptionStatus.currentPeriodEnd && (
                <p className="text-slate-400 text-sm">
                  Renews: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {subscriptionStatus.plan === 'admin' && (
                <p className="text-purple-400 text-sm font-medium">
                  ⚡ Admin Access - Full System Control
                </p>
              )}
            </div>
            {subscriptionStatus.plan !== 'free' && subscriptionStatus.plan !== 'admin' && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Cancel'}
              </button>
            )}
            {subscriptionStatus.plan === 'admin' && (
              <div className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold flex-shrink-0">
                ADMIN
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Admin Plan Card - Show only for admin users */}
        {subscriptionStatus?.plan === 'admin' && (
          <div className="p-6 rounded-lg border bg-purple-900/20 border-purple-500/30">
            <div className="text-center mb-4">
              <h4 className="text-xl font-bold text-white mb-2">Admin</h4>
              <div className="text-3xl font-bold text-purple-400 mb-1">
                Full Access
              </div>
              <div className="text-sm text-purple-300">
                System Administrator
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {getPlanFeatures('admin').map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-purple-200">
                  <Check className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="text-center">
              <div className="text-purple-400 font-medium">Current Plan</div>
              <div className="text-xs text-purple-300 mt-1">Cannot be changed</div>
            </div>
          </div>
        )}

        {/* Regular Plans - Hide for admin users */}
        {subscriptionStatus?.plan !== 'admin' && plans && plans.length > 0 ? plans.map((plan) => (
          <div
            key={plan.id}
            className={`p-6 rounded-lg border transition-colors ${
              subscriptionStatus?.plan === plan.id
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-slate-700 border-slate-600 hover:border-slate-500'
            }`}
          >
            <div className="text-center mb-4">
              <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
              <div className="text-3xl font-bold text-crypto-blue mb-1">
                ${plan.price}
                <span className="text-sm text-slate-400">/month</span>
              </div>
              <div className="text-sm text-slate-400">
                or {plan.cryptoPrice} ETH/month
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {getPlanFeatures(plan.id).map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-slate-300">
                  <Check className="w-4 h-4 text-crypto-green mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Payment Methods */}
            {subscriptionStatus?.plan !== plan.id && (
              <div className="space-y-2">
                <p className="text-sm text-slate-400 mb-3">Choose payment method:</p>
                
                {paymentMethods && Object.keys(paymentMethods).length > 0 && Object.entries(paymentMethods).map(([method, details]) => (
                  <button
                    key={method}
                    onClick={() => handleSubscribe(plan.id, method)}
                    disabled={loading}
                    className="w-full flex items-center justify-center space-x-2 p-3 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {getPaymentMethodIcon(method)}
                        <span className="text-white">{details.name}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}

            {subscriptionStatus?.plan === plan.id && (
              <div className="text-center">
                <div className="text-crypto-green font-medium">Current Plan</div>
              </div>
            )}
          </div>
        )) : subscriptionStatus?.plan !== 'admin' ? (
          <div className="col-span-full text-center py-8">
            <div className="text-slate-400">Loading subscription plans...</div>
          </div>
        ) : null}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* API Usage Info */}
      {subscriptionStatus?.plan !== 'free' && (
        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <h4 className="text-white font-medium mb-2">API Access</h4>
          <p className="text-slate-400 text-sm">
            Your plan includes API access with rate limiting. 
            Check your usage at <code className="bg-slate-600 px-1 rounded">/api/usage</code>
          </p>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full border border-slate-700">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Cancel Subscription
              </h3>
              <p className="text-gray-400">
                Are you sure you want to cancel your subscription? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;