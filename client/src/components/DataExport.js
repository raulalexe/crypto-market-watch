import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader, CheckCircle } from 'lucide-react';
import axios from 'axios';

const DataExport = () => {
  const [exportType, setExportType] = useState('market_data');
  const [dateRange, setDateRange] = useState('7d');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkAuthAndSubscription();
  }, []);

  const checkAuthAndSubscription = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthError('Authentication required. Please log in to access data export.');
        setIsAuthenticated(false);
        return;
      }
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Check subscription status
      const subscriptionResponse = await axios.get('/api/subscription/status');
      setSubscriptionStatus(subscriptionResponse.data);
      setIsAuthenticated(true);
      
      // If user has premium+ subscription, fetch export history
      if (subscriptionResponse.data.plan !== 'free') {
        await fetchExportHistory();
      }
    } catch (error) {
      console.error('Error checking auth/subscription:', error);
      if (error.response?.status === 401) {
        setAuthError('Authentication required. Please log in to access data export.');
        setIsAuthenticated(false);
      } else if (error.response?.status === 403) {
        setAuthError('Premium subscription required. Data export is only available for Pro and Premium users.');
        setIsAuthenticated(true);
      } else {
        setAuthError('Failed to check subscription status. Please try again.');
      }
    }
  };

  const fetchExportHistory = async () => {
    try {
      const response = await axios.get('/api/exports/history');
      setExportHistory(response.data.exports || []);
    } catch (error) {
      console.error('Error fetching export history:', error);
      // Don't set auth error here as it's handled in checkAuthAndSubscription
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/exports/create', {
        type: exportType,
        dateRange,
        format
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `crypto-data-${exportType}-${dateRange}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Refresh export history
      await fetchExportHistory();
    } catch (error) {
      setError(error.response?.data?.error || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const exportTypes = [
    { id: 'market_data', label: 'Market Data', description: 'Treasury yields, VIX, equity indices' },
    { id: 'crypto_prices', label: 'Crypto Prices', description: 'BTC, ETH, SOL, SUI, XRP prices' },
    { id: 'fear_greed', label: 'Fear & Greed Index', description: 'Market sentiment data' },
    { id: 'narratives', label: 'Trending Narratives', description: 'AI-generated market narratives' },
    { id: 'ai_analysis', label: 'AI Analysis', description: 'Complete AI analysis reports' },
    { id: 'all_data', label: 'All Data', description: 'Complete dataset export' }
  ];

  const dateRanges = [
    { id: '1d', label: 'Last 24 Hours' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: '1y', label: 'Last Year' },
    { id: 'all', label: 'All Time' }
  ];

  const formats = [
    { id: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { id: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { id: 'xlsx', label: 'Excel', description: 'Microsoft Excel format' }
  ];

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Download className="w-8 h-8 text-crypto-blue" />
        <div>
          <h1 className="text-3xl font-bold text-white">Data Export</h1>
          <p className="text-slate-400">Export market data and analysis for your needs</p>
        </div>
      </div>

      {/* Auth/Subscription Error */}
      {authError && (
        <div className="bg-slate-800 rounded-lg p-6 border border-red-500/30">
          <div className="text-center">
            <Download className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Access Restricted</h3>
            <p className="text-red-400 mb-4">{authError}</p>
            {!isAuthenticated && (
              <button
                onClick={() => window.location.href = '/#login'}
                className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </button>
            )}
            {isAuthenticated && subscriptionStatus?.plan === 'free' && (
              <button
                onClick={() => window.location.href = '/#subscription'}
                className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View Subscription Plans
              </button>
            )}
          </div>
        </div>
      )}

      {/* Export Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Settings */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4">Export Configuration</h3>
          
          {/* Data Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data Type
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
            >
              {exportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-crypto-blue"
            >
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id)}
                  className={`p-3 rounded-lg border transition-colors ${
                    format === fmt.id
                      ? 'bg-crypto-blue border-crypto-blue text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="text-sm font-medium">{fmt.label}</div>
                  <div className="text-xs opacity-75">{fmt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>{loading ? 'Preparing Export...' : 'Export Data'}</span>
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Export History */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4">Recent Exports</h3>
          
          {exportHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">No exports yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exportHistory.slice(0, 5).map((exportItem) => (
                <div
                  key={exportItem.id}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-white font-medium">
                        {exportItem.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {exportItem.format.toUpperCase()} • {exportItem.dateRange}
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs">
                    {formatTimestamp(exportItem.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Limits Info */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-4">Export Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-crypto-blue">Free</div>
            <div className="text-slate-400 text-sm">No exports available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-crypto-blue">Pro</div>
            <div className="text-slate-400 text-sm">10 exports per month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-crypto-blue">Premium+</div>
            <div className="text-slate-400 text-sm">Unlimited exports</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
