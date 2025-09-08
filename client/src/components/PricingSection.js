import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  X, 
  Clock, 
  Tag, 
  Star,
  BarChart3,
  Zap,
  CreditCard,
  Globe,
  Bitcoin
} from 'lucide-react';
import ToastNotification from './ToastNotification';

const PricingSection = ({ 
  variant = 'marketing', // 'marketing' or 'app'
  setAuthModalOpen,
  showPaymentMethods = true,
  showFAQ = true,
  showHeader = true,
  showCTA = true
}) => {
  const [loading, setLoading] = useState(true);
  const [isLaunchPhase, setIsLaunchPhase] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [alert, setAlert] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [discountActive, setDiscountActive] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchPricing();
    // Check if we're in launch phase
    setIsLaunchPhase(process.env.REACT_APP_LAUNCH_PHASE === 'true');
    setLoading(false);
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return;
      }
      
      const response = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
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

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/subscription/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricing(data.pricing);
        setDiscountActive(data.discountActive);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
  };

  const handleSubscribe = async (planId) => {
    if (isLaunchPhase && (planId === 'pro' || planId === 'premium')) {
      showAlert('Pro and Premium plans are coming soon! Stay tuned for updates.', 'info');
      return;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      if (setAuthModalOpen) {
        setAuthModalOpen(true);
      } else {
        showAlert('Please sign in to subscribe to a plan.', 'warning');
      }
      return;
    }
    
    // For now, redirect to a subscription page or show payment options
    if (planId === 'free') {
      showAlert('You are already on the free plan!', 'info');
      return;
    }
    
    // For Pro and Premium plans, show payment modal
    const plan = plansData.find(p => p.id === planId);
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentMethod = async (method) => {
    if (!selectedPlan) return;
    
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      if (setAuthModalOpen) {
        setAuthModalOpen(true);
      } else {
        showAlert('Please sign in to subscribe to a plan.', 'warning');
      }
      setShowPaymentModal(false);
      return;
    }
    
    setShowPaymentModal(false);
    
    try {
      if (method === 'stripe') {
        // Stripe payment
        const response = await fetch('/api/subscribe/stripe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planId: selectedPlan.id })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.url) {
            // Redirect to Stripe Checkout
            window.location.href = result.url;
          } else {
            showAlert('Subscription failed: ' + (result.error || 'Unknown error'), 'error');
          }
        } else {
          const errorData = await response.json();
          showAlert('Subscription failed: ' + (errorData.error || 'Please try again.'), 'error');
        }
      } else {
        // Crypto payment
        const response = await fetch('/api/subscribe/crypto-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planId: selectedPlan.id })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.hostedUrl) {
            window.open(result.hostedUrl, '_blank');
          } else {
            showAlert('Crypto payment setup failed. Please try again.', 'error');
          }
        } else {
          showAlert('Crypto payment setup failed. Please try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showAlert('Subscription failed. Please try again.', 'error');
    }
  };

  const plansData = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      originalPrice: 0,
      period: 'forever',
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
      comingSoon: false,
      hasDiscount: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: pricing?.pro?.currentPrice || 29,
      originalPrice: pricing?.pro?.originalPrice || 29,
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
      comingSoon: isLaunchPhase,
      hasDiscount: pricing?.pro?.hasDiscount || false,
      discountPercentage: pricing?.pro?.discountPercentage || 0
    },
    {
      id: 'premium',
      name: 'Premium+',
      price: pricing?.premium?.currentPrice || 99,
      originalPrice: pricing?.premium?.originalPrice || 99,
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
      comingSoon: isLaunchPhase,
      hasDiscount: pricing?.premium?.hasDiscount || false,
      discountPercentage: pricing?.premium?.discountPercentage || 0
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-crypto-blue"></div>
      </div>
    );
  }

  const renderPlanCard = (plan) => {
    const IconComponent = plan.icon;
    const isCurrentPlan = subscriptionStatus?.plan === plan.id;
    
    return (
      <div
        key={plan.id}
        className={`relative bg-gray-800 rounded-lg p-8 border-2 transition-all duration-300 hover:scale-105 ${
          plan.popular 
            ? 'border-crypto-blue shadow-lg shadow-crypto-blue/20' 
            : 'border-gray-700 hover:border-gray-600'
        } ${plan.comingSoon ? 'opacity-75' : ''}`}
      >
        {plan.hasDiscount && !plan.comingSoon && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1 animate-pulse">
              <Tag className="w-3 h-3" />
              <span>LIMITED OFFER</span>
            </span>
          </div>
        )}

        {plan.popular && !plan.comingSoon && !plan.hasDiscount && (
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
            {plan.hasDiscount ? (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-2xl text-gray-400 line-through">
                    ${plan.originalPrice}
                  </span>
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                    -{plan.discountPercentage}%
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-4xl font-bold text-red-400">
                    ${plan.price}
                  </span>
                  <span className="text-gray-400">/{plan.period}</span>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-red-400 font-medium">
                    🔥 Limited Time Offer!
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-1">
                <span className="text-4xl font-bold">
                  ${plan.price}
                </span>
                <span className="text-gray-400">/{plan.period}</span>
              </div>
            )}
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
        {variant === 'app' ? (
          <button
            onClick={() => handleSubscribe(plan.id)}
            disabled={plan.comingSoon || isCurrentPlan}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
              plan.comingSoon
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : isCurrentPlan
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : plan.popular
                    ? 'bg-crypto-blue hover:bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {plan.comingSoon 
              ? 'Coming Soon' 
              : isCurrentPlan
                ? 'Current Plan' 
                : plan.price === 0 
                  ? 'Get Started Free' 
                  : 'Subscribe Now'
            }
          </button>
        ) : (
          <Link
            to={plan.name === 'Free' ? '/app' : '/app/subscription'}
            className={`w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
              plan.popular
                ? 'bg-crypto-blue text-white hover:bg-blue-600'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {plan.cta || (plan.price === 0 ? 'Get Started Free' : 'Sign Up for Pro')}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className={variant === 'marketing' ? 'py-24' : 'min-h-screen bg-gray-900 text-white p-6'}>
      <div className={variant === 'marketing' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto'}>
        {/* Header */}
        {showHeader && (
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {variant === 'marketing' ? 'Choose Your Plan' : 'Choose Your Plan'}
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {variant === 'marketing' 
                ? 'Start free and upgrade as you grow. No hidden fees, cancel anytime.'
                : 'Unlock powerful crypto market insights and advanced analytics to make informed trading decisions'
              }
            </p>
            
            {/* Discount Banner */}
            {discountActive && subscriptionStatus?.plan !== 'pro' && subscriptionStatus?.plan !== 'premium' && subscriptionStatus?.plan !== 'admin' && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg max-w-2xl mx-auto animate-pulse">
                <div className="flex items-center justify-center space-x-2">
                  <Tag className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">
                    🔥 LIMITED TIME OFFER: Pro plan now ${pricing?.pro?.currentPrice} (Save {pricing?.pro?.discountPercentage}%!)
                  </span>
                </div>
              </div>
            )}
            
            {/* Launch Phase Banner */}
            {isLaunchPhase && (
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Launch Phase: Pro and Premium plans coming soon!</span>
                </div>
              </div>
            )}
            
            {/* Admin Banner */}
            {subscriptionStatus?.plan === 'admin' && (
              <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-medium">Admin Access: You have full system control and all features unlocked</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Admin Plan Card - Show only for admin users in app variant */}
          {variant === 'app' && subscriptionStatus?.plan === 'admin' && (
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

          {/* Regular Plans */}
          {variant === 'marketing' ? 
            plansData.map(renderPlanCard) :
            (subscriptionStatus?.plan !== 'admin' && plansData.map(renderPlanCard))
          }
        </div>

        {/* Payment Methods */}
        {showPaymentMethods && variant === 'app' && (
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
        )}

        {/* FAQ */}
        {showFAQ && variant === 'app' && (
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
        )}

        {/* CTA Section for Marketing */}
        {showCTA && variant === 'marketing' && (
          <div className="text-center mt-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app"
                className="inline-flex items-center px-8 py-4 bg-crypto-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
              >
                Launch App Now
              </Link>
              <Link
                to="/app/subscription"
                className="inline-flex items-center px-8 py-4 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
              >
                View All Plans
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Payment Method Selection Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full border border-gray-700">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Choose Payment Method
              </h3>
              <p className="text-gray-400">
                Subscribe to {selectedPlan.name} plan for ${selectedPlan.price}/{selectedPlan.period}
                {selectedPlan.hasDiscount && (
                  <span className="block text-sm text-red-400 mt-1">
                    🔥 Limited Time Offer! Save {selectedPlan.discountPercentage}% (was ${selectedPlan.originalPrice})
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <button
                onClick={() => handlePaymentMethod('stripe')}
                className="w-full flex items-center justify-center space-x-3 bg-crypto-blue hover:bg-blue-600 text-white py-4 px-6 rounded-lg transition-colors duration-200"
              >
                <CreditCard className="w-6 h-6" />
                <span className="font-semibold">Pay with Credit Card</span>
              </button>
              
              <button
                onClick={() => handlePaymentMethod('crypto')}
                className="w-full flex items-center justify-center space-x-3 bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-lg transition-colors duration-200"
              >
                <Bitcoin className="w-6 h-6" />
                <span className="font-semibold">Pay with Cryptocurrency</span>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {alert && <ToastNotification message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default PricingSection;
