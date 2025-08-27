import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, Activity, Users, Zap } from 'lucide-react';
import axios from 'axios';

const AdvancedMetricsCard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendingNarratives, setTrendingNarratives] = useState([]);

  useEffect(() => {
    fetchAdvancedMetrics();
  }, []);

  const fetchAdvancedMetrics = async () => {
    try {
      setLoading(true);
      const [metricsResponse, narrativesResponse] = await Promise.all([
        axios.get('/api/advanced-metrics'),
        axios.get('/api/trending-narratives')
      ]);
      setMetrics(metricsResponse.data);
      setTrendingNarratives(narrativesResponse.data.narratives || []);
    } catch (error) {
      console.error('Error fetching advanced metrics:', error);
      setError('Failed to load advanced metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatCurrency = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getTrendIcon = (value, isPositive = true) => {
    if (value === null || value === undefined) return null;
    const isTrendingUp = isPositive ? value > 0 : value < 0;
    return isTrendingUp ? 
      <TrendingUp className="w-4 h-4 text-green-400" /> : 
      <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getSSRInterpretation = (ssr) => {
    if (ssr === null || ssr === undefined) return { text: 'N/A', color: 'text-slate-400' };
    if (ssr < 2) return { text: 'Very Bullish - High buying power', color: 'text-green-400' };
    if (ssr < 4) return { text: 'Bullish - Good buying power', color: 'text-green-300' };
    if (ssr < 6) return { text: 'Neutral - Balanced', color: 'text-yellow-400' };
    if (ssr < 8) return { text: 'Bearish - Low buying power', color: 'text-orange-400' };
    return { text: 'Very Bearish - Very low buying power', color: 'text-red-400' };
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-6 h-6 text-crypto-blue" />
          <h2 className="text-xl font-semibold text-white">Advanced Metrics</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded mb-2"></div>
          <div className="h-4 bg-slate-700 rounded mb-2"></div>
          <div className="h-4 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-6 h-6 text-crypto-blue" />
          <h2 className="text-xl font-semibold text-white">Advanced Metrics</h2>
        </div>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-6 h-6 text-crypto-blue" />
        <h2 className="text-xl font-semibold text-white">Advanced Metrics</h2>
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
                {getTrendIcon(metrics?.bitcoinDominance?.change_24h)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(metrics?.bitcoinDominance?.value)}%
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.bitcoinDominance?.change_24h > 0 ? '+' : ''}
                {formatNumber(metrics?.bitcoinDominance?.change_24h)}% (24h)
              </div>
            </div>

            {/* Stablecoin Market Cap */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Stablecoin Market Cap</h3>
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(metrics?.stablecoinMetrics?.totalMarketCap)}
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.stablecoinMetrics?.change_24h > 0 ? '+' : ''}
                {formatNumber(metrics?.stablecoinMetrics?.change_24h)}% (24h)
              </div>
            </div>

            {/* Stablecoin Supply Ratio */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">SSR</h3>
                {getTrendIcon(metrics?.stablecoinMetrics?.ssr, false)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(metrics?.stablecoinMetrics?.ssr)}
              </div>
              <div className={`text-xs ${getSSRInterpretation(metrics?.stablecoinMetrics?.ssr).color}`}>
                {getSSRInterpretation(metrics?.stablecoinMetrics?.ssr).text}
              </div>
            </div>

            {/* BTC Exchange Flows */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">BTC Exchange Flows</h3>
                {metrics?.exchangeFlows?.btc?.netFlow > 0 ? 
                  <ArrowUpRight className="w-4 h-4 text-green-400" /> : 
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                }
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(metrics?.exchangeFlows?.btc?.netFlow)}
              </div>
              <div className="text-xs text-slate-400">
                In: {formatCurrency(metrics?.exchangeFlows?.btc?.inflow)} | 
                Out: {formatCurrency(metrics?.exchangeFlows?.btc?.outflow)}
              </div>
            </div>

            {/* ETH Exchange Flows */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">ETH Exchange Flows</h3>
                {metrics?.exchangeFlows?.eth?.netFlow > 0 ? 
                  <ArrowUpRight className="w-4 h-4 text-green-400" /> : 
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                }
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(metrics?.exchangeFlows?.eth?.netFlow)}
              </div>
              <div className="text-xs text-slate-400">
                In: {formatCurrency(metrics?.exchangeFlows?.eth?.inflow)} | 
                Out: {formatCurrency(metrics?.exchangeFlows?.eth?.outflow)}
              </div>
            </div>

            {/* Market Sentiment */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Market Sentiment</h3>
                <BarChart3 className="w-4 h-4 text-crypto-blue" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(metrics?.marketSentiment?.score)}%
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.marketSentiment?.interpretation}
              </div>
            </div>

            {/* Total Market Cap */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Total Market Cap</h3>
                {getTrendIcon(metrics?.totalMarketCap?.change_24h)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(metrics?.totalMarketCap?.value)}
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.totalMarketCap?.change_24h > 0 ? '+' : ''}
                {formatNumber(metrics?.totalMarketCap?.change_24h)}% (24h)
              </div>
            </div>

            {/* Altcoin Season */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Altcoin Season</h3>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(metrics?.altcoinSeason?.indicator)}%
              </div>
              <div className="text-xs text-slate-400">
                {metrics?.altcoinSeason?.season || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        {/* Derivatives & On-chain Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Derivatives & On-chain Data</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Open Interest */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Open Interest</h3>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(metrics?.derivatives?.openInterest?.value)}
              </div>
              <div className="text-xs text-slate-400">
                BTC: {metrics?.derivatives?.openInterest?.metadata?.btc_percentage || 0}% | ETH: {metrics?.derivatives?.openInterest?.metadata?.eth_percentage || 0}%
              </div>
            </div>

            {/* Funding Rate */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Funding Rate</h3>
                {getTrendIcon(metrics?.derivatives?.fundingRate?.value)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(metrics?.derivatives?.fundingRate?.value)}%
              </div>
              <div className="text-xs text-slate-400">
                BTC: {formatNumber(metrics?.derivatives?.fundingRate?.metadata?.btc_funding || 0)}% | ETH: {formatNumber(metrics?.derivatives?.fundingRate?.metadata?.eth_funding || 0)}%
              </div>
            </div>

            {/* Liquidations */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Liquidations</h3>
                <Zap className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatCurrency(metrics?.derivatives?.liquidations?.value)}
              </div>
              <div className="text-xs text-slate-400">
                Long: {formatCurrency(metrics?.derivatives?.liquidations?.metadata?.long_liquidations || 0)} | Short: {formatCurrency(metrics?.derivatives?.liquidations?.metadata?.short_liquidations || 0)}
              </div>
            </div>

            {/* Whale Transactions */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Whale Transactions</h3>
                <Users className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {Math.round(metrics?.onchain?.whaleTransactions?.value || 0)}
              </div>
              <div className="text-xs text-slate-400">
                BTC: {Math.round(metrics?.onchain?.whaleTransactions?.metadata?.btc_whales || 0)} | ETH: {Math.round(metrics?.onchain?.whaleTransactions?.metadata?.eth_whales || 0)}
              </div>
            </div>

            {/* Hash Rate */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Hash Rate</h3>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(metrics?.onchain?.hashRate?.value || 0)} EH/s
              </div>
              <div className="text-xs text-slate-400">
                BTC: {formatNumber(metrics?.onchain?.hashRate?.metadata?.btc_hashrate || 0)} EH/s
              </div>
            </div>

            {/* Active Addresses */}
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Active Addresses</h3>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber((metrics?.onchain?.activeAddresses?.value || 0) / 1e6)}M
              </div>
              <div className="text-xs text-slate-400">
                BTC: {formatNumber((metrics?.onchain?.activeAddresses?.metadata?.btc_addresses || 0) / 1e6)}M | ETH: {formatNumber((metrics?.onchain?.activeAddresses?.metadata?.eth_addresses || 0) / 1e6)}M
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Narratives */}
      {trendingNarratives.length > 0 && (
        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-3">Trending Narratives (Money Flow)</h4>
          <div className="space-y-2">
            {trendingNarratives.slice(0, 5).map((narrative, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                <div>
                  <div className="text-sm font-medium text-white">{narrative.narrative}</div>
                  <div className="text-xs text-slate-400">
                    {narrative.coin_count} coins • ${(narrative.total_volume_24h / 1e6).toFixed(1)}M volume
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${narrative.avg_change_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {narrative.avg_change_24h > 0 ? '+' : ''}{narrative.avg_change_24h.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-400">
                    Avg 24h change
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interpretation Guide */}
      <div className="mt-6 p-4 bg-slate-700 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">Metric Interpretations</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div>
            <strong>Bitcoin Dominance:</strong> Higher = BTC outperforming altcoins
          </div>
          <div>
            <strong>SSR (Stablecoin Supply Ratio):</strong> Lower = more buying power available
          </div>
          <div>
            <strong>Exchange Flows:</strong> Positive = money moving to exchanges (bearish), Negative = money leaving exchanges (bullish)
          </div>
          <div>
            <strong>Stablecoin Growth:</strong> Expanding = sidelined capital ready to enter
          </div>
          <div>
            <strong>Open Interest:</strong> Higher = more leverage in the market
          </div>
          <div>
            <strong>Funding Rate:</strong> Positive = longs pay shorts, Negative = shorts pay longs
          </div>
          <div>
            <strong>Liquidations:</strong> High liquidations = potential for price volatility
          </div>
          <div>
            <strong>Whale Transactions:</strong> More transactions = increased institutional activity
          </div>
          <div>
            <strong>Hash Rate:</strong> Higher = more network security and miner confidence
          </div>
          <div>
            <strong>Active Addresses:</strong> Higher = more network usage and adoption
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMetricsCard;
