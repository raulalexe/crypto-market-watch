import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle, Filter, Search, RefreshCw } from 'lucide-react';
import { shouldShowUpgradePrompt } from '../utils/authUtils';

const AlertsPage = ({ isAuthenticated, userData }) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  const handleUpgradeClick = () => {
    navigate('/app/subscription');
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, high, medium, low
  const [searchTerm, setSearchTerm] = useState('');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/alerts?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        setError('Failed to fetch alerts');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-900/20 border-slate-500/30';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'low':
        return <Bell className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatEventTime = (alert) => {
    // For upcoming events, show when the event is happening, not when the alert was created
    if (alert.type === 'UPCOMING_EVENT' && alert.eventDate) {
      const eventDate = new Date(alert.eventDate);
      const now = new Date();
      const diffMs = eventDate - now;
      
      if (diffMs < 0) {
        // Event has passed
        return 'Past event';
      }
      
      // Always show the actual event date and time for upcoming events
      return eventDate.toLocaleDateString() + ' ' + eventDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // For other alerts, show when the alert was created
    return formatTimestamp(alert.timestamp);
  };

  const filteredAlerts = alerts.filter(alert => {
    // Filter by severity
    if (filter !== 'all' && alert.severity !== filter) {
      return false;
    }

    // Filter by search term
    if (searchTerm && !alert.message.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filter by acknowledgment status
    if (!showAcknowledged && alert.acknowledged) {
      return false;
    }

    return true;
  });

  const highSeverityCount = alerts.filter(a => a.severity === 'high' && !a.acknowledged).length;
  const mediumSeverityCount = alerts.filter(a => a.severity === 'medium' && !a.acknowledged).length;
  const lowSeverityCount = alerts.filter(a => a.severity === 'low' && !a.acknowledged).length;

  if (shouldShowUpgradePrompt(userData)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Bell className="w-16 h-16 text-crypto-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Get Real-Time Market Alerts</h2>
          <p className="text-slate-400 mb-6">
            Stay ahead of market movements with instant notifications for price changes, 
            volume spikes, and market sentiment shifts.
          </p>
          <div className="space-y-3 text-sm text-slate-400 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>SSR (Stablecoin Supply Ratio) alerts</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Bitcoin dominance changes</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Exchange flow movements</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Stablecoin market cap changes</span>
            </div>
          </div>
          <div className="space-y-3">
            <button 
              onClick={handleUpgradeClick}
              className="w-full px-6 py-3 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Upgrade to Pro
            </button>
            <Link
              to="/"
              className="block px-6 py-3 text-slate-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-crypto-blue" />
          <span className="text-white">Loading alerts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchAlerts}
            className="px-4 py-2 bg-crypto-blue hover:bg-blue-600 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Market Alerts</h1>
              <p className="text-gray-400">Monitor and manage system-generated market alerts</p>
            </div>
            {/* Refresh button removed - alerts now update in real-time via WebSocket */}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Alerts</p>
                <p className="text-2xl font-bold text-white">{alerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-crypto-blue" />
            </div>
          </div>
          <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm">High Severity</p>
                <p className="text-2xl font-bold text-red-400">{highSeverityCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm">Medium Severity</p>
                <p className="text-2xl font-bold text-yellow-400">{mediumSeverityCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm">Low Severity</p>
                <p className="text-2xl font-bold text-blue-400">{lowSeverityCount}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="low">Low Severity</option>
              </select>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showAcknowledged}
                onChange={(e) => setShowAcknowledged(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">Show acknowledged</span>
            </label>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <div className="text-gray-400 mb-2">No alerts found</div>
              <div className="text-sm text-gray-500">Market conditions are stable</div>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 rounded-lg border ${getSeverityColor(alert.severity)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex items-center space-x-2 mt-1">
                      {getSeverityIcon(alert.severity)}
                      {alert.acknowledged && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          alert.severity === 'high' ? 'bg-red-500 text-white' :
                          alert.severity === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">{alert.type}</span>
                        {alert.acknowledged && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>
                      <p className="text-white mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Metric: {alert.metric}</span>
                        {alert.value && (
                          <span>Value: {typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value}</span>
                        )}
                        <span>{formatEventTime(alert)}</span>
                      </div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="ml-4 p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                      title="Acknowledge alert"
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
