import React from 'react';
import { TrendingUp, DollarSign, BarChart3, Activity, RefreshCw } from 'lucide-react';
import useAdvancedMetrics from '../hooks/useAdvancedMetrics';

const AdvancedMetricsCard = () => {
  // Use the custom hook for advanced metrics data
  const {
    data,
    loading,
    error,
    lastFetch,
    isStale,
    refresh
  } = useAdvancedMetrics({
    autoFetch: true,
    refreshInterval: null, // No polling - WebSocket handles updates
    onError: (err) => console.error('Advanced metrics error:', err),
    onSuccess: (data) => {} // WebSocket data received
  });

  // Extract data from the hook response
  const metrics = data?.metrics;
  const trendingNarratives = data?.trendingNarratives || [];

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    
    if (numValue >= 1e12) return `$${(numValue / 1e12).toFixed(2)}T`;
    if (numValue >= 1e9) return `$${(numValue / 1e9).toFixed(2)}B`;
    if (numValue >= 1e6) return `$${(numValue / 1e6).toFixed(2)}M`;
    if (numValue >= 1e3) return `$${(numValue / 1e3).toFixed(2)}K`;
    return `$${numValue.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-blue"></div>
          <span className="ml-2 text-slate-400">Loading advanced metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-red-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Advanced Metrics</h3>
          </div>
          <button
            onClick={refresh}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">Failed to load advanced metrics</p>
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

  if (!metrics) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-6 h-6 text-crypto-blue" />
          <h2 className="text-xl font-semibold text-white">Advanced Metrics</h2>
        </div>
        <div className="text-slate-400 text-center py-8">
          <BarChart3 className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <p>No advanced metrics data available</p>
          <p className="text-sm mt-2">Advanced metrics will appear here once data is collected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-crypto-blue" />
          <h2 className="text-xl font-semibold text-white">Advanced Metrics</h2>
        </div>
        <div className="flex items-center space-x-2">
          {lastFetch && (
            <span className="text-xs text-slate-500">
              {lastFetch.toLocaleTimeString()}
              {isStale && <span className="text-yellow-400 ml-1">•</span>}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh advanced metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Core Market Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Bitcoin Dominance */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Bitcoin Dominance</h3>
                <TrendingUp className="w-4 h-4 text-crypto-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.bitcoinDominance?.dominance_percentage ? formatNumber(metrics.bitcoinDominance.dominance_percentage) : 'N/A'}%
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.bitcoinDominance?.timestamp ? new Date(metrics.bitcoinDominance.timestamp).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            {/* Stablecoin Metrics */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Stablecoin Metrics</h3>
                <DollarSign className="w-4 h-4 text-crypto-green" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.stablecoinMetrics && Array.isArray(metrics.stablecoinMetrics) && metrics.stablecoinMetrics.length > 0 ? 
                  formatCurrency(metrics.stablecoinMetrics[0].total_market_cap) : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.stablecoinMetrics && Array.isArray(metrics.stablecoinMetrics) && metrics.stablecoinMetrics.length > 0 ? 
                  `SSR: ${formatNumber(metrics.stablecoinMetrics[0].ssr)}` : 'N/A'}
              </div>
            </div>

            {/* Exchange Flows */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Exchange Flows</h3>
                <Activity className="w-4 h-4 text-crypto-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.exchangeFlows && Array.isArray(metrics.exchangeFlows) && metrics.exchangeFlows.length > 0 ? 
                  formatCurrency(metrics.exchangeFlows[0].net_flow) : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.exchangeFlows && Array.isArray(metrics.exchangeFlows) && metrics.exchangeFlows.length > 0 ? 
                  `${metrics.exchangeFlows[0].asset} flows` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Trending Narratives */}
        {trendingNarratives && trendingNarratives.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Trending Narratives</h3>
            <div className="space-y-3">
              {trendingNarratives.slice(0, 3).map((narrative, index) => (
                <div key={index} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">{narrative.narrative}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      narrative.sentiment === 'positive' ? 'bg-green-600 text-white' :
                      narrative.sentiment === 'negative' ? 'bg-red-600 text-white' :
                      'bg-slate-600 text-white'
                    }`}>
                      {narrative.sentiment}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Relevance: {formatNumber(narrative.relevance_score)}% | 
                    Volume: {formatCurrency(narrative.total_volume_24h || 0)} | 
                    Change: {formatNumber(narrative.avg_change_24h || 0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedMetricsCard;