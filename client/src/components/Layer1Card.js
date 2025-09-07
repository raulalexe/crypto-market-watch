import React, { useState, useEffect } from 'react';
import { Layers, TrendingUp, TrendingDown, DollarSign, BarChart3, ChevronDown, ChevronRight, Activity, Users } from 'lucide-react';
import axios from 'axios';

const Layer1Card = () => {
  const [layer1Data, setLayer1Data] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedChains, setExpandedChains] = useState({});

  useEffect(() => {
    fetchLayer1Data();
  }, []);

  const fetchLayer1Data = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/layer1-data');
      setLayer1Data(response.data);
    } catch (error) {
      console.error('Error fetching Layer 1 data:', error);
      setError('Failed to load Layer 1 data');
    } finally {
      setLoading(false);
    }
  };

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
  if (!layer1Data || !layer1Data.chains || layer1Data.chains.length === 0) {
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
      <div className="flex items-center space-x-3 mb-6">
        <Layers className="w-6 h-6 text-crypto-blue" />
        <h3 className="text-lg font-semibold text-white">Layer 1 Blockchains</h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">Total Market Cap</h4>
            <DollarSign className="w-4 h-4 text-crypto-green" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(data.total_market_cap)}
          </div>
          <div className="text-xs text-slate-400">
            {data.chains.length} chains
          </div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">24h Volume</h4>
            <BarChart3 className="w-4 h-4 text-crypto-blue" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(data.total_volume_24h)}
          </div>
          <div className="text-xs text-slate-400">
            Combined volume
          </div>
        </div>

        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">Avg 24h Change</h4>
            {getChangeIcon(data.avg_change_24h)}
          </div>
          <div className={`text-2xl font-bold ${getChangeColor(data.avg_change_24h)}`}>
            {formatChange(data.avg_change_24h)}
          </div>
          <div className="text-xs text-slate-400">
            Market average
          </div>
        </div>
      </div>

      {/* Chains List */}
      <div className="space-y-4">
        {data.chains.map((chain) => (
          <div key={chain.id} className="bg-slate-700 rounded-lg border border-slate-600">
            {/* Chain Header */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{chain.symbol}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{chain.name}</h4>
                    <p className="text-sm text-slate-400">{chain.narrative}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {formatCurrency(chain.price)}
                    </div>
                    <div className={`text-sm ${getChangeColor(chain.change_24h)}`}>
                      {formatChange(chain.change_24h)}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleChain(chain.id)}
                    className="text-slate-400 hover:text-white transition-colors"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
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
