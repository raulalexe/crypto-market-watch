import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Zap, 
  BarChart3, 
  Globe, 
  Star,
  Check,
  X,
  Clock
} from 'lucide-react';

const SubscriptionPlans = () => {
  const [loading, setLoading] = useState(true);
  const [isLaunchPhase, setIsLaunchPhase] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptionStatus();
    // Check if we're in launch phase
    setIsLaunchPhase(process.env.REACT_APP_LAUNCH_PHASE === 'true');
  }, []);

  const fetchPlans = async () => {
    try {
      // eslint-disable-next-line no-unused-vars
      const response = await fetch('/api/subscription/plans');
      // plans data is available but not used in current implementation
      console.log('Plans loaded successfully');
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const status = await response.json();
        setSubscriptionStatus(status);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSubscribe = async (planId) => {
    if (isLaunchPhase && (planId === 'pro' || planId === 'premium')) {
      alert('Pro and Premium plans are coming soon! Stay tuned for updates.');
      return;
    }
    // Implementation for subscription logic
    console.log('Subscribing to plan:', planId);
  };

  const plansData = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'month',
      description: 'Basic access to crypto market data',
      features: [
        'Basic dashboard access',
        'Real-time crypto prices',
        'Basic market metrics',
        'Fear & Greed Index',
        'Community support'
      ],
      limitations: [
        'No AI market analysis',
        'No market alerts',
        'No data exports',
        'No API access',
        'No notifications'
      ],
      popular: false,
      icon: BarChart3,
      comingSoon: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      period: 'month',
      description: 'Advanced features for serious traders',
      features: [
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
      limitations: [
        'Limited API calls (1,000/day)',
        'No white-label options (can\'t rebrand as your own product)'
      ],
      popular: true,
      icon: Zap,
      comingSoon: isLaunchPhase
    },
    {
      id: 'premium',
      name: 'Premium+',
      price: 99,
      period: 'month',
      description: 'Professional tools for institutions',
      features: [
        'All Pro features',
        'Unlimited API calls',
        'White-label options',
        'Advanced analytics',
        'Priority notification delivery',
        'Custom alert thresholds',
        'Advanced data exports',
        'Webhook integrations'
      ],
      limitations: [],
      popular: false,
      icon: Star,
      comingSoon: isLaunchPhase
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-crypto-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Unlock powerful crypto market insights and advanced analytics to make informed trading decisions
          </p>
          {isLaunchPhase && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Launch Phase: Pro and Premium plans coming soon!</span>
              </div>
            </div>
          )}
          {subscriptionStatus?.plan === 'admin' && (
            <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Star className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-medium">Admin Access: You have full system control and all features unlocked</span>
              </div>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Admin Plan Card - Show only for admin users */}
          {subscriptionStatus?.plan === 'admin' && (
            <div className="relative bg-purple-900/20 rounded-lg p-8 border-2 border-purple-500/30">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  ADMIN
                </span>
              </div>

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <Star className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-purple-200">Admin</h3>
                <p className="text-purple-300 mb-4">Full system access and control</p>
                
                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-purple-300">
                    Full Access
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h4 className="font-semibold mb-4 text-purple-300">What's included:</h4>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                    <span className="text-sm text-purple-200">All Premium features</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                    <span className="text-sm text-purple-200">Admin access and controls</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                    <span className="text-sm text-purple-200">Error logs access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                    <span className="text-sm text-purple-200">Unlimited API calls</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-5 h-5 text-purple-400 mr-3 flex-shrink-0" />
                    <span className="text-sm text-purple-200">System management tools</span>
                  </li>
                </ul>
              </div>

              {/* Admin Button */}
              <button
                disabled
                className="w-full py-3 px-6 rounded-lg font-semibold bg-purple-600 text-white cursor-not-allowed"
              >
                Current Plan
              </button>
            </div>
          )}

          {/* Regular Plans - Hide for admin users */}
          {subscriptionStatus?.plan !== 'admin' && plansData.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-lg p-8 border-2 transition-all duration-300 hover:scale-105 ${
                  plan.popular 
                    ? 'border-crypto-blue shadow-lg shadow-crypto-blue/20' 
                    : 'border-gray-700 hover:border-gray-600'
                } ${plan.comingSoon ? 'opacity-75' : ''}`}
              >
                {plan.popular && !plan.comingSoon && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-crypto-blue text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {plan.comingSoon && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Coming Soon</span>
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <IconComponent className={`w-12 h-12 ${plan.comingSoon ? 'text-gray-500' : 'text-crypto-blue'}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      ${plan.price}
                    </span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="font-semibold mb-4 text-crypto-blue">What's included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className={`text-sm ${plan.comingSoon ? 'text-gray-500' : ''}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-semibold mb-4 text-red-400">Limitations:</h4>
                    <ul className="space-y-3">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-center">
                          <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                          <span className={`text-sm text-gray-400 ${plan.comingSoon ? 'text-gray-600' : ''}`}>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.comingSoon}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.comingSoon
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : plan.popular
                        ? 'bg-crypto-blue hover:bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {plan.comingSoon 
                    ? 'Coming Soon' 
                    : plan.price === 0 
                      ? 'Current Plan' 
                      : 'Subscribe Now'
                  }
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h3 className="text-xl font-bold mb-6">Payment Methods</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <CreditCard className="w-8 h-8 text-crypto-blue" />
              <div>
                <h4 className="font-semibold">Credit Card</h4>
                <p className="text-gray-400 text-sm">Secure payment via Stripe</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Globe className="w-8 h-8 text-crypto-blue" />
              <div>
                <h4 className="font-semibold">Cryptocurrency</h4>
                <p className="text-gray-400 text-sm">Pay with 200+ cryptocurrencies</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gray-800 rounded-lg p-8">
          <h3 className="text-xl font-bold mb-6">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-400">Yes, you can cancel your subscription at any time. No long-term commitments required.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-400">We accept all major credit cards via Stripe and over 200 cryptocurrencies via NOWPayments.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-gray-400">Yes, you can try our Pro plan free for 7 days before being charged.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h4>
              <p className="text-gray-400">Yes, you can change your plan at any time. Changes take effect immediately.</p>
            </div>
            {isLaunchPhase && (
              <div>
                <h4 className="font-semibold mb-2">When will Pro and Premium plans be available?</h4>
                <p className="text-gray-400">We're working hard to launch Pro and Premium features. Sign up for our newsletter to be notified when they become available!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
