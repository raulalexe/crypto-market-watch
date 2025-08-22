const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database');
const DataCollector = require('./services/dataCollector');
const AIAnalyzer = require('./services/aiAnalyzer');
const PaymentService = require('./services/paymentService');
const { authenticateToken, optionalAuth, requireSubscription, rateLimit } = require('./middleware/auth');

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
app.get('/api/dashboard', optionalAuth, async (req, res) => {
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

    // Add subscription status if user is authenticated
    let subscriptionStatus = null;
    if (req.user) {
      subscriptionStatus = await paymentService.getSubscriptionStatus(req.user.id);
    }

    res.json({
      marketData,
      analysis,
      cryptoPrices,
      fearGreed,
      narratives,
      backtestMetrics,
      subscriptionStatus,
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

// ===== PAYMENT & SUBSCRIPTION ROUTES =====

// Get subscription plans and pricing
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await paymentService.getPlanPricing();
    const paymentMethods = await paymentService.getPaymentMethods();
    res.json({ plans, paymentMethods });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
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

// Create Coinbase crypto payment
app.post('/api/subscribe/crypto', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const result = await paymentService.createCoinbaseCharge(req.user.id, planId);
    res.json(result);
  } catch (error) {
    console.error('Crypto payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create direct ETH payment
app.post('/api/subscribe/eth', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const result = await paymentService.createEthPayment(req.user.id, planId);
    res.json(result);
  } catch (error) {
    console.error('ETH payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify ETH payment
app.post('/api/subscribe/eth/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentId, txHash } = req.body;
    const result = await paymentService.verifyEthPayment(paymentId, txHash);
    res.json(result);
  } catch (error) {
    console.error('ETH payment verification error:', error);
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
    const status = await paymentService.getSubscriptionStatus(req.user.id);
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

// Coinbase webhook
app.post('/api/webhooks/coinbase', async (req, res) => {
  try {
    await paymentService.handleCoinbaseWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    console.error('Coinbase webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ===== API ACCESS (PRO TIER) =====

// Pro-tier API endpoints with rate limiting
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