const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database');
const DataCollector = require('./services/dataCollector');
const AIAnalyzer = require('./services/aiAnalyzer');

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
    const { getMarketData } = require('./database');
    
    const data = await getMarketData(dataType, parseInt(limit));
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
app.get('/api/dashboard', async (req, res) => {
  try {
    const [
      marketData,
      analysis,
      cryptoPrices,
      fearGreed,
      narratives,
      backtestMetrics
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
      aiAnalyzer.getBacktestMetrics()
    ]);

    res.json({
      marketData,
      analysis,
      cryptoPrices,
      fearGreed,
      narratives,
      backtestMetrics,
      timestamp: new Date().toISOString()
    });
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;