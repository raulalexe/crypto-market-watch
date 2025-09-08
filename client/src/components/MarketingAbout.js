import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Menu, X, Info, Clock, Database, Brain, TrendingUp as TrendingUpIcon, Shield, Zap } from 'lucide-react';
import axios from 'axios';

const MarketingAbout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastCollectionTime, setLastCollectionTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLastCollectionTime();
  }, []);

  const fetchLastCollectionTime = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      if (response.data && response.data.timestamp) {
        setLastCollectionTime(response.data.timestamp);
      }
    } catch (error) {
      console.error('Error fetching last collection time:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const features = [
    {
      icon: Database,
      title: 'Real-time Data Collection',
      description: 'Automatically collects market data every hour from multiple sources including crypto prices, macro indicators, and market sentiment.',
      color: 'text-crypto-blue'
    },
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI models analyze market trends, predict price movements, and provide actionable insights with confidence scores.',
      color: 'text-purple-400'
    },
    {
      icon: TrendingUpIcon,
      title: 'Comprehensive Metrics',
      description: 'Track DXY Index, Treasury Yields, VIX, equity indices, and crypto prices with historical data and trend analysis.',
      color: 'text-crypto-green'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with JWT authentication, rate limiting, and secure API access for premium users.',
      color: 'text-orange-400'
    },
    {
      icon: Zap,
      title: 'Subscription Tiers',
      description: 'Free, Pro, and Premium plans with different feature sets, API access limits, and advanced analytics.',
      color: 'text-yellow-400'
    }
  ];

  const dataSources = [
    { name: 'CoinGecko', description: 'Cryptocurrency prices and market data' },
    { name: 'Alpha Vantage', description: 'Stock market data and macro indicators' },
    { name: 'FRED API', description: 'Federal Reserve economic data' },
    { name: 'Venice AI', description: 'AI-powered market analysis' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <TrendingUp className="w-8 h-8 text-crypto-blue" />
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
              <Link
                to="/app"
                className="px-4 py-2 bg-crypto-green text-black rounded-lg hover:bg-green-400 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
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
                <Link
                  to="/app"
                  className="px-4 py-2 bg-crypto-green text-black rounded-lg hover:bg-green-400 transition-colors mx-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Info className="w-8 h-8 text-crypto-blue" />
            <h1 className="text-3xl font-bold text-white">About Crypto Market Watch</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A comprehensive cryptocurrency market monitoring platform that combines real-time data collection, 
            AI-powered analysis, and advanced market insights to help you make informed trading decisions.
          </p>
        </div>

        {/* Data Collection Info */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-crypto-blue" />
            <h2 className="text-xl font-semibold text-white">Data Collection</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Collection Schedule</h3>
              <p className="text-slate-300 mb-4">
                Smart scheduling based on market hours:
              </p>
              <ul className="space-y-1 text-slate-400 mb-4">
                <li>• Weekdays 9 AM - 5 PM UTC: Every hour</li>
                <li>• Weekdays off-hours: Every 3 hours</li>
                <li>• Weekends: Every 4 hours</li>
              </ul>
              <ul className="space-y-2 text-slate-400">
                <li>• Cryptocurrency prices (BTC, ETH, SOL, SUI, XRP)</li>
                <li>• Macro indicators (DXY, Treasury Yields, VIX)</li>
                <li>• Equity indices (S&P 500, NASDAQ)</li>
                <li>• Market sentiment and narratives</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Last Collection</h3>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-crypto-blue border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-slate-400">Loading...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-300">
                    <span className="text-crypto-green font-semibold">
                      {formatTimestamp(lastCollectionTime)}
                    </span>
                  </p>
                  <button
                    onClick={fetchLastCollectionTime}
                    className="text-sm text-crypto-blue hover:text-blue-400 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <div className="flex items-center space-x-3 mb-4">
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Data Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map((source, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                <div className="w-3 h-3 bg-crypto-blue rounded-full"></div>
                <div>
                  <h4 className="text-white font-medium">{source.name}</h4>
                  <p className="text-slate-400 text-sm">{source.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Technical Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Frontend</h3>
              <ul className="space-y-1 text-slate-400">
                <li>• React 18</li>
                <li>• Tailwind CSS</li>
                <li>• Lucide React Icons</li>
                <li>• Axios for API calls</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Backend</h3>
              <ul className="space-y-1 text-slate-400">
                <li>• Node.js & Express</li>
                <li>• PostgreSQL Database</li>
                <li>• JWT Authentication</li>
                <li>• Cron Jobs</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">APIs & Services</h3>
              <ul className="space-y-1 text-slate-400">
                <li>• Stripe Payments</li>
                <li>• NOWPayments Crypto</li>
                <li>• Venice AI Analysis</li>
                <li>• Multiple Data APIs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center text-slate-400 text-sm">
          <p>Version 1.0.0 • Built with ❤️ for the crypto community</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              <p>© 2025 Crypto Market Watch. All rights reserved.</p>
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

export default MarketingAbout;
