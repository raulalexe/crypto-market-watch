import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Filter, X, Info, Database, Shield, Zap } from 'lucide-react';
import axios from 'axios';

const ErrorLogs = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedError, setExpandedError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthError('Authentication required. Please log in.');
        setIsAuthenticated(false);
        return;
      }
      
      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get('/api/errors');
      setErrors(response.data.errors || []);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching error logs:', error);
      if (error.response?.status === 401) {
        setAuthError('Authentication required. Please log in.');
        setIsAuthenticated(false);
      } else if (error.response?.status === 403) {
        setAuthError('Admin access required. This page is only available to administrators.');
        setIsAuthenticated(true);
      } else {
        setAuthError('Failed to load error logs. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorIcon = (type) => {
    switch (type) {
      case 'api_failure':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'data_collection':
        return <Database className="w-5 h-5 text-orange-400" />;
      case 'authentication':
        return <Shield className="w-5 h-5 text-yellow-400" />;
      case 'system':
        return <Zap className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case 'api_failure':
        return 'border-red-500/30 bg-red-900/20';
      case 'data_collection':
        return 'border-orange-500/30 bg-orange-900/20';
      case 'authentication':
        return 'border-yellow-500/30 bg-yellow-900/20';
      case 'system':
        return 'border-purple-500/30 bg-purple-900/20';
      default:
        return 'border-blue-500/30 bg-blue-900/20';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const errorTime = new Date(timestamp);
    const diffMs = now - errorTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  const filteredErrors = errors.filter(error => {
    if (filter === 'all') return true;
    return error.type === filter;
  });

  const errorTypes = [
    { id: 'all', label: 'All Errors', count: errors.length },
    { id: 'api_failure', label: 'API Failures', count: errors.filter(e => e.type === 'api_failure').length },
    { id: 'data_collection', label: 'Data Collection', count: errors.filter(e => e.type === 'data_collection').length },
    { id: 'authentication', label: 'Authentication', count: errors.filter(e => e.type === 'authentication').length },
    { id: 'system', label: 'System', count: errors.filter(e => e.type === 'system').length }
  ];

  const parseDetails = (details) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return { raw: details };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Error Logs</h1>
            <p className="text-slate-400">Monitor API failures and system errors</p>
          </div>
        </div>
        
        <button
          onClick={fetchErrors}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      {!authError && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-medium text-white">Filter Errors</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {errorTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setFilter(type.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === type.id
                    ? 'bg-crypto-blue text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {type.label} ({type.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error List */}
      <div className="space-y-4">
        {authError ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Access Denied</h3>
            <p className="text-red-400 mb-4">{authError}</p>
            {!isAuthenticated && (
              <button
                onClick={() => window.location.href = '/#login'}
                className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </button>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-crypto-blue" />
          </div>
        ) : filteredErrors.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Errors Found</h3>
            <p className="text-slate-400">Great! No errors have been logged recently.</p>
          </div>
        ) : (
          filteredErrors.map((error) => {
            const details = parseDetails(error.details);
            const isExpanded = expandedError === error.id;
            
            return (
              <div
                key={error.id}
                className={`border rounded-lg p-4 transition-colors ${getErrorColor(error.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getErrorIcon(error.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-white font-medium">{error.source}</h4>
                        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                          {error.type}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm mb-2">{error.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span>{formatTimestamp(error.timestamp)}</span>
                        <span>•</span>
                        <span>{getTimeAgo(error.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setExpandedError(isExpanded ? null : error.id)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && details && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <h5 className="text-sm font-medium text-white mb-2">Error Details</h5>
                    <pre className="text-xs text-slate-300 bg-slate-900 p-3 rounded overflow-x-auto">
                      {JSON.stringify(details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {!authError && errors.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-3">Error Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {errorTypes.slice(1).map((type) => (
              <div key={type.id} className="text-center">
                <div className="text-2xl font-bold text-white">{type.count}</div>
                <div className="text-sm text-slate-400">{type.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogs;
