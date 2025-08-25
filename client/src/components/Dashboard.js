import React from 'react';
import moment from 'moment';
import MarketDataCard from './MarketDataCard';
import AIAnalysisCard from './AIAnalysisCard';
import CryptoPricesCard from './CryptoPricesCard';
import FearGreedCard from './FearGreedCard';
import NarrativesCard from './NarrativesCard';
import BacktestCard from './BacktestCard';
import SubscriptionCard from './SubscriptionCard';
import DataCollectionCard from './DataCollectionCard';
import AdvancedMetricsCard from './AdvancedMetricsCard';
import LoadingSpinner from './LoadingSpinner';

const Dashboard = ({ data, loading, error, onRefresh, onCollectData }) => {
  if (loading && !data) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-crypto-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-slate-300 text-lg">No data available</p>
      </div>
    );
  }

  const { marketData, analysis, cryptoPrices, fearGreed, narratives, backtestMetrics, subscriptionStatus, timestamp } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Market Dashboard</h1>
          <p className="text-slate-400">
            Last updated: {moment(timestamp).format('MMMM Do YYYY, h:mm:ss A')}
          </p>
        </div>
        
        {loading && (
          <div className="flex items-center space-x-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-crypto-blue border-t-transparent rounded-full animate-spin"></div>
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Data Collection Card */}
      <DataCollectionCard 
        onCollectData={onCollectData}
        loading={loading}
        lastCollectionTime={timestamp}
      />

      {/* AI Analysis Section */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIAnalysisCard analysis={analysis} />
          <FearGreedCard fearGreed={fearGreed} />
        </div>
      )}

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketData && (
          <>
            <MarketDataCard
              title="DXY Index"
              value={marketData.dxy}
              format="number"
              trend="neutral"
              description="US Dollar Strength"
            />
            <MarketDataCard
              title="2Y Treasury"
              value={marketData.treasury_2y}
              format="percentage"
              trend="neutral"
              description="2-Year Yield"
            />
            <MarketDataCard
              title="10Y Treasury"
              value={marketData.treasury_10y}
              format="percentage"
              trend="neutral"
              description="10-Year Yield"
            />
            <MarketDataCard
              title="VIX"
              value={marketData.vix}
              format="number"
              trend={marketData.vix > 25 ? "up" : "down"}
              description="Volatility Index"
            />
          </>
        )}
      </div>

      {/* Equity Markets */}
      {marketData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MarketDataCard
            title="S&P 500"
            value={marketData.sp500}
            format="currency"
            trend="neutral"
            description="S&P 500 Index"
          />
          <MarketDataCard
            title="NASDAQ"
            value={marketData.nasdaq}
            format="currency"
            trend="neutral"
            description="NASDAQ Index"
          />
        </div>
      )}

      {/* Crypto Prices */}
      {cryptoPrices && (
        <CryptoPricesCard cryptoPrices={cryptoPrices} />
      )}

      {/* Advanced Metrics */}
      <AdvancedMetricsCard />

      {/* Trending Narratives */}
      {narratives && narratives.length > 0 && (
        <NarrativesCard narratives={narratives} />
      )}

      {/* Backtest Results */}
      {backtestMetrics && (
        <BacktestCard backtestMetrics={backtestMetrics} />
      )}

      {/* Subscription Plans */}
      <SubscriptionCard 
        subscriptionStatus={subscriptionStatus}
        onSubscriptionUpdate={onRefresh}
      />

      {/* Data Collection Status */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Data Collection Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-crypto-green">✓</div>
            <p className="text-slate-300 text-sm">Market Data</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-crypto-green">✓</div>
            <p className="text-slate-300 text-sm">AI Analysis</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-crypto-green">✓</div>
            <p className="text-slate-300 text-sm">Backtest Results</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-4 text-center">
          Next collection: {moment().add(3, 'hours').format('h:mm A')}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;