import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe, 
  Clock,
  ArrowRight,
  Check,
  Star,
  Users,
  Activity
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Get instant insights into crypto market trends with our advanced analytics engine'
    },
    {
      icon: Zap,
      title: 'AI-Powered Predictions',
      description: 'Leverage machine learning for market direction predictions and trading signals'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime and data protection'
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Monitor 200+ cryptocurrencies across major exchanges worldwide'
    },
    {
      icon: Clock,
      title: '24/7 Monitoring',
      description: 'Never miss important market movements with continuous monitoring'
    },
    {
      icon: Activity,
      title: 'Advanced Metrics',
      description: 'Fear & Greed Index, market dominance, and custom indicators'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Basic market data',
        '24-hour history',
        'Basic AI analysis',
        'Community support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'month',
      features: [
        'All Free features',
        '30-day history',
        'Advanced AI analysis',
        'Data exports',
        'API access',
        'Email alerts'
      ],
      popular: true
    },
    {
      name: 'Premium+',
      price: '$99',
      period: 'month',
      features: [
        'All Pro features',
        '1-year history',
        'Custom AI models',
        'Priority support',
        'White-label options',
        'Error logs access'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-crypto-blue/20 rounded-full">
                <TrendingUp className="w-16 h-16 text-crypto-blue" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Crypto Market Monitor
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Advanced cryptocurrency analytics powered by AI. Get real-time insights, 
              predictions, and market intelligence to make informed trading decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center px-8 py-4 bg-crypto-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Start Trading
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/subscription"
                className="inline-flex items-center px-8 py-4 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">200+</div>
              <div className="text-gray-400">Cryptocurrencies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">50K+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Crypto Market Monitor?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built by traders, for traders. Get the tools you need to succeed in the crypto market.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors">
                  <div className="p-3 bg-crypto-blue/20 rounded-lg w-fit mb-4">
                    <IconComponent className="w-8 h-8 text-crypto-blue" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees, cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-gray-900 p-8 rounded-lg border-2 ${
                  plan.popular 
                    ? 'border-crypto-blue shadow-lg shadow-crypto-blue/20' 
                    : 'border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-crypto-blue text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-crypto-blue mb-1">
                    {plan.price}
                    <span className="text-lg text-gray-400">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-crypto-blue mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.name === 'Free' ? '/' : '/subscription'}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-crypto-blue hover:bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {plan.name === 'Free' ? 'Get Started' : 'Choose Plan'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Trading Smarter?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of traders who trust Crypto Market Monitor for their daily trading decisions.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-crypto-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-crypto-blue" />
            </div>
            <p className="text-gray-400 mb-4">© 2024 Crypto Market Monitor. All rights reserved.</p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/subscription" className="hover:text-white transition-colors">Pricing</Link>
              <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
