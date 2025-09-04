import React, { useState } from 'react';
import { Database, RefreshCw, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import moment from 'moment';

/**
 * DataCollectionCard - Admin-only component for triggering manual data collection
 * This component should only be rendered for users with admin subscription plan
 */
const DataCollectionCard = ({ lastCollectionTime, onCollectData, expanded = false, onToggleExpanded }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState({
    marketData: true,
    aiAnalysis: true,
    backtestResults: true
  });

  const handleCollectData = async () => {
    setIsCollecting(true);
    setCollectionStatus({
      marketData: false,
      aiAnalysis: false,
      backtestResults: false
    });

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/collect-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Simulate collection progress
        setTimeout(() => setCollectionStatus(prev => ({ ...prev, marketData: true })), 2000);
        setTimeout(() => setCollectionStatus(prev => ({ ...prev, aiAnalysis: true })), 4000);
        setTimeout(() => setCollectionStatus(prev => ({ ...prev, backtestResults: true })), 6000);
        
        if (onCollectData) {
          setTimeout(() => onCollectData(), 7000);
        }
      } else {
        throw new Error('Failed to trigger data collection');
      }
    } catch (error) {
      console.error('Error collecting data:', error);
      setCollectionStatus({
        marketData: false,
        aiAnalysis: false,
        backtestResults: false
      });
    } finally {
      setTimeout(() => setIsCollecting(false), 7000);
    }
  };

  const getStatusIcon = (status) => {
    if (status) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    if (isCollecting) {
      return <RefreshCw className="w-6 h-6 text-crypto-blue animate-spin" />;
    }
    return <AlertCircle className="w-6 h-6 text-red-500" />;
  };

  const getNextCollectionTime = () => {
    const lastCollection = moment(lastCollectionTime);
    const nextCollection = lastCollection.add(30, 'minutes');
    return nextCollection.format('h:mm A');
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header - Always visible */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-crypto-blue" />
            <h3 className="text-lg font-semibold text-white">Data Collection</h3>
            <button
              onClick={onToggleExpanded}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex flex-col md:flex-row items-center space-x-3">
            <span className="text-sm mb-4 mt-2 sm:mb-0 sm:mt-0 text-gray-400">
              Last: {lastCollectionTime 
                ? moment(lastCollectionTime).format('MMM Do, h:mm A')
                : 'Never'
              }
            </span>
            <button
              onClick={handleCollectData}
              disabled={isCollecting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2 ${
                isCollecting
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-crypto-blue hover:bg-blue-600 text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isCollecting ? 'animate-spin' : ''}`} />
              <span>{isCollecting ? 'Collecting...' : 'Collect Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {expanded && (
        <div className="p-6">
          {/* Last Collection Time */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Last Collection</span>
            </div>
            <p className="text-white font-medium">
              {lastCollectionTime 
                ? moment(lastCollectionTime).format('MMM Do YYYY, h:mm A')
                : 'Never'
              }
            </p>
          </div>

          {/* Collection Status */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Collection Status</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(collectionStatus.marketData)}
                  <div>
                    <p className="text-white font-medium">Market Data</p>
                    <p className="text-xs text-gray-400">Crypto prices, market metrics</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  collectionStatus.marketData 
                    ? 'bg-green-900 text-green-300' 
                    : isCollecting 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-red-900 text-red-300'
                }`}>
                  {collectionStatus.marketData ? 'Complete' : isCollecting ? 'Collecting...' : 'Failed'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(collectionStatus.aiAnalysis)}
                  <div>
                    <p className="text-white font-medium">AI Analysis</p>
                    <p className="text-xs text-gray-400">Market predictions & insights</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  collectionStatus.aiAnalysis 
                    ? 'bg-green-900 text-green-300' 
                    : isCollecting 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-red-900 text-red-300'
                }`}>
                  {collectionStatus.aiAnalysis ? 'Complete' : isCollecting ? 'Collecting...' : 'Failed'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(collectionStatus.backtestResults)}
                  <div>
                    <p className="text-white font-medium">Backtest Results</p>
                    <p className="text-xs text-gray-400">Strategy performance analysis</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  collectionStatus.backtestResults 
                    ? 'bg-green-900 text-green-300' 
                    : isCollecting 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-red-900 text-red-300'
                }`}>
                  {collectionStatus.backtestResults ? 'Complete' : isCollecting ? 'Collecting...' : 'Failed'}
                </span>
              </div>
            </div>
          </div>

          {/* Next Collection */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Next scheduled collection</span>
              <span className="text-sm text-white font-medium">
                {getNextCollectionTime()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Data is automatically collected every 30 minutes
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCollectionCard;
