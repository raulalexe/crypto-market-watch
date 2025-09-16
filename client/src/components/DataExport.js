import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileText, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import axios from 'axios';
import ToastNotification from './ToastNotification';

const DataExport = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    dataType: 'crypto_prices',
    dateRange: '7d',
    format: 'json'
  });

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
  };

  const checkAuthAndSubscription = useCallback(async () => {
    try {
      // Check subscription status
      const subscriptionResponse = await axios.get('/api/subscription');
      setSubscriptionStatus(subscriptionResponse.data);
      setIsAuthenticated(true);
      
      // Check if user is admin or has premium+ subscription
      const isAdmin = subscriptionResponse.data.plan === 'admin';
      const hasValidPlan = subscriptionResponse.data.plan && subscriptionResponse.data.plan !== 'free';
      
      if (isAdmin || hasValidPlan) {
        await fetchExportHistory();
      } else {
        setAuthError('Premium subscription required. Data export is only available for Pro, Premium users, or administrators.');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      if (error.response?.status === 401) {
        setAuthError('Authentication required. Please log in to access data export features.');
      } else if (error.response?.status === 403) {
        setAuthError('Premium subscription required. Data export is only available for Pro, Premium users, or administrators.');
      } else {
        setAuthError('Failed to check authentication status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthAndSubscription();
  }, [checkAuthAndSubscription]);

  const fetchExportHistory = async () => {
    try {
      const response = await axios.get('/api/exports/history');
      setExportHistory(response.data.exports || []);
    } catch (error) {
      console.error('Error fetching export history:', error);
      setExportHistory([]);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 Form submitted with data:', formData);
    
    if (exporting) {
      console.log('⏳ Export already in progress, ignoring submission');
      return;
    }
    
    try {
      setExporting(true);
      console.log('🚀 Creating export with data:', formData);
      
      const response = await axios.post('/api/exports/create', formData, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      console.log('✅ Export created successfully');
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crypto-data-${formData.dataType}-${formData.dateRange}.${formData.format}`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
      
      // Refresh export history
      await fetchExportHistory();
      
      // Show success message
      showAlert(`✅ Export created successfully! Downloading crypto-data-${formData.dataType}-${formData.dateRange}.${formData.format}`, 'success');
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      showAlert(`Export failed: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-crypto-blue"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-red-400">Access Restricted</h2>
            </div>
            <p className="text-red-300 mb-4">{authError}</p>
            <div className="flex items-center space-x-4">
              <a
                href="/history"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Go to Historical Data</span>
              </a>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Export Capabilities</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Free Plan</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Basic dashboard access</li>
                  <li>• Limited historical data</li>
                  <li>• CSV export from Historical Data page</li>
                </ul>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Pro Plan</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• All Free features</li>
                  <li>• Advanced data exports</li>
                  <li>• JSON and Excel formats</li>
                  <li>• API access</li>
                </ul>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Premium+ & Admin</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• All Pro features</li>
                  <li>• Unlimited exports</li>
                  <li>• Custom date ranges</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Export</h1>
          <p className="text-gray-400">Export market data in various formats for analysis and reporting</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Export Creation */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Create Export</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data Type
                </label>
                <select
                  name="dataType"
                  value={formData.dataType}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="market_data">Market Data</option>
                  <option value="fear_greed">Fear & Greed Index</option>
                  <option value="narratives">Trending Narratives</option>
                  <option value="ai_analysis">AI Analysis</option>
                  <option value="all_data">All Data</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  name="dateRange"
                  value={formData.dateRange}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="1d">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Format
                </label>
                <select
                  name="format"
                  value={formData.format}
                  onChange={handleInputChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={exporting}
                className="w-full bg-crypto-blue hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Create Export</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Export History */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Export History</h2>
              <button
                onClick={fetchExportHistory}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Refresh export history"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {!Array.isArray(exportHistory) || exportHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No exports created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((export_, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{export_.type}</p>
                        <p className="text-sm text-gray-400">{export_.dateRange} • {export_.format}</p>
                      </div>
                      <button className="text-crypto-blue hover:text-blue-400">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {alert && <ToastNotification message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default DataExport;
