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
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatChange = (change) => {
    if (!change) return '0.00%';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  const getChangeColor = (change) => {
    if (!change) return 'text-slate-400';
    return change >= 0 ? 'text-crypto-green' : 'text-crypto-red';
  };

  const getChangeIcon = (change) => {
    if (!change) return null;
    return change >= 0 ? 
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

  // Sample Layer 1 data structure
  const sampleLayer1Data = {
    chains: [
      {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        price: 45000,
        change_24h: 2.5,
        market_cap: 850000000000,
        volume_24h: 25000000000,
        tps: 7,
        active_addresses: 850000,
        hash_rate: 450,
        dominance: 48.5,
        narrative: 'Store of Value',
        sentiment: 'positive'
      },
      {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        price: 2800,
        change_24h: -1.2,
        market_cap: 350000000000,
        volume_24h: 18000000000,
        tps: 15,
        active_addresses: 650000,
        hash_rate: 0,
        dominance: 20.2,
        narrative: 'Smart Contracts',
        sentiment: 'neutral'
      },
      {
        id: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        price: 95,
        change_24h: 8.7,
        market_cap: 45000000000,
        volume_24h: 3500000000,
        tps: 65000,
        active_addresses: 120000,
        hash_rate: 0,
        dominance: 2.8,
        narrative: 'High Performance',
        sentiment: 'positive'
      },
      {
        id: 'cardano',
        name: 'Cardano',
        symbol: 'ADA',
        price: 0.45,
        change_24h: -0.8,
        market_cap: 16000000000,
        volume_24h: 1200000000,
        tps: 250,
        active_addresses: 85000,
        hash_rate: 0,
        dominance: 1.0,
        narrative: 'Academic Research',
        sentiment: 'neutral'
      },
      {
        id: 'polkadot',
        name: 'Polkadot',
        symbol: 'DOT',
        price: 6.8,
        change_24h: 3.2,
        market_cap: 8500000000,
        volume_24h: 800000000,
        tps: 1000,
        active_addresses: 45000,
        hash_rate: 0,
        dominance: 0.5,
        narrative: 'Interoperability',
        sentiment: 'positive'
      }
    ],
    total_market_cap: 1750000000000,
    total_volume_24h: 68000000000,
    avg_change_24h: 2.48
  };

  const data = layer1Data || sampleLayer1Data;

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
                      {chain.tps.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Users className="w-4 h-4 text-crypto-purple" />
                      <span className="text-xs text-slate-400">Active Addresses</span>
                    </div>
                    <div className="text-sm font-medium text-white">
                      {chain.active_addresses.toLocaleString()}
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
