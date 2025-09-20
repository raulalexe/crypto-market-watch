import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Activity,
  Download,
  Filter,
  PieChart,
  LineChart,
  ScatterChart,
  Zap,
  Shield
} from 'lucide-react';
import logger from '../utils/logger';
import axios from 'axios';
import { isAdmin } from '../utils/authUtils';

// Helper function to safely convert values to numbers and format them
const safeToFixed = (value, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'N/A';
  return numValue.toFixed(decimals);
};

const AdvancedAnalytics = ({ userData }) => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('60');
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [chartType, setChartType] = useState('candlestick');
  const [marketMetrics, setMarketMetrics] = useState(null);
  const [advancedMetrics, setAdvancedMetrics] = useState(null);
  const [marketSentiment, setMarketSentiment] = useState(null);
  const [derivativesData, setDerivativesData] = useState(null);
  const [onchainData, setOnchainData] = useState(null);

  const timeframes = [
    { value: '1', label: '1 Minute' },
    { value: '5', label: '5 Minutes' },
    { value: '15', label: '15 Minutes' },
    { value: '30', label: '30 Minutes' },
    { value: '60', label: '1 Hour' },
    { value: '240', label: '4 Hours' },
    { value: 'D', label: '1 Day' },
    { value: 'W', label: '1 Week' },
    { value: 'M', label: '1 Month' }
  ];

  const assets = [
    { value: 'BTC', label: 'Bitcoin' },
    { value: 'ETH', label: 'Ethereum' },
    { value: 'SOL', label: 'Solana' },
    { value: 'SUI', label: 'Sui' },
    { value: 'XRP', label: 'Ripple' }
  ];

  const chartTypes = [
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'candlestick', label: 'Candlestick', icon: BarChart3 },
    { value: 'area', label: 'Area Chart', icon: LineChart }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeframe, selectedAsset]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [marketData, backtestData, correlationData, advancedMetricsData, sentimentData, derivatives, onchain] = await Promise.all([
        fetchMarketData(),
        fetchBacktestData(),
        fetchCorrelationData(),
        fetchAdvancedMetrics(),
        fetchMarketSentiment(),
        fetchDerivativesData(),
        fetchOnchainData()
      ]);

      setAnalyticsData({
        marketData,
        backtestData,
        correlationData: correlationData?.error ? null : correlationData,
        correlationError: correlationData?.error || null
      });

      // Calculate market metrics
      const metrics = calculateMarketMetrics(marketData);
      setMarketMetrics(metrics);
      setAdvancedMetrics(advancedMetricsData);
      setMarketSentiment(sentimentData);
      setDerivativesData(derivatives);
      setOnchainData(onchain);

    } catch (error) {
      logger.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      return response.data;
    } catch (error) {
      logger.error('Error fetching market data:', error);
      return null;
    }
  };

  const fetchBacktestData = async () => {
    try {
      const response = await axios.get('/api/backtest');
      return response.data;
    } catch (error) {
      logger.error('Error fetching backtest data:', error);
      return null;
    }
  };

  const fetchCorrelationData = async () => {
    try {
      const response = await axios.get('/api/correlation');
      return response.data;
    } catch (error) {
      logger.error('Error fetching correlation data:', error);
      // Return error information instead of null
      if (error.response && error.response.status === 503) {
        return { error: error.response.data };
      }
      return { error: { message: 'Failed to fetch correlation data. Please try again later.' } };
    }
  };

  const fetchAdvancedMetrics = async () => {
    try {
      const response = await axios.get('/api/advanced-metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching advanced metrics:', error);
      return null;
    }
  };

  const fetchMarketSentiment = async () => {
    try {
      const response = await axios.get('/api/market-sentiment');
      return response.data;
    } catch (error) {
      console.error('Error fetching market sentiment:', error);
      return null;
    }
  };

  const fetchDerivativesData = async () => {
    try {
      const response = await axios.get('/api/derivatives');
      return response.data;
    } catch (error) {
      console.error('Error fetching derivatives data:', error);
      return null;
    }
  };

  const fetchOnchainData = async () => {
    try {
      const response = await axios.get('/api/onchain');
      return response.data;
    } catch (error) {
      console.error('Error fetching on-chain data:', error);
      return null;
    }
  };

  const calculateMarketMetrics = (marketData) => {
    if (!marketData?.cryptoPrices) return null;

    const prices = Object.values(marketData.cryptoPrices);
    const avgChange = prices.reduce((sum, price) => sum + (price.change_24h || 0), 0) / prices.length;
    
    // Calculate total volume
    const totalVolume = prices.reduce((sum, price) => sum + (price.volume_24h || 0), 0);
    
    // Calculate market volatility (standard deviation of returns)
    const returns = prices.map(price => (price.change_24h || 0) / 100);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;

    // Calculate market risk-adjusted return (assuming risk-free rate of 2%)
    const riskFreeRate = 0.02;
    const riskAdjustedReturn = (avgReturn - riskFreeRate) / (volatility / 100);

    return {
      avgChange: safeToFixed(avgChange, 2),
      totalVolume: totalVolume,
      volatility: safeToFixed(volatility, 2),
      riskAdjustedReturn: safeToFixed(riskAdjustedReturn, 2),
      assetCount: prices.length
    };
  };

  const formatVolume = (volume) => {
    if (!volume) return 'N/A';
    
    // Convert to number if it's a string
    const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
    
    // Check if conversion was successful
    if (isNaN(numVolume)) return 'N/A';
    
    if (numVolume >= 1e9) {
      return `$${(numVolume / 1e9).toFixed(2)}B`;
    } else if (numVolume >= 1e6) {
      return `$${(numVolume / 1e6).toFixed(2)}M`;
    } else if (numVolume >= 1e3) {
      return `$${(numVolume / 1e3).toFixed(2)}K`;
    }
    return `$${numVolume.toFixed(2)}`;
  };

  const exportAnalyticsReport = async (format = 'pdf') => {
    try {
      const response = await axios.post('/api/analytics/export', {
        timeframe: selectedTimeframe,
        asset: selectedAsset,
        chartType,
        format
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `market_analytics_report_${selectedTimeframe}_${selectedAsset}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analytics report:', error);
      
      // Handle PDF export error specifically
      if (format === 'pdf' && error.response?.status === 400) {
        alert('PDF export is not available. Please use JSON or CSV format instead.');
        return;
      }
      
      alert('Failed to export report. Please try again.');
    }
  };

  const getCorrelationColor = (correlation) => {
    if (correlation === null || correlation === undefined) return 'text-slate-500';
    if (correlation > 0.7) return 'text-crypto-green';
    if (correlation > 0.4) return 'text-crypto-yellow';
    if (correlation > 0.1) return 'text-crypto-orange';
    return 'text-crypto-red';
  };

  const getTradingViewSymbol = (asset) => {
    const symbols = {
      'BTC': 'BINANCE:BTCUSDT',
      'ETH': 'BINANCE:ETHUSDT',
      'SOL': 'BINANCE:SOLUSDT',
      'SUI': 'BINANCE:SUIUSDT',
      'XRP': 'BINANCE:XRPUSDT'
    };
    return symbols[asset] || 'BINANCE:BTCUSDT';
  };



  const getTradingViewStyle = (chartType) => {
    const styles = {
      'candlestick': '1',       
      'bar': '2',        
      'line': '3',
      'area': '4'        
    };
    return styles[chartType] || '1';
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-crypto-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
            <p className="text-slate-400">Professional-grade market analysis and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportAnalyticsReport('json')}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>JSON</span>
              </button>
              <button
                onClick={() => exportAnalyticsReport('csv')}
                className="px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => exportAnalyticsReport('pdf')}
                className="px-3 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              >
                {timeframes.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Asset</label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              >
                {assets.map(asset => (
                  <option key={asset.value} value={asset.value}>{asset.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
              >
                {chartTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Price Chart and Asset Correlation - Side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Price Performance Chart */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              {selectedAsset} Price Chart
              <span className="text-sm font-normal text-slate-400 ml-2">
                ({timeframes.find(tf => tf.value === selectedTimeframe)?.label} • {chartTypes.find(ct => ct.value === chartType)?.label})
              </span>
            </h3>
            <div className="h-64 bg-slate-700 rounded-lg">
              <iframe
                key={`${selectedAsset}-${selectedTimeframe}-${chartType}`}
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${selectedAsset}_${selectedTimeframe}_${chartType}&symbol=${encodeURIComponent(getTradingViewSymbol(selectedAsset))}&interval=${selectedTimeframe}&hidesidetoolbar=0&hidedrawingtoolbar=0&symboledit=0&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=${getTradingViewStyle(chartType)}&timezone=Etc%2FUTC&withdateranges=1&showpopupbutton=1&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utm_source=&utm_medium=widget&utm_campaign=chart`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={`${selectedAsset} Price Chart`}
              />
            </div>
            <p className="text-sm text-slate-400 mt-2">Live Bitcoin price data from TradingView</p>
          </div>

          {/* Correlation Matrix */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Crypto Correlation</h3>
            {analyticsData?.correlationData ? (
              <div className="h-64 overflow-auto">
                <div className="grid grid-cols-6 gap-2 text-xs">
                  {/* Header row */}
                  <div className="font-semibold text-slate-300 p-2"></div>
                  <div className="font-semibold text-slate-300 p-2 text-center">BTC</div>
                  <div className="font-semibold text-slate-300 p-2 text-center">ETH</div>
                  <div className="font-semibold text-slate-300 p-2 text-center">SOL</div>
                  <div className="font-semibold text-slate-300 p-2 text-center">SUI</div>
                  <div className="font-semibold text-slate-300 p-2 text-center">XRP</div>
                  
                  {/* BTC row */}
                  <div className="font-semibold text-slate-300 p-2">BTC</div>
                  <div className="bg-crypto-green/20 text-crypto-green p-2 text-center rounded">1.00</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.BTC_ETH?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.BTC_SOL?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.BTC_SUI?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.BTC_XRP?.toFixed(2) || 'N/A'}</div>
                  
                  {/* ETH row */}
                  <div className="font-semibold text-slate-300 p-2">ETH</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.BTC_ETH?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-crypto-green/20 text-crypto-green p-2 text-center rounded">1.00</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.ETH_SOL?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.ETH_SUI?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.ETH_XRP?.toFixed(2) || 'N/A'}</div>
                  
                  {/* SOL row */}
                  <div className="font-semibold text-slate-300 p-2">SOL</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.BTC_SOL?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.ETH_SOL?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-crypto-green/20 text-crypto-green p-2 text-center rounded">1.00</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.SOL_SUI?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.SOL_XRP?.toFixed(2) || 'N/A'}</div>
                  
                  {/* SUI row */}
                  <div className="font-semibold text-slate-300 p-2">SUI</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.BTC_SUI?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.ETH_SUI?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.SOL_SUI?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-crypto-green/20 text-crypto-green p-2 text-center rounded">1.00</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.SUI_XRP?.toFixed(2) || 'N/A'}</div>
                  
                  {/* XRP row */}
                  <div className="font-semibold text-slate-300 p-2">XRP</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.BTC_XRP?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.ETH_XRP?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.SOL_XRP?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-slate-600 p-2 text-center rounded">{analyticsData.correlationData.SUI_XRP?.toFixed(2) || 'N/A'}</div>
                  <div className="bg-crypto-green/20 text-crypto-green p-2 text-center rounded">1.00</div>
                </div>
              </div>
            ) : analyticsData?.correlationError ? (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-red-400 mb-2">Correlation data unavailable</p>
                  <p className="text-sm text-slate-500">{analyticsData.correlationError.message}</p>
                  <button 
                    onClick={() => fetchAnalyticsData()}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Correlation data loading...</p>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-400 mt-2">Crypto correlation matrix (1.00 = perfect correlation, -1.00 = perfect negative correlation)</p>
          </div>
        </div>

        {/* Market Metrics */}
        {marketMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Bitcoin Dominance</h3>
                <TrendingUp className="w-6 h-6 text-crypto-green" />
              </div>
              <div className="text-3xl font-bold text-crypto-green">
                {advancedMetrics?.bitcoinDominance?.value ? `${parseFloat(advancedMetrics.bitcoinDominance.value).toFixed(2)}%` : 'N/A'}
              </div>
              <p className="text-sm text-slate-400 mt-2">BTC market share</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Total Volume</h3>
                <Activity className="w-6 h-6 text-crypto-blue" />
              </div>
              <div className="text-3xl font-bold text-crypto-blue">
                {formatVolume(marketMetrics.totalVolume)}
              </div>
              <p className="text-sm text-slate-400 mt-2">24h trading volume</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Market Volatility</h3>
                <Zap className="w-6 h-6 text-crypto-yellow" />
              </div>
              <div className="text-3xl font-bold text-crypto-yellow">{marketMetrics.volatility}%</div>
              <p className="text-sm text-slate-400 mt-2">Price volatility</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Risk-Adjusted Return</h3>
                <Target className="w-6 h-6 text-crypto-blue" />
              </div>
              <div className={`text-3xl font-bold ${parseFloat(marketMetrics.riskAdjustedReturn) >= 1 ? 'text-crypto-green' : 'text-crypto-yellow'}`}>
                {marketMetrics.riskAdjustedReturn}
              </div>
              <p className="text-sm text-slate-400 mt-2">Return per unit of risk</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Avg Change</h3>
                <Activity className="w-6 h-6 text-crypto-blue" />
              </div>
              <div className={`text-3xl font-bold ${parseFloat(marketMetrics.avgChange) >= 0 ? 'text-crypto-green' : 'text-crypto-red'}`}>
                {marketMetrics.avgChange}%
              </div>
              <p className="text-sm text-slate-400 mt-2">Average 24h change</p>
            </div>
          </div>
        )}


        {/* Backtesting Results */}
        {analyticsData?.backtestData && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">AI Prediction Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-crypto-blue mb-2">
                  {analyticsData.backtestData.overall_accuracy || 0}%
                </div>
                <p className="text-slate-400">Prediction Accuracy</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-crypto-green mb-2">
                  {analyticsData.backtestData.average_correlation || 0}%
                </div>
                <p className="text-slate-400">Avg Correlation</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-crypto-yellow mb-2">
                  {analyticsData.backtestData.total_predictions || 0}
                </div>
                <p className="text-slate-400">Total Predictions</p>
              </div>
            </div>
          </div>
        )}

        {/* Market Analysis */}
        <div className="bg-slate-800 rounded-lg p-6 mb-4 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Market Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                <h4 className="text-lg font-medium text-white mb-3">Market Overview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tracked Assets</span>
                    <span className="text-white font-medium">{marketMetrics?.assetCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">BTC Dominance</span>
                    <span className="text-white font-medium">
                      {advancedMetrics?.bitcoinDominance?.value ? `${safeToFixed(advancedMetrics.bitcoinDominance.value, 1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Volume</span>
                    <span className="text-white font-medium">
                      {marketMetrics?.totalVolume ? formatVolume(marketMetrics.totalVolume) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Market Trend</span>
                    <span className={`font-medium ${parseFloat(marketMetrics?.avgChange || 0) >= 0 ? 'text-crypto-green' : 'text-crypto-red'}`}>
                      {parseFloat(marketMetrics?.avgChange || 0) >= 0 ? 'Bullish' : 'Bearish'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volatility Level</span>
                    <span className={`font-medium ${
                      parseFloat(marketMetrics?.volatility || 0) > 10 ? 'text-crypto-red' : 
                      parseFloat(marketMetrics?.volatility || 0) > 5 ? 'text-crypto-yellow' : 'text-crypto-green'
                    }`}>
                      {parseFloat(marketMetrics?.volatility || 0) > 10 ? 'High' : 
                       parseFloat(marketMetrics?.volatility || 0) > 5 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Data Sources</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Price Data</span>
                  <span className="text-white font-medium">Real-time</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AI Analysis</span>
                  <span className="text-white font-medium">Venice AI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Backtesting</span>
                  <span className="text-white font-medium">Historical</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Advanced Data Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Market Sentiment Section */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Activity className="w-6 h-6 text-crypto-blue mr-2" />
              Market Sentiment
            </h3>
            {marketSentiment ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Fear & Greed Index</span>
                  <span className={`font-bold text-lg ${
                    marketSentiment.value > 75 ? 'text-crypto-red' :
                    marketSentiment.value > 55 ? 'text-crypto-yellow' :
                    marketSentiment.value > 25 ? 'text-crypto-green' : 'text-crypto-blue'
                  }`}>
                    {marketSentiment.value ? Math.round(marketSentiment.value) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Classification</span>
                  <span className="text-white font-medium">
                    {marketSentiment.classification || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Source</span>
                  <span className="text-slate-300 text-sm">
                    {marketSentiment.source || 'N/A'}
                  </span>
                </div>
                {marketSentiment.metadata && (
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs text-slate-400">
                      Last updated: {new Date(marketSentiment.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No sentiment data available</p>
                <p className="text-slate-500 text-sm mt-2">Data will appear after collection</p>
              </div>
            )}
          </div>

          {/* Derivatives Data Section */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 text-crypto-green mr-2" />
              Derivatives
            </h3>
            {derivativesData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Asset</span>
                  <span className="text-white font-medium">
                    {derivativesData.asset || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white font-medium">
                    {derivativesData.derivative_type || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Open Interest</span>
                  <span className="text-white font-medium">
                    {derivativesData.open_interest ? 
                      `$${(derivativesData.open_interest / 1000000).toFixed(2)}M` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Funding Rate</span>
                  <span className={`font-medium ${
                    parseFloat(derivativesData.funding_rate || 0) > 0 ? 'text-crypto-red' : 'text-crypto-green'
                  }`}>
                    {derivativesData.funding_rate ? 
                      `${(derivativesData.funding_rate * 100).toFixed(4)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">24h Volume</span>
                  <span className="text-white font-medium">
                    {derivativesData.volume_24h ? 
                      `$${(derivativesData.volume_24h / 1000000).toFixed(2)}M` : 'N/A'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-400">
                    Source: {derivativesData.source || 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No derivatives data available</p>
                <p className="text-slate-500 text-sm mt-2">Data will appear after collection</p>
              </div>
            )}
          </div>

          {/* On-Chain Data Section */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Zap className="w-6 h-6 text-crypto-yellow mr-2" />
              On-Chain Metrics
            </h3>
            {onchainData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Network</span>
                  <span className="text-white font-medium">
                    {onchainData.blockchain || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Metric</span>
                  <span className="text-white font-medium">
                    {onchainData.metric_type ? 
                      onchainData.metric_type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Value</span>
                  <span className="text-white font-medium">
                    {onchainData.value ? 
                      (onchainData.metric_type === 'hash_rate' ? 
                        `${(onchainData.value / 1e18).toFixed(2)} EH/s` :
                        onchainData.metric_type === 'total_supply' ?
                        `${onchainData.value.toFixed(2)} ETH` :
                        onchainData.metric_type === 'gas_price' ?
                        `${onchainData.value} Gwei` :
                        onchainData.metric_type === 'exchange_flows' ?
                        `${(onchainData.value * 100).toFixed(1)}%` :
                        onchainData.metric_type === 'network_health' ?
                        `${(onchainData.value * 100).toFixed(1)}%` :
                        onchainData.metric_type === 'whale_activity' ?
                        `${(onchainData.value * 100).toFixed(1)}%` :
                        onchainData.metric_type === 'fear_greed_index' ?
                        Math.round(onchainData.value) :
                        typeof onchainData.value === 'number' && onchainData.value < 1 ?
                        `${(onchainData.value * 100).toFixed(1)}%` :
                        onchainData.value.toLocaleString()
                      ) : 'N/A'}
                  </span>
                </div>
                {/* Metric Description */}
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">
                    <strong>What this means:</strong>
                  </p>
                  <p className="text-xs text-slate-400 mb-2">
                    {onchainData.metric_type === 'exchange_flows' ? 
                      'Exchange Flows: Shows money movement direction. Above 50% = money leaving exchanges (bullish), below 50% = money entering exchanges (bearish)' :
                      onchainData.metric_type === 'network_health' ?
                      'Network Health: Overall blockchain health score. Higher percentage = healthier network with better performance' :
                      onchainData.metric_type === 'whale_activity' ?
                      'Whale Activity: Large transaction volume. Higher percentage = more large transactions happening' :
                      'Metric from multiple blockchain sources combined for overall market insight'
                    }
                  </p>
                  {onchainData.metadata && (
                    <>
                      <p className="text-xs text-slate-400">
                        Source: {onchainData.source || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Last updated: {new Date(onchainData.timestamp).toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No on-chain data available</p>
                <p className="text-slate-500 text-sm mt-2">Data will appear after collection</p>
              </div>
            )}
          </div>
        </div>

        {/* Manual Data Collection Trigger */}
        {/* Data Collection - Admin Only */}
        {isAdmin(userData) && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Shield className="w-6 h-6 text-crypto-blue mr-2" />
              Data Collection
              <span className="ml-2 text-sm bg-crypto-blue/20 text-crypto-blue px-2 py-1 rounded-full">
                Admin Only
              </span>
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 mb-2">Manually trigger advanced data collection</p>
                <p className="text-slate-400 text-sm">
                  This will collect market sentiment, derivatives, and on-chain data from external APIs
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await axios.post('/api/collect-advanced-data');
                    await fetchAnalyticsData(); // Refresh data
                  } catch (error) {
                    console.error('Error triggering data collection:', error);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="bg-crypto-blue hover:bg-crypto-blue-dark text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Collecting...' : 'Collect Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
