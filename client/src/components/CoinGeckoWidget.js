import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, RefreshCw } from 'lucide-react';

const CoinGeckoWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoins, setSelectedCoins] = useState([
    'bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 
    'polkadot', 'chainlink', 'litecoin', 'bitcoin-cash', 'stellar',
    'uniswap', 'avalanche-2', 'polygon', 'dogecoin', 'shiba-inu',
    'tron', 'monero', 'ethereum-classic', 'vechain'
  ]);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [customCoinId, setCustomCoinId] = useState('');
  const [widgetKey, setWidgetKey] = useState(0);

  // Popular cryptocurrencies for quick selection (Top 100+)
  const popularCoins = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'tether', name: 'Tether', symbol: 'USDT' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC' },
    { id: 'staked-ether', name: 'Staked Ether', symbol: 'STETH' },
    { id: 'xrp', name: 'XRP', symbol: 'XRP' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
    { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
    { id: 'tron', name: 'TRON', symbol: 'TRX' },
    { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
    { id: 'bitcoin-cash', name: 'Bitcoin Cash', symbol: 'BCH' },
    { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
    { id: 'internet-computer', name: 'Internet Computer', symbol: 'ICP' },
    { id: 'uniswap', name: 'Uniswap', symbol: 'UNI' },
    { id: 'ethereum-classic', name: 'Ethereum Classic', symbol: 'ETC' },
    { id: 'stellar', name: 'Stellar', symbol: 'XLM' },
    { id: 'monero', name: 'Monero', symbol: 'XMR' },
    { id: 'aptos', name: 'Aptos', symbol: 'APT' },
    { id: 'hedera-hashgraph', name: 'Hedera', symbol: 'HBAR' },
    { id: 'filecoin', name: 'Filecoin', symbol: 'FIL' },
    { id: 'vechain', name: 'VeChain', symbol: 'VET' },
    { id: 'cronos', name: 'Cronos', symbol: 'CRO' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
    { id: 'optimism', name: 'Optimism', symbol: 'OP' },
    { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB' },
    { id: 'algorand', name: 'Algorand', symbol: 'ALGO' },
    { id: 'the-sandbox', name: 'The Sandbox', symbol: 'SAND' },
    { id: 'decentraland', name: 'Decentraland', symbol: 'MANA' },
    { id: 'axie-infinity', name: 'Axie Infinity', symbol: 'AXS' },
    { id: 'apecoin', name: 'ApeCoin', symbol: 'APE' },
    { id: 'chiliz', name: 'Chiliz', symbol: 'CHZ' },
    { id: 'enjin-coin', name: 'Enjin Coin', symbol: 'ENJ' },
    { id: 'gala', name: 'Gala', symbol: 'GALA' },
    { id: 'immutable-x', name: 'Immutable X', symbol: 'IMX' },
    { id: 'flow', name: 'Flow', symbol: 'FLOW' },
    { id: 'tezos', name: 'Tezos', symbol: 'XTZ' },
    { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM' },
    { id: 'fantom', name: 'Fantom', symbol: 'FTM' },
    { id: 'elrond-erd-2', name: 'MultiversX', symbol: 'EGLD' },
    { id: 'the-graph', name: 'The Graph', symbol: 'GRT' },
    { id: 'maker', name: 'Maker', symbol: 'MKR' },
    { id: 'compound-governance-token', name: 'Compound', symbol: 'COMP' },
    { id: 'aave', name: 'Aave', symbol: 'AAVE' },
    { id: 'sushi', name: 'SushiSwap', symbol: 'SUSHI' },
    { id: 'curve-dao-token', name: 'Curve DAO Token', symbol: 'CRV' },
    { id: 'yearn-finance', name: 'Yearn Finance', symbol: 'YFI' },
    { id: '1inch', name: '1inch', symbol: '1INCH' },
    { id: 'pancakeswap-token', name: 'PancakeSwap', symbol: 'CAKE' },
    { id: 'thorchain', name: 'THORChain', symbol: 'RUNE' },
    { id: 'kava', name: 'Kava', symbol: 'KAVA' },
    { id: 'injective-protocol', name: 'Injective', symbol: 'INJ' },
    { id: 'osmosis', name: 'Osmosis', symbol: 'OSMO' },
    { id: 'juno-network', name: 'Juno Network', symbol: 'JUNO' },
    { id: 'secret', name: 'Secret', symbol: 'SCRT' },
    { id: 'akash-network', name: 'Akash Network', symbol: 'AKT' },
    { id: 'persistence', name: 'Persistence', symbol: 'XPRT' },
    { id: 'regen', name: 'Regen', symbol: 'REGEN' },
    { id: 'sentinel', name: 'Sentinel', symbol: 'DVPN' },
    { id: 'iris-network', name: 'IRISnet', symbol: 'IRIS' },
    { id: 'band-protocol', name: 'Band Protocol', symbol: 'BAND' },
    { id: 'kava-lend', name: 'Kava Lend', symbol: 'HARD' },
    { id: 'kava-swap', name: 'Kava Swap', symbol: 'SWP' },
    { id: 'terra-luna', name: 'Terra Luna Classic', symbol: 'LUNC' },
    { id: 'terra-luna-2', name: 'Terra', symbol: 'LUNA' },
    { id: 'anchor-protocol', name: 'Anchor Protocol', symbol: 'ANC' },
    { id: 'mirror-protocol', name: 'Mirror Protocol', symbol: 'MIR' },
    { id: 'thorchain-erc20', name: 'THORChain (ERC20)', symbol: 'RUNE' },
    { id: 'synthetix-network-token', name: 'Synthetix', symbol: 'SNX' },
    { id: 'uma', name: 'UMA', symbol: 'UMA' },
    { id: 'ren', name: 'Ren', symbol: 'REN' },
    { id: 'kyber-network-crystal', name: 'Kyber Network Crystal', symbol: 'KNC' },
    { id: 'bancor', name: 'Bancor', symbol: 'BNT' },
    { id: '0x', name: '0x Protocol', symbol: 'ZRX' },
    { id: 'loopring', name: 'Loopring', symbol: 'LRC' },
    { id: 'dydx', name: 'dYdX', symbol: 'DYDX' },
    { id: 'perpetual-protocol', name: 'Perpetual Protocol', symbol: 'PERP' },
    { id: 'barnbridge', name: 'BarnBridge', symbol: 'BOND' },
    { id: 'alpha-finance', name: 'Alpha Finance Lab', symbol: 'ALPHA' },
    { id: 'cream-2', name: 'Cream Finance', symbol: 'CREAM' },
    { id: 'harvest-finance', name: 'Harvest Finance', symbol: 'FARM' },
    { id: 'badger-dao', name: 'Badger DAO', symbol: 'BADGER' },
    { id: 'pickle-finance', name: 'Pickle Finance', symbol: 'PICKLE' },
    { id: 'cover-protocol', name: 'Cover Protocol', symbol: 'COVER' },
    { id: 'hegic', name: 'Hegic', symbol: 'HEGIC' },
    { id: 'opyn', name: 'Opyn', symbol: 'OPYN' },
    { id: 'nexus-mutual', name: 'Nexus Mutual', symbol: 'NXM' },
    { id: 'bancor-governance-token', name: 'Bancor Governance Token', symbol: 'VBNT' },
    { id: 'bancor-v2', name: 'Bancor v2', symbol: 'VBNT' },
    { id: 'bancor-v3', name: 'Bancor v3', symbol: 'VBNT' },
    { id: 'balancer', name: 'Balancer', symbol: 'BAL' },
    { id: 'gnosis', name: 'Gnosis', symbol: 'GNO' },
    { id: 'augur', name: 'Augur', symbol: 'REP' },
    { id: 'augur-v2', name: 'Augur v2', symbol: 'REPv2' },
    { id: 'polymath', name: 'Polymath', symbol: 'POLY' },
    { id: 'polymath-network', name: 'Polymath Network', symbol: 'POLY' },
    { id: 'polymath-v2', name: 'Polymath v2', symbol: 'POLY' },
    { id: 'polymath-v3', name: 'Polymath v3', symbol: 'POLY' },
    { id: 'polymath-v4', name: 'Polymath v4', symbol: 'POLY' },
    { id: 'polymath-v5', name: 'Polymath v5', symbol: 'POLY' }
  ];

  // Filter coins based on search term
  const filteredCoins = popularCoins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const forceWidgetUpdate = () => {
    setWidgetKey(prev => prev + 1);
  };


  const toggleCoin = (coinId) => {
    setSelectedCoins(prev => {
      const newCoins = prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId];
      // Force widget update after state change
      setTimeout(() => forceWidgetUpdate(), 100);
      return newCoins;
    });
  };

  const resetToDefault = () => {
    setSelectedCoins([
      'bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 
      'polkadot', 'chainlink', 'litecoin', 'bitcoin-cash', 'stellar',
      'uniswap', 'avalanche-2', 'polygon', 'dogecoin', 'shiba-inu',
      'tron', 'monero', 'ethereum-classic', 'vechain'
    ]);
    setSearchTerm('');
    setCustomCoinId('');
    setTimeout(() => forceWidgetUpdate(), 100);
  };

  const addCustomCoin = () => {
    if (customCoinId.trim() && !selectedCoins.includes(customCoinId.trim())) {
      setSelectedCoins(prev => [...prev, customCoinId.trim()]);
      setCustomCoinId('');
      setTimeout(() => forceWidgetUpdate(), 100);
    }
  };

  const removeCoin = (coinId) => {
    setSelectedCoins(prev => prev.filter(id => id !== coinId));
    setTimeout(() => forceWidgetUpdate(), 100);
  };

  // Load CoinGecko widget script
  useEffect(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="gecko-coin-list-widget"]')) {
      setWidgetLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://widgets.coingecko.com/gecko-coin-list-widget.js';
    script.async = true;
    script.onload = () => {
      console.log('CoinGecko coin list widget script loaded');
      setWidgetLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load CoinGecko widget script');
      setWidgetLoaded(true); // Set to true anyway to show fallback
    };
    document.head.appendChild(script);

    // Fallback timeout
    const timeout = setTimeout(() => {
      console.log('CoinGecko widget script timeout');
      setWidgetLoaded(true);
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(timeout);
      // Don't remove script on unmount as it might be used by other components
    };
  }, []);


  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">Live Crypto Prices</h3>
          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
            Powered by CoinGecko
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetToDefault}
            className="text-slate-400 hover:text-white transition-colors"
            title="Reset to default coins"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Search and Selection */}
      {isExpanded && (
        <div className="mb-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Coin Selection */}
          <div className="max-h-40 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredCoins.map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => toggleCoin(coin.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    selectedCoins.includes(coin.id)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{coin.symbol}</span>
                    <span className="text-xs text-slate-400">{coin.name}</span>
                  </div>
                  {selectedCoins.includes(coin.id) && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Add Custom Coin */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Add Custom Coin</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter CoinGecko coin ID (e.g., bitcoin, ethereum)"
                value={customCoinId}
                onChange={(e) => setCustomCoinId(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && addCustomCoin()}
              />
              <button
                onClick={addCustomCoin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Find coin IDs at <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">CoinGecko.com</a>
            </p>
          </div>

          {/* Selected Coins Display */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-300">
              Selected Coins ({selectedCoins.length}): {selectedCoins.join(', ')}
            </div>
            <div className="max-h-32 overflow-y-auto bg-slate-700 rounded-lg p-2">
              <div className="flex flex-wrap gap-1">
                {selectedCoins.map((coinId) => (
                  <span
                    key={coinId}
                    className="inline-flex items-center px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs"
                  >
                    {coinId}
                    <button
                      onClick={() => removeCoin(coinId)}
                      className="ml-1 text-slate-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CoinGecko Widget */}
      <div className="relative">
        {!widgetLoaded ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-slate-400">Loading widget...</span>
          </div>
        ) : (
          <div className="bg-slate-700 rounded-lg overflow-hidden">
            <div className="max-h-[70vh] md:max-h-96 overflow-y-auto">
              {selectedCoins.length > 0 ? (
                <gecko-coin-list-widget 
                  key={widgetKey}
                  locale="en" 
                  dark-mode="true" 
                  outlined="true" 
                  coin-ids={selectedCoins.join(',')}
                  initial-currency="usd"
                  height="600"
                  width="100%"
                ></gecko-coin-list-widget>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-slate-400 mb-2">No coins selected</div>
                    <div className="text-xs text-slate-500">Click the + button to add cryptocurrencies</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-600 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Data provided by</span>
          <a
            href="https://www.coingecko.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>CoinGecko</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="text-xs text-slate-500 text-right sm:text-left">
          Updates every 30 seconds • Widget may take a moment to refresh when coins are changed
        </div>
      </div>
    </div>
  );
};

export default CoinGeckoWidget;
