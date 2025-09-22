import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import logger from '../utils/logger';
import websocketService from '../services/websocketService';

const useAIAnalysis = (options = {}) => {
  const {
    autoFetch = true,
    refreshInterval = null,
    onError = null,
    onSuccess = null
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAIAnalysis = useCallback(async (forceRefresh = false) => {
    // Don't fetch if already loading unless forced
    if (loading && !forceRefresh) return;

    try {
      setLoading(true);
      setError(null);

      // Add cache busting parameter if forced refresh
      const url = forceRefresh ? `/api/dashboard?t=${Date.now()}` : '/api/dashboard';
      
      const response = await axios.get(url);
      const aiAnalysisData = response.data.aiAnalysis;

      if (aiAnalysisData) {
        setData(aiAnalysisData);
        setLastFetch(new Date());
        
        if (onSuccess) {
          onSuccess(aiAnalysisData);
        }
      } else {
        setData(null);
        setError(new Error('No AI analysis data available'));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch AI analysis';
      setError(new Error(errorMessage));
      setData(null);
      
      logger.error('Error fetching AI analysis:', err);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, onError, onSuccess]);

  // Handle WebSocket dashboard updates
  const handleDashboardUpdate = useCallback((updateData) => {
    const aiAnalysisData = updateData.data?.aiAnalysis;
    if (aiAnalysisData) {
      setData(aiAnalysisData);
      setLastFetch(new Date());
      setError(null); // Clear any previous errors
      
      if (onSuccess) {
        onSuccess(aiAnalysisData);
      }
    }
  }, [onSuccess]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAIAnalysis();
    }
  }, [autoFetch, fetchAIAnalysis]);

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
        fetchAIAnalysis(true); // Force refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchAIAnalysis]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAIAnalysis(true);
  }, [fetchAIAnalysis]);

  // Check if data is stale (older than 5 minutes)
  const isStale = useCallback(() => {
    if (!lastFetch) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastFetch < fiveMinutesAgo;
  }, [lastFetch]);

  return {
    data,
    loading,
    error,
    lastFetch,
    isStale: isStale(),
    refresh,
    fetchAIAnalysis
  };
};

export default useAIAnalysis;
