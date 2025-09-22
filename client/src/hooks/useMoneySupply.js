import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import logger from '../utils/logger';
import websocketService from '../services/websocketService';

const useMoneySupply = (options = {}) => {
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

  const fetchMoneySupply = useCallback(async (forceRefresh = false) => {
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
        // Extract money supply data from the dashboard response
        const moneySupplyData = dashboardData.moneySupplyData;

        setData(moneySupplyData);
        setLastFetch(new Date());
        setIsStale(false); // Reset staleness on successful fetch

        if (onSuccess) {
          onSuccess(moneySupplyData);
        }
      } else {
        setData(null);
        setError(new Error('No money supply data available'));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch money supply data';
      setError(new Error(errorMessage));
      setData(null);

      logger.error('Error fetching money supply data:', err);

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
      // Extract money supply data from the dashboard response
      const moneySupplyData = dashboardData.moneySupplyData;

      setData(moneySupplyData);
      setLastFetch(new Date());
      setError(null); // Clear any previous errors

      if (onSuccess) {
        onSuccess(moneySupplyData);
      }
    }
  }, [onSuccess]);

  // Skip auto-fetch - rely on WebSocket updates only
  // useEffect(() => {
  //   if (autoFetch) {
  //     fetchMoneySupply();
  //   }
  // }, [autoFetch, fetchMoneySupply]);

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
        fetchMoneySupply(true); // Force refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchMoneySupply]);

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
    fetchMoneySupply(true);
  }, [fetchMoneySupply]);

  return { data, loading, error, lastFetch, isStale, refresh };
};

export default useMoneySupply;
