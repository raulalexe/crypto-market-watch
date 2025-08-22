import React from 'react';
import { Heart, Zap, AlertTriangle } from 'lucide-react';

const FearGreedCard = ({ fearGreed }) => {
  if (!fearGreed) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Fear & Greed Index</h3>
        </div>
        <p className="text-slate-400">No data available</p>
      </div>
    );
  }

  const getIndexColor = (value) => {
    if (value >= 80) return 'text-crypto-green';
    if (value >= 60) return 'text-crypto-yellow';
    if (value >= 40) return 'text-slate-300';
    if (value >= 20) return 'text-crypto-red';
    return 'text-crypto-red';
  };

  const getIndexBg = (value) => {
    if (value >= 80) return 'bg-green-900/20 border-green-500/30';
    if (value >= 60) return 'bg-yellow-900/20 border-yellow-500/30';
    if (value >= 40) return 'bg-slate-700/20 border-slate-500/30';
    if (value >= 20) return 'bg-red-900/20 border-red-500/30';
    return 'bg-red-900/20 border-red-500/30';
  };

  const getIndexIcon = (value) => {
    if (value >= 80) return <Zap className="w-6 h-6 text-crypto-green" />;
    if (value >= 60) return <Heart className="w-6 h-6 text-crypto-yellow" />;
    if (value >= 40) return <Heart className="w-6 h-6 text-slate-400" />;
    return <AlertTriangle className="w-6 h-6 text-crypto-red" />;
  };

  const getIndexLabel = (value) => {
    if (value >= 80) return 'Extreme Greed';
    if (value >= 60) return 'Greed';
    if (value >= 40) return 'Neutral';
    if (value >= 20) return 'Fear';
    return 'Extreme Fear';
  };

  const getIndexDescription = (value) => {
    if (value >= 80) return 'Market showing extreme optimism';
    if (value >= 60) return 'Market showing greed sentiment';
    if (value >= 40) return 'Market sentiment is neutral';
    if (value >= 20) return 'Market showing fear sentiment';
    return 'Market showing extreme fear';
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-6 border ${getIndexBg(fearGreed.value)}`}>
      <div className="flex items-center space-x-3 mb-4">
        {getIndexIcon(fearGreed.value)}
        <h3 className="text-lg font-semibold text-white">Fear & Greed Index</h3>
      </div>

      <div className="space-y-4">
        {/* Index Value */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getIndexColor(fearGreed.value)}`}>
            {fearGreed.value}
          </div>
          <div className={`text-lg font-medium ${getIndexColor(fearGreed.value)}`}>
            {getIndexLabel(fearGreed.value)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              fearGreed.value >= 80 ? 'bg-crypto-green' :
              fearGreed.value >= 60 ? 'bg-crypto-yellow' :
              fearGreed.value >= 40 ? 'bg-slate-400' :
              'bg-crypto-red'
            }`}
            style={{ width: `${fearGreed.value}%` }}
          ></div>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-sm text-slate-300">
            {getIndexDescription(fearGreed.value)}
          </p>
        </div>

        {/* Source */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Source: {fearGreed.source || 'Alternative.me'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FearGreedCard;