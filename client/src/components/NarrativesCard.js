import React from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const NarrativesCard = ({ narratives }) => {
  const getSentimentIcon = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-crypto-green" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-crypto-red" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'text-crypto-green';
      case 'negative':
        return 'text-crypto-red';
      default:
        return 'text-slate-300';
    }
  };

  const getSentimentBg = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-900/20 border-green-500/30';
      case 'negative':
        return 'bg-red-900/20 border-red-500/30';
      default:
        return 'bg-slate-700/20 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <MessageSquare className="w-6 h-6 text-crypto-blue" />
        <h3 className="text-lg font-semibold text-white">Trending Narratives</h3>
      </div>

      <div className="space-y-4">
        {narratives.map((narrative, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${getSentimentBg(narrative.sentiment)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getSentimentIcon(narrative.sentiment)}
                <span className={`text-sm font-medium ${getSentimentColor(narrative.sentiment)}`}>
                  {narrative.sentiment.charAt(0).toUpperCase() + narrative.sentiment.slice(1)}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {(narrative.relevance_score * 100).toFixed(0)}% relevance
              </div>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              {narrative.narrative}
            </p>
            
            <div className="mt-2 text-xs text-slate-500">
              Source: {narrative.source || 'Market Analysis'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NarrativesCard;