import React from 'react';
import { TrendingUp, DollarSign, BarChart3, Activity, RefreshCw } from 'lucide-react';
import useAdvancedMetrics from '../hooks/useAdvancedMetrics';

const AdvancedMetricsCard = ({ data: propData }) => {
  // Use the custom hook as fallback only if no prop data
  const {
    data: hookData,
    loading,
    error,
    lastFetch,
    isStale,
    refresh
  } = useAdvancedMetrics({
    autoFetch: !propData, // Only auto-fetch if no prop data
    refreshInterval: null, // No polling - WebSocket handles updates
    onError: (err) => console.error('Advanced metrics error:', err),
    onSuccess: (data) => {} // WebSocket data received
  });

  // Use prop data if available, otherwise use hook data
  const data = propData || hookData;

  // Extract data - prop data comes directly from dashboard, hook data might be wrapped
  const metrics = propData ? propData : data?.metrics;
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
                {metrics?.bitcoinDominance?.value ? formatNumber(metrics.bitcoinDominance.value) : 'N/A'}%
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.bitcoinDominance?.change_24h ? `${metrics.bitcoinDominance.change_24h >= 0 ? '+' : ''}${formatNumber(metrics.bitcoinDominance.change_24h)}%` : 'N/A'}
              </div>
            </div>

            {/* Stablecoin Metrics */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Stablecoin Metrics</h3>
                <DollarSign className="w-4 h-4 text-crypto-green" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.stablecoinMetrics?.totalMarketCap ? formatCurrency(metrics.stablecoinMetrics.totalMarketCap) : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.stablecoinMetrics?.ssr ? `SSR: ${formatNumber(metrics.stablecoinMetrics.ssr)}` : 'N/A'}
              </div>
            </div>

            {/* Total Market Cap */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Total Market Cap</h3>
                <DollarSign className="w-4 h-4 text-crypto-green" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.totalMarketCap?.value ? formatCurrency(metrics.totalMarketCap.value) : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.totalMarketCap?.change_24h ? `${metrics.totalMarketCap.change_24h >= 0 ? '+' : ''}${formatNumber(metrics.totalMarketCap.change_24h)}%` : 'N/A'}
              </div>
            </div>

            {/* Market Sentiment */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Market Sentiment</h3>
                <Activity className="w-4 h-4 text-crypto-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.marketSentiment?.score ? `${metrics.marketSentiment.score}/100` : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.marketSentiment?.interpretation || 'N/A'}
              </div>
            </div>

            {/* Altcoin Season */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Altcoin Season</h3>
                <TrendingUp className="w-4 h-4 text-crypto-yellow" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.altcoinSeason?.season || 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.altcoinSeason?.indicator ? `${formatNumber(metrics.altcoinSeason.indicator)}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Derivatives & On-chain Data */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Derivatives & On-chain Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Open Interest */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Open Interest</h3>
                <BarChart3 className="w-4 h-4 text-crypto-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.derivatives?.openInterest?.value ? formatCurrency(metrics.derivatives.openInterest.value) : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                Total derivatives OI
              </div>
            </div>

            {/* Funding Rate */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Funding Rate</h3>
                <TrendingUp className="w-4 h-4 text-crypto-green" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.derivatives?.fundingRate?.value ? `${formatNumber(metrics.derivatives.fundingRate.value * 100)}%` : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                Average funding rate
              </div>
            </div>

            {/* Liquidations */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Liquidations</h3>
                <Activity className="w-4 h-4 text-crypto-red" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.derivatives?.liquidations?.value ? formatCurrency(metrics.derivatives.liquidations.value) : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                24h total liquidations
              </div>
            </div>

            {/* Whale Transactions */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Whale Transactions</h3>
                <Activity className="w-4 h-4 text-crypto-purple" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.onchain?.whaleTransactions?.value ? formatNumber(metrics.onchain.whaleTransactions.value) : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                Large transactions
              </div>
            </div>

            {/* Hash Rate */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Hash Rate</h3>
                <TrendingUp className="w-4 h-4 text-crypto-yellow" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.onchain?.hashRate?.value ? `${formatNumber(metrics.onchain.hashRate.value)} EH/s` : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                Network hash rate
              </div>
            </div>

            {/* Active Addresses */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Active Addresses</h3>
                <Activity className="w-4 h-4 text-crypto-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics?.onchain?.activeAddresses?.value ? formatNumber(metrics.onchain.activeAddresses.value) : 'N/A'}
              </div>
              <div className="text-xs text-slate-400">
                Daily active addresses
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