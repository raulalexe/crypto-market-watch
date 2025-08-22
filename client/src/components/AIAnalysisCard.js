import React from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

const AIAnalysisCard = ({ analysis }) => {
  const getDirectionIcon = (direction) => {
    switch (direction) {
      case 'BULLISH':
        return <TrendingUp className="w-6 h-6 text-crypto-green" />;
      case 'BEARISH':
        return <TrendingDown className="w-6 h-6 text-crypto-red" />;
      default:
        return <Minus className="w-6 h-6 text-slate-400" />;
    }
  };

  const getDirectionColor = (direction) => {
    switch (direction) {
      case 'BULLISH':
        return 'text-crypto-green';
      case 'BEARISH':
        return 'text-crypto-red';
      default:
        return 'text-slate-300';
    }
  };

  const getDirectionBg = (direction) => {
    switch (direction) {
      case 'BULLISH':
        return 'bg-green-900/20 border-green-500/30';
      case 'BEARISH':
        return 'bg-red-900/20 border-red-500/30';
      default:
        return 'bg-slate-700/20 border-slate-500/30';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-crypto-green';
    if (confidence >= 60) return 'text-crypto-yellow';
    return 'text-crypto-red';
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-6 border ${getDirectionBg(analysis.market_direction)}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-6 h-6 text-crypto-blue" />
        <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
      </div>

      <div className="space-y-4">
        {/* Direction */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Market Direction:</span>
          <div className="flex items-center space-x-2">
            {getDirectionIcon(analysis.market_direction)}
            <span className={`font-bold text-lg ${getDirectionColor(analysis.market_direction)}`}>
              {analysis.market_direction}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Confidence:</span>
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-crypto-blue" />
            <span className={`font-bold ${getConfidenceColor(analysis.confidence)}`}>
              {analysis.confidence}%
            </span>
          </div>
        </div>

        {/* Time Horizon */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Time Horizon:</span>
          <span className="text-white font-medium">{analysis.time_horizon}</span>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Analysis:</h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {analysis.reasoning}
          </p>
        </div>

        {/* Key Factors */}
        {analysis.factors_analyzed && analysis.factors_analyzed.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Key Factors:</h4>
            <ul className="space-y-1">
              {analysis.factors_analyzed.slice(0, 3).map((factor, index) => (
                <li key={index} className="text-sm text-slate-300 flex items-center">
                  <span className="w-1.5 h-1.5 bg-crypto-blue rounded-full mr-2"></span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisCard;