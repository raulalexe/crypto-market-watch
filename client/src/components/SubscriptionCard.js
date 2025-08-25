import React, { useState, useEffect } from 'react';
import { CreditCard, Bitcoin, Zap, Check, X, Loader } from 'lucide-react';
import axios from 'axios';

const SubscriptionCard = ({ subscriptionStatus, onSubscriptionUpdate }) => {
  const [plans, setPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/plans');
      setPlans(response.data.plans);
      setPaymentMethods(response.data.paymentMethods);
    } catch (error) {
      console.error('Error fetching plans:', error);
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
          // This is a simplified version
          result = await axios.post('/api/subscribe/stripe', {
            planId,
            paymentMethodId: 'pm_test_123' // This would come from Stripe Elements
          });
          break;
          
        case 'nowpayments':
          // Use crypto subscription by default
          result = await axios.post('/api/subscribe/crypto-subscription', { planId });
          if (result.data.hostedUrl) {
            window.open(result.data.hostedUrl, '_blank');
          }
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
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

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
      free: [
        'Basic market data (limited)',
        '24-hour data history',
        'Basic AI analysis',
        '1 manual data collection per day'
      ],
      pro: [
        'All crypto assets (BTC, ETH, SOL, SUI, XRP)',
        '30-day historical data',
        'Advanced AI analysis with confidence scores',
        'Unlimited data collection',
        'Email alerts for extreme market conditions',
        'API access (1,000 calls/day)',
        'Data export (CSV/JSON)'
      ],
      premium: [
        'All Pro features',
        '1-year historical data',
        'Custom AI model training',
        'Priority support',
        'White-label options',
        'API access (10,000 calls/day)',
        'Advanced data export',
        'Custom integrations',
        'Error logs access'
      ],
      api: [
        'All Premium features',
        '100,000 API calls per day',
        'Real-time data streaming',
        'Webhook support',
        'Dedicated support',
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
      case 'nowpayments':
        return <Bitcoin className="w-5 h-5" />;
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
          <div className="flex items-center justify-between">
            <div>
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
            </div>
            {subscriptionStatus.plan !== 'free' && (
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
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
                
                {Object.entries(paymentMethods).map(([method, details]) => (
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
        ))}
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
    </div>
  );
};

export default SubscriptionCard;