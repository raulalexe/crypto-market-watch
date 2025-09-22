import React, { useState, useEffect } from 'react';
import { Layers, TrendingUp, TrendingDown, DollarSign, BarChart3, ChevronDown, ChevronRight, Activity, Users, RefreshCw } from 'lucide-react';
import useLayer1Data from '../hooks/useLayer1Data';

const Layer1Card = () => {
  const [expandedChains, setExpandedChains] = useState({});

  // Use the custom hook for layer1 data
  const {
    data: layer1Data,
    loading,
    error,
    lastFetch,
    isStale,
    refresh
  } = useLayer1Data({
    autoFetch: true,
    refreshInterval: 300000, // 5 minutes fallback
    onError: (err) => console.error('Layer1 data error:', err),
    onSuccess: (data) => console.log('Layer1 data updated:', data)
  });

  const toggleChain = (chainId) => {
    setExpandedChains(prev => ({
      ...prev,
      [chainId]: !prev[chainId]
    }));
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if conversion was successful
    if (isNaN(numValue)) return 'N/A';
    
    if (numValue >= 1e9) return `$${(numValue / 1e9).toFixed(2)}B`;
    if (numValue >= 1e6) return `$${(numValue / 1e6).toFixed(2)}M`;
    if (numValue >= 1e3) return `$${(numValue / 1e3).toFixed(2)}K`;
    return `$${numValue.toFixed(2)}`;
  };

  const formatChange = (change) => {
    if (!change) return '0.00%';
    
    // Convert to number if it's a string
    const numChange = typeof change === 'string' ? parseFloat(change) : change;
    
    // Check if conversion was successful
    if (isNaN(numChange)) return '0.00%';
    
    return `${numChange >= 0 ? '+' : ''}${numChange.toFixed(2)}%`;
  };

  const getChangeColor = (change) => {
    if (!change) return 'text-slate-400';
    
    // Convert to number if it's a string
    const numChange = typeof change === 'string' ? parseFloat(change) : change;
    
    // Check if conversion was successful
    if (isNaN(numChange)) return 'text-slate-400';
    
    return numChange >= 0 ? 'text-crypto-green' : 'text-crypto-red';
  };

  const getChangeIcon = (change) => {
    if (!change) return null;
    
    // Convert to number if it's a string
    const numChange = typeof change === 'string' ? parseFloat(change) : change;
    
    // Check if conversion was successful
    if (isNaN(numChange)) return null;
    
    return numChange >= 0 ? 
      <TrendingUp className="w-4 h-4 text-crypto-green" /> : 
      <TrendingDown className="w-4 h-4 text-crypto-red" />;
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Layers className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Layer 1 Blockchains</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded mb-2"></div>
          <div className="h-4 bg-slate-700 rounded mb-2"></div>
          <div className="h-4 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Layers className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Layer 1 Blockchains</h3>
        </div>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // Only use real data - no fallback sample data
  // layer1Data is an array directly from the database
  if (!layer1Data || !Array.isArray(layer1Data) || layer1Data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <Layers className="w-6 h-6 text-crypto-blue" />
          <h2 className="text-xl font-bold text-white">Layer 1 Blockchains</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No real Layer 1 data available</div>
          <div className="text-sm text-gray-500">Data collection is in progress...</div>
        </div>
      </div>
    );
  }

  const data = layer1Data;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Layers className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Layer 1 Blockchains</h3>
        </div>
        <div className="flex items-center space-x-2">
          {lastFetch && (
            <span className="text-xs text-slate-500">
              {lastFetch.toLocaleTimeString()}
              {isStale && <span className="text-yellow-400 ml-1">•</span>}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh layer1 data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">Total Market Cap</h4>
            <DollarSign className="w-4 h-4 text-crypto-green" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(layer1Data.reduce((sum, chain) => sum + (parseFloat(chain.market_cap) || 0), 0))}
          </div>
          <div className="text-xs text-slate-400">
            {layer1Data.length} chains
          </div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">24h Volume</h4>
            <BarChart3 className="w-4 h-4 text-crypto-blue" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(layer1Data.reduce((sum, chain) => sum + (parseFloat(chain.volume_24h) || 0), 0))}
          </div>
          <div className="text-xs text-slate-400">
            Combined volume
          </div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">Avg 24h Change</h4>
            {getChangeIcon(layer1Data.reduce((sum, chain) => sum + (parseFloat(chain.change_24h) || 0), 0) / layer1Data.length)}
          </div>
          <div className={`text-2xl font-bold ${getChangeColor(layer1Data.reduce((sum, chain) => sum + (parseFloat(chain.change_24h) || 0), 0) / layer1Data.length)}`}>
            {formatChange(layer1Data.reduce((sum, chain) => sum + (parseFloat(chain.change_24h) || 0), 0) / layer1Data.length)}
          </div>
          <div className="text-xs text-slate-400">
            Market average
          </div>
        </div>
      </div>

      {/* Chains List */}
      <div className="space-y-4">
        {layer1Data.map((chain) => (
          <div key={chain.id} className="bg-slate-700 rounded-lg border border-slate-600">
            {/* Chain Header */}
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">{chain.symbol}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg font-semibold text-white truncate">{chain.name}</h4>
                    <p className="text-sm text-slate-400 truncate">{chain.narrative}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-bold text-white">
                      {formatCurrency(chain.price)}
                    </div>
                    <div className={`text-sm ${getChangeColor(chain.change_24h)}`}>
                      {formatChange(chain.change_24h)}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChain(chain.id)}
                    className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    {expandedChains[chain.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Details */}
            {expandedChains[chain.id] && (
              <div className="px-4 pb-4 border-t border-slate-600">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <DollarSign className="w-4 h-4 text-crypto-green" />
                      <span className="text-xs text-slate-400">Market Cap</span>
                    </div>
                    <div className="text-sm font-medium text-white">
                      {formatCurrency(chain.market_cap)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {chain.dominance}% dominance
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <BarChart3 className="w-4 h-4 text-crypto-blue" />
                      <span className="text-xs text-slate-400">Volume 24h</span>
                    </div>
                    <div className="text-sm font-medium text-white">
                      {formatCurrency(chain.volume_24h)}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Activity className="w-4 h-4 text-crypto-yellow" />
                      <span className="text-xs text-slate-400">TPS</span>
                    </div>
                    <div className="text-sm font-medium text-white">
                      {typeof chain.tps === 'string' ? parseInt(chain.tps).toLocaleString() : chain.tps.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="w-4 h-4 text-crypto-purple" />
                      <span className="text-xs text-slate-400">Active Addresses</span>
                    </div>
                    <div className="text-sm font-medium text-white">
                      {typeof chain.active_addresses === 'string' ? parseInt(chain.active_addresses).toLocaleString() : chain.active_addresses.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Layer1Card;
