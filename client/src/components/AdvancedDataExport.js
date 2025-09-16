import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings,
  Database,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { shouldShowPremiumUpgradePrompt } from '../utils/authUtils';
import ToastNotification from './ToastNotification';

const AdvancedDataExport = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedDataTypes, setSelectedDataTypes] = useState(['crypto_prices']);
  const [dateRange, setDateRange] = useState('7d');
  const [exportFormat, setExportFormat] = useState('csv');
  const [scheduledExports, setScheduledExports] = useState([]);
  const [alert, setAlert] = useState(null);

  const dataTypes = [
    { 
      id: 'crypto_prices', 
      label: 'Crypto Prices', 
      description: 'Historical cryptocurrency price data',
      icon: BarChart3,
      available: true
    },
    { 
      id: 'market_data', 
      label: 'Market Data', 
      description: 'Equity indices, DXY, Treasury yields, VIX',
      icon: Database,
      available: true
    },
    { 
      id: 'ai_analysis', 
      label: 'AI Analysis', 
      description: 'AI predictions and market direction analysis',
      icon: Settings,
      available: true
    },
    { 
      id: 'fear_greed', 
      label: 'Fear & Greed Index', 
      description: 'Market sentiment indicators',
      icon: AlertCircle,
      available: true
    },
    { 
      id: 'narratives', 
      label: 'Market Narratives', 
      description: 'Trending market narratives and sentiment',
      icon: FileText,
      available: true
    },
    { 
      id: 'alerts', 
      label: 'Market Alerts', 
      description: 'Historical alert data and triggers',
      icon: AlertCircle,
      available: true
    },
    { 
      id: 'backtest_results', 
      label: 'Backtest Results', 
      description: 'AI prediction accuracy and performance',
      icon: CheckCircle,
      available: true
    },
    { 
      id: 'all_data', 
      label: 'All Data', 
      description: 'Complete dataset export',
      icon: Database,
      available: true
    }
  ];

  const dateRanges = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const exportFormats = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel format' },
    { value: 'pdf', label: 'PDF Report', description: 'Professional PDF report with charts' },
    { value: 'xml', label: 'XML', description: 'Extensible Markup Language' }
  ];

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
  };

  useEffect(() => {
    checkAuthAndSubscription();
  }, []);

  const checkAuthAndSubscription = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get('/api/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setIsAuthenticated(true);

      // Check if user has access to advanced exports using shared utility
      const hasAccess = !shouldShowPremiumUpgradePrompt(response.data);
      if (hasAccess) {
        await fetchExportHistory();
        await fetchScheduledExports();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExportHistory = async () => {
    try {
      const response = await axios.get('/api/exports/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}` }
      });
      // Ensure response.data is always an array
      setExportHistory(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching export history:', error);
      setExportHistory([]);
    }
  };

  const fetchScheduledExports = async () => {
    try {
      const response = await axios.get('/api/exports/scheduled', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}` }
      });
      // Ensure response.data is always an array
      setScheduledExports(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching scheduled exports:', error);
      setScheduledExports([]);
    }
  };

  const createExport = async () => {
    try {
      setExporting(true);
      const response = await axios.post('/api/exports/create', {
        dataTypes: selectedDataTypes,
        dateRange,
        format: exportFormat,
        includeMetadata: true,
        compression: exportFormat === 'json' || exportFormat === 'csv'
      }, {
        responseType: 'blob',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}` }
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `crypto_market_data_${dateRange}_${new Date().toISOString().split('T')[0]}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Refresh export history
      await fetchExportHistory();
    } catch (error) {
      console.error('Error creating export:', error);
      showAlert('Failed to create export. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const scheduleExport = async (schedule) => {
    try {
      await axios.post('/api/exports/schedule', {
        dataTypes: selectedDataTypes,
        dateRange,
        format: exportFormat,
        schedule: schedule, // daily, weekly, monthly
        emailNotification: true
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}` }
      });

      await fetchScheduledExports();
      showAlert('Export scheduled successfully!', 'success');
    } catch (error) {
      console.error('Error scheduling export:', error);
      showAlert('Failed to schedule export. Please try again.', 'error');
    }
  };

  const cancelScheduledExport = async (exportId) => {
    try {
      await axios.delete(`/api/exports/scheduled/${exportId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}` }
      });
      await fetchScheduledExports();
    } catch (error) {
      console.error('Error canceling scheduled export:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-crypto-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Database className="w-16 h-16 text-crypto-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Advanced Data Export</h2>
          <p className="text-slate-400 mb-6">
            Export comprehensive market data in multiple formats with advanced filtering and scheduling options.
          </p>
          <div className="space-y-3 text-sm text-slate-400 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Multiple export formats (CSV, JSON, Excel, PDF, XML)</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Scheduled exports (daily, weekly, monthly)</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Custom date ranges and data filtering</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Bulk data downloads and compression</span>
            </div>
          </div>
          <button className="w-full px-6 py-3 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
            Upgrade to Premium+
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Advanced Data Export</h1>
            <p className="text-slate-400">Export comprehensive market data in multiple formats</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchExportHistory}
              className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Type Selection */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Select Data Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataTypes.map((dataType) => (
                  <label key={dataType.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDataTypes.includes(dataType.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDataTypes([...selectedDataTypes, dataType.id]);
                        } else {
                          setSelectedDataTypes(selectedDataTypes.filter(id => id !== dataType.id));
                        }
                      }}
                      className="mt-1 w-4 h-4 text-crypto-blue bg-slate-700 border-slate-600 rounded focus:ring-crypto-blue"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <dataType.icon className="w-4 h-4 text-crypto-blue" />
                        <span className="font-medium text-white">{dataType.label}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{dataType.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Settings */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Export Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                  >
                    {dateRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-crypto-blue"
                  >
                    {exportFormats.map(format => (
                      <option key={format.value} value={format.value}>{format.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={createExport}
                    disabled={exporting || selectedDataTypes.length === 0}
                    className="w-full px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                </div>
              </div>
            </div>

            {/* Scheduled Exports */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Scheduled Exports</h3>
              <div className="space-y-4">
                {scheduledExports.length === 0 ? (
                  <p className="text-slate-400">No scheduled exports</p>
                ) : (
                  scheduledExports.map((scheduled) => (
                    <div key={scheduled.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-white">{scheduled.name}</h4>
                        <p className="text-sm text-slate-400">
                          {scheduled.schedule} • {scheduled.format.toUpperCase()} • {scheduled.dataTypes.join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => cancelScheduledExport(scheduled.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => scheduleExport('daily')}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Schedule Daily
                  </button>
                  <button
                    onClick={() => scheduleExport('weekly')}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Schedule Weekly
                  </button>
                  <button
                    onClick={() => scheduleExport('monthly')}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Schedule Monthly
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Export History */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Exports</h3>
              <div className="space-y-3">
                {exportHistory.length === 0 ? (
                  <p className="text-slate-400">No recent exports</p>
                ) : (
                  exportHistory.slice(0, 5).map((exportItem) => (
                    <div key={exportItem.id} className="p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{exportItem.format.toUpperCase()}</span>
                        <span className="text-sm text-slate-400">{new Date(exportItem.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-400">{exportItem.data_types.join(', ')}</p>
                      <p className="text-xs text-slate-500">{exportItem.file_size}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Export Statistics */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Export Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Exports</span>
                  <span className="text-white font-medium">{exportHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">This Month</span>
                  <span className="text-white font-medium">
                    {exportHistory.filter(e => new Date(e.created_at).getMonth() === new Date().getMonth()).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Data Exported</span>
                  <span className="text-white font-medium">
                    {exportHistory.reduce((sum, e) => sum + (parseInt(e.file_size) || 0), 0)} MB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {alert && <ToastNotification message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
    </div>
  );
};

export default AdvancedDataExport;
