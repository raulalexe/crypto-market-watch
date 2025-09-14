import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Building2, Activity, RefreshCw } from 'lucide-react';

const MoneySupplyCard = () => {
  const [moneySupplyData, setMoneySupplyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMoneySupplyData();
  }, []);

  const fetchMoneySupplyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/money-supply');
      
      if (!response.ok) {
        throw new Error('Failed to fetch money supply data');
      }

      const data = await response.json();
      setMoneySupplyData(data);
    } catch (err) {
      console.error('Error fetching money supply data:', err);
      setError('Failed to fetch money supply data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Handle very large numbers (like M3) that might be in different units
    if (value >= 1000000000000) {
      // Values over 1 trillion - convert to trillions
      return `$${(value / 1000000000000).toFixed(1)}T`;
    } else if (value >= 1000000000) {
      // Values over 1 billion - convert to trillions
      return `$${(value / 1000000000).toFixed(1)}T`;
    } else if (value >= 1000000) {
      // Values over 1 million - convert to trillions
      return `$${(value / 1000000).toFixed(1)}T`;
    } else if (value >= 1000) {
      // Values over 1 thousand - convert to billions
      return `$${(value / 1000).toFixed(1)}B`;
    } else if (value >= 1) {
      // Values over 1 - show as billions
      return `$${value.toFixed(1)}B`;
    } else {
      // Values less than 1 - show as billions with more precision
      return `$${value.toFixed(2)}B`;
    }
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-400">Loading money supply data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Money Supply & Bank Reserves</h3>
          <button
            onClick={fetchMoneySupplyData}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">Error loading data</div>
          <div className="text-sm text-slate-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">Money Supply & Bank Reserves</h3>
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
            FRED Data
          </span>
        </div>
        <button
          onClick={fetchMoneySupplyData}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Money Supply Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {/* M1 Money Supply */}
               <div className="bg-slate-700 rounded-lg p-4">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center space-x-2">
                     <DollarSign className="w-4 h-4 text-blue-400" />
                     <h4 className="text-sm font-medium text-slate-300">M1 Money Supply</h4>
                   </div>
                   {getTrendIcon(moneySupplyData?.m1?.change_30d)}
                 </div>
                 <div className="text-xl font-bold text-white mb-1">
                   {formatCurrency(moneySupplyData?.m1?.value)}
                 </div>
                 <div className={`text-xs ${getTrendColor(moneySupplyData?.m1?.change_30d)}`}>
                   {formatPercentage(moneySupplyData?.m1?.change_30d)} (30d)
                 </div>
                 <div className="text-xs text-slate-500 mt-1">
                   {moneySupplyData?.m1?.date ? new Date(moneySupplyData.m1.date).toLocaleDateString() : 'N/A'}
                 </div>
                 <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                   Most liquid money: cash, checking accounts, and traveler's checks. Directly impacts consumer spending and inflation.
                 </div>
               </div>

               {/* M2 Money Supply */}
               <div className="bg-slate-700 rounded-lg p-4">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center space-x-2">
                     <DollarSign className="w-4 h-4 text-green-400" />
                     <h4 className="text-sm font-medium text-slate-300">M2 Money Supply</h4>
                   </div>
                   {getTrendIcon(moneySupplyData?.m2?.change_30d)}
                 </div>
                 <div className="text-xl font-bold text-white mb-1">
                   {formatCurrency(moneySupplyData?.m2?.value)}
                 </div>
                 <div className={`text-xs ${getTrendColor(moneySupplyData?.m2?.change_30d)}`}>
                   {formatPercentage(moneySupplyData?.m2?.change_30d)} (30d)
                 </div>
                 <div className="text-xs text-slate-500 mt-1">
                   {moneySupplyData?.m2?.date ? new Date(moneySupplyData.m2.date).toLocaleDateString() : 'N/A'}
                 </div>
                 <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                   M1 + savings accounts, money market funds, and small time deposits. Broader measure of money supply and economic activity.
                 </div>
               </div>

               {/* M3 Money Supply */}
               <div className="bg-slate-700 rounded-lg p-4">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center space-x-2">
                     <DollarSign className="w-4 h-4 text-purple-400" />
                     <h4 className="text-sm font-medium text-slate-300">M3 Money Supply</h4>
                   </div>
                   {getTrendIcon(moneySupplyData?.m3?.change_30d)}
                 </div>
                 <div className="text-xl font-bold text-white mb-1">
                   {formatCurrency(moneySupplyData?.m3?.value)}
                 </div>
                 <div className={`text-xs ${getTrendColor(moneySupplyData?.m3?.change_30d)}`}>
                   {formatPercentage(moneySupplyData?.m3?.change_30d)} (30d)
                 </div>
                 <div className="text-xs text-slate-500 mt-1">
                   {moneySupplyData?.m3?.date ? new Date(moneySupplyData.m3.date).toLocaleDateString() : 'N/A'}
                 </div>
                 <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                   M2 + large time deposits and institutional money market funds. Comprehensive measure including institutional liquidity.
                 </div>
               </div>

               {/* Bank Reserves */}
               <div className="bg-slate-700 rounded-lg p-4">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center space-x-2">
                     <Building2 className="w-4 h-4 text-yellow-400" />
                     <h4 className="text-sm font-medium text-slate-300">Bank Reserves</h4>
                   </div>
                   {getTrendIcon(moneySupplyData?.bank_reserves?.change_30d)}
                 </div>
                 <div className="text-xl font-bold text-white mb-1">
                   {formatCurrency(moneySupplyData?.bank_reserves?.value)}
                 </div>
                 <div className={`text-xs ${getTrendColor(moneySupplyData?.bank_reserves?.change_30d)}`}>
                   {formatPercentage(moneySupplyData?.bank_reserves?.change_30d)} (30d)
                 </div>
                 <div className="text-xs text-slate-500 mt-1">
                   {moneySupplyData?.bank_reserves?.date ? new Date(moneySupplyData.bank_reserves.date).toLocaleDateString() : 'N/A'}
                 </div>
                 <div className="text-xs text-slate-400 mt-2 leading-relaxed">
                   Cash held by banks at the Federal Reserve. Key indicator of banking system liquidity and lending capacity.
                 </div>
               </div>
      </div>

      {/* Analysis Section */}
      {moneySupplyData?.analysis && (
        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-medium text-slate-300">Liquidity Analysis</h4>
          </div>
          <div className="text-sm text-slate-300">
            <div className="mb-2">
              <span className="font-medium">Liquidity Conditions:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                moneySupplyData.analysis.liquidity_conditions === 'very_loose' ? 'bg-green-900/20 text-green-400' :
                moneySupplyData.analysis.liquidity_conditions === 'loose' ? 'bg-green-800/20 text-green-300' :
                moneySupplyData.analysis.liquidity_conditions === 'neutral' ? 'bg-slate-600/20 text-slate-300' :
                moneySupplyData.analysis.liquidity_conditions === 'tight' ? 'bg-red-800/20 text-red-300' :
                'bg-red-900/20 text-red-400'
              }`}>
                {moneySupplyData.analysis.liquidity_conditions?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-medium">Monetary Policy Stance:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                moneySupplyData.analysis.monetary_policy_stance === 'very_accommodative' ? 'bg-green-900/20 text-green-400' :
                moneySupplyData.analysis.monetary_policy_stance === 'accommodative' ? 'bg-green-800/20 text-green-300' :
                moneySupplyData.analysis.monetary_policy_stance === 'neutral' ? 'bg-slate-600/20 text-slate-300' :
                moneySupplyData.analysis.monetary_policy_stance === 'restrictive' ? 'bg-red-800/20 text-red-300' :
                'bg-red-900/20 text-red-400'
              }`}>
                {moneySupplyData.analysis.monetary_policy_stance?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="text-slate-400 text-xs">
              {moneySupplyData.analysis.description}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-600 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Data from Federal Reserve Economic Data (FRED)
        </div>
        <div className="text-xs text-slate-500">
          Updated: {moneySupplyData?.last_updated ? new Date(moneySupplyData.last_updated).toLocaleString() : 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default MoneySupplyCard;
