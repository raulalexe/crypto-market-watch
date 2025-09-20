import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import websocketService from '../services/websocketService';

const WebSocketMaintenanceScreen = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [disconnectedTime, setDisconnectedTime] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastConnectedTime, setLastConnectedTime] = useState(Date.now());

  useEffect(() => {
    let maintenanceTimer;
    let reconnectCheckInterval;

    const checkConnectionStatus = () => {
      const isConnected = websocketService.isConnectedToServer();
      const connectionState = websocketService.getConnectionState();
      
      setReconnectAttempts(connectionState.reconnectAttempts);

      if (!isConnected) {
        if (!disconnectedTime) {
          setDisconnectedTime(Date.now());
        }
        
        // Show maintenance screen if disconnected for more than 60 seconds
        const timeDisconnected = Date.now() - (disconnectedTime || Date.now());
        if (timeDisconnected > 60000) { // 60 seconds
          setIsMaintenanceMode(true);
        }
      } else {
        // Connected - reset maintenance mode
        setIsMaintenanceMode(false);
        setDisconnectedTime(null);
        setLastConnectedTime(Date.now());
      }
    };

    // Check connection status immediately
    checkConnectionStatus();

    // Check every 5 seconds
    reconnectCheckInterval = setInterval(checkConnectionStatus, 5000);

    // Listen for websocket events
    const handleConnect = () => {
      setIsMaintenanceMode(false);
      setDisconnectedTime(null);
      setLastConnectedTime(Date.now());
    };

    const handleDisconnect = () => {
      setDisconnectedTime(Date.now());
    };

    // Add event listeners if websocket service supports them
    if (websocketService.socket) {
      websocketService.socket.on('connect', handleConnect);
      websocketService.socket.on('disconnect', handleDisconnect);
    }

    return () => {
      if (reconnectCheckInterval) {
        clearInterval(reconnectCheckInterval);
      }
      if (maintenanceTimer) {
        clearTimeout(maintenanceTimer);
      }
      if (websocketService.socket) {
        websocketService.socket.off('connect', handleConnect);
        websocketService.socket.off('disconnect', handleDisconnect);
      }
    };
  }, [disconnectedTime]);

  const handleRetryConnection = () => {
    // Force a reconnection attempt
    if (websocketService.socket) {
      websocketService.socket.connect();
    }
  };

  const getDisconnectedDuration = () => {
    if (!disconnectedTime) return '0s';
    const seconds = Math.floor((Date.now() - disconnectedTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (!isMaintenanceMode) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/50">
          {/* Maintenance Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center">
              <WifiOff className="w-12 h-12 text-orange-400" />
            </div>
          </div>

          {/* Maintenance Message */}
          <h1 className="text-2xl font-bold text-white mb-4">
            Connection Issues
          </h1>
          
          <p className="text-slate-300 mb-6">
            We're experiencing connectivity issues with our real-time data service. 
            Some features may be temporarily unavailable.
          </p>

          {/* Status Information */}
          <div className="bg-slate-700/30 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-400 font-medium">Disconnected</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Disconnected for:</span>
              <span className="text-white font-medium">{getDisconnectedDuration()}</span>
            </div>
            
            {reconnectAttempts > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reconnect attempts:</span>
                <span className="text-white font-medium">{reconnectAttempts}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetryConnection}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-slate-400 text-xs">
                  <strong>What's happening?</strong> Our real-time data service is temporarily unavailable. 
                  This affects live price updates, alerts, and some dashboard features.
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  <strong>What you can do:</strong> Try refreshing the page or check back in a few minutes. 
                  Historical data and basic features remain available.
                </p>
              </div>
            </div>
          </div>

          {/* Last Connected Info */}
          {lastConnectedTime && (
            <div className="mt-4 text-xs text-slate-500">
              Last connected: {new Date(lastConnectedTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketMaintenanceScreen;
