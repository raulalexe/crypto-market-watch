import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Bell, CheckCircle, X, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { shouldShowUpgradePrompt } from '../utils/authUtils';

const AlertPopup = ({ isOpen, onClose, alerts = [], onAcknowledge, unreadCount = 0, isAuthenticated = false }) => {
  const popupRef = useRef(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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
    if (onAcknowledge) {
      await onAcknowledge(alertId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16">
      <div className="bg-black bg-opacity-25 absolute inset-0" />
      <div
        ref={popupRef}
        className="relative bg-slate-800 border border-slate-600 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-600">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-crypto-blue" />
            <h3 className="text-lg font-semibold text-white">Market Alerts</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="max-h-80 overflow-y-auto">
          {shouldShowUpgradePrompt({ isAuthenticated }) ? (
            <div className="p-6 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-crypto-blue" />
              <h3 className="text-white font-medium mb-2">Get Real-Time Market Alerts</h3>
              <p className="text-slate-400 mb-4">
                Stay ahead of market movements with instant notifications for price changes, 
                volume spikes, and market sentiment shifts.
              </p>
              <div className="space-y-2 text-sm text-slate-400 mb-4">
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
              <button className="px-6 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors">
                Upgrade to Pro
              </button>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              <p className="text-slate-400">No alerts</p>
              <p className="text-sm text-slate-500 mt-1">Market conditions are stable</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <div className="flex items-center space-x-1 mt-1">
                        {getAlertIcon(alert.type)}
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1 break-words leading-relaxed">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="truncate">{alert.type.replace(/_/g, ' ')}</span>
                          <span className="flex-shrink-0 ml-2">{formatTimestamp(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="ml-2 p-1 text-green-400 hover:text-green-300 transition-colors"
                        title="Acknowledge alert"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="p-3 border-t border-slate-600 bg-slate-700/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{alerts.length} total alerts</span>
              <span>{unreadCount} unread</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertPopup;
