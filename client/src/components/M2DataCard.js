import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Calendar } from 'lucide-react';

const M2DataCard = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle undefined or null data
  if (!data) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">M2 Money Supply</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400">No M2 money supply data available</p>
        </div>
      </div>
    );
  }

  const formatM2Value = (value) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatChange = (change) => {
    if (change === null || change === undefined) return 'N/A';
    return `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
  };

  const getChangeIcon = (change) => {
    if (change === null || change === undefined) return <Minus className="w-4 h-4 text-gray-500" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = (change) => {
    if (change === null || change === undefined) return 'text-gray-400';
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-400';
  };

  const getChangeDescription = (change) => {
    if (change === null || change === undefined) return 'No change data';
    if (change > 2) return 'Significant expansion';
    if (change > 0.5) return 'Moderate expansion';
    if (change > 0) return 'Slight expansion';
    if (change > -0.5) return 'Slight contraction';
    if (change > -2) return 'Moderate contraction';
    return 'Significant contraction';
  };

  const currentValue = data.value || data.metadata?.current_value;
  const monthOverMonthChange = data.metadata?.month_over_month_change;
  const yearOverYearChange = data.metadata?.year_over_year_change;
  const previousValue = data.metadata?.previous_value;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">M2 Money Supply</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Main M2 Value Display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <DollarSign className="w-6 h-6 text-crypto-blue" />
          <span className="text-3xl font-bold text-white">
            {currentValue ? formatM2Value(currentValue) : 'N/A'}
          </span>
        </div>
        <p className="text-gray-400 text-sm">Current M2 Money Stock</p>
      </div>

      {/* Change Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Month-over-Month</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            {getChangeIcon(monthOverMonthChange)}
            <span className={`text-lg font-semibold ${getChangeColor(monthOverMonthChange)}`}>
              {formatChange(monthOverMonthChange)}
            </span>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Year-over-Year</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            {getChangeIcon(yearOverYearChange)}
            <span className={`text-lg font-semibold ${getChangeColor(yearOverYearChange)}`}>
              {formatChange(yearOverYearChange)}
            </span>
          </div>
        </div>
      </div>

      {/* Change Description */}
      <div className="text-center mb-4">
        <p className="text-gray-300 text-sm">
          {getChangeDescription(monthOverMonthChange)}
        </p>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">What is M2 Money Supply?</h4>
              <p className="text-gray-300 text-sm">
                M2 is a measure of the money supply that includes cash, checking deposits, 
                savings deposits, and other near-money equivalents. It's a key indicator 
                of economic liquidity and monetary policy effectiveness.
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Market Impact</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Expansion (>0.5%)</span>
                  <span className="text-green-400">Generally bullish for risk assets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Contraction (<-0.5%)</span>
                  <span className="text-red-400">Generally bearish for risk assets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stable (-0.5% to 0.5%)</span>
                  <span className="text-gray-300">Neutral market conditions</span>
                </div>
              </div>
            </div>

            {previousValue && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Previous Value</h4>
                <p className="text-gray-300 text-sm">
                  Previous M2: {formatM2Value(previousValue)}
                </p>
              </div>
            )}

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Data Source</h4>
              <p className="text-gray-300 text-sm">
                Data provided by the Federal Reserve Economic Data (FRED) service, 
                sourced from the Federal Reserve Bank of St. Louis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default M2DataCard;