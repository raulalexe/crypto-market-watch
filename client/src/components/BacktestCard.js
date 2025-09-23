import React from 'react';
import { BarChart3, Target, TrendingUp, Clock } from 'lucide-react';

const BacktestCard = ({ data: backtestMetrics }) => {
  // Check if we have no data or if it's sample data with no real results
  if (!backtestMetrics || (backtestMetrics.total_predictions === 0 && backtestMetrics.is_sample_data)) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="w-6 h-6 text-crypto-blue" />
          <h3 className="text-lg font-semibold text-white">Backtest Performance</h3>
        </div>
        
        <div className="text-center py-8">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-12 h-12 text-crypto-blue/50" />
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">Coming Soon</h4>
          <p className="text-slate-400 max-w-md mx-auto">
            We're working on advanced backtesting features to show AI prediction performance and accuracy metrics.
          </p>
        </div>
      </div>
    );
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'text-crypto-green';
    if (accuracy >= 60) return 'text-crypto-yellow';
    return 'text-crypto-red';
  };

  const getCorrelationColor = (correlation) => {
    if (correlation >= 70) return 'text-crypto-green';
    if (correlation >= 50) return 'text-crypto-yellow';
    return 'text-crypto-red';
  };

  // Check if we have data but no successful predictions yet
  const hasNoSuccessfulPredictions = backtestMetrics.total_predictions > 0 && backtestMetrics.overall_accuracy === 0;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-6 h-6 text-crypto-blue" />
        <h3 className="text-lg font-semibold text-white">Backtest Performance</h3>
      </div>

      {/* Show special message if we have predictions but no successful ones yet */}
      {hasNoSuccessfulPredictions && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h4 className="text-yellow-400 font-medium">Building Prediction History</h4>
          </div>
          <p className="text-yellow-300 text-sm">
            We have {backtestMetrics.total_predictions} predictions in our system. As more time passes and we collect more data, 
            the accuracy metrics will become more meaningful. Check back later for improved performance metrics.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Overall Accuracy */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-crypto-blue" />
            <span className="text-sm font-medium text-slate-400">Overall Accuracy</span>
          </div>
          <div className={`text-3xl font-bold ${getAccuracyColor(backtestMetrics.overall_accuracy)}`}>
            {backtestMetrics.overall_accuracy}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {backtestMetrics.total_predictions} predictions
          </p>
        </div>

        {/* Average Correlation */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-crypto-blue" />
            <span className="text-sm font-medium text-slate-400">Avg Correlation</span>
          </div>
          <div className={`text-3xl font-bold ${getCorrelationColor(backtestMetrics.average_correlation)}`}>
            {backtestMetrics.average_correlation}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Price movement correlation
          </p>
        </div>

        {/* Total Predictions */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <BarChart3 className="w-5 h-5 text-crypto-blue" />
            <span className="text-sm font-medium text-slate-400">Total Tests</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {backtestMetrics.total_predictions}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical predictions
          </p>
        </div>
      </div>

      {/* Performance by Asset */}
      {backtestMetrics.by_symbol && Object.keys(backtestMetrics.by_symbol).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-4">Performance by Asset</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(backtestMetrics.by_symbol).map(([symbol, metrics]) => (
              <div key={symbol} className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-white">{symbol}</h5>
                  <span className="text-xs text-slate-400">
                    {metrics.totalPredictions} tests
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Accuracy:</span>
                    <span className={getAccuracyColor(metrics.accuracy)}>
                      {metrics.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Correlation:</span>
                    <span className={getCorrelationColor(metrics.avgCorrelation)}>
                      {metrics.avgCorrelation.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {backtestMetrics.recent_results && backtestMetrics.recent_results.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-400 mb-4">Recent Results</h4>
          <div className="space-y-2">
            {backtestMetrics.recent_results.slice(0, 5).map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-white">{result.crypto_symbol}</span>
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.predicted_direction === 'BULLISH' 
                        ? 'bg-green-900/30 text-crypto-green' 
                        : 'bg-red-900/30 text-crypto-red'
                    }`}>
                      {result.predicted_direction}
                    </span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.actual_direction === 'BULLISH' 
                        ? 'bg-green-900/30 text-crypto-green' 
                        : 'bg-red-900/30 text-crypto-red'
                    }`}>
                      {result.actual_direction}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    result.accuracy === 100 ? 'text-crypto-green' : 'text-crypto-red'
                  }`}>
                    {result.accuracy === 100 ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {result.correlation_score}% correlation
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestCard;