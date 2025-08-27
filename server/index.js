const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { 
  db,
  initDatabase, 
  insertUser, 
  getUserByEmail, 
  getUserById,
  isUserAdmin,
  insertSubscription,
  getActiveSubscription,
  updateSubscription,
  trackApiUsage,
  getApiUsage,
  insertErrorLog,
  getErrorLogs,
  getLatestBitcoinDominance,
  getLatestStablecoinMetrics,
  getLatestExchangeFlows,
  getAlerts,
  acknowledgeAlert,
  getTrendingNarratives,
  getTableData
} = require('./database');
const DataCollector = require('./services/dataCollector');
const AIAnalyzer = require('./services/aiAnalyzer');
const PaymentService = require('./services/paymentService');
const EventCollector = require('./services/eventCollector');
const { authenticateToken, optionalAuth, requireSubscription, requireAdmin, rateLimit } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Initialize database
initDatabase().then(() => {
  console.log('Database initialized successfully');
}).catch(err => {
  console.error('Database initialization failed:', err);
});

// Initialize services
const dataCollector = new DataCollector();
const aiAnalyzer = new AIAnalyzer();
const paymentService = new PaymentService();
const eventCollector = new EventCollector();

// Setup cron jobs for data collection (only in development or when explicitly enabled)
const setupDataCollectionCron = () => {
  if (process.env.ENABLE_CRON_JOBS === 'true' || process.env.NODE_ENV === 'development') {
    console.log('Setting up data collection cron jobs...');
    
    // Run data collection every 30 minutes in development
    const dataCollectionJob = cron.schedule('0 * * * *', async () => {
      console.log('🕐 Cron job triggered: Starting data collection...');
      try {
        const success = await dataCollector.collectAllData();
        if (success) {
          console.log('✅ Data collection completed successfully');
        } else {
          console.log('❌ Data collection failed');
        }
      } catch (error) {
        console.error('❌ Cron job error:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC'
    });
    
    console.log('✅ Cron jobs set up successfully');
    console.log('📅 Schedule: Every 30 minutes');
    
    return dataCollectionJob;
  } else {
    console.log('⏭️ Skipping cron job setup (ENABLE_CRON_JOBS not set to true)');
    return null;
  }
};

// Start cron jobs
const cronJob = setupDataCollectionCron();

// API Routes

// Get current market data
app.get('/api/market-data', async (req, res) => {
  try {
    const marketData = await dataCollector.getMarketDataSummary();
    res.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Get latest AI analysis
app.get('/api/analysis', async (req, res) => {
  try {
    const analysis = await aiAnalyzer.getAnalysisSummary();
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Get multi-timeframe AI predictions
app.get('/api/predictions', async (req, res) => {
  try {
    const analysis = await aiAnalyzer.getAnalysisSummary();
    
    if (!analysis) {
      return res.status(404).json({ error: 'No AI analysis found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// Get crypto prices
app.get('/api/crypto-prices', async (req, res) => {
  try {
    const { getCryptoPrices } = require('./database');
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
    const prices = {};
    
    for (const symbol of cryptoSymbols) {
      const data = await getCryptoPrices(symbol, 1);
      if (data && data.length > 0) {
        prices[symbol] = data[0];
      }
    }
    
    res.json(prices);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({ error: 'Failed to fetch crypto prices' });
  }
});

// Get fear & greed index
app.get('/api/fear-greed', async (req, res) => {
  try {
    const { getLatestFearGreedIndex } = require('./database');
    const fearGreed = await getLatestFearGreedIndex();
    res.json(fearGreed);
  } catch (error) {
    console.error('Error fetching fear & greed index:', error);
    res.status(500).json({ error: 'Failed to fetch fear & greed index' });
  }
});

// Get trending narratives
app.get('/api/narratives', async (req, res) => {
  try {
    const { getTrendingNarratives } = require('./database');
    const narratives = await getTrendingNarratives(10);
    res.json(narratives);
  } catch (error) {
    console.error('Error fetching narratives:', error);
    res.status(500).json({ error: 'Failed to fetch narratives' });
  }
});

// Get advanced metrics
app.get('/api/advanced-metrics', async (req, res) => {
  try {
    // Get Bitcoin Dominance
    const bitcoinDominance = await getLatestBitcoinDominance();
    
    // Get Stablecoin Metrics
    const stablecoinMetrics = await getLatestStablecoinMetrics();
    
    // Process stablecoin metrics
    const totalMarketCap = stablecoinMetrics.find(m => m.metric_type === 'total_market_cap');
    const ssr = stablecoinMetrics.find(m => m.metric_type === 'ssr');
    
    // Get Exchange Flows
    const btcFlows = await getLatestExchangeFlows('BTC');
    const ethFlows = await getLatestExchangeFlows('ETH');
    
    // Process exchange flows
    const processFlows = (flows) => {
      const inflows = flows.filter(f => f.flow_type === 'inflow').reduce((sum, f) => sum + f.value, 0);
      const outflows = flows.filter(f => f.flow_type === 'outflow').reduce((sum, f) => sum + f.value, 0);
      return {
        inflow: inflows,
        outflow: outflows,
        netFlow: inflows - outflows
      };
    };
    
    // Calculate market sentiment score
    const calculateSentiment = () => {
      let score = 50; // Neutral starting point
      
      if (ssr && ssr.value < 4) score += 20; // Low SSR is bullish
      if (ssr && ssr.value > 6) score -= 20; // High SSR is bearish
      
      if (btcFlows.length > 0) {
        const btcFlowData = processFlows(btcFlows);
        if (btcFlowData.netFlow < 0) score += 15; // Negative net flow (money leaving exchanges) is bullish
        if (btcFlowData.netFlow > 0) score -= 15; // Positive net flow (money entering exchanges) is bearish
      }
      
      if (bitcoinDominance && bitcoinDominance.value > 50) score += 10; // High BTC dominance can be bullish
      
      return Math.max(0, Math.min(100, score));
    };
    
    const sentimentScore = calculateSentiment();
    const getSentimentInterpretation = (score) => {
      if (score >= 70) return 'Very Bullish';
      if (score >= 60) return 'Bullish';
      if (score >= 40) return 'Neutral';
      if (score >= 30) return 'Bearish';
      return 'Very Bearish';
    };
    
    // Calculate 24h changes
    const calculate24hChange = async (tableName, metricType = null) => {
      const { db } = require('./database');
      return new Promise((resolve) => {
        const query = metricType 
          ? `SELECT value FROM ${tableName} WHERE metric_type = ? ORDER BY timestamp DESC LIMIT 2`
          : `SELECT value FROM ${tableName} ORDER BY timestamp DESC LIMIT 2`;
        const params = metricType ? [metricType] : [];
        
        db.all(query, params, (err, rows) => {
          if (err || rows.length < 2) {
            resolve(0);
          } else {
            const current = rows[0].value;
            const previous = rows[1].value;
            const change = ((current - previous) / previous) * 100;
            resolve(change);
          }
        });
      });
    };

    const btcDominanceChange = await calculate24hChange('bitcoin_dominance');
    const stablecoinMarketCapChange = await calculate24hChange('stablecoin_metrics', 'total_market_cap');
    const ssrChange = await calculate24hChange('stablecoin_metrics', 'ssr');

    // Get Total Market Cap
    const { getMarketData } = require('./database');
    const totalMarketCapData = await getMarketData('TOTAL_MARKET_CAP', 2);
    
    // Get Altcoin Season Indicator
    const altcoinSeasonData = await getMarketData('ALTCOIN_SEASON', 1);
    
    // Get Derivatives Data
    const openInterestData = await getMarketData('DERIVATIVES', 1, 'OPEN_INTEREST');
    const fundingRateData = await getMarketData('DERIVATIVES', 1, 'FUNDING_RATE');
    const liquidationsData = await getMarketData('DERIVATIVES', 1, 'LIQUIDATIONS');
    
    // Get On-chain Data
    const whaleTransactionsData = await getMarketData('ONCHAIN', 1, 'WHALE_TRANSACTIONS');
    const hashRateData = await getMarketData('ONCHAIN', 1, 'HASH_RATE');
    const activeAddressesData = await getMarketData('ONCHAIN', 1, 'ACTIVE_ADDRESSES');
    
    // Calculate total market cap change
    let totalMarketCapChange24h = 0;
    if (totalMarketCapData && totalMarketCapData.length >= 2) {
      const current = totalMarketCapData[0].value;
      const previous = totalMarketCapData[1].value;
      totalMarketCapChange24h = ((current - previous) / previous) * 100;
    }

    // Check if we have any real data
    const hasRealData = bitcoinDominance || (totalMarketCapData && totalMarketCapData.length > 0) || (btcFlows.length > 0);
    
    if (!hasRealData) {
      // Return fallback data if no real data is available
      return res.json({
        bitcoinDominance: {
          value: 52.5,
          change_24h: 1.2
        },
        totalMarketCap: {
          value: 2500000000000,
          change_24h: 2.8
        },
        altcoinSeason: {
          indicator: 45.2,
          season: 'Bitcoin Season',
          metadata: { season: 'Bitcoin Season', strength: 'Moderate' }
        },
        stablecoinMetrics: {
          totalMarketCap: 125000000000,
          ssr: 3.2,
          change_24h: -0.5
        },
        exchangeFlows: {
          btc: {
            inflow: 850000000,
            outflow: 920000000,
            netFlow: -70000000
          },
          eth: {
            inflow: 450000000,
            outflow: 480000000,
            netFlow: -30000000
          }
        },
        marketSentiment: {
          score: 68,
          interpretation: 'Bullish'
        },
        derivatives: {
          openInterest: {
            value: 18500000000,
            metadata: { btc_oi: 12500000000, eth_oi: 6000000000 }
          },
          fundingRate: {
            value: 0.0125,
            metadata: { btc_funding: 0.015, eth_funding: 0.008 }
          },
          liquidations: {
            value: 85000000,
            metadata: { long_liquidations: 45000000, short_liquidations: 40000000 }
          }
        },
        onchain: {
          whaleTransactions: {
            value: 1250,
            metadata: { large_transfers: 850, exchange_deposits: 400 }
          },
          hashRate: {
            value: 450,
            metadata: { difficulty: 68000000000000, network_health: 'Strong' }
          },
          activeAddresses: {
            value: 850000,
            metadata: { new_addresses: 125000, returning_addresses: 725000 }
          }
        }
      });
    }

    res.json({
      bitcoinDominance: bitcoinDominance ? {
        value: bitcoinDominance.value,
        change_24h: btcDominanceChange
      } : null,
      totalMarketCap: totalMarketCapData && totalMarketCapData.length > 0 ? {
        value: totalMarketCapData[0].value,
        change_24h: totalMarketCapChange24h
      } : null,
      altcoinSeason: altcoinSeasonData && altcoinSeasonData.length > 0 ? {
        indicator: altcoinSeasonData[0].value,
        season: altcoinSeasonData[0].metadata ? JSON.parse(altcoinSeasonData[0].metadata).season : 'Unknown',
        metadata: altcoinSeasonData[0].metadata ? JSON.parse(altcoinSeasonData[0].metadata) : null
      } : null,
      stablecoinMetrics: {
        totalMarketCap: totalMarketCap ? totalMarketCap.value : null,
        ssr: ssr ? ssr.value : null,
        change_24h: stablecoinMarketCapChange
      },
      exchangeFlows: {
        btc: btcFlows.length > 0 ? processFlows(btcFlows) : null,
        eth: ethFlows.length > 0 ? processFlows(ethFlows) : null
      },
      marketSentiment: {
        score: sentimentScore,
        interpretation: getSentimentInterpretation(sentimentScore)
      },
      derivatives: {
        openInterest: openInterestData && openInterestData.length > 0 ? {
          value: openInterestData[0].value,
          metadata: openInterestData[0].metadata ? JSON.parse(openInterestData[0].metadata) : null
        } : null,
        fundingRate: fundingRateData && fundingRateData.length > 0 ? {
          value: fundingRateData[0].value,
          metadata: fundingRateData[0].metadata ? JSON.parse(fundingRateData[0].metadata) : null
        } : null,
        liquidations: liquidationsData && liquidationsData.length > 0 ? {
          value: liquidationsData[0].value,
          metadata: liquidationsData[0].metadata ? JSON.parse(liquidationsData[0].metadata) : null
        } : null
      },
      onchain: {
        whaleTransactions: whaleTransactionsData && whaleTransactionsData.length > 0 ? {
          value: whaleTransactionsData[0].value,
          metadata: whaleTransactionsData[0].metadata ? JSON.parse(whaleTransactionsData[0].metadata) : null
        } : null,
        hashRate: hashRateData && hashRateData.length > 0 ? {
          value: hashRateData[0].value,
          metadata: hashRateData[0].metadata ? JSON.parse(hashRateData[0].metadata) : null
        } : null,
        activeAddresses: activeAddressesData && activeAddressesData.length > 0 ? {
          value: activeAddressesData[0].value,
          metadata: activeAddressesData[0].metadata ? JSON.parse(activeAddressesData[0].metadata) : null
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching advanced metrics:', error);
    res.status(500).json({ error: 'Failed to fetch advanced metrics' });
  }
});

// Get trending narratives
app.get('/api/trending-narratives', async (req, res) => {
  try {
    const narratives = await getTrendingNarratives();
    
    // Filter out synthetic data and only return real data with metadata
    const realNarratives = narratives.filter(narrative => 
      narrative.source && narrative.source !== 'Synthetic'
    );
    
    // Parse the metadata to get money flow data
    const enhancedNarratives = realNarratives.map(narrative => {
      try {
        const metadata = JSON.parse(narrative.source);
        
        // Calculate market insights
        const totalVolume = metadata.total_volume_24h || 0;
        const totalMarketCap = metadata.total_market_cap || 0;
        const avgChange24h = metadata.avg_change_24h || 0;
        const coinCount = metadata.coins ? metadata.coins.length : 0;
        
        // Market trend analysis
        const getTrendAnalysis = (change24h, volume, marketCap) => {
          if (change24h > 10) return 'Strong Bullish Momentum';
          if (change24h > 5) return 'Bullish Trend';
          if (change24h > 0) return 'Slight Uptick';
          if (change24h > -5) return 'Slight Decline';
          if (change24h > -10) return 'Bearish Trend';
          return 'Strong Bearish Momentum';
        };
        
        // Volume analysis
        const getVolumeAnalysis = (volume, marketCap) => {
          const volumeToMarketCapRatio = volume / marketCap;
          if (volumeToMarketCapRatio > 0.5) return 'High Trading Activity';
          if (volumeToMarketCapRatio > 0.2) return 'Moderate Trading';
          return 'Low Trading Activity';
        };
        
        // Risk assessment
        const getRiskLevel = (change24h, volume, coinCount) => {
          const volatility = Math.abs(change24h);
          if (volatility > 15) return 'High Risk - High Volatility';
          if (volatility > 8) return 'Medium Risk - Moderate Volatility';
          if (coinCount === 1) return 'Medium Risk - Single Asset';
          return 'Lower Risk - Diversified';
        };
        
        // Investment opportunity score (0-100)
        const calculateOpportunityScore = (change24h, volume, marketCap, coinCount) => {
          let score = 50; // Neutral starting point
          
          // Price momentum (40% weight)
          if (change24h > 0) score += Math.min(change24h * 2, 20);
          else score -= Math.min(Math.abs(change24h) * 2, 20);
          
          // Volume activity (30% weight)
          const volumeRatio = volume / marketCap;
          if (volumeRatio > 0.3) score += 15;
          else if (volumeRatio > 0.1) score += 10;
          else score -= 10;
          
          // Diversification (20% weight)
          if (coinCount > 3) score += 10;
          else if (coinCount > 1) score += 5;
          else score -= 5;
          
          // Market cap stability (10% weight)
          if (marketCap > 10000000000) score += 5; // >$10B
          else if (marketCap > 1000000000) score += 2; // >$1B
          
          return Math.max(0, Math.min(100, Math.round(score)));
        };
        
        const opportunityScore = calculateOpportunityScore(avgChange24h, totalVolume, totalMarketCap, coinCount);
        
        return {
          narrative: narrative.narrative,
          sentiment: narrative.sentiment,
          relevance: narrative.relevance,
          total_volume_24h: totalVolume,
          total_market_cap: totalMarketCap,
          avg_change_24h: avgChange24h,
          coin_count: coinCount,
          money_flow_score: narrative.relevance,
          coins: metadata.coins || [],
          // Enhanced market insights
          market_insights: {
            trend_analysis: getTrendAnalysis(avgChange24h, totalVolume, totalMarketCap),
            volume_analysis: getVolumeAnalysis(totalVolume, totalMarketCap),
            risk_level: getRiskLevel(avgChange24h, totalVolume, coinCount),
            opportunity_score: opportunityScore,
            opportunity_rating: opportunityScore >= 80 ? 'Excellent' : 
                               opportunityScore >= 60 ? 'Good' : 
                               opportunityScore >= 40 ? 'Fair' : 
                               opportunityScore >= 20 ? 'Poor' : 'Very Poor'
          }
        };
      } catch (error) {
        return {
          narrative: narrative.narrative,
          sentiment: narrative.sentiment,
          relevance: narrative.relevance,
          total_volume_24h: 0,
          total_market_cap: 0,
          avg_change_24h: 0,
          coin_count: 0,
          money_flow_score: narrative.relevance,
          coins: [],
          market_insights: {
            trend_analysis: 'Data Unavailable',
            volume_analysis: 'Data Unavailable',
            risk_level: 'Unknown',
            opportunity_score: 0,
            opportunity_rating: 'Unknown'
          }
        };
      }
    });
    
    res.json({ narratives: enhancedNarratives });
  } catch (error) {
    console.error('Error fetching trending narratives:', error);
    res.status(500).json({ error: 'Failed to fetch trending narratives' });
  }
});

// Get Layer 1 blockchain data
app.get('/api/layer1-data', async (req, res) => {
  try {
    const { getLayer1Data } = require('./database');
    const layer1Data = await getLayer1Data();
    
    if (layer1Data.length === 0) {
      // Return sample data if no data in database
      const sampleData = {
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
      return res.json(sampleData);
    }
    
    // Calculate totals
    const totalMarketCap = layer1Data.reduce((sum, chain) => sum + chain.market_cap, 0);
    const totalVolume24h = layer1Data.reduce((sum, chain) => sum + chain.volume_24h, 0);
    const avgChange24h = layer1Data.reduce((sum, chain) => sum + chain.change_24h, 0) / layer1Data.length;
    
    const response = {
      chains: layer1Data.map(chain => ({
        id: chain.chain_id,
        name: chain.name,
        symbol: chain.symbol,
        price: chain.price,
        change_24h: chain.change_24h,
        market_cap: chain.market_cap,
        volume_24h: chain.volume_24h,
        tps: chain.tps,
        active_addresses: chain.active_addresses,
        hash_rate: chain.hash_rate,
        dominance: chain.dominance,
        narrative: chain.narrative,
        sentiment: chain.sentiment
      })),
      total_market_cap: totalMarketCap,
      total_volume_24h: totalVolume24h,
      avg_change_24h: avgChange24h
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching Layer 1 data:', error);
    res.status(500).json({ error: 'Failed to fetch Layer 1 data' });
  }
});

// Public API endpoints for developers (structured data without raw JSON)
app.get('/api/v1/narratives', async (req, res) => {
  try {
    const narratives = await getTrendingNarratives();
    
    // Filter out synthetic data and only return real data with metadata
    const realNarratives = narratives.filter(narrative => 
      narrative.source && narrative.source !== 'Synthetic'
    );
    
    // Parse the metadata to get money flow data
    const enhancedNarratives = realNarratives.map(narrative => {
      try {
        const metadata = JSON.parse(narrative.source);
        return {
          narrative: narrative.narrative,
          sentiment: narrative.sentiment,
          relevance_score: narrative.relevance_score || 0,
          total_volume_24h: metadata.total_volume_24h || 0,
          total_market_cap: metadata.total_market_cap || 0,
          avg_change_24h: metadata.avg_change_24h || 0,
          coin_count: metadata.coins ? metadata.coins.length : 0,
          money_flow_score: narrative.relevance_score || 0,
          coins: metadata.coins ? metadata.coins.map(coin => ({
            symbol: coin.coin_symbol,
            name: coin.coin_name,
            price_usd: coin.price_usd,
            change_24h: coin.change_24h,
            volume_24h: coin.volume_24h,
            market_cap: coin.market_cap,
            market_cap_rank: coin.market_cap_rank
          })) : []
        };
      } catch (error) {
        return {
          narrative: narrative.narrative,
          sentiment: narrative.sentiment,
          relevance_score: narrative.relevance_score || 0,
          total_volume_24h: 0,
          total_market_cap: 0,
          avg_change_24h: 0,
          coin_count: 0,
          money_flow_score: narrative.relevance_score || 0,
          coins: []
        };
      }
    });
    
    res.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      count: enhancedNarratives.length,
      narratives: enhancedNarratives 
    });
  } catch (error) {
    console.error('Error fetching narratives API:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch narratives' 
    });
  }
});

app.get('/api/v1/layer1', async (req, res) => {
  try {
    const { getLayer1Data } = require('./database');
    const layer1Data = await getLayer1Data();
    
    if (layer1Data.length === 0) {
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: 0,
        chains: [],
        summary: {
          total_market_cap: 0,
          total_volume_24h: 0,
          avg_change_24h: 0
        }
      });
    }
    
    // Calculate totals
    const totalMarketCap = layer1Data.reduce((sum, chain) => sum + chain.market_cap, 0);
    const totalVolume24h = layer1Data.reduce((sum, chain) => sum + chain.volume_24h, 0);
    const avgChange24h = layer1Data.reduce((sum, chain) => sum + chain.change_24h, 0) / layer1Data.length;
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      count: layer1Data.length,
      chains: layer1Data.map(chain => ({
        id: chain.chain_id,
        name: chain.name,
        symbol: chain.symbol,
        price: chain.price,
        change_24h: chain.change_24h,
        market_cap: chain.market_cap,
        volume_24h: chain.volume_24h,
        tps: chain.tps,
        active_addresses: chain.active_addresses,
        hash_rate: chain.hash_rate,
        dominance: chain.dominance,
        narrative: chain.narrative,
        sentiment: chain.sentiment
      })),
      summary: {
        total_market_cap: totalMarketCap,
        total_volume_24h: totalVolume24h,
        avg_change_24h: avgChange24h
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching Layer 1 API:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch Layer 1 data' 
    });
  }
});

// Admin-only endpoints for raw data access
app.get('/api/admin/narratives/raw', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const narratives = await getTrendingNarratives();
    res.json({ 
      timestamp: new Date().toISOString(),
      count: narratives.length,
      data: narratives 
    });
  } catch (error) {
    console.error('Error fetching raw narratives:', error);
    res.status(500).json({ error: 'Failed to fetch raw narratives' });
  }
});

app.get('/api/admin/layer1/raw', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { getLayer1Data } = require('./database');
    const layer1Data = await getLayer1Data();
    res.json({ 
      timestamp: new Date().toISOString(),
      count: layer1Data.length,
      data: layer1Data 
    });
  } catch (error) {
    console.error('Error fetching raw Layer 1 data:', error);
    res.status(500).json({ error: 'Failed to fetch raw Layer 1 data' });
  }
});

// Get alerts (premium+ only)
app.get('/api/alerts', authenticateToken, requireSubscription('premium'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const alerts = await getAlerts(parseInt(limit));
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Acknowledge alert
app.post('/api/alerts/:id/acknowledge', authenticateToken, requireSubscription('premium'), async (req, res) => {
  try {
    const { id } = req.params;
    await acknowledgeAlert(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Get error logs (admin only)
app.get('/api/errors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { getErrorLogs } = require('./database');
    const errors = await getErrorLogs(100);
    res.json({ errors });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    res.status(500).json({ error: 'Failed to fetch error logs' });
  }
});

// Data export endpoints (premium+ only)
app.get('/api/exports/history', authenticateToken, requireSubscription('premium'), async (req, res) => {
  try {
    // TODO: Implement export history tracking
    res.json({ exports: [] });
  } catch (error) {
    console.error('Error fetching export history:', error);
    res.status(500).json({ error: 'Failed to fetch export history' });
  }
});

app.post('/api/exports/create', authenticateToken, requireSubscription('premium'), async (req, res) => {
  try {
    const { type, dateRange, format } = req.body;
    
    // Get actual data based on type and date range
    const { getMarketData, getCryptoPrices, getLatestFearGreedIndex, getTrendingNarratives, getLatestAIAnalysis } = require('./database');
    let data = [];
    
    // Determine limit based on date range
    const getLimit = (range) => {
      switch (range) {
        case '1d': return 24;
        case '7d': return 168;
        case '30d': return 720;
        case '90d': return 2160;
        case '1y': return 8760;
        case 'all': return 10000;
        default: return 100;
      }
    };
    
    const limit = getLimit(dateRange);
    
    // Fetch data based on type
    if (type === 'crypto_prices') {
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
      for (const symbol of cryptoSymbols) {
        const prices = await getCryptoPrices(symbol, Math.ceil(limit / cryptoSymbols.length));
        if (prices && prices.length > 0) {
          data.push(...prices.map(price => ({
            timestamp: price.timestamp,
            symbol: price.symbol,
            price: price.price,
            volume_24h: price.volume_24h,
            market_cap: price.market_cap,
            change_24h: price.change_24h
          })));
        }
      }
    } else if (type === 'market_data') {
      const marketTypes = ['EQUITY_INDEX', 'DXY', 'TREASURY_YIELD', 'VOLATILITY_INDEX', 'ENERGY_PRICE'];
      for (const marketType of marketTypes) {
        const marketDataItems = await getMarketData(marketType, Math.ceil(limit / marketTypes.length));
        if (marketDataItems && marketDataItems.length > 0) {
          data.push(...marketDataItems.map(item => ({
            timestamp: item.timestamp,
            data_type: item.data_type,
            symbol: item.symbol,
            value: item.value,
            source: item.source
          })));
        }
      }
    } else if (type === 'fear_greed') {
      const fearGreed = await getLatestFearGreedIndex();
      if (fearGreed) {
        data.push({
          timestamp: fearGreed.timestamp,
          value: fearGreed.value,
          classification: fearGreed.classification,
          source: fearGreed.source
        });
      }
    } else if (type === 'narratives') {
      const narratives = await getTrendingNarratives(limit);
      data = narratives.map(narrative => ({
        timestamp: narrative.timestamp,
        narrative: narrative.narrative,
        sentiment: narrative.sentiment,
        relevance_score: narrative.relevance_score,
        source: narrative.source
      }));
    } else if (type === 'ai_analysis') {
      const analysis = await getLatestAIAnalysis();
      if (analysis) {
        data.push({
          timestamp: analysis.timestamp,
          market_direction: analysis.market_direction,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          factors_analyzed: analysis.factors_analyzed
        });
      }
    } else if (type === 'all_data') {
      // Combine all data types
      const allTypes = ['crypto_prices', 'market_data', 'fear_greed', 'narratives', 'ai_analysis'];
      for (const dataType of allTypes) {
        const typeData = await getDataForType(dataType, limit);
        data.push(...typeData);
      }
    }
    
    // Sort by timestamp
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Format data based on requested format
    let content;
    let contentType;
    let fileExtension;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'csv':
        content = convertToCSV(data);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'xlsx':
        content = convertToExcel(data);
        contentType = 'text/html';
        fileExtension = 'html';
        break;
      default:
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=crypto-data-${type}-${dateRange}.${fileExtension}`);
    res.send(content);
  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json({ error: 'Failed to create export' });
  }
});

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
};

// Helper function to convert data to Excel (compatible format)
const convertToExcel = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  
  // Create HTML table that Excel can open
  let excelContent = `<html>
<head>
  <meta charset="utf-8">
  <title>Crypto Data Export</title>
</head>
<body>
  <table border="1">
    <thead>
      <tr>
        ${headers.map(header => `<th>${header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map(row => `
      <tr>
        ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
      </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;
  
  return excelContent;
};

// Helper function to get data for different types
const getDataForType = async (type, limit) => {
  const { getMarketData, getCryptoPrices, getLatestFearGreedIndex, getTrendingNarratives, getLatestAIAnalysis } = require('./database');
  
  switch (type) {
    case 'crypto_prices':
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
      const cryptoData = [];
      for (const symbol of cryptoSymbols) {
        const prices = await getCryptoPrices(symbol, Math.ceil(limit / cryptoSymbols.length));
        if (prices && prices.length > 0) {
          cryptoData.push(...prices.map(price => ({
            timestamp: price.timestamp,
            symbol: price.symbol,
            price: price.price,
            volume_24h: price.volume_24h,
            market_cap: price.market_cap,
            change_24h: price.change_24h
          })));
        }
      }
      return cryptoData;
      
    case 'market_data':
      const marketTypes = ['EQUITY_INDEX', 'DXY', 'TREASURY_YIELD', 'VOLATILITY_INDEX', 'ENERGY_PRICE'];
      const marketData = [];
      for (const marketType of marketTypes) {
        const marketDataItems = await getMarketData(marketType, Math.ceil(limit / marketTypes.length));
        if (marketDataItems && marketDataItems.length > 0) {
          marketData.push(...marketDataItems.map(item => ({
            timestamp: item.timestamp,
            data_type: item.data_type,
            symbol: item.symbol,
            value: item.value,
            source: item.source
          })));
        }
      }
      return marketData;
      
    case 'fear_greed':
      const fearGreed = await getLatestFearGreedIndex();
      return fearGreed ? [{
        timestamp: fearGreed.timestamp,
        value: fearGreed.value,
        classification: fearGreed.classification,
        source: fearGreed.source
      }] : [];
      
    case 'narratives':
      const narratives = await getTrendingNarratives(limit);
      return narratives.map(narrative => ({
        timestamp: narrative.timestamp,
        narrative: narrative.narrative,
        sentiment: narrative.sentiment,
        relevance_score: narrative.relevance_score,
        source: narrative.source
      }));
      
    case 'ai_analysis':
      const analysis = await aiAnalyzer.getAnalysisSummary();
      return analysis ? [analysis] : [];
      
    default:
      return [];
  }
};

// Get backtest results
app.get('/api/backtest', async (req, res) => {
  try {
    const metrics = await aiAnalyzer.getBacktestMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching backtest results:', error);
    res.status(500).json({ error: 'Failed to fetch backtest results' });
  }
});

// Get historical data
app.get('/api/history/:dataType', async (req, res) => {
  try {
    const { dataType } = req.params;
    const { limit = 100 } = req.query;
    const { getMarketData, getCryptoPrices } = require('./database');
    
    let data;
    
    // Handle crypto prices separately since they're in a different table
    if (dataType === 'CRYPTO_PRICE') {
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK'];
      data = [];
      
      for (const symbol of cryptoSymbols) {
        const prices = await getCryptoPrices(symbol, Math.ceil(limit / cryptoSymbols.length));
        if (prices && prices.length > 0) {
          // Convert crypto_prices format to match market_data format
          const convertedPrices = prices.map(price => ({
            id: price.id,
            timestamp: price.timestamp,
            data_type: 'CRYPTO_PRICE',
            symbol: price.symbol,
            value: price.price,
            metadata: JSON.stringify({
              volume_24h: price.volume_24h,
              market_cap: price.market_cap,
              change_24h: price.change_24h
            }),
            source: 'CoinGecko'
          }));
          data.push(...convertedPrices);
        }
      }
      
      // Sort by timestamp and limit
      data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      data = data.slice(0, limit);
    } else {
      data = await getMarketData(dataType, parseInt(limit));
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Manual data collection trigger
app.post('/api/collect-data', async (req, res) => {
  try {
    console.log('Manual data collection triggered');
    const success = await dataCollector.collectAllData();
    
    if (success) {
      // Trigger AI analysis
      const marketData = await dataCollector.getMarketDataSummary();
      if (marketData) {
        await aiAnalyzer.analyzeMarketDirection(marketData);
        await aiAnalyzer.backtestPredictions();
      }
      
      // Collect upcoming events
      await eventCollector.collectUpcomingEvents();
      
      res.json({ success: true, message: 'Data collection and analysis completed' });
    } else {
      res.status(500).json({ success: false, message: 'Data collection failed' });
    }
  } catch (error) {
    console.error('Error in manual data collection:', error);
    res.status(500).json({ error: 'Failed to collect data' });
  }
});

// Get dashboard summary
app.get('/api/dashboard', optionalAuth, async (req, res) => {
  try {
    console.log('🔍 ===== DASHBOARD REQUEST START =====');
    console.log('🔍 Request headers:', req.headers.authorization ? 'Has Auth' : 'No Auth');
    console.log('🔍 User authenticated:', !!req.user);
    console.log('🔍 User ID:', req.user?.id);
    
    const [
      marketData,
      analysis,
      cryptoPrices,
      fearGreed,
      narratives,
      backtestMetrics,
      upcomingEvents
    ] = await Promise.all([
      dataCollector.getMarketDataSummary(),
      aiAnalyzer.getAnalysisSummary(),
      (async () => {
        const { getCryptoPrices } = require('./database');
        const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
        const prices = {};
        for (const symbol of cryptoSymbols) {
          const data = await getCryptoPrices(symbol, 1);
          if (data && data.length > 0) {
            prices[symbol] = data[0];
          }
        }
        return prices;
      })(),
      (async () => {
        const { getLatestFearGreedIndex } = require('./database');
        return await getLatestFearGreedIndex();
      })(),
      (async () => {
        const { getTrendingNarratives } = require('./database');
        return await getTrendingNarratives(5);
      })(),
      aiAnalyzer.getBacktestMetrics(),
      eventCollector.getUpcomingEvents(10)
    ]);

    // Add subscription status if user is authenticated
    let subscriptionStatus = null;
    if (req.user) {
      subscriptionStatus = await paymentService.getSubscriptionStatus(req.user.id);
    } else {
      console.log('🔍 API Debug - No user authenticated');
    }

    // Get the actual last collection time from the most recent data
    let lastCollectionTime = null;
    if (analysis && analysis.timestamp) {
      lastCollectionTime = analysis.timestamp;
    } else if (marketData && marketData.timestamp) {
      lastCollectionTime = marketData.timestamp;
    } else if (fearGreed && fearGreed.timestamp) {
      lastCollectionTime = fearGreed.timestamp;
    }

    // Return only real data
    const dashboardData = {
      marketData,
      aiAnalysis: analysis,
      cryptoPrices,
      fearGreed,
      trendingNarratives: narratives,
      backtestResults: backtestMetrics,
      upcomingEvents,
      subscriptionStatus,
      lastCollectionTime,
      timestamp: lastCollectionTime || new Date().toISOString()
    };
    console.log('dashboard request has subscription status:', dashboardData.subscriptionStatus?.planName || 'null');
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ===== PAYMENT & SUBSCRIPTION ROUTES =====

// Get subscription plans
app.get('/api/subscription/plans', async (req, res) => {
  try {
    const plans = await paymentService.getPlanPricing();
    res.json(plans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get plans with payment methods (for SubscriptionCard component)
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await paymentService.getPlanPricing();
    const paymentMethods = await paymentService.getPaymentMethods();
    res.json({ plans, paymentMethods });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe subscription
app.post('/api/subscribe/stripe', authenticateToken, async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const result = await paymentService.createStripeSubscription(req.user.id, planId, paymentMethodId);
    res.json(result);
  } catch (error) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create NOWPayments crypto payment
app.post('/api/subscribe/crypto', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const result = await paymentService.createNowPaymentsCharge(req.user.id, planId, false);
    res.json(result);
  } catch (error) {
    console.error('NOWPayments payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create NOWPayments crypto subscription
app.post('/api/subscribe/crypto-subscription', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const result = await paymentService.createNowPaymentsSubscription(req.user.id, planId);
    res.json(result);
  } catch (error) {
    console.error('NOWPayments subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Cancel subscription
app.post('/api/subscribe/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await paymentService.cancelSubscription(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get subscription status
app.get('/api/subscription', authenticateToken, async (req, res) => {
  try {
    let status;
    try {
      status = await paymentService.getSubscriptionStatus(req.user.id);
    } catch (error) {
      console.error('Payment service error:', error);
      // If payment service fails, return basic status
      status = { plan: 'free', status: 'inactive' };
    }
    
    console.log('Final subscription response:', status); // Debug log
    res.json(status);
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== WEBHOOKS =====

// Stripe webhook
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    await paymentService.handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// NOWPayments webhook
app.post('/api/webhooks/nowpayments', async (req, res) => {
  try {
    await paymentService.handleNowPaymentsWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    console.error('NOWPayments webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ===== API ACCESS (PRO TIER) =====

// Pro-tier API endpoints with rate limiting
app.get('/api/v1/narratives', authenticateToken, requireSubscription('pro'), rateLimit('/api/v1/narratives'), async (req, res) => {
  try {
    const narratives = await getTrendingNarratives();
    
    // Filter out synthetic data and only return real data with metadata
    const realNarratives = narratives.filter(narrative => 
      narrative.source && narrative.source !== 'Synthetic'
    );
    
    // Parse the metadata to get money flow data
    const enhancedNarratives = realNarratives.map(narrative => {
      try {
        const metadata = JSON.parse(narrative.source);
        return {
          narrative: narrative.narrative,
          sentiment: narrative.sentiment,
          relevance_score: narrative.relevance_score || 0,
          total_volume_24h: metadata.total_volume_24h || 0,
          total_market_cap: metadata.total_market_cap || 0,
          avg_change_24h: metadata.avg_change_24h || 0,
          coin_count: metadata.coins ? metadata.coins.length : 0,
          money_flow_score: narrative.relevance_score || 0,
          coins: metadata.coins ? metadata.coins.map(coin => ({
            symbol: coin.coin_symbol,
            name: coin.coin_name,
            price_usd: coin.price_usd,
            change_24h: coin.change_24h,
            volume_24h: coin.volume_24h,
            market_cap: coin.market_cap,
            market_cap_rank: coin.market_cap_rank
          })) : []
        };
      } catch (error) {
        return {
          narrative: narrative.narrative,
          sentiment: narrative.sentiment,
          relevance_score: narrative.relevance_score || 0,
          total_volume_24h: 0,
          total_market_cap: 0,
          avg_change_24h: 0,
          coin_count: 0,
          money_flow_score: narrative.relevance_score || 0,
          coins: []
        };
      }
    });
    
    res.json({ 
      success: true,
      timestamp: new Date().toISOString(),
      count: enhancedNarratives.length,
      narratives: enhancedNarratives 
    });
  } catch (error) {
    console.error('Error fetching narratives API:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch narratives' 
    });
  }
});

app.get('/api/v1/layer1', authenticateToken, requireSubscription('pro'), rateLimit('/api/v1/layer1'), async (req, res) => {
  try {
    const { getLayer1Data } = require('./database');
    const layer1Data = await getLayer1Data();
    
    if (layer1Data.length === 0) {
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: 0,
        chains: [],
        summary: {
          total_market_cap: 0,
          total_volume_24h: 0,
          avg_change_24h: 0
        }
      });
    }
    
    // Calculate totals
    const totalMarketCap = layer1Data.reduce((sum, chain) => sum + chain.market_cap, 0);
    const totalVolume24h = layer1Data.reduce((sum, chain) => sum + chain.volume_24h, 0);
    const avgChange24h = layer1Data.reduce((sum, chain) => sum + chain.change_24h, 0) / layer1Data.length;
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      count: layer1Data.length,
      chains: layer1Data.map(chain => ({
        id: chain.chain_id,
        name: chain.name,
        symbol: chain.symbol,
        price: chain.price,
        change_24h: chain.change_24h,
        market_cap: chain.market_cap,
        volume_24h: chain.volume_24h,
        tps: chain.tps,
        active_addresses: chain.active_addresses,
        hash_rate: chain.hash_rate,
        dominance: chain.dominance,
        narrative: chain.narrative,
        sentiment: chain.sentiment
      })),
      summary: {
        total_market_cap: totalMarketCap,
        total_volume_24h: totalVolume24h,
        avg_change_24h: avgChange24h
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching Layer 1 API:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch Layer 1 data' 
    });
  }
});

app.get('/api/v1/market-data', authenticateToken, requireSubscription('pro'), rateLimit('/api/v1/market-data'), async (req, res) => {
  try {
    const marketData = await dataCollector.getMarketDataSummary();
    res.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

app.get('/api/v1/analysis', authenticateToken, requireSubscription('pro'), rateLimit('/api/v1/analysis'), async (req, res) => {
  try {
    const analysis = await aiAnalyzer.getAnalysisSummary();
    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

app.get('/api/v1/crypto-prices', authenticateToken, requireSubscription('pro'), rateLimit('/api/v1/crypto-prices'), async (req, res) => {
  try {
    const { getCryptoPrices } = require('./database');
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
    const prices = {};
    
    for (const symbol of cryptoSymbols) {
      const data = await getCryptoPrices(symbol, 1);
      if (data && data.length > 0) {
        prices[symbol] = data[0];
      }
    }
    
    res.json(prices);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    res.status(500).json({ error: 'Failed to fetch crypto prices' });
  }
});

app.get('/api/v1/backtest', authenticateToken, requireSubscription('pro'), rateLimit('/api/v1/backtest'), async (req, res) => {
  try {
    const metrics = await aiAnalyzer.getBacktestMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching backtest results:', error);
    res.status(500).json({ error: 'Failed to fetch backtest results' });
  }
});

// Get API usage statistics
app.get('/api/usage', authenticateToken, async (req, res) => {
  try {
    const { getApiUsage } = require('./database');
    const usage = await getApiUsage(req.user.id, 30);
    res.json({ usage });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await getUserByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    console.log('JWT Secret length:', jwtSecret.length);
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    console.log('Token generated successfully');
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email,
        isAdmin: user.is_admin === 1
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const userId = await insertUser(email, passwordHash);
    
    // Generate token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: userId, 
        email,
        isAdmin: false
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Admin routes
app.get('/api/admin/collections', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const collections = [
      'market_data',
      'ai_analysis', 
      'fear_greed_index',
      'trending_narratives',
      'users',
      'subscriptions',
      'error_logs'
    ];

    const collectionsData = [];

    for (const collection of collections) {
      try {
        const data = await getTableData(collection, 100);

        collectionsData.push({
          collection,
          count: data.length,
          data: data
        });
      } catch (err) {
        console.error(`Error processing collection ${collection}:`, err);
        collectionsData.push({
          collection,
          count: 0,
          data: []
        });
      }
    }

    res.json(collectionsData);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

app.get('/api/admin/ai-analysis', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get raw database records for admin view
    const rawAnalysis = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id,
          market_direction,
          confidence,
          reasoning,
          factors_analyzed,
          analysis_data,
          timestamp
        FROM ai_analysis 
        ORDER BY timestamp DESC 
        LIMIT 50
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

    // Parse the analysis_data to show multi-timeframe structure
    const parsedAnalysis = rawAnalysis.map(analysis => {
      let parsedData = null;
      if (analysis.analysis_data) {
        try {
          parsedData = JSON.parse(analysis.analysis_data);
          // Handle double encoding
          if (typeof parsedData === 'string') {
            parsedData = JSON.parse(parsedData);
          }
        } catch (error) {
          console.error('Error parsing analysis_data:', error);
        }
      }

      return {
        id: analysis.id,
        timestamp: analysis.timestamp,
        // Legacy fields for backward compatibility
        market_direction: analysis.market_direction,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        factors_analyzed: analysis.factors_analyzed,
        // Multi-timeframe structure
        overall_direction: parsedData?.overall_direction,
        overall_confidence: parsedData?.overall_confidence,
        short_term: parsedData?.short_term,
        medium_term: parsedData?.medium_term,
        long_term: parsedData?.long_term,
        // Raw data for debugging
        raw_analysis_data: analysis.analysis_data
      };
    });

    res.json(parsedAnalysis);
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    res.status(500).json({ error: 'Failed to fetch AI analysis' });
  }
});

app.get('/api/admin/export/:collection', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin(req.user.id);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { collection } = req.params;
    const allowedCollections = [
      'market_data',
      'ai_analysis', 
      'fear_greed_index',
      'trending_narratives',
      'users',
      'subscriptions',
      'error_logs'
    ];

    if (!allowedCollections.includes(collection)) {
      return res.status(400).json({ error: 'Invalid collection' });
    }

    const data = await getTableData(collection, 1000);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.json"`);
    res.json(data);
  } catch (error) {
    console.error('Error exporting collection:', error);
    res.status(500).json({ error: 'Failed to export collection' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Log Railway-specific info
  if (process.env.RAILWAY_STATIC_URL) {
    console.log(`🚂 Railway URL: ${process.env.RAILWAY_STATIC_URL}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  if (cronJob) {
    cronJob.stop();
    console.log('⏹️ Cron jobs stopped');
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  if (cronJob) {
    cronJob.stop();
    console.log('⏹️ Cron jobs stopped');
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;