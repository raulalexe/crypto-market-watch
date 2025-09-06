import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ArrowRight,
  Check,
  Bell,
  Calendar,
  Mail,
  Target,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Database,
  Download,
  Brain,
  Layers,
  Volume2,
  History,
  Menu,
  X
} from 'lucide-react';

const MarketingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notificationFeatures = [
    {
      icon: Bell,
      title: 'Real-Time Market Alerts',
      description: 'Instant notifications for price movements, volume spikes, and market sentiment changes',
      features: [
        'SSR (Stablecoin Supply Ratio) alerts',
        'Bitcoin dominance changes',
        'Exchange flow movements',
        'Stablecoin market cap changes',
        'Custom alert thresholds'
      ]
    },
    {
      icon: Calendar,
      title: 'Upcoming Impactful Events',
      description: 'Stay ahead of market-moving events with our comprehensive calendar',
      features: [
        'Federal Reserve meetings & speeches',
        'Bitcoin halving events',
        'Ethereum network upgrades',
        'SEC & CFTC regulatory updates',
        'Major earnings reports'
      ]
    },
    {
      icon: Mail,
      title: 'Multi-Channel Notifications',
      description: 'Get notified through your preferred channels',
      features: [
        'Email notifications',
        'Push notifications',
        'Telegram bot integration',
        'In-app alerts',
        'Custom notification preferences'
      ]
    }
  ];

  const analyticsFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Market Analysis',
      description: 'Advanced machine learning algorithms analyze market patterns and provide predictions',
      features: [
        'Multi-timeframe analysis',
        'Market sentiment scoring',
        'Trend prediction models',
        'Risk assessment',
        'Automated insights'
      ]
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics Dashboard',
      description: 'Comprehensive market metrics and visualizations',
      features: [
        'Real-time price performance charts',
        'Asset correlation matrix',
        'Market volatility indicators',
        'Bitcoin dominance tracking',
        'Total market volume analysis'
      ]
    },
    {
      icon: Layers,
      title: 'Layer 1 Blockchain Data',
      description: 'Deep insights into major blockchain networks',
      features: [
        'Bitcoin network metrics',
        'Ethereum gas analysis',
        'Transaction volume tracking',
        'Network health indicators',
        'DeFi protocol monitoring'
      ]
    }
  ];

  const dataFeatures = [
    {
      icon: Database,
      title: 'Comprehensive Data Collection',
      description: 'Real-time data from multiple sources',
      features: [
        '200+ cryptocurrency prices',
        'Fear & Greed Index',
        'Treasury yields & DXY',
        'VIX volatility index',
        'Energy & equity markets',
        'Inflation data (CPI & PCE)',
        'Exchange flow analysis',
        'Stablecoin metrics (SSR)',
        'Social sentiment analysis'
      ]
    },
    {
      icon: Download,
      title: 'Advanced Data Export',
      description: 'Export your data in multiple formats',
      features: [
        'CSV & JSON exports',
        'Custom date ranges',
        'Filtered data sets',
        'Scheduled exports',
        'API access for developers'
      ]
    },
    {
      icon: History,
      title: 'Historical Data Analysis',
      description: 'Access and analyze historical market data',
      features: [
        'Price history charts',
        'Volume analysis',
        'Market cap trends',
        'Performance comparisons',
        'Backtesting capabilities'
      ]
    }
  ];

  const marketMetrics = [
    {
      icon: DollarSign,
      title: 'Bitcoin Dominance',
      value: 'Real-time tracking',
      description: 'Monitor BTC market share vs altcoins'
    },
    {
      icon: DollarSign,
      title: 'SSR (Stablecoin Supply Ratio)',
      value: 'Live calculation',
      description: 'Measure buying power in the market'
    },
    {
      icon: Volume2,
      title: 'Total Market Volume',
      value: '24/7 monitoring',
      description: 'Track overall market activity'
    },
    {
      icon: TrendingUp,
      title: 'Market Trends',
      value: 'AI analysis',
      description: 'Identify market direction patterns'
    },
    {
      icon: AlertTriangle,
      title: 'Volatility Alerts',
      value: 'Instant notifications',
      description: 'Get alerted to market volatility'
    },
    {
      icon: Target,
      title: 'Custom Thresholds',
      value: 'Personalized alerts',
      description: 'Set your own alert conditions'
    }
  ];

  const advancedFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Backtesting',
      description: 'Validate predictions with historical accuracy',
      features: [
        'Historical prediction validation',
        'Accuracy scoring & metrics',
        'Performance correlation analysis',
        'Asset-specific backtesting',
        'Continuous model improvement'
      ]
    },
    {
      icon: Layers,
      title: 'Layer 1 Blockchain Analytics',
      description: 'Deep insights into major blockchain networks',
      features: [
        'Bitcoin network metrics (hash rate, TPS)',
        'Ethereum gas analysis & pricing',
        'Solana performance tracking',
        'Network health indicators',
        'DeFi protocol monitoring'
      ]
    },
    {
      icon: BarChart3,
      title: 'Inflation & Macro Analysis',
      description: 'Track economic indicators that impact crypto',
      features: [
        'CPI & PCE inflation data',
        'Year-over-year calculations',
        'Federal Reserve impact analysis',
        'Economic calendar tracking',
        'Macro-crypto correlation insights'
      ]
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Basic dashboard access',
        'Real-time crypto prices',
        'Basic market metrics',
        'Fear & Greed Index',
        'Community support'
      ],
      popular: false,
      cta: 'Get Started Free'
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'month',
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
      popular: true,
      cta: 'Sign Up for Pro'
    },
    {
      name: 'Premium+',
      price: '$99',
      period: 'month',
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
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <TrendingUp className="w-8 h-8 text-crypto-blue" />
              <span className="text-xl font-bold text-white">Crypto Market Monitor</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/about"
                className="text-gray-300 hover:text-white transition-colors"
              >
                About
              </Link>
              <button
                onClick={() => {
                  const pricingSection = document.getElementById('pricing-section');
                  if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <Link
                to="/app"
                className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Launch App
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-700">
              <div className="flex flex-col space-y-4">
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-white transition-colors px-4 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <button
                  onClick={() => {
                    const pricingSection = document.getElementById('pricing-section');
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="text-gray-300 hover:text-white transition-colors text-left px-4 py-2"
                >
                  Pricing
                </button>
              </div>
              
              {/* Separate row for Launch App button */}
              <div className="pt-4 border-t border-gray-600">
                <Link
                  to="/app"
                  className="block w-full px-4 py-3 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-center font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Launch App
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-green-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-crypto-blue/20 rounded-full">
                <TrendingUp className="w-16 h-16 text-crypto-blue" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-green-200 bg-clip-text text-transparent">
              Crypto Market Monitor
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Advanced cryptocurrency analytics with real-time notifications, AI-powered predictions, and comprehensive market data. 
              Track 200+ cryptocurrencies, inflation data, Layer 1 blockchain metrics, and stay ahead with automated alerts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app"
                className="inline-flex items-center px-8 py-4 bg-crypto-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Launch App
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <button
                onClick={() => {
                  const pricingSection = document.getElementById('pricing-section');
                  if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center px-8 py-4 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">AI-Powered</div>
              <div className="text-gray-400">Analysis</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">24/7</div>
              <div className="text-gray-400">Market Monitoring</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">Multi-Channel</div>
              <div className="text-gray-400">Notifications</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">Market</div>
              <div className="text-gray-400">Impacting Events</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">200+</div>
              <div className="text-gray-400">Cryptocurrencies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">24/7</div>
              <div className="text-gray-400">Data Collection</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">15+</div>
              <div className="text-gray-400">Data Sources</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Stay Ahead with Smart Notifications</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Never miss important market movements. Get notified about events that impact crypto markets 
              through multiple channels.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {notificationFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gray-800 p-8 rounded-lg border border-gray-700 hover:border-crypto-blue/50 transition-colors">
                  <div className="p-4 bg-crypto-blue/20 rounded-lg w-fit mb-6">
                    <IconComponent className="w-10 h-10 text-crypto-blue" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Market Metrics Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Market Metrics</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Track the most important indicators that drive crypto market movements.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-700">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-crypto-blue/20 rounded-lg">
                      <IconComponent className="w-6 h-6 text-crypto-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{metric.title}</h3>
                      <p className="text-sm text-crypto-blue font-medium">{metric.value}</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{metric.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Analytics Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Advanced Analytics & AI</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Leverage cutting-edge technology to understand market patterns and make informed decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {analyticsFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gray-800 p-8 rounded-lg border border-gray-700">
                  <div className="p-4 bg-crypto-blue/20 rounded-lg w-fit mb-6">
                    <IconComponent className="w-10 h-10 text-crypto-blue" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Features Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Comprehensive Data & Export</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Access real-time data from multiple sources and export it for your analysis.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {dataFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gray-900 p-8 rounded-lg border border-gray-700">
                  <div className="p-4 bg-crypto-blue/20 rounded-lg w-fit mb-6">
                    <IconComponent className="w-10 h-10 text-crypto-blue" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Advanced Features & Capabilities</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Professional-grade tools for serious traders and analysts.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gray-800 p-8 rounded-lg border border-gray-700">
                  <div className="p-4 bg-crypto-blue/20 rounded-lg w-fit mb-6">
                    <IconComponent className="w-10 h-10 text-crypto-blue" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-300">
                        <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="py-24">
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
                className={`bg-gray-800 p-8 rounded-lg border-2 ${
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
                    <span className="text-lg text-gray-400 font-normal">/{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-300">
                      <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.name === 'Free' ? '/app' : '/app/subscription'}
                  className={`w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-crypto-blue text-white hover:bg-blue-600'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Monitoring?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of traders who trust Crypto Market Monitor for their market analysis and notifications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app"
              className="inline-flex items-center px-8 py-4 bg-crypto-blue text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Launch App Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/app/subscription"
              className="inline-flex items-center px-8 py-4 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              View All Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              <p>© 2024 Crypto Market Monitor. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link 
                to="/app/privacy" 
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/app/terms" 
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingPage;
