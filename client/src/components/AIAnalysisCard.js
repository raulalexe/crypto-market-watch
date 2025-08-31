import React, { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, Target, ChevronDown, ChevronRight, Clock, Calendar, CalendarDays } from 'lucide-react';

const AIAnalysisCard = ({ data }) => {
  const [expandedTimeframes, setExpandedTimeframes] = useState({});

  const toggleTimeframe = (timeframe) => {
    setExpandedTimeframes(prev => ({
      ...prev,
      [timeframe]: !prev[timeframe]
    }));
  };

  // Debug logging
  console.log('AIAnalysisCard received data:', data);

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

  const getTimeframeIcon = (timeframe) => {
    switch (timeframe) {
      case 'short':
        return <Clock className="w-4 h-4" />;
      case 'medium':
        return <Calendar className="w-4 h-4" />;
      case 'long':
        return <CalendarDays className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimeframeLabel = (timeframe) => {
    switch (timeframe) {
      case 'short':
        return 'Short Term (1-7 days)';
      case 'medium':
        return 'Medium Term (1-4 weeks)';
      case 'long':
        return 'Long Term (1-6 months)';
      default:
        return 'Short Term';
    }
  };

  // Check if we have multi-timeframe data
  const hasMultiTimeframe = data && (data.short_term || data.medium_term || data.long_term);
  
  // Get available timeframes
  const availableTimeframes = [];
  if (data?.short_term) availableTimeframes.push({ key: 'short', timeframeData: data.short_term, label: 'Short Term' });
  if (data?.medium_term) availableTimeframes.push({ key: 'medium', timeframeData: data.medium_term, label: 'Medium Term' });
  if (data?.long_term) availableTimeframes.push({ key: 'long', timeframeData: data.long_term, label: 'Long Term' });

  // Debug logging (after variables are defined)
  console.log('AIAnalysisCard hasMultiTimeframe:', hasMultiTimeframe);
  console.log('AIAnalysisCard availableTimeframes:', availableTimeframes);
  console.log('AIAnalysisCard short_term factors:', data?.short_term?.factors_analyzed);

  // Early return if no analysis data
  if (!data) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
        </div>
        <div className="text-slate-400 text-center py-8">
          No analysis data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg p-6 border ${getDirectionBg(data.overall_direction || data.market_direction)}`}>
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-6 h-6 text-crypto-blue" />
        <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
      </div>

      {hasMultiTimeframe ? (
        // Multi-timeframe display
        <div className="space-y-4">
          {/* Overall Summary */}
          {(data.overall_direction || data.overall_confidence) && (
            <div className="bg-slate-700 rounded-lg p-4">
              {data.overall_direction && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 font-medium">Overall Outlook:</span>
                  <div className="flex items-center space-x-2">
                    {getDirectionIcon(data.overall_direction)}
                    <span className={`font-bold text-lg ${getDirectionColor(data.overall_direction)}`}>
                      {data.overall_direction}
                    </span>
                  </div>
                </div>
              )}
              {data.overall_confidence && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Overall Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-crypto-blue" />
                    <span className={`font-bold ${getConfidenceColor(data.overall_confidence)}`}>
                      {data.overall_confidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeframe Predictions */}
          <div className="space-y-3">
            {availableTimeframes.map(({ key, timeframeData, label }) => (
              <div key={key} className="bg-slate-700 rounded-lg border border-slate-600">
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => toggleTimeframe(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTimeframeIcon(key)}
                      <span className="text-white font-medium">{getTimeframeLabel(key)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getDirectionIcon(timeframeData.market_direction)}
                        <span className={`font-medium ${getDirectionColor(timeframeData.market_direction)}`}>
                          {timeframeData.market_direction}
                        </span>
                      </div>
                      <span className={`text-sm ${getConfidenceColor(timeframeData.confidence)}`}>
                        {timeframeData.confidence}%
                      </span>
                      <button className="text-slate-400 hover:text-white transition-colors">
                        {expandedTimeframes[key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedTimeframes[key] && (
                  <div className="px-4 pb-4 border-t border-slate-600">
                    <div className="mt-3 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2">Analysis:</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {timeframeData.reasoning}
                        </p>
                      </div>

                      {timeframeData.factors_analyzed && timeframeData.factors_analyzed.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-400 mb-2">Key Factors:</h4>
                          <ul className="space-y-1">
                            {timeframeData.factors_analyzed.slice(0, 6).map((factor, index) => (
                              <li key={index} className="text-sm text-slate-300 flex items-center">
                                <span className="w-1.5 h-1.5 bg-crypto-blue rounded-full mr-2"></span>
                                {factor.includes('VERY_BEARISH') ? 
                                  factor.replace('VERY_BEARISH', 'Very Bearish').replace('(strong negative)', '(strong negative impact)') :
                                  factor.includes('VERY_BULLISH') ? 
                                    factor.replace('VERY_BULLISH', 'Very Bullish').replace('(strong positive)', '(strong positive impact)') :
                                    factor.includes('BEARISH') ? 
                                      factor.replace('BEARISH', 'Bearish').replace('(negative)', '(negative impact)') :
                                      factor.includes('BULLISH') ? 
                                        factor.replace('BULLISH', 'Bullish').replace('(positive)', '(positive impact)') :
                                        factor
                                }
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {timeframeData.risk_factors && timeframeData.risk_factors.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-400 mb-2">Risk Factors:</h4>
                          <ul className="space-y-1">
                            {timeframeData.risk_factors.slice(0, 2).map((risk, index) => (
                              <li key={index} className="text-sm text-slate-300 flex items-center">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Legacy single timeframe display
        <div className="space-y-4">
          {/* Direction */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Market Direction:</span>
            <div className="flex items-center space-x-2">
              {getDirectionIcon(data.market_direction)}
              <span className={`font-bold text-lg ${getDirectionColor(data.market_direction)}`}>
                {data.market_direction}
              </span>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Confidence:</span>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-crypto-blue" />
              <span className={`font-bold ${getConfidenceColor(data.confidence)}`}>
                {data.confidence}%
              </span>
            </div>
          </div>

          {/* Time Horizon */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Time Horizon:</span>
            <span className="text-white font-medium">{data.time_horizon}</span>
          </div>

          {/* Reasoning */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Analysis:</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {data.reasoning}
            </p>
          </div>

          {/* Key Factors */}
          {data.factors_analyzed && data.factors_analyzed.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Key Factors:</h4>
              <ul className="space-y-1">
                {data.factors_analyzed.slice(0, 6).map((factor, index) => (
                  <li key={index} className="text-sm text-slate-300 flex items-center">
                    <span className="w-1.5 h-1.5 bg-crypto-blue rounded-full mr-2"></span>
                    {factor.includes('VERY_BEARISH') ? 
                      factor.replace('VERY_BEARISH', 'Very Bearish').replace('(strong negative)', '(strong negative impact)') :
                      factor.includes('VERY_BULLISH') ? 
                        factor.replace('VERY_BULLISH', 'Very Bullish').replace('(strong positive)', '(strong positive impact)') :
                        factor.includes('BEARISH') ? 
                          factor.replace('BEARISH', 'Bearish').replace('(negative)', '(negative impact)') :
                          factor.includes('BULLISH') ? 
                            factor.replace('BULLISH', 'Bullish').replace('(positive)', '(positive impact)') :
                            factor
                    }
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalysisCard;