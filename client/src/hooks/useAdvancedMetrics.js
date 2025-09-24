import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import logger from '../utils/logger';
import websocketService from '../services/websocketService';

const useAdvancedMetrics = (options = {}) => {
  const {
    autoFetch = false, // Use props from Dashboard instead of separate API calls
    refreshInterval = null, // Fallback polling interval if WebSocket is not used
    onError = null,
    onSuccess = null
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [isStale, setIsStale] = useState(false);

  // Use refs to stabilize callbacks and prevent infinite loops
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
    onSuccessRef.current = onSuccess;
  }, [onError, onSuccess]);

  const fetchAdvancedMetrics = useCallback(async () => {
    // Don't fetch if already loading
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      // Use advanced metrics endpoint for proper data structure
      const url = '/api/advanced-metrics';

      const response = await axios.get(url, {
        headers: {
          'x-websocket-request': 'true' // Prevent server-side WebSocket broadcasts from API requests
        }
      });
      const metricsData = response.data;


      if (metricsData) {
        // Data is already in the correct format from advanced-metrics endpoint
        setData(metricsData);
        setLastFetch(new Date());
        setIsStale(false); // Reset staleness on successful fetch

        if (onSuccessRef.current) {
          onSuccessRef.current(metricsData);
        }
      } else {
        setData(null);
        setError(new Error('No advanced metrics data available'));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch advanced metrics';
      setError(new Error(errorMessage));
      setData(null);

      logger.error('Error fetching advanced metrics:', err);

      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
    } finally {
      setLoading(false);
    }
  }, [loading]); // Remove onError and onSuccess from dependencies to prevent infinite loops

  // Handle WebSocket dashboard updates
  const handleDashboardUpdate = useCallback((updateData) => {
    const dashboardData = updateData.data;
    if (dashboardData && dashboardData.advancedMetrics) {
      // Use the advanced metrics data directly from dashboard update - no additional API calls
      setData(dashboardData.advancedMetrics);
      setLastFetch(new Date());
      setError(null);
      
      if (onSuccessRef.current) {
        onSuccessRef.current(dashboardData.advancedMetrics);
      }
    }
  }, []); // No dependencies needed since we use dashboard data directly

  // Auto-fetch as fallback when WebSocket is not available
  useEffect(() => {
    if (autoFetch) {
      fetchAdvancedMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Remove fetchAdvancedMetrics from dependencies to prevent infinite loops

  // Set up WebSocket listener for dashboard updates
  useEffect(() => {
    // Only set up listeners if WebSocket is connected
    if (websocketService.isConnectedToServer()) {
      websocketService.on('dashboard_update', handleDashboardUpdate);
      // NO API calls - only listen for WebSocket updates to reduce egress charges
    } else {
      // Listen for connection event to set up dashboard listener
      const handleConnected = () => {
        websocketService.on('dashboard_update', handleDashboardUpdate);
        // NO API calls - only listen for WebSocket updates to reduce egress charges
      };
      websocketService.on('connected', handleConnected);
      
      return () => {
        websocketService.off('connected', handleConnected);
        websocketService.off('dashboard_update', handleDashboardUpdate);
      };
    }

    return () => {
      websocketService.off('dashboard_update', handleDashboardUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove handleDashboardUpdate from dependencies to prevent infinite loops

  // Set up refresh interval if provided (fallback for when WebSocket is not available)
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAdvancedMetrics(); // Force refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval]); // Remove fetchAdvancedMetrics from dependencies to prevent infinite loops

  // Note: Staleness checking removed since refreshInterval is always null for WebSocket-only operation

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAdvancedMetrics();
  }, [fetchAdvancedMetrics]);

  return { data, loading, error, lastFetch, isStale, refresh };
};

export default useAdvancedMetrics;
