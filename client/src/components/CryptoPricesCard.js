import React from 'react';
import { Coins, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const CryptoPricesCard = ({ cryptoPrices }) => {
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change) => {
    if (!change) return '0.00%';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change) => {
    if (!change) return 'text-slate-400';
    return change >= 0 ? 'text-crypto-green' : 'text-crypto-red';
  };

  const getChangeIcon = (change) => {
    if (!change) return null;
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-crypto-green" />
    ) : (
      <TrendingDown className="w-4 h-4 text-crypto-red" />
    );
  };

  const cryptoList = Object.entries(cryptoPrices).map(([symbol, data]) => ({
    symbol,
    ...data
  }));

  // Get the latest timestamp from any crypto data
  const getLatestTimestamp = () => {
    const timestamps = cryptoList
      .map(crypto => crypto.timestamp)
      .filter(timestamp => timestamp)
      .sort()
      .reverse();
    return timestamps[0];
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Coins className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Cryptocurrency Prices</h3>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>Last updated: {formatTimestamp(getLatestTimestamp())}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cryptoList.map((crypto) => (
          <div key={crypto.symbol} className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-white">{crypto.symbol}</h4>
              {getChangeIcon(crypto.change_24h)}
            </div>
            
            <div className="space-y-1">
              <div className="text-xl font-bold text-white">
                {formatPrice(crypto.price)}
              </div>
              
              <div className={`text-sm font-medium ${getChangeColor(crypto.change_24h)}`}>
                {formatChange(crypto.change_24h)}
              </div>
              
              <div className="text-xs text-slate-400">
                Vol: {crypto.volume_24h ? new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(crypto.volume_24h) : 'N/A'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoPricesCard;