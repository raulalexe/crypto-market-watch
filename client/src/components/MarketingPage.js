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
import PricingSection from './PricingSection';
import Footer from './Footer';

const MarketingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Debug: Check what React sees for the environment variable
  console.log('REACT_APP_DISABLE_FREEMIUM:', process.env.REACT_APP_DISABLE_FREEMIUM);
  console.log('Should show freemium:', process.env.REACT_APP_DISABLE_FREEMIUM !== 'true');

  const notificationFeatures = [
    {
      icon: Bell,
      title: 'Smart Market Alerts',
      description: 'AI-powered notifications for market movements, sentiment changes, and critical events',
      features: [
        'Bitcoin dominance threshold alerts',
        'Altcoin Season Index notifications',
        'Fear & Greed Index changes',
        'Exchange flow movements',
        'Stablecoin supply ratio (SSR) alerts',
        'Custom price and volume thresholds'
      ]
    },
    {
      icon: Calendar,
      title: 'Market-Impacting Events',
      description: 'Stay ahead with our comprehensive economic and crypto event calendar',
      features: [
        'Federal Reserve meetings & FOMC decisions',
        'CPI, PCE, and PPI inflation releases',
        'Bitcoin halving countdown',
        'Ethereum network upgrades',
        'SEC & CFTC regulatory updates',
        'Major earnings and economic data'
      ]
    },
    {
      icon: Mail,
      title: 'Multi-Channel Notifications',
      description: 'Get notified through your preferred channels with customizable preferences',
      features: [
        'Email notifications with dark theme',
        'Push notifications for mobile',
        'Telegram bot integration',
        'In-app alert system',
        'Custom notification timing',
        'Event-specific alert preferences'
      ]
    }
  ];

  const analyticsFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Market Intelligence',
      description: 'Advanced machine learning algorithms provide multi-timeframe market predictions with confidence scoring',
      features: [
        'Short, medium, and long-term predictions',
        'Confidence scoring (0-100%)',
        'Market factor analysis',
        'Risk assessment with VaR calculations',
        'Historical accuracy tracking',
        'Automated market insights'
      ]
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics & Reports',
      description: 'Professional-grade analytics with comprehensive market metrics and export capabilities',
      features: [
        'Real-time crypto correlation matrix',
        'Asset performance comparisons',
        'Volatility and risk analysis',
        'Bitcoin dominance tracking',
        'Altcoin Season Index monitoring',
        'Professional PDF reports',
        'CSV, JSON, Excel exports',
        'Backtest performance tracking'
      ]
    },
    {
      icon: Layers,
      title: 'Layer 1 Blockchain Analytics',
      description: 'Deep insights into major blockchain networks with real-time metrics',
      features: [
        'Bitcoin network health (hash rate, TPS)',
        'Ethereum gas analysis',
        'Solana performance metrics',
        'Transaction volume tracking',
        'Active address monitoring',
        'Network congestion analysis'
      ]
    }
  ];

  const dataFeatures = [
    {
      icon: Database,
      title: 'Comprehensive Data Collection',
      description: 'Automated 24/7 data collection from 15+ sources with smart scheduling',
      features: [
        '200+ cryptocurrency prices (CoinGecko)',
        'Fear & Greed Index (Alternative.me)',
        'Macro indicators (DXY, Treasury yields)',
        'VIX volatility index',
        'Energy & equity markets',
        'Inflation data (CPI, PCE, PPI)',
        'Exchange flow analysis',
        'Stablecoin metrics (SSR)',
        'Economic calendar events'
      ]
    },
    {
      icon: Download,
      title: 'Advanced Data Export',
      description: 'Professional data export in multiple formats with API access',
      features: [
        'CSV, JSON, PDF & Excel exports',
        'Custom date ranges and filters',
        'RESTful API access (Pro tier)',
        'Professional PDF reports',
        'Historical data access',
        'Real-time WebSocket updates'
      ]
    },
    {
      icon: History,
      title: 'Historical Analysis & Backtesting',
      description: 'Complete historical data with AI prediction backtesting',
      features: [
        'Complete price history',
        'Volume and market cap trends',
        'AI prediction accuracy tracking',
        'Performance correlation analysis',
        'Risk-adjusted returns',
        'Sharpe ratio calculations'
      ]
    }
  ];

  const marketMetrics = [
    {
      icon: DollarSign,
      title: 'Bitcoin Dominance',
      value: 'Real-time tracking',
      description: 'Monitor BTC market share vs altcoins with threshold alerts'
    },
    {
      icon: TrendingUp,
      title: 'Altcoin Season Index',
      value: 'AI-calculated',
      description: 'Track altcoin season probability with BlockchainCenter methodology'
    },
    {
      icon: Volume2,
      title: 'Fear & Greed Index',
      value: 'Live sentiment',
      description: 'Market sentiment analysis with automated alerts'
    },
    {
      icon: BarChart3,
      title: 'SSR (Stablecoin Supply Ratio)',
      value: 'Live calculation',
      description: 'Measure buying power and market liquidity'
    },
    {
      icon: AlertTriangle,
      title: 'Economic Events',
      value: 'Calendar tracking',
      description: 'Monitor Fed meetings, inflation releases, and crypto events'
    },
    {
      icon: Target,
      title: 'Layer 1 Metrics',
      value: 'Blockchain data',
      description: 'Bitcoin, Ethereum, Solana network health monitoring'
    }
  ];

  const advancedFeatures = [
    {
      icon: Brain,
      title: 'AI Prediction Backtesting',
      description: 'Validate AI predictions with historical accuracy tracking',
      features: [
        'Historical prediction validation',
        'Confidence score accuracy',
        'Multi-timeframe performance',
        'Asset-specific backtesting',
        'Continuous model improvement',
        'Sharpe ratio calculations'
      ]
    },
    {
      icon: Layers,
      title: 'Smart Data Collection',
      description: 'Intelligent scheduling optimizes data collection and reduces costs',
      features: [
        'Business hours: Hourly collection',
        'Night hours: Every 3 hours',
        '15+ data sources integration',
        'Automatic error recovery',
        'Rate limit optimization',
        'Railway deployment ready'
      ]
    },
    {
      icon: BarChart3,
      title: 'Macro & Economic Analysis',
      description: 'Comprehensive economic indicators that drive crypto markets',
      features: [
        'CPI, PCE, PPI inflation tracking',
        'Federal Reserve meeting calendar',
        'Treasury yield monitoring',
        'DXY and VIX analysis',
        'Economic event impact scoring',
        'Macro-crypto correlation insights'
      ]
    }
  ];


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <TrendingUp className="w-8 h-8 text-crypto-green" />
              <span className="text-xl font-bold text-white">Crypto Market Watch</span>
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
              <div className="p-4 bg-crypto-green/20 rounded-full">
                <TrendingUp className="w-16 h-16 text-crypto-green" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-green-200 bg-clip-text text-transparent">
              Crypto Market Watch
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              AI-powered cryptocurrency market intelligence platform with real-time data collection, smart notifications, and comprehensive analytics. 
              Track cryptocurrencies, macro indicators, Layer 1 blockchain metrics, and market-impacting events with automated alerts via email, push notifications, and Telegram.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Show different buttons based on freemium setting */}
              {process.env.REACT_APP_DISABLE_FREEMIUM === 'true' ? (
                <>
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
                    className="inline-flex items-center px-8 py-4 border-2 border-crypto-blue text-crypto-blue font-semibold rounded-lg hover:bg-crypto-blue hover:text-white transition-colors shadow-lg"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    View Plans
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/app"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-crypto-blue to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Try Free Demo
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/app"
                    className="inline-flex items-center px-8 py-4 border-2 border-crypto-blue text-crypto-blue font-semibold rounded-lg hover:bg-crypto-blue hover:text-white transition-colors shadow-lg"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Launch App
                  </Link>
                </>
              )}
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
              <div className="text-gray-400">Market Intelligence</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">AI-Powered</div>
              <div className="text-gray-400">News Analysis</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">Multi-Channel</div>
              <div className="text-gray-400">Notifications</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">Layer 1</div>
              <div className="text-gray-400">Blockchain Analytics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">Multiple</div>
              <div className="text-gray-400">Cryptocurrencies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">15+</div>
              <div className="text-gray-400">Data Sources</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-crypto-blue mb-2">24/7</div>
              <div className="text-gray-400">Data Collection</div>
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
      <section id="pricing-section">
        <PricingSection 
          variant="marketing"
          showPaymentMethods={false}
          showFAQ={false}
          showCTA={true}
        />
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Crypto Trading?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join the next generation of crypto traders using AI-powered market intelligence. 
            Get real-time alerts, comprehensive analytics, and stay ahead of market movements with our advanced platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-crypto-blue to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
            >
              <Brain className="w-5 h-5 mr-2" />
              Try Free Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/app/subscription"
              className="inline-flex items-center px-8 py-4 border-2 border-crypto-blue text-crypto-blue font-semibold rounded-lg hover:bg-crypto-blue hover:text-white transition-colors"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              View Pricing Plans
            </Link>
          </div>
          <div className="mt-8 text-sm text-gray-500">
            <p>✓ No credit card required for demo • ✓ 7-day free trial • ✓ Cancel anytime</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MarketingPage;
