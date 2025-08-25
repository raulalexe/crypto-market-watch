const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { 
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
  getTrendingNarratives
} = require('./database');
const DataCollector = require('./services/dataCollector');
const AIAnalyzer = require('./services/aiAnalyzer');
const PaymentService = require('./services/paymentService');
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

// Get advanced metrics
app.get('/api/advanced-metrics', async (req, res) => {
  try {
    // Get Bitcoin Dominance
    const bitcoinDominance = await getLatestBitcoinDominance();
    
    // Get Stablecoin Metrics
    const stablecoinMetrics = await getLatestStablecoinMetrics();
    
    // Get Exchange Flows
    const btcFlows = await getLatestExchangeFlows('BTC');
    const ethFlows = await getLatestExchangeFlows('ETH');
    
    // Process stablecoin metrics
    const totalMarketCap = stablecoinMetrics.find(m => m.metric_type === 'total_market_cap');
    const ssr = stablecoinMetrics.find(m => m.metric_type === 'ssr');
    
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
        return {
          narrative: narrative.narrative,
          sentiment: narrative.sentiment,
          relevance: narrative.relevance,
          total_volume_24h: metadata.total_volume_24h || 0,
          total_market_cap: metadata.total_market_cap || 0,
          avg_change_24h: metadata.avg_change_24h || 0,
          coin_count: metadata.coins ? metadata.coins.length : 0,
          money_flow_score: narrative.relevance
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
          money_flow_score: narrative.relevance
        };
      }
    });
    
    res.json({ narratives: enhancedNarratives });
  } catch (error) {
    console.error('Error fetching trending narratives:', error);
    res.status(500).json({ error: 'Failed to fetch trending narratives' });
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
    
    // TODO: Implement actual data export logic
    // For now, return a sample CSV
    const sampleData = `timestamp,value,source
2024-01-01T00:00:00Z,45000,BTC
2024-01-01T00:00:00Z,2500,ETH
2024-01-01T00:00:00Z,100,SOL`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=crypto-data-${type}-${dateRange}.csv`);
    res.send(sampleData);
  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json({ error: 'Failed to create export' });
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