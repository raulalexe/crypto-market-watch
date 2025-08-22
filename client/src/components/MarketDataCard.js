import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MarketDataCard = ({ title, value, format = 'number', trend = 'neutral', description }) => {
  const formatValue = (val, formatType) => {
    if (val === null || val === undefined) return 'N/A';
    
    switch (formatType) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val);
      default:
        return val.toString();
    }
  };

  const getTrendIcon = (trendType) => {
    switch (trendType) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-crypto-green" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-crypto-red" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendColor = (trendType) => {
    switch (trendType) {
      case 'up':
        return 'text-crypto-green';
      case 'down':
        return 'text-crypto-red';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {getTrendIcon(trend)}
      </div>
      
      <div className="mb-1">
        <span className={`text-2xl font-bold ${getTrendColor(trend)}`}>
          {formatValue(value, format)}
        </span>
      </div>
      
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
};

export default MarketDataCard;