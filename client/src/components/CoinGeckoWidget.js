import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw } from 'lucide-react';

const CoinGeckoWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoins, setSelectedCoins] = useState(['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana']);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  // Load CoinGecko widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widgets.coingecko.com/coingecko-coin-price-ticker-widget.js';
    script.async = true;
    script.onload = () => setWidgetLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src*="coingecko-coin-price-ticker-widget"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Popular cryptocurrencies for quick selection
  const popularCoins = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
    { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
    { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
    { id: 'bitcoin-cash', name: 'Bitcoin Cash', symbol: 'BCH' },
    { id: 'stellar', name: 'Stellar', symbol: 'XLM' },
    { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
    { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' }
  ];

  // Filter coins based on search term
  const filteredCoins = popularCoins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCoin = (coinId) => {
    setSelectedCoins(prev => 
      prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  const resetToDefault = () => {
    setSelectedCoins(['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana']);
    setSearchTerm('');
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">Live Crypto Prices</h3>
          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
            Powered by CoinGecko
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetToDefault}
            className="text-slate-400 hover:text-white transition-colors"
            title="Reset to default coins"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Search and Selection */}
      {isExpanded && (
        <div className="mb-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Coin Selection */}
          <div className="max-h-40 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {filteredCoins.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => toggleCoin(coin.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    selectedCoins.includes(coin.id)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{coin.symbol}</span>
                    <span className="text-xs text-slate-400">{coin.name}</span>
                  </div>
                  {selectedCoins.includes(coin.id) && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Coins Summary */}
          <div className="text-sm text-slate-400">
            Selected: {selectedCoins.length} coin{selectedCoins.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* CoinGecko Widget */}
      <div className="relative">
        {!widgetLoaded && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-slate-400">Loading prices...</span>
          </div>
        )}
        
        <coingecko-coin-price-ticker-widget
          coin-ids={selectedCoins.join(',')}
          currency="usd"
          locale="en"
          background-color="#1e293b"
          border-color="#475569"
          text-color="#ffffff"
          font-family="Inter, sans-serif"
          font-size="14px"
          width="100%"
          height="auto"
        ></coingecko-coin-price-ticker-widget>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-600 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Data provided by</span>
          <a
            href="https://www.coingecko.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>CoinGecko</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="text-xs text-slate-500">
          Updates every 30 seconds
        </div>
      </div>
    </div>
  );
};

export default CoinGeckoWidget;
