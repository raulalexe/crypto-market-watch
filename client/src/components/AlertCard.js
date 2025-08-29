import React, { useState } from 'react';
import { AlertTriangle, Bell, CheckCircle, X, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { shouldShowUpgradePrompt } from '../utils/authUtils';

const AlertCard = ({ alerts = [], onAcknowledge, userData = null }) => {
  const [expanded, setExpanded] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());

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

  const getAlertIcon = (type) => {
    if (type.includes('BULLISH') || type.includes('OUTFLOW') || type.includes('GROWTH')) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (type.includes('BEARISH') || type.includes('INFLOW') || type.includes('DECLINE')) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    } else if (type.includes('DOMINANCE') || type.includes('SSR')) {
      return <Activity className="w-4 h-4 text-blue-400" />;
    } else {
      return <DollarSign className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleAcknowledge = async (alertId) => {
    try {
      if (onAcknowledge) {
        await onAcknowledge(alertId);
      }
      setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !acknowledgedAlerts.has(alert.id));
  const highSeverityCount = unacknowledgedAlerts.filter(alert => alert.severity === 'high').length;
  const mediumSeverityCount = unacknowledgedAlerts.filter(alert => alert.severity === 'medium').length;

  // Show upgrade prompt for users who should see upgrade prompts (but not for admins)
  if (shouldShowUpgradePrompt(userData)) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center space-x-3 mb-4">
          <Bell className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Market Alerts</h3>
          <span className="ml-auto text-xs bg-yellow-600 text-white px-2 py-1 rounded">
            Pro
          </span>
        </div>
        <div className="text-center py-8">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <h4 className="text-white font-medium mb-2">Get Real-Time Market Alerts</h4>
          <p className="text-slate-400 mb-4">
            Stay ahead of market movements with instant notifications for price changes, 
            volume spikes, and market sentiment shifts.
          </p>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>SSR (Stablecoin Supply Ratio) alerts</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Bitcoin dominance changes</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Exchange flow movements</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Stablecoin market cap changes</span>
            </div>
          </div>
          <button className="mt-4 px-6 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center space-x-3 mb-4">
          <Bell className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Market Alerts</h3>
        </div>
        <div className="text-slate-400 text-center py-8">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <p>No active alerts</p>
          <p className="text-sm text-slate-500 mt-1">Market conditions are stable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Market Alerts</h3>
          {unacknowledgedAlerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unacknowledgedAlerts.length}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {highSeverityCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {highSeverityCount} High
            </span>
          )}
          {mediumSeverityCount > 0 && (
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {mediumSeverityCount} Medium
            </span>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {expanded ? <X className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Summary when collapsed */}
      {!expanded && unacknowledgedAlerts.length > 0 && (
        <div className="space-y-2">
          {unacknowledgedAlerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {getSeverityIcon(alert.severity)}
                <span className="text-sm font-medium break-words leading-relaxed">{alert.message}</span>
              </div>
              <span className="text-xs opacity-70 flex-shrink-0 ml-2">{formatTimestamp(alert.timestamp)}</span>
            </div>
          ))}
          {unacknowledgedAlerts.length > 2 && (
            <div className="text-center text-slate-400 text-sm">
              +{unacknowledgedAlerts.length - 2} more alerts
            </div>
          )}
        </div>
      )}

      {/* Expanded alerts list */}
      {expanded && (
        <div className="space-y-3">
          {unacknowledgedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex items-center space-x-2 mt-1">
                    {getAlertIcon(alert.type)}
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1 break-words leading-relaxed">{alert.message}</p>
                    <div className="flex items-center space-x-4 text-xs opacity-70 flex-wrap">
                      <span className="truncate">Type: {alert.type.replace(/_/g, ' ')}</span>
                      <span className="truncate">Metric: {alert.metric}</span>
                      {alert.value && (
                        <span className="truncate">Value: {typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                  <span className="text-xs opacity-70">{formatTimestamp(alert.timestamp)}</span>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="text-green-400 hover:text-green-300 transition-colors"
                    title="Acknowledge alert"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Acknowledged alerts (when expanded) */}
      {expanded && acknowledgedAlerts.size > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <h4 className="text-sm font-medium text-slate-400 mb-2">Acknowledged Alerts</h4>
          <div className="space-y-2">
            {alerts
              .filter(alert => acknowledgedAlerts.has(alert.id))
              .slice(0, 3)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-700/50"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span className="text-xs text-slate-400 break-words leading-relaxed">{alert.message}</span>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{formatTimestamp(alert.timestamp)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCard;
