import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';

const NarrativesCard = ({ data }) => {
  const [expandedNarrative, setExpandedNarrative] = useState(null);

  // Handle undefined or null data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Trending Narratives</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400">No narrative data available</p>
        </div>
      </div>
    );
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'very_positive':
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'very_negative':
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'very_positive':
      case 'positive':
        return 'text-green-500';
      case 'very_negative':
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const formatVolume = (volume) => {
    if (!volume || volume === 0) return 'N/A';
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };

  const formatChange = (change) => {
    if (!change && change !== 0) return 'N/A';
    return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  const formatRelevanceScore = (score) => {
    if (!score && score !== 0) return 'N/A';
    // Score is already normalized to 0-1 range, just convert to percentage
    return `${(score * 100).toFixed(1)}%`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trending Narratives</h3>
        <span className="text-sm text-gray-400">{data.length} narratives</span>
      </div>

      <div className="space-y-3">
        {data.map((narrative, index) => (
          <div key={index} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getSentimentIcon(narrative.sentiment)}
                <div>
                  <h4 className="text-white font-medium">{narrative.narrative}</h4>
                  <p className="text-sm text-gray-400">
                    {narrative.coins && narrative.coins.length > 0 
                      ? `${narrative.coins.length} coins (${narrative.coins.map(coin => coin.coin_symbol).join(', ')})` 
                      : 'No coins data'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExpandedNarrative(expandedNarrative === index ? null : index)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {expandedNarrative === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Volume 24h</p>
                <p className="text-white font-medium">
                  {formatVolume(narrative.total_volume_24h)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Avg Change 24h</p>
                <p className={`font-medium ${narrative.avg_change_24h > 0 ? 'text-green-500' : narrative.avg_change_24h < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formatChange(narrative.avg_change_24h)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Sentiment</p>
                <p className={`font-medium capitalize ${getSentimentColor(narrative.sentiment)}`}>
                  {narrative.sentiment?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Relevance</p>
                <p className="text-white font-medium">
                  {formatRelevanceScore(narrative.relevance_score)}
                </p>
              </div>
            </div>

            {expandedNarrative === index && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                {/* Market Insights */}
                {narrative.market_insights && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-crypto-blue mb-2">Market Insights & Analysis</h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400">Trend Analysis</p>
                        <p className="text-white">{narrative.market_insights.trend_analysis || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Volume Activity</p>
                        <p className="text-white">{narrative.market_insights.volume_analysis || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Risk Level</p>
                        <p className="text-white capitalize">{narrative.market_insights.risk_level || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Opportunity Score</p>
                        <p className="text-white">{narrative.market_insights.opportunity_score || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coins List */}
                {narrative.coins && narrative.coins.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-crypto-blue mb-2">Top Coins</h5>
                    <div className="space-y-2">
                      {narrative.coins.slice(0, 5).map((coin, coinIndex) => (
                        <div key={coinIndex} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{coin.coin_symbol}</span>
                            <span className="text-gray-400 text-xs">{coin.coin_name}</span>
                          </div>
                          <div className="text-right text-xs">
                            <p className="text-white">${coin.price_usd?.toFixed(4) || 'N/A'}</p>
                            <p className={`${coin.change_24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {coin.change_24h > 0 ? '+' : ''}{coin.change_24h?.toFixed(2) || 'N/A'}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NarrativesCard;