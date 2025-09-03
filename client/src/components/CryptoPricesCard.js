import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Search, ExternalLink } from 'lucide-react';

const CryptoPricesCard = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle undefined or null data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Crypto Prices</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400">No crypto price data available</p>
        </div>
      </div>
    );
  }

  // Filter data based on search term
  const filteredData = data.filter(crypto => 
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const formatPrice = (price) => {
    if (price >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      }).format(price);
    }
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${marketCap.toFixed(2)}`;
  };

  const displayedData = isExpanded ? filteredData : filteredData.slice(0, 5);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Crypto Prices</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Search Filter */}
      <div className="mb-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-400">
            Showing {filteredData.length} of {data.length} cryptocurrencies
          </div>
        )}
      </div>

      <div className="space-y-3">
        {displayedData.length > 0 ? (
          displayedData.map((crypto, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-crypto-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{crypto.symbol}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{crypto.symbol}</p>
                  <p className="text-gray-400 text-sm">{crypto.name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-white font-semibold">{formatPrice(crypto.price)}</p>
                <div className="flex items-center space-x-1">
                  {getChangeIcon(crypto.change_24h)}
                  <span className={`text-sm ${crypto.change_24h > 0 ? 'text-green-500' : crypto.change_24h < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {crypto.change_24h > 0 ? '+' : ''}{crypto.change_24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No cryptocurrencies found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {!isExpanded && filteredData.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            +{filteredData.length - 5} more cryptocurrencies
          </p>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Total Volume 24h</p>
              <p className="text-white font-semibold">
                {formatVolume(filteredData.reduce((sum, crypto) => sum + (crypto.volume_24h || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Total Market Cap</p>
              <p className="text-white font-semibold">
                {formatMarketCap(filteredData.reduce((sum, crypto) => sum + (crypto.market_cap || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CoinGecko Attribution */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
          <span>Data provided by</span>
          <a
            href="https://coingecko.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-crypto-blue hover:text-blue-400 transition-colors"
          >
            <span>CoinGecko</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default CryptoPricesCard;