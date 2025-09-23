import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import logger from '../utils/logger';
import websocketService from '../services/websocketService';

const useAdvancedMetrics = (options = {}) => {
  const {
    autoFetch = false, // Changed to false - only fetch on WebSocket connection
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

  const fetchAdvancedMetrics = useCallback(async (forceRefresh = false) => {
    // Don't fetch if already loading unless forced
    if (loading && !forceRefresh) return;

    try {
      setLoading(true);
      setError(null);

      // Add cache busting parameter if forced refresh
      const url = forceRefresh ? `/api/dashboard?t=${Date.now()}` : '/api/dashboard';

      const response = await axios.get(url, {
        headers: {
          'x-websocket-request': 'true' // Prevent server-side WebSocket broadcasts from API requests
        }
      });
      const dashboardData = response.data;


      if (dashboardData) {
        // Extract advanced metrics data from the dashboard response
        const advancedMetricsData = {
          metrics: dashboardData.advancedMetrics,
          trendingNarratives: dashboardData.trendingNarratives || []
        };

        setData(advancedMetricsData);
        setLastFetch(new Date());
        setIsStale(false); // Reset staleness on successful fetch

        if (onSuccessRef.current) {
          onSuccessRef.current(advancedMetricsData);
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
    if (dashboardData) {
      // Extract advanced metrics data from the dashboard response
      const advancedMetricsData = {
        metrics: dashboardData.advancedMetrics,
        trendingNarratives: dashboardData.trendingNarratives || []
      };


      setData(advancedMetricsData);
      setLastFetch(new Date());
      setError(null); // Clear any previous errors

      if (onSuccessRef.current) {
        onSuccessRef.current(advancedMetricsData);
      }
    }
  }, []); // Remove onSuccess from dependencies to prevent infinite loops

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
      // Fetch data when WebSocket connects (this is the only time we should fetch)
      fetchAdvancedMetrics();
    } else {
      // Listen for connection event to set up dashboard listener
      const handleConnected = () => {
        websocketService.on('dashboard_update', handleDashboardUpdate);
        // Fetch data when WebSocket connects (this is the only time we should fetch)
        fetchAdvancedMetrics();
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
        fetchAdvancedMetrics(true); // Force refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval]); // Remove fetchAdvancedMetrics from dependencies to prevent infinite loops

  // Check for data staleness
  useEffect(() => {
    if (lastFetch && refreshInterval) {
      const intervalId = setInterval(() => {
        const now = new Date();
        const timeElapsed = now.getTime() - lastFetch.getTime();
        if (timeElapsed > refreshInterval) {
          setIsStale(true);
        } else {
          setIsStale(false);
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(intervalId);
    }
  }, [lastFetch, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAdvancedMetrics(true);
  }, [fetchAdvancedMetrics]);

  return { data, loading, error, lastFetch, isStale, refresh };
};

export default useAdvancedMetrics;
