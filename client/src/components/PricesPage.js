import React from 'react';
import CoinGeckoWidget from './CoinGeckoWidget';

const PricesPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Cryptocurrency Prices</h1>
          <p className="text-gray-400 text-lg">
            Real-time cryptocurrency prices and market data powered by CoinGecko
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Crypto Prices Widget */}
        <div className="mb-8">
          <CoinGeckoWidget />
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Market Overview */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Market Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Cryptocurrencies</span>
                <span className="text-white font-medium">10,000+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Market Cap</span>
                <span className="text-white font-medium">$2.5T+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">24h Volume</span>
                <span className="text-white font-medium">$100B+</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Widget Features</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-300">Real-time price updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-slate-300">100+ popular cryptocurrencies</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-slate-300">Customizable coin selection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-slate-300">24h price changes</span>
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Data Source</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CG</span>
                </div>
                <div>
                  <div className="text-white font-medium">CoinGecko</div>
                  <div className="text-slate-400 text-sm">Leading crypto data provider</div>
                </div>
              </div>
              <div className="text-slate-300 text-sm">
                Data is updated every 30 seconds and includes prices, market caps, and trading volumes from major exchanges worldwide.
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">Customize Your View</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Click the + button to expand controls</li>
                <li>• Search for specific cryptocurrencies</li>
                <li>• Add custom coins by entering CoinGecko IDs</li>
                <li>• Remove coins by clicking the × button</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Track Performance</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Green arrows indicate price increases</li>
                <li>• Red arrows indicate price decreases</li>
                <li>• Scroll to see more cryptocurrencies</li>
                <li>• Data refreshes automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricesPage;
