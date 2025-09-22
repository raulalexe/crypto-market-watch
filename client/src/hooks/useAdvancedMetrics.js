import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import logger from '../utils/logger';
import websocketService from '../services/websocketService';

const useAdvancedMetrics = (options = {}) => {
  const {
    autoFetch = true,
    refreshInterval = null, // Fallback polling interval if WebSocket is not used
    onError = null,
    onSuccess = null
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [isStale, setIsStale] = useState(false);

  const fetchAdvancedMetrics = useCallback(async (forceRefresh = false) => {
    // Don't fetch if already loading unless forced
    if (loading && !forceRefresh) return;

    try {
      setLoading(true);
      setError(null);

      // Add cache busting parameter if forced refresh
      const url = forceRefresh ? `/api/dashboard?t=${Date.now()}` : '/api/dashboard';

      const response = await axios.get(url);
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

        if (onSuccess) {
          onSuccess(advancedMetricsData);
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

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, onError, onSuccess]);

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

      if (onSuccess) {
        onSuccess(advancedMetricsData);
      }
    }
  }, [onSuccess]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAdvancedMetrics();
    }
  }, [autoFetch, fetchAdvancedMetrics]);

  // Set up WebSocket listener for dashboard updates
  useEffect(() => {
    websocketService.on('dashboard_update', handleDashboardUpdate);

    return () => {
      websocketService.off('dashboard_update', handleDashboardUpdate);
    };
  }, [handleDashboardUpdate]);

  // Set up refresh interval if provided (fallback for when WebSocket is not available)
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAdvancedMetrics(true); // Force refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchAdvancedMetrics]);

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
