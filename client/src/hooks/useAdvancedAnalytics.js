import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import logger from '../utils/logger';
import websocketService from '../services/websocketService';

  const useAdvancedAnalytics = (options = {}) => {
    const {
      autoFetch = false, // Disabled to reduce API calls and egress charges
      refreshInterval = null, // Disabled to reduce API calls and egress charges
      onError = null,
      onSuccess = null
    } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [isStale, setIsStale] = useState(false);
  
  // Use refs to store stable references to callbacks
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);
  
  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
    onSuccessRef.current = onSuccess;
  }, [onError, onSuccess]);

  const fetchAnalyticsData = useCallback(async () => {
    // Don't fetch if already loading
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      // Use standard endpoint - WebSocket handles real-time updates
      const url = '/api/dashboard';

      const response = await axios.get(url, {
        headers: {
          'x-websocket-request': 'true' // Prevent server from broadcasting WebSocket updates
        }
      });
      const dashboardData = response.data;
      

      if (dashboardData) {
        // Extract all the analytics data from the dashboard response
        const analyticsData = {
          marketData: dashboardData.marketData,
          backtestData: dashboardData.backtestResults,
          correlationData: dashboardData.correlationData,
          advancedMetrics: dashboardData.advancedMetrics,
          marketSentiment: dashboardData.marketSentiment,
          derivativesData: dashboardData.derivativesData,
          onchainData: dashboardData.onchainData,
          moneySupplyData: dashboardData.moneySupplyData,
          layer1Data: dashboardData.layer1Data,
          inflationData: dashboardData.inflationData,
          fearGreed: dashboardData.fearGreed,
          trendingNarratives: dashboardData.trendingNarratives,
          upcomingEvents: dashboardData.upcomingEvents,
          aiAnalysis: dashboardData.aiAnalysis
        };

        setData(analyticsData);
        setLastFetch(new Date());
        setIsStale(false); // Reset staleness on successful fetch

        if (onSuccessRef.current) {
          onSuccessRef.current(analyticsData);
        }
      } else {
        setData(null);
        setError(new Error('No analytics data available'));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch analytics data';
      setError(new Error(errorMessage));
      setData(null);

      logger.error('Error fetching analytics data:', err);

      if (onErrorRef.current) {
        onErrorRef.current(err);
      }
    } finally {
      setLoading(false);
    }
  }, [loading]); // Remove onError and onSuccess from dependencies to prevent infinite loop

  // Handle WebSocket dashboard updates
  const handleDashboardUpdate = useCallback((updateData) => {
    const dashboardData = updateData.data;
    
    
    if (dashboardData) {
      // Extract all the analytics data from the dashboard response
      const analyticsData = {
        marketData: dashboardData.marketData,
        backtestData: dashboardData.backtestResults,
        correlationData: dashboardData.correlationData,
        advancedMetrics: dashboardData.advancedMetrics,
        marketSentiment: dashboardData.marketSentiment,
        derivativesData: dashboardData.derivativesData,
        onchainData: dashboardData.onchainData,
        moneySupplyData: dashboardData.moneySupplyData,
        layer1Data: dashboardData.layer1Data,
        inflationData: dashboardData.inflationData,
        fearGreed: dashboardData.fearGreed,
        trendingNarratives: dashboardData.trendingNarratives,
        upcomingEvents: dashboardData.upcomingEvents,
        aiAnalysis: dashboardData.aiAnalysis
      };

      setData(analyticsData);
      setLastFetch(new Date());
      setError(null); // Clear any previous errors

      if (onSuccessRef.current) {
        onSuccessRef.current(analyticsData);
      }
    }
  }, []); // Remove onSuccess from dependencies to prevent infinite loop

  // Auto-fetch as fallback when WebSocket is not available
  useEffect(() => {
    if (autoFetch) {
      fetchAnalyticsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Remove fetchAnalyticsData from dependencies to prevent infinite loop

  // Set up WebSocket listener for dashboard updates
  useEffect(() => {
    const setupWebSocketListener = () => {
      websocketService.on('dashboard_update', handleDashboardUpdate);
      // NO API calls - only listen for WebSocket updates to reduce egress charges
    };

    // Set up listener immediately if already connected
    if (websocketService.isConnectedToServer()) {
      setupWebSocketListener();
    }

    // Also listen for connection events to set up listener when connection is established
    websocketService.on('connected', setupWebSocketListener);

    return () => {
      websocketService.off('dashboard_update', handleDashboardUpdate);
      websocketService.off('connected', setupWebSocketListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove handleDashboardUpdate from dependencies to prevent infinite loop

  // Set up refresh interval if provided (fallback for when WebSocket is not available)
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAnalyticsData(); // Force refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval]); // Remove fetchAnalyticsData from dependencies to prevent infinite loop

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
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove fetchAnalyticsData from dependencies to prevent infinite loop

  return { data, loading, error, lastFetch, isStale, refresh };
};

export default useAdvancedAnalytics;
