import React, { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, Target, ChevronDown, ChevronRight, Clock, Calendar, CalendarDays, Users, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import ExpandableText from './ExpandableText';
import useAIAnalysis from '../hooks/useAIAnalysis';

const AIAnalysisCard = ({ 
  data: propData, // Accept data as prop
  autoFetch = true, 
  refreshInterval = 300000, // 5 minutes fallback
  showRefreshButton = false, // Disabled by default since WebSocket handles updates
  onError = null,
  onSuccess = null,
  className = ''
}) => {
  const [expandedTimeframes, setExpandedTimeframes] = useState({});
  
  // Use the custom hook for data fetching (fallback if no prop data)
  const { 
    data: hookData, 
    loading, 
    error, 
    lastFetch, 
    isStale, 
    refresh 
  } = useAIAnalysis({
    autoFetch: !propData, // Only auto-fetch if no prop data
    refreshInterval,
    onError,
    onSuccess
  });

  // Use prop data if available, otherwise use hook data
  const data = propData || hookData;

  const toggleTimeframe = (timeframe) => {
    setExpandedTimeframes(prev => ({
      ...prev,
      [timeframe]: !prev[timeframe]
    }));
  };

  // Debug logging (removed for production)

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
  
  // Check if we have multiple AI providers
  const hasMultipleProviders = data && data.providers && (data.providers.venice || data.providers.huggingface || data.providers.groq);
  
  // Get available timeframes
  const availableTimeframes = [];
  if (data?.short_term) availableTimeframes.push({ key: 'short', timeframeData: data.short_term, label: 'Short Term' });
  if (data?.medium_term) availableTimeframes.push({ key: 'medium', timeframeData: data.medium_term, label: 'Medium Term' });
  if (data?.long_term) availableTimeframes.push({ key: 'long', timeframeData: data.long_term, label: 'Long Term' });

  // Debug logging (removed for production)

  // Handle loading state
  if (loading && !data) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 border border-slate-600 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-crypto-blue" />
            <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
          </div>
          {showRefreshButton && (
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        <div className="text-slate-400 text-center py-8">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p>Loading AI analysis...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error && !data) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 border border-red-500/30 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
          </div>
          {showRefreshButton && (
            <button
              onClick={refresh}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-2">Failed to load AI analysis</p>
          <p className="text-slate-400 text-sm mb-4">{error.message}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-crypto-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Early return if no analysis data
  if (!data) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 border border-slate-600 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-crypto-blue" />
            <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
          </div>
          {showRefreshButton && (
            <button
              onClick={refresh}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-slate-400 text-center py-8">
          <Brain className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <p>No analysis data available</p>
          <p className="text-sm mt-2">AI analysis will appear here once data is collected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-lg p-6 border ${getDirectionBg(data.overall_direction || data.market_direction)} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-crypto-blue" />
          <div>
            <h3 className="text-lg font-semibold text-white">AI Market Analysis</h3>
            {lastFetch && (
              <p className="text-xs text-slate-400">
                Last updated: {lastFetch.toLocaleTimeString()}
                {isStale && <span className="text-yellow-400 ml-2">• Stale</span>}
              </p>
            )}
          </div>
        </div>
        {showRefreshButton && (
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh AI analysis"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* AI Provider Comparison - Always show if we have multiple providers */}
        {hasMultipleProviders && (
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-crypto-blue" />
              <span className="text-slate-400 font-medium">AI Market Predictions</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.providers.venice && (
                <div className="bg-slate-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span className="text-lg font-semibold text-white">Venice AI</span>
                  </div>
                  
                  {/* Prediction Summary */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Market Outlook:</span>
                      <div className="flex items-center space-x-2">
                        {getDirectionIcon(data.providers.venice.overall_direction)}
                        <span className={`font-bold text-lg ${getDirectionColor(data.providers.venice.overall_direction)}`}>
                          {data.providers.venice.overall_direction}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Confidence:</span>
                      <span className={`font-semibold ${getConfidenceColor(data.providers.venice.overall_confidence)}`}>
                        {data.providers.venice.overall_confidence}%
                      </span>
                    </div>
                  </div>

                  {/* Key Factors */}
                  {data.providers.venice.short_term?.key_factors && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Key Influences:</h4>
                      <ul className="space-y-1">
                        {data.providers.venice.short_term.key_factors.slice(0, 3).map((factor, index) => (
                          <li key={index} className="text-xs text-slate-400 flex items-start">
                            <span className="w-1 h-1 bg-blue-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary */}
                  <ExpandableText 
                    text={data.providers.venice.overall_reasoning}
                    maxLength={300}
                    className="text-xs text-slate-300 leading-relaxed"
                  />
                </div>
              )}

              {data.providers.groq && (
                <div className="bg-slate-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span className="text-lg font-semibold text-white">Groq</span>
                  </div>
                  
                  {/* Prediction Summary */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Market Outlook:</span>
                      <div className="flex items-center space-x-2">
                        {getDirectionIcon(data.providers.groq.overall_direction)}
                        <span className={`font-bold text-lg ${getDirectionColor(data.providers.groq.overall_direction)}`}>
                          {data.providers.groq.overall_direction}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Confidence:</span>
                      <span className={`font-semibold ${getConfidenceColor(data.providers.groq.overall_confidence)}`}>
                        {data.providers.groq.overall_confidence}%
                      </span>
                    </div>
                  </div>

                  {/* Key Factors */}
                  {data.providers.groq.short_term?.key_factors && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Key Influences:</h4>
                      <ul className="space-y-1">
                        {data.providers.groq.short_term.key_factors.slice(0, 3).map((factor, index) => (
                          <li key={index} className="text-xs text-slate-400 flex items-start">
                            <span className="w-1 h-1 bg-purple-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary */}
                  <ExpandableText 
                    text={data.providers.groq.overall_reasoning}
                    maxLength={300}
                    className="text-xs text-slate-300 leading-relaxed"
                  />
                </div>
              )}

              {data.providers.huggingface && (
                <div className="bg-slate-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Brain className="w-5 h-5 text-green-400" />
                    <span className="text-lg font-semibold text-white">Hugging Face</span>
                  </div>
                  
                  {/* Prediction Summary */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Market Outlook:</span>
                      <div className="flex items-center space-x-2">
                        {getDirectionIcon(data.providers.huggingface.overall_direction)}
                        <span className={`font-bold text-lg ${getDirectionColor(data.providers.huggingface.overall_direction)}`}>
                          {data.providers.huggingface.overall_direction}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Confidence:</span>
                      <span className={`font-semibold ${getConfidenceColor(data.providers.huggingface.overall_confidence)}`}>
                        {data.providers.huggingface.overall_confidence}%
                      </span>
                    </div>
                  </div>

                  {/* Key Factors */}
                  {data.providers.huggingface.short_term?.key_factors && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Key Influences:</h4>
                      <ul className="space-y-1">
                        {data.providers.huggingface.short_term.key_factors.slice(0, 3).map((factor, index) => (
                          <li key={index} className="text-xs text-slate-400 flex items-start">
                            <span className="w-1 h-1 bg-green-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Summary */}
                  <ExpandableText 
                    text={data.providers.huggingface.overall_reasoning}
                    maxLength={300}
                    className="text-xs text-slate-300 leading-relaxed"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Multi-AI Consensus - Always show if we have consensus data */}
        {(data.overall_direction || data.overall_confidence) && (
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-crypto-blue" />
              <span className="text-slate-400 font-medium">Multi-AI Consensus</span>
            </div>
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">Overall Confidence:</span>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-crypto-blue" />
                  <span className={`font-bold ${getConfidenceColor(data.overall_confidence)}`}>
                    {data.overall_confidence}%
                  </span>
                </div>
              </div>
            )}
            {data.overall_reasoning && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Consensus Reasoning:</h4>
                <ExpandableText 
                  text={data.overall_reasoning}
                  maxLength={400}
                  className="text-sm text-slate-300 leading-relaxed"
                />
              </div>
            )}
          </div>
        )}

        {hasMultiTimeframe ? (
          // Multi-timeframe display
          <div>
            {/* Timeframe Predictions */}
            <div className="space-y-3">
              {availableTimeframes.map(({ key, timeframeData, label }) => (
                <div key={key} className="bg-slate-700 rounded-lg border border-slate-600">
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => toggleTimeframe(key)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        {getTimeframeIcon(key)}
                        <span className="text-white font-medium">{getTimeframeLabel(key)}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-3">
                        <div className="flex items-center space-x-2">
                          {getDirectionIcon(timeframeData.market_direction)}
                          <span className={`font-medium ${getDirectionColor(timeframeData.market_direction)}`}>
                            {timeframeData.market_direction}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${getConfidenceColor(timeframeData.confidence)}`}>
                            {timeframeData.confidence}%
                          </span>
                          <button className="text-slate-400 hover:text-white transition-colors">
                            {expandedTimeframes[key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                                  {expandedTimeframes[key] && (
                  <div className="px-4 pb-4 border-t border-slate-600">
                    <div className="mt-3 space-y-4">
                      {/* Multi-AI Consensus for this timeframe */}
                      <div className="bg-slate-600 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Multi-AI Consensus:</h4>
                        <ExpandableText 
                          text={timeframeData.reasoning}
                          maxLength={400}
                          className="text-sm text-slate-300 leading-relaxed"
                        />
                      </div>

                      {/* Individual AI Predictions for this timeframe */}
                      {hasMultipleProviders && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-slate-400">Individual AI Predictions:</h4>
                          
                          {/* Venice AI Prediction */}
                          {data.providers?.venice?.[`${key}_term`] && (
                            <div className="bg-slate-600 rounded-lg p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 mb-2">
                                <div className="flex items-center space-x-2">
                                  <Zap className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm font-medium text-white">Venice AI</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getDirectionIcon(data.providers.venice[`${key}_term`].market_direction)}
                                  <span className={`text-sm font-medium ${getDirectionColor(data.providers.venice[`${key}_term`].market_direction)}`}>
                                    {data.providers.venice[`${key}_term`].market_direction}
                                  </span>
                                  <span className={`text-xs ${getConfidenceColor(data.providers.venice[`${key}_term`].confidence)}`}>
                                    ({data.providers.venice[`${key}_term`].confidence}%)
                                  </span>
                                </div>
                              </div>
                              <ExpandableText 
                                text={data.providers.venice[`${key}_term`].reasoning}
                                maxLength={300}
                                className="text-xs text-slate-300 leading-relaxed"
                              />
                            </div>
                          )}

                          {/* Groq Prediction */}
                          {data.providers?.groq?.[`${key}_term`] && (
                            <div className="bg-slate-600 rounded-lg p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 mb-2">
                                <div className="flex items-center space-x-2">
                                  <Zap className="w-4 h-4 text-purple-400" />
                                  <span className="text-sm font-medium text-white">Groq</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getDirectionIcon(data.providers.groq[`${key}_term`].market_direction)}
                                  <span className={`text-sm font-medium ${getDirectionColor(data.providers.groq[`${key}_term`].market_direction)}`}>
                                    {data.providers.groq[`${key}_term`].market_direction}
                                  </span>
                                  <span className={`text-xs ${getConfidenceColor(data.providers.groq[`${key}_term`].confidence)}`}>
                                    ({data.providers.groq[`${key}_term`].confidence}%)
                                  </span>
                                </div>
                              </div>
                              <ExpandableText 
                                text={data.providers.groq[`${key}_term`].reasoning}
                                maxLength={300}
                                className="text-xs text-slate-300 leading-relaxed"
                              />
                            </div>
                          )}

                          {/* Hugging Face Prediction */}
                          {data.providers?.huggingface?.[`${key}_term`] && (
                            <div className="bg-slate-600 rounded-lg p-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0 mb-2">
                                <div className="flex items-center space-x-2">
                                  <Brain className="w-4 h-4 text-green-400" />
                                  <span className="text-sm font-medium text-white">Hugging Face</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getDirectionIcon(data.providers.huggingface[`${key}_term`].market_direction)}
                                  <span className={`text-sm font-medium ${getDirectionColor(data.providers.huggingface[`${key}_term`].market_direction)}`}>
                                    {data.providers.huggingface[`${key}_term`].market_direction}
                                  </span>
                                  <span className={`text-xs ${getConfidenceColor(data.providers.huggingface[`${key}_term`].confidence)}`}>
                                    ({data.providers.huggingface[`${key}_term`].confidence}%)
                                  </span>
                                </div>
                              </div>
                              <ExpandableText 
                                text={data.providers.huggingface[`${key}_term`].reasoning}
                                maxLength={300}
                                className="text-xs text-slate-300 leading-relaxed"
                              />
                            </div>
                          )}

                          {/* Fallback if no individual predictions available */}
                          {!data.providers?.venice?.[`${key}_term`] && 
                           !data.providers?.groq?.[`${key}_term`] && 
                           !data.providers?.huggingface?.[`${key}_term`] && (
                            <div className="bg-slate-600 rounded-lg p-3">
                              <p className="text-xs text-slate-400 text-center">
                                Individual AI predictions not available for this timeframe
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Key Factors */}
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

                      {/* Risk Factors */}
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
              <ExpandableText 
                text={data.reasoning}
                maxLength={400}
                className="text-sm text-slate-300 leading-relaxed"
              />
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
    </div>
  );
};

export default AIAnalysisCard;