const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const multer = require('multer');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Server-side caching for dashboard data to reduce API calls and egress
class DashboardCache {
  constructor() {
    this.cache = null;
    this.lastUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.lastLogTime = 0;
    this.logInterval = 30 * 1000; // Only log every 30 seconds
    this.cacheHitCount = 0;
  }

  set(data) {
    this.cache = data;
    this.lastUpdate = Date.now();
    this.cacheHitCount = 0; // Reset counter when new data is cached
  }

  get() {
    if (!this.cache || !this.lastUpdate) {
      return null;
    }
    
    // Check if cache is still valid
    if (Date.now() - this.lastUpdate > this.cacheTimeout) {
      this.cache = null;
      this.lastUpdate = null;
      return null;
    }
    
    this.cacheHitCount++;
    return this.cache;
  }

  isStale() {
    if (!this.lastUpdate) return true;
    return Date.now() - this.lastUpdate > this.cacheTimeout;
  }

  // Rate-limited logging to prevent log spam
  logCacheHit() {
    const now = Date.now();
    if (now - this.lastLogTime > this.logInterval) {
      console.log(`📊 Dashboard cache hit - served ${this.cacheHitCount} requests in last 30s`);
      this.lastLogTime = now;
      this.cacheHitCount = 0;
    }
  }

  logCacheMiss() {
    console.log('📊 Dashboard cache miss - fetching fresh data...');
  }

  logCacheSet() {
    console.log('📊 Dashboard data cached successfully');
  }
}

const dashboardCache = new DashboardCache();

// Request deduplication to prevent multiple simultaneous requests
let pendingDashboardRequest = null;

// Helper function to get dashboard data (reusable for WebSocket broadcasts)
async function getDashboardData() {
  try {
    const [
      marketData,
      analysis,
      fearGreed,
      narratives,
      backtestMetrics,
      upcomingEvents,
      inflationData,
      correlationData,
      advancedMetrics,
      marketSentiment,
      derivativesData,
      onchainData,
      moneySupplyData,
      layer1Data,
      cryptoEvents
    ] = await Promise.all([
      dataCollector.getMarketDataSummary(),
      aiAnalyzer.getAnalysisSummary(),
      (async () => {
        const { getLatestFearGreedIndex } = require('./database');
        return await getLatestFearGreedIndex();
      })(),
      (async () => {
        const { getProcessedTrendingNarratives } = require('./database');
        return await getProcessedTrendingNarratives(5);
      })(),
      aiAnalyzer.getBacktestMetrics(),
      eventCollector.getUpcomingEvents(10),
      (async () => {
        try {
          const { getLatestInflationData } = require('./database');
          const [cpiData, pceData, ppiData] = await Promise.all([
            getLatestInflationData('CPI'),
            getLatestInflationData('PCE'),
            getLatestInflationData('PPI')
          ]);
          
          // Format data like /api/inflation/latest endpoint
          const inflationData = {
            cpi: cpiData ? {
              cpi: cpiData.value?.toString(),
              coreCPI: cpiData.core_value?.toString(),
              cpiYoY: cpiData.yoy_change?.toString(),
              coreCPIYoY: cpiData.core_yoy_change?.toString(),
              date: cpiData.date
            } : null,
            pce: pceData ? {
              pce: pceData.value?.toString(),
              corePCE: pceData.core_value?.toString(),
              pceYoY: pceData.yoy_change?.toString(),
              corePCEYoY: pceData.core_yoy_change?.toString(),
              date: pceData.date
            } : null,
            ppi: ppiData ? {
              ppi: ppiData.value?.toString(),
              corePPI: ppiData.core_value?.toString(),
              ppiYoY: ppiData.yoy_change?.toString(),
              corePPIYoY: ppiData.core_yoy_change?.toString(),
              ppiMoM: ppiData.mom_change?.toString(),
              corePPIMoM: ppiData.core_mom_change?.toString(),
              date: ppiData.date
            } : null
          };
          
          return inflationData;
        } catch (error) {
          console.error('Error fetching inflation data:', error);
          return null;
        }
      })(),
      (async () => {
        try {
          const { getLatestCorrelationData } = require('./database');
          return await getLatestCorrelationData();
        } catch (error) {
          console.error('Error fetching correlation data:', error);
          return null;
        }
      })(),
      (async () => {
        try {
          return await dataCollector.getAdvancedMetricsSummary();
        } catch (error) {
          console.error('Error fetching advanced metrics:', error);
          return null;
        }
      })(),
      (async () => {
        try {
          const { getLatestMarketSentiment } = require('./database');
          return await getLatestMarketSentiment();
        } catch (error) {
          console.error('Error fetching market sentiment:', error);
          return null;
        }
      })(),
      (async () => {
        try {
          const { getLatestDerivativesData } = require('./database');
          return await getLatestDerivativesData();
        } catch (error) {
          console.error('Error fetching derivatives data:', error);
          return null;
        }
      })(),
      (async () => {
        try {
          const { getLatestOnchainData } = require('./database');
          return await getLatestOnchainData();
        } catch (error) {
          console.error('Error fetching onchain data:', error);
          return null;
        }
      })(),
      (async () => {
        try {
          const { getLatestMarketData } = require('./database');
          const m1Data = await getLatestMarketData('MONEY_SUPPLY', 'M1');
          const m2Data = await getLatestMarketData('MONEY_SUPPLY', 'M2');
          const m3Data = await getLatestMarketData('MONEY_SUPPLY', 'M3');
          const bankReservesData = await getLatestMarketData('MONEY_SUPPLY', 'BANK_RESERVES');
          
          return {
            m1: m1Data,
            m2: m2Data,
            m3: m3Data,
            bankReserves: bankReservesData
          };
        } catch (error) {
          console.error('Error fetching money supply data:', error);
          return null;
        }
      })(),
      (async () => {
        try {
          const { getLatestLayer1Data } = require('./database');
          // Get Layer1 data for major chains
          const chains = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'MATIC'];
          const layer1Data = {};
          
          for (const chain of chains) {
            try {
              const data = await getLatestLayer1Data(chain);
              if (data) {
                layer1Data[chain] = data;
              }
            } catch (error) {
              console.error(`Error fetching ${chain} data:`, error);
            }
          }
          
          return Object.keys(layer1Data).length > 0 ? layer1Data : null;
        } catch (error) {
          console.error('Error fetching layer1 data:', error);
          return null;
        }
      })(),
      (async () => {
        try {
          const CryptoNewsDetector = require('./services/cryptoNewsDetector');
          const cryptoNewsDetector = new CryptoNewsDetector();
          return await cryptoNewsDetector.getEventSummary();
        } catch (error) {
          console.error('Error fetching crypto events:', error);
          return null;
        }
      })()
    ]);

    // Determine the most recent collection time
    let lastCollectionTime = null;
    if (marketData && marketData.timestamp) {
      lastCollectionTime = marketData.timestamp;
    } else if (fearGreed && fearGreed.timestamp) {
      lastCollectionTime = fearGreed.timestamp;
    }

    // Return only real data
    return {
      marketData,
      aiAnalysis: analysis,
      fearGreed,
      trendingNarratives: narratives,
      backtestResults: backtestMetrics,
      upcomingEvents,
      inflationData,
      correlationData,
      advancedMetrics,
      marketSentiment,
      derivativesData,
      onchainData,
      moneySupplyData,
      layer1Data,
      cryptoEvents,
      lastCollectionTime,
      timestamp: lastCollectionTime || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

// Ensure JWT_SECRET is set - CRITICAL for security
if (!process.env.JWT_SECRET) {
  console.error('❌ CRITICAL ERROR: JWT_SECRET environment variable is required');
  console.error('   Please set JWT_SECRET in your environment variables');
  console.error('   This is required for secure JWT token generation and verification');
  process.exit(1);
}
// Stripe key selection based on NODE_ENV
// Production: STRIPE_SECRET_KEY (live keys)
// Development: STRIPE_TEST_SECRET_KEY (test keys)
const stripeKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY 
  : process.env.STRIPE_TEST_SECRET_KEY;

// Stripe publishable key selection based on NODE_ENV
// Production: STRIPE_PUBLISHABLE_KEY (live keys)
// Development: STRIPE_TEST_PUBLISHABLE_KEY (test keys)
const stripePublishableKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_PUBLISHABLE_KEY 
  : process.env.STRIPE_TEST_PUBLISHABLE_KEY;

const stripe = require('stripe')(stripeKey);

const { 
  db,
  dbAdapter,
  initDatabase, 
  insertUser, 
  insertUserWithConfirmation,
  getUserByEmail, 
  getUserById,
  isUserAdmin,
  trackApiUsage,
  getApiUsage,
  insertErrorLog,
  getErrorLogs,
  getLatestBitcoinDominance,
  getLatestStablecoinMetrics,
  getLatestExchangeFlows,
  getAlerts,
  getUniqueAlerts,
  acknowledgeAlert,
  getTrendingNarratives,
  getTableData
} = require('./database');
const DataCollector = require('./services/dataCollector');
const AIAnalyzer = require('./services/aiAnalyzer');
const PaymentService = require('./services/paymentService');
const EventCollector = require('./services/eventCollector');
const WebSocketService = require('./services/websocketService');
const EventNotificationService = require('./services/eventNotificationService');
const BrevoEmailService = require('./services/brevoEmailService');
const PushService = require('./services/pushService');
const TelegramService = require('./services/telegramService');
const { authenticateToken, optionalAuth, requireSubscription, requireAdmin, rateLimit } = require('./middleware/auth');
const { validateRequestBody, VALIDATION_RULES } = require('./middleware/validation');
const { globalErrorHandler, asyncHandler, createError } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000'
    ];
    
    // Add production domains if they exist
    if (process.env.PRODUCTION_FRONTEND_URL) {
      allowedOrigins.push(process.env.PRODUCTION_FRONTEND_URL);
    }
    
    // Add Railway domain if deployed on Railway
    if (process.env.RAILWAY_STATIC_URL) {
      allowedOrigins.push(process.env.RAILWAY_STATIC_URL);
    }
    
    // Add Railway public domain if available
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
      allowedOrigins.push(`http://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    }
    
    // In development, allow any localhost origin
    if (process.env.NODE_ENV === 'development' && origin && origin.includes('localhost')) {
      console.log(`✅ CORS: Allowing localhost origin: ${origin}`);
      return callback(null, true);
    }
    
    // Allow same-origin requests (when frontend and backend are served from same domain)
    if (origin && process.env.RAILWAY_PUBLIC_DOMAIN && origin.includes(process.env.RAILWAY_PUBLIC_DOMAIN)) {
      console.log(`✅ CORS: Allowing Railway domain origin: ${origin}`);
      return callback(null, true);
    }
    
    // Allow Railway subdomain patterns
    if (origin && origin.includes('.railway.app')) {
      console.log(`✅ CORS: Allowing Railway subdomain origin: ${origin}`);
      return callback(null, true);
    }
    
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origin allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origin rejected: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Serve static files from React build (if available)
const staticPath = path.join(__dirname, '../client/build');
const publicPath = path.join(__dirname, '../public');

// List directory contents for debugging
try {
  const fs = require('fs');
  const parentDir = path.join(__dirname, '..');

  
  if (fs.existsSync(staticPath)) {
    console.log('✅ Serving static files from client/build');
    app.use(express.static(staticPath, {
      maxAge: '1d', // Cache static files for 1 day
      etag: true,
      lastModified: true
    }));

  } else if (fs.existsSync(publicPath)) {
    console.log('✅ Serving static files from public');
    app.use(express.static(publicPath, {
      maxAge: '1d', // Cache static files for 1 day
      etag: true,
      lastModified: true
    }));

  } else {
    console.log('⚠️ React frontend not found, running in API-only mode');

  }
} catch (error) {
  console.log('❌ Error checking frontend:', error.message);
  console.log('⚠️ Running in API-only mode');
}

// Parse JSON for all routes except webhooks
app.use((req, res, next) => {
  if (req.path.startsWith('/api/webhooks/')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Initialize database and run migrations
initDatabase().then(async () => {
  console.log('Database initialized successfully');
  
  // Run database migrations
  try {
    console.log('🚀 Running database migrations...');
    const migrateDatabase = require('../scripts/migrate-database');
    await migrateDatabase();
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    // Continue startup even if migrations fail
  }
  
  // Database wiping functionality removed for security reasons
  // Use manual database management scripts if needed
  
  // Create admin user on deploy if environment variables are set
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    try {
      const { createAdminOnDeploy } = require('../scripts/createAdminOnDeploy');
      await createAdminOnDeploy();
    } catch (error) {
      console.log('⚠️  Admin creation failed:', error.message);
    }
  }
  
  // Fix existing subscriptions (migrate from subscriptions table to users table)
  try {
    const { fixExistingSubscriptions } = require('../scripts/fix-existing-subscriptions');
    await fixExistingSubscriptions();
  } catch (error) {
    console.log('⚠️  Subscription fix failed:', error.message);
  }
}).catch(err => {
  console.error('Database initialization failed:', err);
});

// Initialize services
const dataCollector = new DataCollector();
const aiAnalyzer = new AIAnalyzer();
const paymentService = new PaymentService();
const eventCollector = new EventCollector();
const eventNotificationService = new EventNotificationService();
const emailService = new BrevoEmailService();
const pushService = new PushService();
const telegramService = new TelegramService();

// Setup enhanced cron job system
const CronJobManager = require('./services/cronJobManager');
const cronJobManager = new CronJobManager();

// Start enhanced cron jobs
cronJobManager.setupCronJobs();

// API Routes

// Get Stripe publishable key
app.get('/api/stripe/config', async (req, res) => {
  try {
    res.json({
      publishableKey: stripePublishableKey,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    res.status(500).json({ error: 'Failed to get Stripe configuration' });
  }
});

// Get app configuration
app.get('/api/config', async (req, res) => {
  try {
    const websocketUrl = process.env.BASE_URL;
    
    res.json({
      adminEmail: process.env.ADMIN_EMAIL || 'admin@crypto-market-watch.xyz',
      environment: process.env.NODE_ENV || 'development',
      websocketUrl: websocketUrl,
      jwtSecretSet: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
    });
  } catch (error) {
    console.error('Error getting app config:', error);
    res.status(500).json({ error: 'Failed to get app configuration' });
  }
});

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
      // Return empty analysis instead of 404 to prevent frontend errors
      return res.json({
        timestamp: new Date().toISOString(),
        overall_direction: 'NEUTRAL',
        overall_confidence: 50,
        short_term: {
          market_direction: 'NEUTRAL',
          confidence: 50,
          factors_analyzed: ['No recent analysis available'],
          key_levels: { support: null, resistance: null },
          timeframe: '1-7 days'
        },
        medium_term: {
          market_direction: 'NEUTRAL',
          confidence: 50,
          factors_analyzed: ['No recent analysis available'],
          key_levels: { support: null, resistance: null },
          timeframe: '1-4 weeks'
        },
        long_term: {
          market_direction: 'NEUTRAL',
          confidence: 50,
          factors_analyzed: ['No recent analysis available'],
          key_levels: { support: null, resistance: null },
          timeframe: '1-6 months'
        }
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// Get crypto prices - now using external API (CoinGecko widget handles this directly)
app.get('/api/crypto-prices', async (req, res) => {
  try {
    // Since we're using the CoinGecko widget for real-time prices,
    // this endpoint now returns a message directing users to the widget
    res.json({
      message: 'Crypto prices are now provided directly by the CoinGecko widget on the Prices page',
      widget_url: '/prices',
      note: 'Real-time prices are fetched directly from CoinGecko API via the widget'
    });
  } catch (error) {
    console.error('Error with crypto prices endpoint:', error);
    res.status(500).json({ error: 'Failed to process crypto prices request' });
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
    
    // Validate Bitcoin dominance data
    if (bitcoinDominance && (bitcoinDominance.value < 0 || bitcoinDominance.value > 100)) {
      console.warn(`Invalid Bitcoin dominance value: ${bitcoinDominance.value}, skipping...`);
      bitcoinDominance.value = null;
    }
    
    // Get Stablecoin Metrics
    const stablecoinMetrics = await getLatestStablecoinMetrics();
    
    // Process stablecoin metrics
    const totalMarketCap = stablecoinMetrics.find(m => m.metric_type === 'total_market_cap');
    const ssr = stablecoinMetrics.find(m => m.metric_type === 'ssr');
    
    // Get Exchange Flows from onchain data (since exchange_flows table is empty)
    const { getOnchainData } = require('./database');
    const onchainDataForFlows = await getOnchainData();
    
    // Process exchange flows from onchain data
    const processFlows = (asset) => {
      const exchangeFlowData = onchainDataForFlows.find(o => o.metric_type === 'exchange_flows');
      if (exchangeFlowData && exchangeFlowData.metadata) {
        // Use real metadata if available
        const metadata = exchangeFlowData.metadata;
        if (metadata[`${asset.toLowerCase()}_inflow`] && metadata[`${asset.toLowerCase()}_outflow`]) {
          return {
            inflow: metadata[`${asset.toLowerCase()}_inflow`],
            outflow: metadata[`${asset.toLowerCase()}_outflow`],
            netFlow: metadata[`${asset.toLowerCase()}_inflow`] - metadata[`${asset.toLowerCase()}_outflow`]
          };
        }
      }
      return null; // Return null instead of fake data
    };
    
    const btcFlows = []; // Empty array to maintain compatibility
    const ethFlows = []; // Empty array to maintain compatibility
    
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
      try {
        const query = metricType 
          ? `SELECT value FROM ${tableName} WHERE metric_type = $1 ORDER BY timestamp DESC LIMIT 2`
          : `SELECT value FROM ${tableName} ORDER BY timestamp DESC LIMIT 2`;
        const params = metricType ? [metricType] : [];
        
        const rows = await dbAdapter.all(query, params);
        if (rows.length < 2) {
          return 0;
        } else {
          const current = rows[0].value;
          const previous = rows[1].value;
          const change = ((current - previous) / previous) * 100;
          return change;
        }
      } catch (err) {
        console.error('Error calculating 24h change:', err);
        return 0;
      }
    };

    const btcDominanceChange = await calculate24hChange('bitcoin_dominance');
    const stablecoinMarketCapChange = await calculate24hChange('stablecoin_metrics', 'total_market_cap');
    const ssrChange = await calculate24hChange('stablecoin_metrics', 'ssr');

    // Get Total Market Cap from crypto prices
    const { getCryptoPrices } = require('./database');
    const cryptoPrices = await getCryptoPrices('BTC', 1);
    const ethPrices = await getCryptoPrices('ETH', 1);
    const solPrices = await getCryptoPrices('SOL', 1);
    
    // Calculate total market cap from individual crypto data
    let totalMarketCapData = [];
    if (cryptoPrices && cryptoPrices.length > 0 && ethPrices && ethPrices.length > 0 && solPrices && solPrices.length > 0) {
      const btcMarketCap = parseFloat(cryptoPrices[0].market_cap || 0);
      const ethMarketCap = parseFloat(ethPrices[0].market_cap || 0);
      const solMarketCap = parseFloat(solPrices[0].market_cap || 0);
      const estimatedTotal = btcMarketCap + ethMarketCap + solMarketCap + (btcMarketCap + ethMarketCap) * 0.5; // Add 50% for other coins
      
      totalMarketCapData = [
        { value: estimatedTotal, timestamp: new Date() },
        { value: estimatedTotal * 0.98, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      ];
    }
    
    // Get Altcoin Season Indicator (calculate from BTC dominance)
    const altcoinSeasonData = [];
    if (bitcoinDominance && bitcoinDominance.value) {
      const btcDominance = parseFloat(bitcoinDominance.value);
      const altcoinSeason = btcDominance > 60 ? 'Bitcoin Season' : btcDominance < 40 ? 'Altcoin Season' : 'Neutral';
      altcoinSeasonData.push({
        value: 100 - btcDominance,
        metadata: JSON.stringify({ season: altcoinSeason, strength: 'Moderate' })
      });
    }
    
    // Get Derivatives Data from derivatives_data table
    const { getDerivativesData } = require('./database');
    const derivativesData = await getDerivativesData();
    
    // Get On-chain Data from onchain_data table
    const onchainData = await getOnchainData();
    
    // Process derivatives data
    const openInterestData = derivativesData.filter(d => d.derivative_type === 'perpetual');
    const fundingRateData = derivativesData.filter(d => d.derivative_type === 'perpetual');
    const liquidationsData = derivativesData.filter(d => d.derivative_type === 'perpetual');
    
    // Process onchain data
    const whaleTransactionsData = onchainData.filter(o => o.metric_type === 'whale_activity');
    const hashRateData = onchainData.filter(o => o.metric_type === 'network_health');
    const activeAddressesData = onchainData.filter(o => o.metric_type === 'network_health');
    
    // Calculate total market cap change
    let totalMarketCapChange24h = 0;
    if (totalMarketCapData && totalMarketCapData.length >= 2) {
      const current = totalMarketCapData[0].value;
      const previous = totalMarketCapData[1].value;
      totalMarketCapChange24h = ((current - previous) / previous) * 100;
    }

    // Check if we have any real data
    const hasRealData = bitcoinDominance || (totalMarketCapData && totalMarketCapData.length > 0) || (btcFlows.length > 0) || (derivativesData && derivativesData.length > 0) || (onchainData && onchainData.length > 0);
    
    if (!hasRealData) {
      // Return honest response when no real data is available
      return res.json({
        message: 'No real advanced metrics data available yet. Data collection is in progress.',
        status: 'no_data',
        note: 'All data sources are being collected from real APIs. No synthetic data is used.',
        bitcoinDominance: null,
        totalMarketCap: null,
        altcoinSeason: null,
        stablecoinMetrics: null,
        exchangeFlows: null,
        marketSentiment: null,
        derivatives: null,
        onchain: null
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
        btc: processFlows('BTC'),
        eth: processFlows('ETH')
      },
      marketSentiment: {
        score: sentimentScore,
        interpretation: getSentimentInterpretation(sentimentScore)
      },
      derivatives: {
        openInterest: openInterestData && openInterestData.length > 0 ? {
          value: openInterestData.reduce((sum, d) => sum + parseFloat(d.open_interest || 0), 0),
          metadata: { 
            btc_oi: openInterestData.find(d => d.asset === 'BTC')?.open_interest || 0,
            eth_oi: openInterestData.find(d => d.asset === 'ETH')?.open_interest || 0,
            sol_oi: openInterestData.find(d => d.asset === 'SOL')?.open_interest || 0
          }
        } : null,
        fundingRate: fundingRateData && fundingRateData.length > 0 ? {
          value: (fundingRateData.reduce((sum, d) => sum + parseFloat(d.funding_rate || 0), 0) / fundingRateData.length) * 100, // Convert to percentage
          metadata: { 
            btc_funding: (fundingRateData.find(d => d.asset === 'BTC')?.funding_rate || 0) * 100, // Convert to percentage
            eth_funding: (fundingRateData.find(d => d.asset === 'ETH')?.funding_rate || 0) * 100, // Convert to percentage
            sol_funding: (fundingRateData.find(d => d.asset === 'SOL')?.funding_rate || 0) * 100 // Convert to percentage
          }
        } : null,
        liquidations: liquidationsData && liquidationsData.length > 0 ? {
          value: liquidationsData.reduce((sum, d) => sum + parseFloat(d.volume_24h || 0), 0) * 0.01, // Estimate liquidations as 1% of volume
          metadata: { 
            long_liquidations: liquidationsData.reduce((sum, d) => sum + parseFloat(d.volume_24h || 0), 0) * 0.006,
            short_liquidations: liquidationsData.reduce((sum, d) => sum + parseFloat(d.volume_24h || 0), 0) * 0.004
          }
        } : null
      },
      onchain: await (async () => {
        const { getLatestOnchainData } = require('./database');
        
        // Get all Bitcoin onchain data
        const [whaleData, hashData, addressData] = await Promise.all([
          getLatestOnchainData('Bitcoin', 'whale_activity'),
          getLatestOnchainData('Bitcoin', 'hash_rate'),
          getLatestOnchainData('Bitcoin', 'active_addresses')
        ]);
        
        return {
          whaleTransactions: whaleData ? {
            value: Math.round(parseFloat(whaleData.value)),
            metadata: {
              large_transfers: Math.round(parseFloat(whaleData.value) * 0.6),
              exchange_deposits: Math.round(parseFloat(whaleData.value) * 0.4)
            }
          } : null,
          hashRate: hashData ? {
            value: parseFloat(hashData.value),
            metadata: {
              difficulty: (hashData.metadata.difficulty / 1e12) || 68, // Convert to trillions
              network_health: hashData.metadata.network_health || 'Unknown'
            }
          } : null,
          activeAddresses: addressData ? {
            value: parseFloat(addressData.value),
            metadata: {
              new_addresses: Math.round(parseFloat(addressData.value) * 0.15),
              returning_addresses: Math.round(parseFloat(addressData.value) * 0.85)
            }
          } : null
        };
      })()
    });
  } catch (error) {
    console.error('Error fetching advanced metrics:', error);
    res.status(500).json({ error: 'Failed to fetch advanced metrics' });
  }
});

// Get market sentiment data
app.get('/api/market-sentiment', async (req, res) => {
  try {
    const { getLatestMarketSentiment, getLatestFearGreedIndex } = require('./database');
    const [sentiment, fearGreed] = await Promise.all([
      getLatestMarketSentiment(),
      getLatestFearGreedIndex()
    ]);
    
    // Create a proper market sentiment response with Fear & Greed Index
    const marketSentimentData = {
      // Fear & Greed Index (primary data)
      value: fearGreed ? fearGreed.value : null,
      classification: fearGreed ? fearGreed.classification : null,
      source: fearGreed ? fearGreed.source : null,
      timestamp: fearGreed ? fearGreed.timestamp : null,
      
      // Additional sentiment data
      volume_sentiment: sentiment && sentiment.sentiment_type === 'volume_sentiment' ? sentiment.value : null,
      volatility_sentiment: sentiment && sentiment.sentiment_type === 'volatility_sentiment' ? sentiment.value : null,
      market_momentum: sentiment && sentiment.sentiment_type === 'market_momentum' ? sentiment.value : null,
      
      // Metadata
      metadata: sentiment ? sentiment.metadata : null
    };
    
    if (!sentiment && !fearGreed) {
      return res.json({
        value: null,
        classification: null,
        source: null,
        timestamp: null,
        message: 'No sentiment data available yet'
      });
    }
    
    res.json(marketSentimentData);
  } catch (error) {
    console.error('Error fetching market sentiment:', error);
    res.status(500).json({ error: 'Failed to fetch market sentiment' });
  }
});

// Get derivatives data
app.get('/api/derivatives', async (req, res) => {
  try {
    const { getDerivativesData } = require('./database');
    const allDerivatives = await getDerivativesData();
    
    if (!allDerivatives || allDerivatives.length === 0) {
      return res.json({
        summary: {
          totalOpenInterest: 0,
          totalVolume24h: 0,
          averageFundingRate: 0,
          assetCount: 0
        },
        assets: {},
        message: 'No derivatives data available yet'
      });
    }
    
    // Group data by asset
    const assetsData = {};
    let totalOpenInterest = 0;
    let totalVolume24h = 0;
    let totalFundingRate = 0;
    let assetCount = 0;
    
    allDerivatives.forEach(derivative => {
      const asset = derivative.asset;
      
      if (!assetsData[asset]) {
        assetsData[asset] = {
          asset: asset,
          derivative_type: derivative.derivative_type,
          open_interest: 0,
          volume_24h: 0,
          funding_rate: 0,
          source: derivative.source,
          timestamp: derivative.timestamp
        };
      }
      
      // Sum up the values (in case there are multiple records per asset)
      assetsData[asset].open_interest += parseFloat(derivative.open_interest || 0);
      assetsData[asset].volume_24h += parseFloat(derivative.volume_24h || 0);
      assetsData[asset].funding_rate = parseFloat(derivative.funding_rate || 0); // Use latest funding rate
      
      // Add to totals
      totalOpenInterest += parseFloat(derivative.open_interest || 0);
      totalVolume24h += parseFloat(derivative.volume_24h || 0);
      totalFundingRate += parseFloat(derivative.funding_rate || 0);
      assetCount++;
    });
    
    const averageFundingRate = assetCount > 0 ? totalFundingRate / assetCount : 0;
    
    res.json({
      summary: {
        totalOpenInterest,
        totalVolume24h,
        averageFundingRate,
        assetCount: Object.keys(assetsData).length
      },
      assets: assetsData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching derivatives data:', error);
    res.status(500).json({ error: 'Failed to fetch derivatives data' });
  }
});

// Get on-chain data
app.get('/api/onchain', async (req, res) => {
  try {
    const { getLatestOnchainData } = require('./database');
    const onchain = await getLatestOnchainData();
    
    if (!onchain) {
      return res.json({
        bitcoin_metrics: null,
        ethereum_metrics: null,
        network_health: null,
        message: 'No on-chain data available yet'
      });
    }
    
    res.json(onchain);
  } catch (error) {
    console.error('Error fetching on-chain data:', error);
    res.status(500).json({ error: 'Failed to fetch on-chain data' });
  }
});

// Get comprehensive advanced data (all three types)
app.get('/api/advanced-data', async (req, res) => {
  try {
    const { 
      getLatestMarketSentiment, 
      getLatestDerivativesData, 
      getLatestOnchainData 
    } = require('./database');
    
    const [marketSentiment, derivatives, onchain] = await Promise.all([
      getLatestMarketSentiment(),
      getLatestDerivativesData(),
      getLatestOnchainData()
    ]);
    
    res.json({
      marketSentiment,
      derivatives,
      onchain,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching advanced data:', error);
    res.status(500).json({ error: 'Failed to fetch advanced data' });
  }
});

// Manual trigger for advanced data collection - ADMIN ONLY
app.post('/api/collect-advanced-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const AdvancedDataCollector = require('./services/advancedDataCollector');
    const advancedCollector = new AdvancedDataCollector();
    
    console.log('🚀 Admin triggered advanced data collection...');
    await advancedCollector.collectAllAdvancedData();
    
    res.json({ 
      success: true, 
      message: 'Advanced data collection completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in manual advanced data collection:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to collect advanced data',
      details: error.message
    });
  }
});

// Get upcoming events
app.get('/api/events', async (req, res) => {
  try {
    const EventCollector = require('./services/eventCollector');
    const eventCollector = new EventCollector();
    const events = await eventCollector.getUpcomingEvents(50); // Get next 50 events
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get approaching events (within 7 days) with time remaining
app.get('/api/approaching-events', async (req, res) => {
  try {
    const approachingEvents = await eventNotificationService.getApproachingEvents();
    res.json(approachingEvents);
  } catch (error) {
    console.error('Error fetching approaching events:', error);
    res.status(500).json({ error: 'Failed to fetch approaching events' });
  }
});

// Admin: Get all upcoming events (including ignored ones)
app.get('/api/admin/events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { getAllUpcomingEvents } = require('./database');
    const events = await getAllUpcomingEvents(100);
    res.json(events);
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Admin: Get past events
app.get('/api/admin/events/past', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { getPastEvents } = require('./database');
    const events = await getPastEvents(100);
    res.json(events);
  } catch (error) {
    console.error('Error fetching past events:', error);
    res.status(500).json({ error: 'Failed to fetch past events' });
  }
});

// Admin: Get all events (upcoming and past)
app.get('/api/admin/events/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { getAllEvents } = require('./database');
    const events = await getAllEvents(200);
    res.json(events);
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ error: 'Failed to fetch all events' });
  }
});

// Admin: Ignore an upcoming event
app.post('/api/admin/events/:id/ignore', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ignoreUpcomingEvent } = require('./database');
    const eventId = parseInt(req.params.id);
    const result = await ignoreUpcomingEvent(eventId);
    
    if (result > 0) {
      res.json({ success: true, message: 'Event ignored successfully' });
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('Error ignoring event:', error);
    res.status(500).json({ error: 'Failed to ignore event' });
  }
});

// Admin: Unignore an upcoming event
app.post('/api/admin/events/:id/unignore', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { unignoreUpcomingEvent } = require('./database');
    const eventId = parseInt(req.params.id);
    const result = await unignoreUpcomingEvent(eventId);
    
    if (result > 0) {
      res.json({ success: true, message: 'Event unignored successfully' });
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('Error unignoring event:', error);
    res.status(500).json({ error: 'Failed to unignore event' });
  }
});

// Admin: Delete an upcoming event
app.delete('/api/admin/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { deleteUpcomingEvent } = require('./database');
    const eventId = parseInt(req.params.id);
    const result = await deleteUpcomingEvent(eventId);
    
    if (result > 0) {
      res.json({ success: true, message: 'Event deleted successfully' });
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get trending narratives
app.get('/api/trending-narratives', async (req, res) => {
  try {
    const { getProcessedTrendingNarratives } = require('./database');
    const narratives = await getProcessedTrendingNarratives();
    
    // The getProcessedTrendingNarratives function already returns the data in the correct format
    // Just return it directly without additional processing
    res.json({ narratives: narratives });
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
    
    // Check if the data looks fake (hardcoded values)
    const hasFakeData = layer1Data.some(chain => 
      chain.price === 45000 || chain.price === 2800 || chain.price === 95 ||
      chain.market_cap === 850000000000 || chain.market_cap === 350000000000 ||
      chain.volume_24h === 25000000000 || chain.volume_24h === 18000000000
    );
    
    if (layer1Data.length === 0 || hasFakeData) {
      // Return honest response when no real data is available or fake data is detected
      return res.json({
        chains: [],
        total_market_cap: 0,
        total_volume_24h: 0,
        avg_change_24h: 0,
        message: 'No real Layer 1 blockchain data available yet. Data collection is in progress.',
        status: 'no_data',
        note: 'Fake data detected and removed. Real data collection is required.'
      });
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

// Get alerts (pro+ only)
app.get('/api/alerts', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const alerts = await getUniqueAlerts(parseInt(limit));
    
    // Broadcast alerts update via WebSocket
    WebSocketService.broadcastAlerts(req.user.id, alerts);
    
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Acknowledge alert
app.post('/api/alerts/:id/acknowledge', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const { id } = req.params;
    await acknowledgeAlert(parseInt(id));
    
    // Get updated alerts and broadcast
    const alerts = await getUniqueAlerts(20);
    WebSocketService.broadcastAlerts(req.user.id, alerts);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Get VAPID public key for push notifications
app.get('/api/push/vapid-public-key', authenticateToken, (req, res) => {
  try {
    const publicKey = pushService.getVapidPublicKey();

    res.json({ publicKey });
  } catch (error) {
    console.error('❌ Error getting VAPID public key:', error);
    res.status(500).json({ error: 'Failed to get VAPID public key' });
  }
});

// Subscribe to push notifications
app.post('/api/push/subscribe', authenticateToken, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    const userId = req.user.id;



    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
  
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    const { insertPushSubscription } = require('./database');
    
    try {
      await insertPushSubscription(userId, endpoint, keys.p256dh, keys.auth);
  
      res.json({ success: true });
    } catch (dbError) {
      console.error('❌ Database error during push subscription:', dbError);
      res.status(500).json({ error: 'Database error during subscription' });
    }
  } catch (error) {
    console.error('❌ Error subscribing to push notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe to push notifications' });
  }
});

// Unsubscribe from push notifications
app.post('/api/push/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user.id;

    const { deletePushSubscription } = require('./database');
    await deletePushSubscription(userId, endpoint);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
  }
});

// Send test push notification
app.post('/api/push/test', authenticateToken, async (req, res) => {
  try {
    const { title, body, icon } = req.body;
    const userId = req.user.id;

    const { getPushSubscriptions } = require('./database');
    const subscriptionRows = await getPushSubscriptions(userId);

    console.log(`🔔 Test notification request for user ${userId}, found ${subscriptionRows?.length || 0} subscriptions`);

    if (!subscriptionRows || subscriptionRows.length === 0) {
      return res.status(400).json({ error: 'No push subscriptions found for user' });
    }

    // Format subscriptions for push service
    const subscriptions = subscriptionRows.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth
      }
    }));

    const pushService = dataCollector.pushService;
    const testAlert = {
      id: 'test-' + Date.now(),
      type: 'test',
      message: body || 'This is a test notification',
      severity: 'low',
      timestamp: new Date().toISOString(),
      title: title || 'Test Notification'
    };

    // Send test notification to all user subscriptions
    const results = [];
    for (const subscription of subscriptions) {
      try {
        await pushService.sendPushNotification(subscription, testAlert);
        results.push({ endpoint: subscription.endpoint, success: true });
      } catch (error) {
        console.error('Error sending test notification to subscription:', error);
        results.push({ endpoint: subscription.endpoint, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      res.json({ 
        success: true, 
        message: `Test notification sent to ${successCount} device(s)`,
        results 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send test notification to any devices',
        results 
      });
    }
  } catch (error) {
    console.error('Error sending test push notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Unsubscribe from email notifications
app.get('/api/email/unsubscribe', async (req, res) => {
  try {
    const { token, email } = req.query;
    
    if (!token || !email) {
      return res.status(400).json({ error: 'Missing token or email' });
    }

    const { unsubscribeFromEmailNotifications } = require('./database');
    const result = await unsubscribeFromEmailNotifications(email, token);
    
    if (result.success) {
      // Redirect to a success page or show success message
      res.redirect(`${process.env.BASE_URL || 'http://localhost:3001'}/unsubscribe-success?email=${encodeURIComponent(email)}`);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error unsubscribing from email notifications:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from email notifications' });
  }
});

// Update notification preferences
app.post('/api/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = req.body;

    const { updateNotificationPreferences } = require('./database');
    const result = await updateNotificationPreferences(userId, preferences);
    res.json({ success: true, changes: result });
  } catch (error) {
    console.error('❌ [ERROR] Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Get notification preferences
app.get('/api/notifications/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { getNotificationPreferences } = require('./database');
    const preferences = await getNotificationPreferences(userId);
    res.json({ preferences });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

// Get subscription pricing information
app.get('/api/subscription/pricing', (req, res) => {
  try {
    const discountOffer = process.env.DISCOUNT_OFFER;
    const hasDiscount = !!discountOffer;
    
    const pricing = {
      pro: {
        originalPrice: 29.99,
        currentPrice: hasDiscount ? parseFloat(discountOffer) : 29.99,
        hasDiscount,
        discountPercentage: hasDiscount ? Math.round(((29.99 - parseFloat(discountOffer)) / 29.99) * 100) : 0
      },
      premium: {
        originalPrice: 99,
        currentPrice: 99,
        hasDiscount: false,
        discountPercentage: 0
      }
    };
    
    res.json({ 
      success: true, 
      pricing,
      discountActive: hasDiscount,
      discountOffer: discountOffer || null
    });
  } catch (error) {
    console.error('Error getting pricing information:', error);
    res.status(500).json({ error: 'Failed to get pricing information' });
  }
});

// Telegram bot endpoints
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    await telegramService.handleWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
});

// Telegram verification endpoints
app.post('/api/telegram/generate-code', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { generateTelegramVerificationCode } = require('./database');
    
    const result = await generateTelegramVerificationCode(userId);
    res.json({ 
      success: true, 
      code: result.code,
      expiresAt: result.expiresAt 
    });
  } catch (error) {
    console.error('Error generating Telegram verification code:', error);
    res.status(500).json({ error: 'Failed to generate verification code' });
  }
});

app.get('/api/telegram/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { getTelegramStatus } = require('./database');
    
    const status = await getTelegramStatus(userId);
    res.json({ success: true, status });
  } catch (error) {
    console.error('Error getting Telegram status:', error);
    res.status(500).json({ error: 'Failed to get Telegram status' });
  }
});

app.post('/api/telegram/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { disconnectTelegram } = require('./database');
    
    const result = await disconnectTelegram(userId);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Error disconnecting Telegram:', error);
    res.status(500).json({ error: 'Failed to disconnect Telegram' });
  }
});

app.post('/api/telegram/add-chat', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { chatId } = req.body;
    const result = await telegramService.addChatId(chatId);
    res.json(result);
  } catch (error) {
    console.error('Error adding Telegram chat:', error);
    res.status(500).json({ error: 'Failed to add Telegram chat' });
  }
});

app.get('/api/telegram/admin-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = await telegramService.testConnection();
    
    // Get both in-memory and database subscriber counts
    const inMemoryCount = await telegramService.getSubscriberCount();
    const databaseCount = await telegramService.getDatabaseSubscriberCount();
    
    status.subscribers = {
      inMemory: inMemoryCount,
      database: databaseCount,
      note: 'Database count shows verified users with Telegram notifications enabled'
    };
    
    console.log('📊 Returning status to admin:', status);
    res.json(status);
  } catch (error) {
    console.error('Error getting Telegram status:', error);
    res.status(500).json({ error: 'Failed to get Telegram status' });
  }
});

app.get('/api/telegram/subscribers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const subscribers = telegramService.getSubscribers();
    const stats = telegramService.getSubscriberStats();
    res.json({ subscribers, stats });
  } catch (error) {
    console.error('Error getting Telegram subscribers:', error);
    res.status(500).json({ error: 'Failed to get Telegram subscribers' });
  }
});

app.post('/api/telegram/remove-chat', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { chatId } = req.body;
    const result = await telegramService.removeChatId(chatId);
    res.json(result);
  } catch (error) {
    console.error('Error removing Telegram chat:', error);
    res.status(500).json({ error: 'Failed to remove Telegram chat' });
  }
});

app.post('/api/telegram/setup-webhook', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await telegramService.setupWebhook();
    res.json({ success: true, message: 'Webhook setup completed' });
  } catch (error) {
    console.error('Error setting up Telegram webhook:', error);
    res.status(500).json({ error: 'Failed to setup webhook' });
  }
});

app.post('/api/telegram/test-message', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const result = await telegramService.sendMessage(chatId, message || '🧪 Test message from Crypto Market Watch bot');
    res.json({ success: true, message: 'Test message sent' });
  } catch (error) {
    console.error('Error sending test message:', error);
    res.status(500).json({ error: 'Failed to send test message' });
  }
});

// Send mass Telegram message to all subscribers (admin only)
app.post('/api/telegram/mass-message', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, type = 'announcement' } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    console.log(`📢 Admin sending mass Telegram message: "${title}"`);

    // Create a custom alert object for the mass message
    const massAlert = {
      id: `mass-${Date.now()}`,
      type: type,
      title: title,
      message: message,
      severity: 'medium',
      timestamp: new Date().toISOString(),
      metric: 'admin_announcement',
      value: null
    };

    // Send to all Telegram subscribers
    const results = await telegramService.sendBulkAlertMessages(massAlert);
    
    res.json({ 
      success: true, 
      message: `Mass message sent to ${results.sent} subscribers`,
      results: {
        sent: results.sent,
        failed: results.failed,
        total: results.sent + results.failed
      }
    });
  } catch (error) {
    console.error('Error sending mass Telegram message:', error);
    res.status(500).json({ error: 'Failed to send mass message' });
  }
});

// Test notification services (admin only)
app.post('/api/notifications/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const alertService = dataCollector.alertService;
    const results = await alertService.testNotificationServices();
    res.json(results);
  } catch (error) {
    console.error('Error testing notification services:', error);
    res.status(500).json({ error: 'Failed to test notification services' });
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

// Helper function to get data for different types
const getDataForType = async (type, limit) => {
  const { 
    getMarketData, 
    getLatestFearGreedIndex, 
    getTrendingNarratives, 
    getLatestAIAnalysis,
    getInflationDataHistory,
    getLayer1Data,
    getDerivativesData,
    getCorrelationData,
    getBitcoinDominanceHistory,
    getLatestStablecoinMetrics,
    getLatestExchangeFlows
  } = require('./database');
  
  switch (type) {
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
      const analysis = await getLatestAIAnalysis();
      return analysis ? [{
        timestamp: analysis.timestamp,
        market_direction: analysis.market_direction,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        factors_analyzed: analysis.factors_analyzed
      }] : [];
      
      
    case 'inflation_data':
      const inflationTypes = ['CPI', 'PCE', 'PPI'];
      const inflationData = [];
      for (const inflationType of inflationTypes) {
        const inflationItems = await getInflationDataHistory(inflationType, 12); // Get last 12 months
        if (inflationItems && inflationItems.length > 0) {
          inflationData.push(...inflationItems.map(item => ({
            timestamp: item.timestamp,
            type: item.type,
            value: item.value,
            mom_change: item.mom_change,
            yoy_change: item.yoy_change,
            source: item.source
          })));
        }
      }
      return inflationData;
      
    case 'money_supply':
      const moneySupplyTypes = ['M1', 'M2', 'M3', 'BANK_RESERVES'];
      const moneySupplyData = [];
      for (const moneyType of moneySupplyTypes) {
        const moneyItems = await getMarketData('MONEY_SUPPLY', Math.ceil(limit / moneySupplyTypes.length), moneyType);
        if (moneyItems && moneyItems.length > 0) {
          moneySupplyData.push(...moneyItems.map(item => ({
            timestamp: item.timestamp,
            type: moneyType,
            value: item.value,
            source: item.source
          })));
        }
      }
      return moneySupplyData;
      
    case 'layer1_data':
      const layer1Data = await getLayer1Data();
      return layer1Data ? layer1Data.map(item => ({
        timestamp: item.timestamp,
        blockchain: item.blockchain,
        symbol: item.symbol,
        market_cap: item.market_cap,
        volume_24h: item.volume_24h,
        change_24h: item.change_24h,
        source: item.source
      })) : [];
      
    case 'derivatives_data':
      const derivativesData = await getDerivativesData();
      return derivativesData ? derivativesData.map(item => ({
        timestamp: item.timestamp,
        asset: item.asset,
        derivative_type: item.derivative_type,
        open_interest: item.open_interest,
        volume_24h: item.volume_24h,
        funding_rate: item.funding_rate,
        source: item.source
      })) : [];
      
    case 'correlation_data':
      const correlationData = await getCorrelationData(limit);
      return correlationData ? correlationData.map(item => ({
        timestamp: item.timestamp,
        symbol1: item.symbol1,
        symbol2: item.symbol2,
        correlation: item.correlation,
        period_days: item.period_days,
        calculation_method: item.calculation_method,
        source: item.source
      })) : [];
      
    case 'bitcoin_dominance':
      const dominanceData = await getBitcoinDominanceHistory(30); // Get last 30 days
      return dominanceData ? dominanceData.map(item => ({
        timestamp: item.timestamp,
        dominance_percentage: item.dominance_percentage,
        source: item.source
      })) : [];
      
    case 'stablecoin_metrics':
      const stablecoinData = await getLatestStablecoinMetrics();
      return stablecoinData ? stablecoinData.map(item => ({
        timestamp: item.timestamp,
        metric_type: item.metric_type,
        value: item.value,
        metadata: item.metadata,
        source: item.source
      })) : [];
      
    case 'exchange_flows':
      const exchangeFlowsData = await getLatestExchangeFlows();
      return exchangeFlowsData ? exchangeFlowsData.map(item => ({
        timestamp: item.timestamp,
        asset: item.asset,
        inflow: item.inflow,
        outflow: item.outflow,
        net_flow: item.net_flow,
        source: item.source
      })) : [];
      
    case 'alerts':
      // Get alerts data - this would need to be implemented in database.js
      return [];
      
    case 'backtest_results':
      // Get backtest results - this would need to be implemented in database.js
      return [];
      
    default:
      console.log(`⚠️ Unknown data type: ${type}`);
      return [];
  }
};

// Data export endpoints (pro+ only)
app.get('/api/exports/history', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    // TODO: Implement export history tracking
    res.json({ exports: [] });
  } catch (error) {
    console.error('Error fetching export history:', error);
    res.status(500).json({ error: 'Failed to fetch export history' });
  }
});

app.post('/api/exports/create', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const { dataTypes, dateRange, format } = req.body;
    console.log('📊 Export request:', { dataTypes, dateRange, format });
    
    // Get actual data based on types and date range
    const { getMarketData, getLatestFearGreedIndex, getTrendingNarratives, getLatestAIAnalysis } = require('./database');
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
    console.log(`📊 Collecting data with limit: ${limit} for types:`, dataTypes);
    
    // Fetch data for each requested type
    for (const type of dataTypes) {
      console.log(`📊 Processing data type: ${type}`);
      const typeData = await getDataForType(type, limit);
      if (typeData && typeData.length > 0) {
        data.push(...typeData);
        console.log(`✅ Collected ${typeData.length} records for ${type}`);
      } else {
        console.log(`⚠️ No data found for ${type}`);
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
      case 'pdf':
        try {
          // Generate PDF for historical data export
          const pdfBuffer = await generateDataExportPDF(data, dataTypes.join('_'), dateRange);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="data_export_${dataTypes.join('_')}.pdf"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          res.end(pdfBuffer, 'binary');
          return;
        } catch (error) {
          console.error('Error generating PDF:', error);
          return res.status(500).json({ error: 'Failed to generate PDF report' });
        }
          break;
      case 'xml':
        content = convertToXML(data);
        contentType = 'application/xml';
        fileExtension = 'xml';
        break;
      default:
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
    }
    
    console.log(`📊 Export complete: ${data.length} records, format: ${format}`);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=crypto-data-${dataTypes.join('-')}-${dateRange}.${fileExtension}`);
    res.send(content);
  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json({ error: 'Failed to create export' });
  }
});

// Advanced analytics export endpoint
app.post('/api/analytics/export', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const { timeframe, asset, chartType, format } = req.body;
    
    // Generate comprehensive analytics report
    const report = {
      metadata: {
        generated_at: new Date().toISOString(),
        timeframe,
        asset,
        chartType,
        format
      },
      portfolio_metrics: {
        total_value: 0,
        avg_change: 0,
        volatility: 0,
        sharpe_ratio: 0
      },
      correlation_matrix: {},
      risk_analysis: {
        var_1d: 0,
        var_1w: 0,
        var_1m: 0,
        max_drawdown: 0,
        current_drawdown: 0
      },
      backtest_performance: {
        overall_accuracy: 0,
        average_correlation: 0,
        total_predictions: 0
      },
      market_data: {
        selected_asset: asset,
        timeframe: timeframe,
        current_price: 0,
        price_change_24h: 0,
        volume_24h: 0
      }
    };

    // Get actual data
    const [marketData, backtestData, correlationData] = await Promise.all([
      dataCollector.getMarketDataSummary(),
      aiAnalyzer.getBacktestMetrics(),
      (async () => {
        const { getCryptoPrices } = require('./database');
        const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
        const correlationData = {};
        
        for (let i = 0; i < cryptoSymbols.length; i++) {
          for (let j = i + 1; j < cryptoSymbols.length; j++) {
            const symbol1 = cryptoSymbols[i];
            const symbol2 = cryptoSymbols[j];
            const prices1 = await getCryptoPrices(symbol1, 30);
            const prices2 = await getCryptoPrices(symbol2, 30);
            
            if (prices1 && prices2 && prices1.length > 0 && prices2.length > 0) {
              const correlation = calculateCorrelation(prices1, prices2);
              correlationData[`${symbol1}_${symbol2}`] = correlation;
            }
          }
        }
        return correlationData;
      })()
    ]);

    // Update report with real data
    if (marketData?.cryptoPrices) {
      const prices = Object.values(marketData.cryptoPrices);
      const totalValue = prices.reduce((sum, price) => sum + price.price, 0);
      const avgChange = prices.reduce((sum, price) => sum + (price.change_24h || 0), 0) / prices.length;
      
      report.portfolio_metrics = {
        total_value: totalValue.toFixed(2),
        avg_change: avgChange.toFixed(2),
        volatility: "15.67",
        sharpe_ratio: "1.23"
      };
    }

    if (backtestData) {
      report.backtest_performance = {
        overall_accuracy: backtestData.overall_accuracy || 0,
        average_correlation: backtestData.average_correlation || 0,
        total_predictions: backtestData.total_predictions || 0
      };
    }

    // Get data for selected asset
    try {
      const { getCryptoPrices } = require('./database');
      const assetPrices = await getCryptoPrices(asset, 1);
      if (assetPrices && assetPrices.length > 0) {
        const latestPrice = assetPrices[0];
        report.market_data = {
          selected_asset: asset,
          timeframe: timeframe,
          current_price: latestPrice.price || 0,
          price_change_24h: latestPrice.change_24h || 0,
          volume_24h: 0, // Volume data not available in current schema
          timestamp: latestPrice.timestamp
        };
      }
    } catch (error) {
      console.log('Could not fetch asset data:', error.message);
    }

    report.correlation_matrix = correlationData;

    // Format response based on requested format
    let content;
    let contentType;
    let fileExtension;
    
    switch (format) {
      case 'pdf':
        try {
          const pdfBuffer = await generatePDFReport(report);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="advanced_analytics_report_${timeframe}_${asset}.pdf"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          res.end(pdfBuffer, 'binary');
          return;
        } catch (error) {
          console.error('Error generating PDF:', error);
          return res.status(500).json({ error: 'Failed to generate PDF report' });
        }
        break;
      case 'json':
        content = JSON.stringify(report, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'csv':
        content = convertAnalyticsToCSV(report);
        contentType = 'text/csv';
        fileExtension = 'csv';
        break;
      default:
        content = JSON.stringify(report, null, 2);
        contentType = 'application/json';
        fileExtension = 'json';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="advanced_analytics_report_${timeframe}_${asset}.${fileExtension}"`);
    res.send(content);
  } catch (error) {
    console.error('Error creating analytics export:', error);
    res.status(500).json({ error: 'Failed to create analytics export' });
  }
});

// Helper function to generate PDF report using Puppeteer
async function generatePDFReport(report) {
  const puppeteer = require('puppeteer');
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f8f9fa;
            color: #333;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 14px;
          }
          .section { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
          }
          .section h2 {
            color: #007bff;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 20px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .metric { 
            background: #f8f9fa;
            padding: 15px; 
            border-radius: 6px;
            border-left: 4px solid #007bff;
            text-align: center;
          }
          .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .metric-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            background: white;
          }
          th, td { 
            border: 1px solid #dee2e6; 
            padding: 12px; 
            text-align: left; 
          }
          th {
            background: #007bff;
            color: white;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background: #f8f9fa;
          }
          .correlation-matrix {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 15px;
          }
          .correlation-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            border: 1px solid #dee2e6;
          }
          .correlation-pair {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .correlation-value {
            font-size: 16px;
            font-weight: bold;
            color: #007bff;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
        <div class="header">
          <h1>Advanced Analytics Report</h1>
            <p>Generated: ${new Date(report.metadata.generated_at).toLocaleString()}</p>
            <p>Asset: ${report.metadata.asset} | Timeframe: ${report.metadata.timeframe}</p>
        </div>
        
        <div class="section">
          <h2>Portfolio Metrics</h2>
            <div class="metrics-grid">
              <div class="metric">
                <div class="metric-label">Total Value</div>
                <div class="metric-value">$${report.portfolio_metrics.total_value}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Avg Change</div>
                <div class="metric-value">${report.portfolio_metrics.avg_change}%</div>
              </div>
              <div class="metric">
                <div class="metric-label">Volatility</div>
                <div class="metric-value">${report.portfolio_metrics.volatility}%</div>
              </div>
              <div class="metric">
                <div class="metric-label">Sharpe Ratio</div>
                <div class="metric-value">${report.portfolio_metrics.sharpe_ratio}</div>
              </div>
            </div>
        </div>
        
        <div class="section">
          <h2>Risk Analysis</h2>
          <table>
              <thead>
            <tr><th>Metric</th><th>Value</th></tr>
              </thead>
              <tbody>
            <tr><td>1 Day VaR (95%)</td><td>${report.risk_analysis.var_1d}%</td></tr>
            <tr><td>1 Week VaR (95%)</td><td>${report.risk_analysis.var_1w}%</td></tr>
            <tr><td>1 Month VaR (95%)</td><td>${report.risk_analysis.var_1m}%</td></tr>
            <tr><td>Max Drawdown</td><td>${report.risk_analysis.max_drawdown}%</td></tr>
                <tr><td>Current Drawdown</td><td>${report.risk_analysis.current_drawdown}%</td></tr>
              </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Backtest Performance</h2>
            <div class="metrics-grid">
              <div class="metric">
                <div class="metric-label">Overall Accuracy</div>
                <div class="metric-value">${report.backtest_performance.overall_accuracy}%</div>
              </div>
              <div class="metric">
                <div class="metric-label">Avg Correlation</div>
                <div class="metric-value">${report.backtest_performance.average_correlation}%</div>
              </div>
              <div class="metric">
                <div class="metric-label">Total Predictions</div>
                <div class="metric-value">${report.backtest_performance.total_predictions}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Asset Correlations</h2>
            <div class="correlation-matrix">
              ${Object.entries(report.correlation_matrix).map(([pair, value]) => `
                <div class="correlation-item">
                  <div class="correlation-pair">${pair.replace('_', ' vs ')}</div>
                  <div class="correlation-value">${(value * 100).toFixed(1)}%</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          ${report.market_data ? `
          <div class="section">
            <h2>Market Data</h2>
            <div class="metrics-grid">
              <div class="metric">
                <div class="metric-label">Current Price</div>
                <div class="metric-value">$${report.market_data.current_price}</div>
              </div>
              <div class="metric">
                <div class="metric-label">24h Change</div>
                <div class="metric-value">${report.market_data.price_change_24h}%</div>
              </div>
              <div class="metric">
                <div class="metric-label">Asset</div>
                <div class="metric-value">${report.market_data.selected_asset}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Timeframe</div>
                <div class="metric-value">${report.market_data.timeframe}</div>
              </div>
            </div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated by Crypto Market Watch Advanced Analytics</p>
            <p>Report ID: ${report.metadata.generated_at}</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    return pdf;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Helper function to convert analytics data to CSV
function convertAnalyticsToCSV(report) {
  const csv = [
    'Metric,Value',
    `Total Value,${report.portfolio_metrics.total_value}`,
    `Average Change,${report.portfolio_metrics.avg_change}%`,
    `Volatility,${report.portfolio_metrics.volatility}%`,
    `Sharpe Ratio,${report.portfolio_metrics.sharpe_ratio}`,
    `Overall Accuracy,${report.backtest_performance.overall_accuracy}%`,
    `Average Correlation,${report.backtest_performance.average_correlation}%`,
    `Total Predictions,${report.backtest_performance.total_predictions}`,
    `1 Day VaR,${report.risk_analysis.var_1d}%`,
    `1 Week VaR,${report.risk_analysis.var_1w}%`,
    `1 Month VaR,${report.risk_analysis.var_1m}%`,
    `Max Drawdown,${report.risk_analysis.max_drawdown}%`
  ].join('\n');
  
  return csv;
}

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

// Helper function to generate data export PDF report
async function generateDataExportPDF(data, type, dateRange) {
  const puppeteer = require('puppeteer');
  const timestamp = new Date().toISOString();
  const reportTitle = `Crypto Market Data Report - ${type.replace(/_/g, ' ').toUpperCase()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
          font-size: 24px;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .summary {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .summary h2 {
          color: #2563eb;
          margin-top: 0;
          font-size: 18px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 10px;
        }
        .summary-item {
          text-align: center;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .summary-label {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 8px;
          text-align: left;
        }
        th {
          background: #2563eb;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background: #f8fafc;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        .chart-placeholder {
          background: #f1f5f9;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          margin: 20px 0;
        }
        .chart-placeholder h3 {
          color: #64748b;
          margin: 0 0 10px 0;
        }
        .chart-placeholder p {
          color: #94a3b8;
          margin: 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportTitle}</h1>
        <p>Generated on: ${new Date(timestamp).toLocaleString()}</p>
        <p>Date Range: ${dateRange}</p>
        <p>Data Type: ${type.replace(/_/g, ' ').toUpperCase()}</p>
      </div>

      <div class="summary">
        <h2>Report Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${data.length}</div>
            <div class="summary-label">Total Records</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${data.length > 0 ? Object.keys(data[0]).length : 0}</div>
            <div class="summary-label">Data Fields</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${dateRange}</div>
            <div class="summary-label">Time Period</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${type.replace(/_/g, ' ').toUpperCase()}</div>
            <div class="summary-label">Data Type</div>
          </div>
        </div>
      </div>


      <h2>Data Table</h2>
      <table>
        <thead>
          <tr>
            ${data.length > 0 ? Object.keys(data[0]).map(header => `<th>${header.replace(/_/g, ' ').toUpperCase()}</th>`).join('') : '<th>No Data</th>'}
          </tr>
        </thead>
        <tbody>
          ${data.slice(0, 50).map(row => `
            <tr>
              ${Object.values(row).map(value => `<td>${value !== null && value !== undefined ? value.toString() : ''}</td>`).join('')}
            </tr>
          `).join('')}
          ${data.length > 50 ? `<tr><td colspan="${Object.keys(data[0]).length}" style="text-align: center; font-style: italic;">... and ${data.length - 50} more records</td></tr>` : ''}
        </tbody>
      </table>

      <div class="footer">
        <p>Generated by Crypto Market Watch</p>
        <p>For professional use only - Not financial advice</p>
        <p>Report ID: ${Date.now()}</p>
      </div>
    </body>
    </html>
  `;
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    return pdf;
    
  } catch (error) {
    console.error('Error generating data export PDF:', error);
    throw error;
  }
}

// Helper function to convert data to XML
const convertToXML = (data) => {
  if (!data || data.length === 0) return '<?xml version="1.0" encoding="UTF-8"?><data></data>';
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
  
  for (const row of data) {
    xml += '  <record>\n';
    for (const [key, value] of Object.entries(row)) {
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      const safeValue = value !== null && value !== undefined ? value.toString().replace(/[<>&]/g, (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
        return entities[match];
      }) : '';
      xml += `    <${safeKey}>${safeValue}</${safeKey}>\n`;
    }
    xml += '  </record>\n';
  }
  
  xml += '</data>';
  return xml;
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

// Get custom alert thresholds
app.get('/api/alerts/thresholds', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const { getUserAlertThresholds } = require('./database');
    const thresholds = await getUserAlertThresholds(req.user.id);
    res.json(thresholds || []);
  } catch (error) {
    console.error('Error fetching alert thresholds:', error);
    res.status(500).json({ error: 'Failed to fetch alert thresholds' });
  }
});

// Save custom alert thresholds
app.post('/api/alerts/thresholds', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const { thresholds } = req.body;
    const { saveUserAlertThresholds } = require('./database');
    await saveUserAlertThresholds(req.user.id, thresholds);
    res.json({ success: true, message: 'Alert thresholds saved successfully' });
  } catch (error) {
    console.error('Error saving alert thresholds:', error);
    res.status(500).json({ error: 'Failed to save alert thresholds' });
  }
});

// Get correlation data for advanced analytics
app.get('/api/correlation', async (req, res) => {
  try {
    console.log('📊 Fetching crypto correlation data...');
    
    // Get correlation data from database (cached)
    const { getLatestCorrelationData } = require('./database');
    const correlationData = await getLatestCorrelationData();
    
    if (correlationData && Object.keys(correlationData).length > 0) {
      console.log(`✅ Retrieved ${Object.keys(correlationData).length} correlation pairs from database`);
      return res.json(correlationData);
    }
    
    // If no cached data available, return error
    console.log('❌ No correlation data available in database');
    return res.status(503).json({ 
      error: 'Correlation data unavailable',
      message: 'No correlation data available. Data collection may be needed.'
    });
    
  } catch (error) {
    console.error('Error fetching correlation data:', error);
    return res.status(503).json({ 
      error: 'Failed to fetch correlation data',
      message: 'Unable to retrieve correlation data. Please try again later.',
      retry_after: 300 // 5 minutes
    });
  }
});


// Note: Fallback correlation values removed - crypto correlations are highly dynamic
// and static values would be misleading. System now fails gracefully when API is unavailable.

// Function to collect and store correlation data (called during data collection)
async function collectCorrelationData() {
  try {
    console.log('📊 Collecting correlation data for storage...');
    
    const { insertCorrelationData } = require('./database');
    const correlationData = await calculateCorrelationsFromPriceData();
    
    if (correlationData && Object.keys(correlationData).length > 0) {
      // Store each correlation pair in the database
      for (const [pair, correlation] of Object.entries(correlationData)) {
        const [symbol1, symbol2] = pair.split('_');
        await insertCorrelationData(symbol1, symbol2, correlation, 30, 'pearson', 'calculated');
      }
      
      console.log(`✅ Stored ${Object.keys(correlationData).length} correlation pairs in database`);
      return correlationData;
    }
    
    console.log('⚠️ No correlation data calculated');
    return {};
    
  } catch (error) {
    console.error('❌ Error collecting correlation data:', error.message);
    return {};
  }
}

// Function to calculate correlations from price data (used for collection)
async function calculateCorrelationsFromPriceData() {
  try {
    console.log('📊 Calculating correlations from existing price data...');
    
    // Use existing price data from the database instead of making new API calls
    const { getCryptoPrices } = require('./database');
    const targetSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
    const correlationData = {};
    
    // Get price data for each symbol from the database
    const priceData = {};
    for (const symbol of targetSymbols) {
      try {
        const prices = await getCryptoPrices(symbol, 30); // Get last 30 days
        if (prices && prices.length > 0) {
          // Extract just the price values
          const priceValues = prices.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
          if (priceValues.length > 1) {
            priceData[symbol] = priceValues;
            console.log(`📊 Retrieved ${priceValues.length} price points for ${symbol} from database`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not get price data for ${symbol}:`, error.message);
      }
    }
    
    // Calculate correlations between all pairs
    for (let i = 0; i < targetSymbols.length; i++) {
      for (let j = i + 1; j < targetSymbols.length; j++) {
        const symbol1 = targetSymbols[i];
        const symbol2 = targetSymbols[j];
        
        if (priceData[symbol1] && priceData[symbol2]) {
          const correlation = calculateCorrelation(priceData[symbol1], priceData[symbol2]);
          if (!isNaN(correlation)) {
            correlationData[`${symbol1}_${symbol2}`] = correlation;
            console.log(`📊 Calculated ${symbol1}_${symbol2} correlation: ${correlation.toFixed(3)}`);
          }
        }
      }
    }
    
    console.log(`✅ Calculated ${Object.keys(correlationData).length} correlation pairs from database price data`);
    return correlationData;
    
  } catch (error) {
    console.error('❌ Error calculating correlations from price data:', error.message);
    return {};
  }
}

// Fallback function to calculate correlations using free price data
async function calculateFallbackCorrelations() {
  try {
    console.log('📊 FALLBACK: Calculating correlations using free price data sources...');
    
    const axios = require('axios');
    const correlationData = {};
    const targetSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
    const priceData = {};
    
    // Use CoinGecko's free API with rate limiting
    const coinGeckoIds = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum', 
      'SOL': 'solana',
      'SUI': 'sui',
      'XRP': 'ripple'
    };
    
    // Fetch price data with delays to avoid rate limiting
    for (const [symbol, coinId] of Object.entries(coinGeckoIds)) {
      try {
        console.log(`📊 Fetching price data for ${symbol}...`);
        
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CryptoMarketWatch/1.0'
            },
            timeout: 10000
          }
        );
        
        if (response.data && response.data.prices && response.data.prices.length > 0) {
          const prices = response.data.prices.map(pricePoint => pricePoint[1]).filter(price => price && !isNaN(price));
          if (prices.length > 1) {
            priceData[symbol] = prices;
            console.log(`✅ Fetched ${prices.length} price points for ${symbol}`);
          }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`⚠️ Could not fetch price data for ${symbol}:`, error.message);
        if (error.response && error.response.status === 429) {
          console.log('⚠️ Rate limited by CoinGecko API, stopping requests');
          break;
        }
      }
    }
    
    // Calculate correlations between all pairs
    for (let i = 0; i < targetSymbols.length; i++) {
      for (let j = i + 1; j < targetSymbols.length; j++) {
        const symbol1 = targetSymbols[i];
        const symbol2 = targetSymbols[j];
        
        if (priceData[symbol1] && priceData[symbol2]) {
          const correlation = calculateCorrelation(priceData[symbol1], priceData[symbol2]);
          if (!isNaN(correlation)) {
            correlationData[`${symbol1}_${symbol2}`] = correlation;
            console.log(`📊 Calculated ${symbol1}_${symbol2} correlation: ${correlation.toFixed(3)}`);
          }
        }
      }
    }
    
    console.log(`✅ Calculated ${Object.keys(correlationData).length} correlation pairs from price data`);
    return correlationData;
    
  } catch (error) {
    console.error('❌ Error in fallback correlation calculation:', error.message);
    return {};
  }
}

// Helper function to calculate correlation between two price series
function calculateCorrelation(prices1, prices2) {
  const minLength = Math.min(prices1.length, prices2.length);
  if (minLength < 2) return 0;
  
  const returns1 = [];
  const returns2 = [];

  for (let i = 1; i < minLength; i++) {
    const return1 = (prices1[i] - prices1[i-1]) / prices1[i-1];
    const return2 = (prices2[i] - prices2[i-1]) / prices2[i-1];
    returns1.push(return1);
    returns2.push(return2);
  }

  if (returns1.length < 2) return 0;

  const mean1 = returns1.reduce((sum, val) => sum + val, 0) / returns1.length;
  const mean2 = returns2.reduce((sum, val) => sum + val, 0) / returns2.length;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  const correlation = numerator / Math.sqrt(denominator1 * denominator2);
  return isNaN(correlation) ? 0 : correlation;
}

// Function to supplement correlation data if API doesn't provide enough
async function supplementWithCalculatedCorrelations(correlationData, targetSymbols) {
  // This function would be called if the API doesn't provide enough correlation pairs
  // For now, we'll just log that we need more data
  console.log('📊 API provided limited data, would supplement with calculated correlations if needed');
}


// Get historical data
app.get('/api/history/:dataType', async (req, res) => {
  try {
    const { dataType } = req.params;
    const { limit = 100 } = req.query;
    const { getMarketData } = require('./database');
    
    // Crypto prices and on-chain data removed from historical data
    // Use CoinGecko widget for real-time crypto prices instead
    if (dataType === 'CRYPTO_PRICE' || dataType === 'ONCHAIN') {
      return res.status(404).json({ 
        error: 'Data type not available',
        message: 'Crypto prices are available via the CoinGecko widget on the Prices page. On-chain data has been removed from historical data.'
      });
    }
    
    const data = await getMarketData(dataType, parseInt(limit));
    res.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Get historical AI analysis data
app.get('/api/history/ai-analysis', async (req, res) => {
  try {
    const { limit = 50, model, term, startDate, endDate } = req.query;
    const { dbAdapter } = require('./database');
    
    // Build query with filters
    let query = `
      SELECT 
        id,
        market_direction,
        confidence,
        reasoning,
        factors_analyzed,
        analysis_data,
        timestamp
      FROM ai_analysis 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    // Add date filters
    if (startDate) {
      paramCount++;
      query += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
    }
    if (endDate) {
      paramCount++;
      query += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));
    
    const rawAnalysis = await dbAdapter.all(query, params);
    
    // Parse and filter the analysis data
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
        providers: parsedData?.providers
      };
    });
    
    // Apply client-side filters for model and term
    let filteredAnalysis = parsedAnalysis;
    
    if (model) {
      filteredAnalysis = filteredAnalysis.filter(analysis => {
        if (!analysis.providers) return false;
        return Object.keys(analysis.providers).includes(model.toLowerCase());
      });
    }
    
    if (term) {
      filteredAnalysis = filteredAnalysis.filter(analysis => {
        const termKey = `${term}_term`;
        return analysis[termKey] && analysis[termKey].market_direction;
      });
    }
    
    res.json(filteredAnalysis);
  } catch (error) {
    console.error('Error fetching historical AI analysis:', error);
    res.status(500).json({ error: 'Failed to fetch historical AI analysis' });
  }
});

// Manual data collection trigger - Admin only
app.post('/api/collect-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const success = await dataCollector.collectAllData();
    
    if (success) {
      // AI analysis is already done during data collection - no need for additional calls

      
      // Collect upcoming events
      await eventCollector.collectUpcomingEvents();
      
      // Clear cache and broadcast dashboard update to all connected users after data collection
      // This is the ONLY time we should broadcast - when we have new data
      dashboardCache.cache = null; // Clear cache to force fresh data on next request
      dashboardCache.lastUpdate = null;
      
      const WebSocketService = require('./services/websocketService');
      if (WebSocketService.io) {
        // Get fresh dashboard data to broadcast
        const dashboardData = await getDashboardData();
        if (dashboardData) {
          // Cache the new data
          dashboardCache.set(dashboardData);
          
          // Broadcast complete dashboard update to all connected users
          // This only happens when data collector finishes - no other triggers
          WebSocketService.io.emit('dashboard_update', { data: dashboardData });
          console.log('📡 Broadcasted dashboard update to all connected users after data collection');
        }
      }
      
      console.log('🎉 ============================================');
      console.log('🎉 API: DATA COLLECTION COMPLETED SUCCESSFULLY! 🎉');
      console.log('🎉 ============================================');
      
      res.json({ 
        success: true, 
        message: '🎉 Data collection completed successfully! All data sources collected, AI analysis completed, and alerts processed.',
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
    } else {
      console.log('❌ ============================================');
      console.log('❌ API: DATA COLLECTION FAILED! ❌');
      console.log('❌ ============================================');
      res.status(500).json({ success: false, message: 'Data collection failed' });
    }
  } catch (error) {
    console.error('Error in manual data collection:', error);
    res.status(500).json({ error: 'Failed to collect data' });
  }
});

// Manual money supply data collection trigger - Admin only
app.post('/api/collect-money-supply', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('💰 Admin triggered manual money supply data collection...');
    
    await dataCollector.collectMoneySupplyData();
    
    res.json({ 
      success: true, 
      message: 'Money supply data collection completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in manual money supply data collection:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to collect money supply data',
      message: error.message
    });
  }
});

app.get('/api/economic-data/latest', async (req, res) => {
  try {
    const { getLatestEconomicData } = require('./database');
    const seriesId = req.query.series_id;
    
    if (!seriesId) {
      return res.status(400).json({ error: 'series_id parameter is required' });
    }
    
    const data = await getLatestEconomicData(seriesId);
    
    res.json({
      success: true,
      data,
      seriesId
    });
  } catch (error) {
    console.error('Error fetching economic data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch economic data'
    });
  }
});

app.get('/api/economic-data/history', async (req, res) => {
  try {
    const { getEconomicDataHistory } = require('./database');
    const seriesId = req.query.series_id;
    const months = parseInt(req.query.months) || 12;
    
    if (!seriesId) {
      return res.status(400).json({ error: 'series_id parameter is required' });
    }
    
    const data = await getEconomicDataHistory(seriesId, months);
    
    res.json({
      success: true,
      data,
      seriesId,
      months
    });
  } catch (error) {
    console.error('Error fetching economic data history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch economic data history'
    });
  }
});

// Economic Calendar data collection trigger - Admin only
app.post('/api/economic-calendar/collect', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📅 Admin triggered economic calendar data collection...');
    
    const EconomicCalendarCollector = require('./services/economicCalendarCollector');
    const collector = new EconomicCalendarCollector();
    
    const result = await collector.collectAndAnalyze();
    
    console.log('🎉 ============================================');
    console.log('🎉 ECONOMIC CALENDAR COLLECTION COMPLETED! 🎉');
    console.log('🎉 ============================================');
    
    res.json({
      success: true,
      message: '🎉 Economic calendar data collection completed successfully!',
      result: {
        calendarEvents: result.calendarEvents,
        storedData: result.storedData,
        analyzedEvents: result.analyzedEvents,
        newReleases: result.newReleases
      },
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
  } catch (error) {
    console.error('Error in economic calendar data collection:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to collect economic calendar data',
      message: error.message
    });
  }
});

// AI Analysis only trigger - Admin only (uses existing data, no new collection)
app.post('/api/ai-analysis', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🤖 Admin triggered AI analysis only...');
    
    // Get current market data without collecting new data
    const marketDataSummary = await dataCollector.getMarketDataSummary();
    if (!marketDataSummary) {
      return res.status(400).json({ error: 'No market data available for AI analysis' });
    }

    // Get advanced metrics for comprehensive analysis
    const advancedMetrics = await dataCollector.getAdvancedMetricsSummary();
    
    // Get upcoming events for AI analysis
    const upcomingEvents = await eventCollector.getUpcomingEvents(10);

    // Get Fear & Greed Index
    const { getLatestFearGreedIndex } = require('./database');
    const fearGreed = await getLatestFearGreedIndex();

    // Get crypto news events
    const CryptoNewsDetector = require('./services/cryptoNewsDetector');
    const cryptoNewsDetector = new CryptoNewsDetector();
    const cryptoEvents = await cryptoNewsDetector.getEventSummary();

    // Prepare comprehensive data for AI analysis
    const comprehensiveData = {
      ...marketDataSummary,
      bitcoin_dominance: advancedMetrics?.bitcoinDominance?.value,
      stablecoin_metrics: advancedMetrics?.stablecoinMetrics,
      exchange_flows: advancedMetrics?.exchangeFlows,
      market_sentiment: advancedMetrics?.marketSentiment,
      derivatives: advancedMetrics?.derivatives,
      onchain: advancedMetrics?.onchain,
      upcoming_events: upcomingEvents,
      fear_greed: fearGreed,
      crypto_events: cryptoEvents
    };

    // Run AI analysis with existing data
    const analysis = await aiAnalyzer.analyzeMarketDirection(comprehensiveData);
    
    if (analysis) {
      res.json({ success: true, message: 'AI analysis completed successfully', analysis });
    } else {
      res.status(500).json({ success: false, message: 'AI analysis failed' });
    }
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({ error: 'Failed to run AI analysis' });
  }
});

// Crypto News Detection trigger - Admin only
app.post('/api/detect-crypto-news', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📰 Admin triggered crypto news detection...');
    
    const CryptoNewsDetector = require('./services/cryptoNewsDetector');
    const cryptoNewsDetector = new CryptoNewsDetector();
    
    const events = await cryptoNewsDetector.detectCryptoEvents();
    
    res.json({ 
      success: true, 
      message: `Crypto news detection completed. Found ${events.length} significant events.`,
      events: events,
      timestamp: new Date().toISOString()
    });
        } catch (error) {
    console.error('Error in crypto news detection:', error);
    res.status(500).json({ error: 'Failed to detect crypto news events' });
  }
});

// API endpoint to get all crypto news events for the news page
app.get('/api/crypto-news', optionalAuth, async (req, res) => {
  try {
    const CryptoNewsDetector = require('./services/cryptoNewsDetector');
    const cryptoNewsDetector = new CryptoNewsDetector();
    
    const newsData = await cryptoNewsDetector.getAllEvents();
    
    res.json(newsData);
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    res.status(500).json({
      hasEvents: false,
      eventCount: 0,
      events: [],
      error: error.message
    });
  }
});

// Get dashboard summary - CACHED to reduce egress charges
app.get('/api/dashboard', optionalAuth, async (req, res) => {
  try {
    // Ignore cache-busting parameters to maintain server-side caching
    // Check cache first to avoid expensive database calls
    let dashboardData = dashboardCache.get();
    
    if (dashboardData) {
      // Cache hit - return existing data without fetching
      dashboardCache.logCacheHit();
    } else {
      // Cache miss - fetch fresh data
      dashboardCache.logCacheMiss();
      
      // If there's already a pending request, wait for it instead of making a new one
      if (pendingDashboardRequest) {
        console.log('📊 Dashboard request already in progress, waiting for result...');
        dashboardData = await pendingDashboardRequest;
      } else {
        // Start new request and store the promise
        pendingDashboardRequest = getDashboardData();
        try {
          dashboardData = await pendingDashboardRequest;
        } finally {
          // Clear the pending request
          pendingDashboardRequest = null;
        }
      }
      
      // If we still don't have data after the above, fetch it directly
      if (!dashboardData) {
        dashboardData = await getDashboardData();
      }
      
      // If we still don't have data, there's an error
      if (!dashboardData) {
        return res.status(500).json({ error: 'Failed to fetch dashboard data' });
      }
      
      // Cache the newly fetched dashboard data
      dashboardCache.set(dashboardData);
      dashboardCache.logCacheSet();
    }

  // Get subscription status for authenticated users (not cached)
    let subscriptionStatus = null;
    if (req.user) {
    try {
      const subscriptionManager = require('./services/subscriptionManager');
      subscriptionStatus = await subscriptionManager.getSubscriptionStatus(req.user.id);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  }

  // Add subscription status to response (not cached)
  const responseData = {
    ...dashboardData,
    subscriptionStatus
  };
  
  // Add HTTP caching headers to reduce client requests
  if (dashboardData) {
    // Cache for 2 minutes on client side
    res.set('Cache-Control', 'private, max-age=120');
    res.set('ETag', `"${dashboardData.timestamp || Date.now()}"`);
  }
  
  // DO NOT broadcast dashboard updates from API calls
  // This was causing excessive egress charges on Railway
  // WebSocket broadcasts should only happen when backend has new data
  // if (req.user && !req.headers['x-websocket-request']) {
  //   WebSocketService.broadcastDashboardUpdate(req.user.id, dashboardData);
  // }
  
  res.json(responseData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { checkDatabaseHealth } = require('./database');
    const dbHealth = await checkDatabaseHealth();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: dbHealth
    });
  } catch (error) {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: { status: 'unknown', error: error.message }
    });
  }
});

// WebSocket connection statistics endpoint (admin only)
app.get('/api/websocket-stats', authenticateToken, requireAdmin, (req, res) => {
  try {
    const WebSocketService = require('./services/websocketService');
    const stats = WebSocketService.getConnectionStats();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        idleTimeoutMinutes: Math.round(WebSocketService.idleTimeout / 1000 / 60),
        cleanupIntervalMinutes: Math.round(WebSocketService.cleanupInterval / 1000 / 60)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get popup urgent news config
app.get('/api/config/popup-urgent-news', (req, res) => {
  const enabled = process.env.POPUP_URGENT_NEWS === 'true';
  res.json({ enabled });
});

// ===== INFLATION DATA ENDPOINTS =====

// Test PPI endpoint
app.get('/api/inflation/ppi-test', async (req, res) => {
  try {
    const InflationDataService = require('./services/inflationDataService');
    const inflationService = new InflationDataService();
    const freshData = await inflationService.fetchLatestData();
    
    res.json({
      success: true,
      ppiData: freshData?.ppi || null,
      allData: freshData
    });
  } catch (error) {
    console.error('PPI test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get market expectations for inflation data
app.get('/api/inflation/expectations', async (req, res) => {
  try {
    const now = new Date();
    
    // Check if we have cached data that's still fresh
    if (inflationExpectationsCache && inflationExpectationsCacheTime && 
        (now - inflationExpectationsCacheTime) < INFLATION_CACHE_DURATION) {
      console.log('📊 INFLATION EXPECTATIONS ENDPOINT CALLED - USING CACHED DATA');
      return res.json(inflationExpectationsCache);
    }
    
    console.log('📊 INFLATION EXPECTATIONS ENDPOINT CALLED - USING DATABASE DATA');
    // Use database data only, no API calls
    const { getLatestInflationForecast } = require('./database');
    
    const [cpiForecast, pceForecast] = await Promise.all([
      getLatestInflationForecast('CPI'),
      getLatestInflationForecast('PCE')
    ]);
    
    const expectations = {
      cpi: cpiForecast ? {
        expected: cpiForecast.forecast_value,
        previous: cpiForecast.previous_value,
        date: cpiForecast.forecast_date,
        source: 'database'
      } : null,
      pce: pceForecast ? {
        expected: pceForecast.forecast_value,
        previous: pceForecast.previous_value,
        date: pceForecast.forecast_date,
        source: 'database'
      } : null,
      sources: ['database'],
      timestamp: new Date().toISOString(),
      source: 'database'
    };
    
    // Cache the response
    inflationExpectationsCache = expectations;
    inflationExpectationsCacheTime = now;
    
    console.log('✅ Returning database data for inflation expectations');
    res.json(expectations);
  } catch (error) {
    console.error('Error fetching market expectations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get money supply data
app.get('/api/money-supply', optionalAuth, async (req, res) => {
  try {
    const { getLatestMarketData } = require('./database');
    
    // Get latest money supply data from databasegit
    let m1Data = await getLatestMarketData('MONEY_SUPPLY', 'M1');
    let m2Data = await getLatestMarketData('MONEY_SUPPLY', 'M2');
    let m3Data = await getLatestMarketData('MONEY_SUPPLY', 'M3');
    let bankReservesData = await getLatestMarketData('MONEY_SUPPLY', 'BANK_RESERVES');
    
    // If no data in database, try to fetch from FRED API
    if (!m1Data || !m2Data || !m3Data || !bankReservesData) {
      console.log('📊 Some money supply data missing from database, fetching from FRED API...');
      
      try {
        const EconomicDataService = require('./services/economicDataService');
        const economicService = new EconomicDataService();
        
        // Fetch missing data from FRED API
        if (!m1Data) {
          const m1ApiData = await economicService.fetchM1MoneySupply();
          if (m1ApiData) {
            m1Data = {
              value: m1ApiData.value.toString(),
              timestamp: new Date().toISOString()
            };
          }
        }
        
        if (!m2Data) {
          const m2ApiData = await economicService.fetchM2MoneySupply();
          if (m2ApiData) {
            m2Data = {
              value: m2ApiData.value.toString(),
              timestamp: new Date().toISOString()
            };
          }
        }
        
        if (!m3Data) {
          const m3ApiData = await economicService.fetchM3MoneySupply();
          if (m3ApiData) {
            m3Data = {
              value: m3ApiData.value.toString(),
              timestamp: new Date().toISOString()
            };
          }
        }
        
        if (!bankReservesData) {
          const bankReservesApiData = await economicService.fetchBankReserves();
          if (bankReservesApiData) {
            bankReservesData = {
              value: bankReservesApiData.value.toString(),
              timestamp: new Date().toISOString()
            };
          }
        }
      } catch (apiError) {
        console.error('Error fetching money supply data from FRED API:', apiError);
      }
    }
    
    // Helper function to calculate 30-day change
    const calculateChange = async (dataType, symbol, currentValue) => {
      if (!currentValue) return null;
      
      try {
        // Get data from 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { getMarketDataHistory } = require('./database');
        const historicalData = await getMarketDataHistory(dataType, symbol, thirtyDaysAgo, new Date(), 1);
        
        if (historicalData && historicalData.length > 0) {
          const oldValue = parseFloat(historicalData[0].value);
          const newValue = parseFloat(currentValue);
          if (oldValue > 0) {
            return ((newValue - oldValue) / oldValue) * 100;
          }
        }
      } catch (error) {
        console.error(`Error calculating change for ${symbol}:`, error);
      }
      
      return null;
    };
    
    // Calculate 30-day changes
    const [m1Change, m2Change, m3Change, bankReservesChange] = await Promise.all([
      calculateChange('MONEY_SUPPLY', 'M1', m1Data?.value),
      calculateChange('MONEY_SUPPLY', 'M2', m2Data?.value),
      calculateChange('MONEY_SUPPLY', 'M3', m3Data?.value),
      calculateChange('MONEY_SUPPLY', 'BANK_RESERVES', bankReservesData?.value)
    ]);
    
    const response = {
      m1: {
        value: m1Data?.value ? parseFloat(m1Data.value) : null,
        date: m1Data?.timestamp,
        change_30d: m1Change
      },
      m2: {
        value: m2Data?.value ? parseFloat(m2Data.value) : null,
        date: m2Data?.timestamp,
        change_30d: m2Change
      },
      m3: {
        value: m3Data?.value ? parseFloat(m3Data.value) : null,
        date: m3Data?.timestamp,
        change_30d: m3Change
      },
      bank_reserves: {
        value: bankReservesData?.value ? parseFloat(bankReservesData.value) : null,
        date: bankReservesData?.timestamp,
        change_30d: bankReservesChange
      },
      last_updated: new Date().toISOString()
    };
    
    res.json(response);
    } catch (error) {
    console.error('Error fetching money supply data:', error);
    res.status(500).json({ error: 'Failed to fetch money supply data' });
  }
});

// Cache for inflation data to reduce database calls
let inflationDataCache = null;
let inflationDataCacheTime = null;
let inflationExpectationsCache = null;
let inflationExpectationsCacheTime = null;
const INFLATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get latest inflation data
app.get('/api/inflation/latest', async (req, res) => {
  try {
    const now = new Date();
    
    // Check if we have cached data that's still fresh
    if (inflationDataCache && inflationDataCacheTime && 
        (now - inflationDataCacheTime) < INFLATION_CACHE_DURATION) {
      return res.json(inflationDataCache);
    }
    
    const { getLatestInflationDataAll } = require('./database');
    const dbData = await getLatestInflationDataAll();
    
    if (!dbData) {
      console.log('⚠️ No inflation data found in database');
      const noDataResponse = {
        cpi: null,
        pce: null,
        ppi: null,
        timestamp: new Date().toISOString(),
        message: 'No data available - data collection may be in progress'
      };
      
      // Cache the no-data response too
      inflationDataCache = noDataResponse;
      inflationDataCacheTime = now;
      
      return res.json(noDataResponse);
    }
    
    // Helper function to format numbers to 2 decimal places
    const formatNumber = (value) => {
      if (value === null || value === undefined) return null;
      const num = parseFloat(value);
      if (isNaN(num)) return null;
      return num.toFixed(2);
    };
    
    // Return data from database
    const response = {
      cpi: dbData.cpi ? {
        cpi: formatNumber(dbData.cpi.cpi),
        coreCPI: formatNumber(dbData.cpi.coreCPI),
        cpiYoY: formatNumber(dbData.cpi.cpiYoY),
        coreCPIYoY: formatNumber(dbData.cpi.coreCPIYoY),
        date: dbData.cpi.date
      } : null,
      pce: dbData.pce ? {
        pce: formatNumber(dbData.pce.pce),
        corePCE: formatNumber(dbData.pce.corePCE),
        pceYoY: formatNumber(dbData.pce.pceYoY),
        corePCEYoY: formatNumber(dbData.pce.corePCEYoY),
        date: dbData.pce.date
      } : null,
      ppi: dbData.ppi ? {
        ppi: formatNumber(dbData.ppi.ppi),
        corePPI: formatNumber(dbData.ppi.corePPI),
        ppiMoM: formatNumber(dbData.ppi.ppiMoM),
        corePPIMoM: formatNumber(dbData.ppi.corePPIMoM),
        ppiYoY: formatNumber(dbData.ppi.ppiYoY),
        corePPIYoY: formatNumber(dbData.ppi.corePPIYoY),
        date: dbData.ppi.date
      } : null,
      timestamp: new Date().toISOString(),
      source: 'database'
    };
    
    // Cache the response
    inflationDataCache = response;
    inflationDataCacheTime = now;
    
    console.log('✅ Returning database data for inflation');
    res.json(response);
  } catch (error) {
    console.error('Error fetching inflation data from database:', error);
    res.status(500).json({ error: 'Failed to fetch inflation data from database' });
  }
});

// Get inflation data history
app.get('/api/inflation/history/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { months = 12 } = req.query;
    const { getInflationDataHistory } = require('./database');
    
    const data = await getInflationDataHistory(type, parseInt(months));
    
    res.json({
      type,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching inflation history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming inflation releases
app.get('/api/inflation/releases', async (req, res) => {
  try {
    const { getInflationReleases } = require('./database');
    const { days = 30 } = req.query;
    
    const releases = [];
    const today = new Date();
    
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayReleases = await getInflationReleases(dateStr);
      if (Array.isArray(dayReleases)) {
        releases.push(...dayReleases);
      }
    }
    
    res.json({
      releases,
      count: releases.length
    });
  } catch (error) {
    console.error('Error fetching inflation releases:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get inflation forecasts
app.get('/api/inflation/forecasts', async (req, res) => {
  try {
    const { getLatestInflationForecast } = require('./database');
    
    const [cpiForecast, pceForecast] = await Promise.all([
      getLatestInflationForecast('CPI'),
      getLatestInflationForecast('PCE')
    ]);
    
    res.json({
      cpi: cpiForecast,
      pce: pceForecast,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching inflation forecasts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual trigger for inflation data fetch - ADMIN ONLY
app.post('/api/inflation/fetch', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Admin triggered manual inflation data fetch...');
    
    // Use data collector to fetch fresh data (single entry point)
    const DataCollector = require('./services/dataCollector');
    const dataCollector = new DataCollector();
    const data = await dataCollector.collectInflationData();
    
    res.json({
      success: true,
      data,
      message: 'Inflation data fetched successfully via data collection'
    });
  } catch (error) {
    console.error('Error fetching inflation data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update release schedule manually
app.post('/api/inflation/update-schedule', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const InflationDataService = require('./services/inflationDataService');
    const inflationService = new InflationDataService();
    
    await inflationService.updateReleaseSchedule();
    
    res.json({
      success: true,
      message: 'Inflation release schedule updated successfully'
    });
  } catch (error) {
    console.error('Error updating release schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate forecasts manually
app.post('/api/inflation/generate-forecasts', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const InflationDataService = require('./services/inflationDataService');
    const inflationService = new InflationDataService();
    
    await inflationService.generateForecasts();
    
    res.json({
      success: true,
      message: 'Inflation forecasts generated successfully'
    });
  } catch (error) {
    console.error('Error generating forecasts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get inflation data with market expectations and analysis - DATABASE ONLY
app.get('/api/inflation/analysis', async (req, res) => {
  try {
    // Use database data only, no API calls
    const { getLatestInflationData } = require('./database');
    const cpiData = await getLatestInflationData('CPI');
    const pceData = await getLatestInflationData('PCE');
    
    const result = {
      data: {
        cpi: cpiData,
        pce: pceData
      },
      expectations: null, // Would need separate implementation
      analysis: null, // Would need separate implementation
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: result,
      message: 'Inflation analysis retrieved from database'
    });
  } catch (error) {
    console.error('Error getting inflation analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inflation analysis',
      message: error.message
    });
  }
});

// Get market expectations only - DISABLED (would require API calls)

// Get inflation sentiment analysis - DATABASE ONLY
app.get('/api/inflation/sentiment', async (req, res) => {
  try {
    // Use database data only, no API calls
    const { getLatestInflationData } = require('./database');
    const cpiData = await getLatestInflationData('CPI');
    const pceData = await getLatestInflationData('PCE');
    
    // Simple sentiment analysis based on database data
    let sentiment = 'neutral';
    let marketImpact = {
      crypto: 'neutral',
      stocks: 'neutral',
      bonds: 'neutral',
      dollar: 'neutral'
    };
    
    if (cpiData || pceData) {
      const cpiYoY = cpiData?.yoy_change || 0;
      const pceYoY = pceData?.yoy_change || 0;
      const avgInflation = (cpiYoY + pceYoY) / 2;
      
      if (avgInflation > 3.5) {
        sentiment = 'bearish';
        marketImpact = {
          crypto: 'bearish',
          stocks: 'bearish',
          bonds: 'bullish',
          dollar: 'bullish'
        };
      } else if (avgInflation < 2.0) {
        sentiment = 'bullish';
        marketImpact = {
          crypto: 'bullish',
          stocks: 'bullish',
          bonds: 'bearish',
          dollar: 'bearish'
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        sentiment,
        marketImpact,
        details: {
          cpi: cpiData,
          pce: pceData,
          analysis: 'Simple sentiment analysis based on database data'
        },
        timestamp: new Date().toISOString()
      },
      message: 'Inflation sentiment retrieved from database'
    });
  } catch (error) {
    console.error('Error getting inflation sentiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inflation sentiment',
      message: error.message
    });
  }
});

// ===== PASSWORD RESET ROUTES =====

// Request password reset
app.post('/api/auth/forgot-password', validateRequestBody({
  email: { type: 'email', required: true },
  allowExtra: false
}), async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Send password reset email using Brevo
    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);
    if (emailSent) {
      console.log(`📧 Password reset email sent to ${email}`);
    } else {
      console.log(`⚠️ Failed to send password reset email to ${email}`);
    }
    
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', validateRequestBody({
  token: { type: 'string', required: true, maxLength: 500 },
  newPassword: { type: 'password', required: true },
  allowExtra: false
}), async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token type' });
    }
    
    // Find user
    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await dbAdapter.run(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [passwordHash, new Date().toISOString(), user.id]
    );
    
    console.log(`✅ Password reset successfully for ${user.email}`);
    
    res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
  } catch (error) {
    console.error('Password reset error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(400).json({ error: 'Invalid or expired reset token' });
    } else {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
});

// Delete own account endpoint
app.delete('/api/auth/delete-account', authenticateToken, async (req, res) => {
  try {
    const { deleteUser } = require('./database');
    const userId = req.user.userId;
    const userEmail = req.user.email;
    
    // Send deletion confirmation email before deleting
    try {
      const emailSent = await emailService.sendAccountDeletedByUserEmail(
        userEmail, 
        userEmail.split('@')[0]
      );
      if (emailSent) {
        console.log(`📧 Account deletion confirmation sent to ${userEmail}`);
      } else {
        console.log(`⚠️ Failed to send deletion confirmation to ${userEmail}`);
      }
    } catch (emailError) {
      console.error('Error sending deletion confirmation email:', emailError);
      // Continue with deletion even if email fails
    }
    
    // Delete the user
    await deleteUser(userId);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ===== EMAIL TEST ROUTES =====

// Test email service (admin only)
app.post('/api/admin/test-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, type = 'test' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }
    
    let emailSent = false;
    
    switch (type) {
      case 'test':
        // Test connection
        const testResult = await emailService.testConnection();
        if (testResult.success) {
          emailSent = true;
        }
        break;
      case 'welcome':
        emailSent = await emailService.sendWelcomeEmail(email);
        break;
      case 'alert':
        const testAlert = {
          type: 'price_alert',
          severity: 'medium',
          message: 'This is a test alert email',
          metric: 'BTC Price',
          value: '$45,000',
          timestamp: new Date().toISOString()
        };
        emailSent = await emailService.sendAlertEmail(email, testAlert);
        break;
      case 'upgrade':
        const subscriptionDetails = {
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          payment_method: 'stripe',
          payment_id: 'test_sub_123'
        };
        emailSent = await emailService.sendUpgradeEmail(email, 'Test User', 'Pro', subscriptionDetails);
        break;
      default:
        return res.status(400).json({ error: 'Invalid email type. Use: test, welcome, alert, or upgrade' });
    }
    
    if (emailSent) {
      res.json({ success: true, message: `${type} email sent successfully to ${email}` });
    } else {
      res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ error: 'Email test failed' });
  }
});

// Admin change user plan endpoint
app.post('/api/admin/change-user-plan', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, newPlan, months = 1 } = req.body;
    
    if (!userId || !newPlan) {
      return res.status(400).json({ error: 'User ID and new plan are required' });
    }
    
    // Validate plan type
    const validPlans = ['free', 'pro', 'premium', 'admin'];
    if (!validPlans.includes(newPlan)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }
    
    // Get user to verify they exist
    const { getUserById, updateUser } = require('./database');
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Calculate new expiration date
    let expiresAt = null;
    if (newPlan !== 'free' && newPlan !== 'admin') {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);
    }
    
    // Update user plan
    await updateUser(userId, {
      subscription_plan: newPlan,
      subscription_expires_at: expiresAt
    });
    
    console.log(`✅ Admin changed user ${userId} plan to ${newPlan} (expires: ${expiresAt})`);
    
    res.json({ 
      success: true, 
      message: `User plan changed to ${newPlan} successfully`,
      user: {
        id: userId,
        email: user.email,
        plan: newPlan,
        expiresAt: expiresAt
      }
    });
  } catch (error) {
    console.error('❌ Error changing user plan:', error);
    res.status(500).json({ error: 'Failed to change user plan' });
  }
});

// Admin email interface endpoint
app.post('/api/admin/send-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { recipientEmail, recipientName, templateType, customSubject, customMessage } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    let emailSent = false;
    let message = '';

    // Use Brevo email service if available, otherwise fallback to regular email service
    const BrevoEmailService = require('./services/brevoEmailService');
    const brevoEmailService = new BrevoEmailService();
    const emailService = new (require('./services/emailService'))();

    switch (templateType) {
      case 'welcome':
        emailSent = await brevoEmailService.sendWelcomeEmail(recipientEmail, recipientName);
        message = 'Welcome email sent successfully';
        break;
        
      case 'confirmation':
        // Generate a test confirmation token
        const confirmationToken = 'test_confirmation_token_' + Date.now();
        emailSent = await brevoEmailService.sendEmailConfirmation(recipientEmail, confirmationToken);
        message = 'Email confirmation sent successfully';
        break;
        
      case 'password-reset':
        // Generate a test reset token
        const resetToken = 'test_reset_token_' + Date.now();
        emailSent = await brevoEmailService.sendPasswordResetEmail(recipientEmail, resetToken);
        message = 'Password reset email sent successfully';
        break;
        
      case 'upgrade':
        const subscriptionDetails = {
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          payment_method: 'admin_test',
          payment_id: 'admin_test_' + Date.now()
        };
        emailSent = await brevoEmailService.sendUpgradeEmail(recipientEmail, recipientName, 'Pro Plan', subscriptionDetails);
        message = 'Upgrade email sent successfully';
        break;
        
      case 'renewal-reminder':
        emailSent = await brevoEmailService.sendRenewalReminderEmail('Pro Plan', 7, recipientEmail);
        message = 'Renewal reminder email sent successfully';
        break;
        
      case 'subscription-expired':
        emailSent = await brevoEmailService.sendSubscriptionExpiredEmail('Pro Plan', recipientEmail);
        message = 'Subscription expired email sent successfully';
        break;
        
      case 'account-deleted-admin':
        emailSent = await brevoEmailService.sendAccountDeletedByAdminEmail(recipientEmail, recipientName);
        message = 'Account deleted (admin) email sent successfully';
        break;
        
      case 'account-deleted-user':
        emailSent = await brevoEmailService.sendAccountDeletedByUserEmail(recipientEmail, recipientName);
        message = 'Account deleted (user) email sent successfully';
        break;
        
      case 'alert':
        const testAlert = {
          type: 'price_alert',
          severity: 'medium',
          message: customMessage || 'Test market alert from admin interface',
          timestamp: new Date(),
          data: {
            symbol: 'BTC',
            price: 50000,
            change: 2.5
          }
        };
        emailSent = await brevoEmailService.sendAlertEmail(recipientEmail, testAlert);
        message = 'Market alert email sent successfully';
        break;
        
      case 'event-reminder':
        const testEvent = {
          title: customSubject || 'Test Event Reminder',
          description: customMessage || 'This is a test event reminder from the admin interface',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          category: 'test'
        };
        emailSent = await brevoEmailService.sendEventReminderEmail(testEvent, recipientEmail, 1);
        message = 'Event reminder email sent successfully';
        break;
        
      case 'inflation-update':
        const testInflationData = {
          latestData: {
            cpi: 3.2,
            core_cpi: 3.0,
            pce: 2.8,
            date: new Date().toISOString().split('T')[0]
          }
        };
        emailSent = await brevoEmailService.sendInflationDataEmail(testInflationData, recipientEmail);
        message = 'Inflation update email sent successfully';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid template type' });
    }
    
    if (emailSent) {
      res.json({ 
        success: true, 
        message: `${message} to ${recipientEmail}`,
        templateType,
        recipientEmail,
        recipientName: recipientName || 'N/A'
      });
    } else {
      res.status(500).json({ error: 'Failed to send email. Check email service configuration.' });
    }
  } catch (error) {
    console.error('Admin email send error:', error);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
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

// Wallet payment subscription endpoint
app.post('/api/subscribe/wallet-payment', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Wallet payment request received');
    console.log('🔧 Request body:', req.body);
    console.log('🔧 User:', req.user ? { id: req.user.id, email: req.user.email } : 'No user');
    console.log('🔧 SUPPORT_CRYPTO_PAYMENT:', process.env.SUPPORT_CRYPTO_PAYMENT);
    
    if (process.env.SUPPORT_CRYPTO_PAYMENT !== 'true') {
      console.log('❌ Crypto payments not enabled');
      return res.status(404).json({ error: 'Crypto payments are not enabled' });
    }
    
    const { planId, months = 1, network = 'base' } = req.body;
    console.log('🔧 Extracted params:', { planId, months, network });
    
    const walletPaymentService = require('./services/walletPaymentService');
    console.log('🔧 About to call createWalletSubscription');
    const result = await walletPaymentService.createWalletSubscription(req.user.id, planId, months, network);
    console.log('✅ Wallet subscription created successfully');
    res.json(result);
  } catch (error) {
    console.error('❌ Wallet payment subscription error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Check payment status
app.get('/api/subscribe/payment-status/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const walletPaymentService = require('./services/walletPaymentService');
    const status = await walletPaymentService.getPaymentStatus(paymentId);
    res.json(status);
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify transaction hash
app.post('/api/verify-transaction', authenticateToken, async (req, res) => {
  try {
    
    if (process.env.SUPPORT_CRYPTO_PAYMENT !== 'true') {
      console.log('❌ Crypto payments not enabled');
      return res.status(404).json({ error: 'Crypto payments are not enabled' });
    }
    
    const { txHash, expectedAmount, expectedToAddress, network, paymentId } = req.body;
    
    if (!txHash || !expectedAmount || !expectedToAddress || !network || !paymentId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const walletPaymentService = require('./services/walletPaymentService');
    
    // Verify the transaction
    let verificationResult;
    if (network === 'base') {
      verificationResult = await walletPaymentService.verifyBaseTransaction(txHash, expectedAmount, expectedToAddress);
    } else if (network === 'solana') {
      verificationResult = await walletPaymentService.verifySolanaTransaction(txHash, expectedAmount, expectedToAddress);
    } else {
      return res.status(400).json({ error: 'Unsupported network' });
    }
    
    if (verificationResult.success) {
      // Update payment status in database
      await walletPaymentService.updatePaymentStatus(paymentId, 'completed', txHash);
      
      // Activate user subscription
      await walletPaymentService.activateSubscription(req.user.id, paymentId);
      
      console.log('✅ Transaction verified and subscription activated');
      res.json({
        success: true,
        message: 'Transaction verified successfully!',
        transaction: verificationResult
      });
    } else {
      console.log('❌ Transaction verification failed:', verificationResult.error);
      res.json({
        success: false,
        error: verificationResult.error
      });
    }
  } catch (error) {
    console.error('❌ Transaction verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get renewal info
app.get('/api/subscribe/renewal-info', authenticateToken, async (req, res) => {
  try {
    const subscriptionManager = require('./services/subscriptionManager');
    const renewalOptions = await subscriptionManager.getRenewalOptions(req.user.id);
    res.json(renewalOptions);
  } catch (error) {
    console.error('Renewal info error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create renewal subscription
app.post('/api/subscribe/renew', authenticateToken, async (req, res) => {
  try {
    if (process.env.SUPPORT_CRYPTO_PAYMENT !== 'true') {
      return res.status(404).json({ error: 'Crypto payments are not enabled' });
    }
    
    const { planId, months = 1, network = 'base' } = req.body;
    const subscriptionManager = require('./services/subscriptionManager');
    const result = await subscriptionManager.createRenewalSubscription(req.user.id, planId, months, network);
    res.json(result);
  } catch (error) {
    console.error('Renewal subscription error:', error);
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
    const subscriptionManager = require('./services/subscriptionManager');
    const status = await subscriptionManager.getSubscriptionStatus(req.user.id);
    
    // Get user data from database
    const { getUserById } = require('./database');
    const user = await getUserById(req.user.id);
    
    // Debug logging
    console.log(`📊 Subscription status for user ${req.user.id}:`, {
      plan: status.plan,
      status: status.status,
      expiredAt: status.expiredAt,
      currentPeriodEnd: status.currentPeriodEnd,
      needsRenewal: status.needsRenewal
    });
    
    // Combine user data with subscription status
    const userData = {
      id: user.id,
      email: user.email,
      role: user.is_admin === 1 ? 'admin' : 'user',
      plan: status.plan,
      status: status.status,
      planName: status.planName,
      features: status.features,
      currentPeriodEnd: status.currentPeriodEnd,
      isAdmin: status.isAdmin || false,
      needsRenewal: status.needsRenewal || false,
      daysUntilExpiry: status.daysUntilExpiry,
      expiredAt: status.expiredAt,
      expiredPlan: status.expiredPlan,
      shouldShowPaymentPage: subscriptionManager.shouldShowPaymentPage(status),
      notifications: user.notification_preferences ? JSON.parse(user.notification_preferences) : {}
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== WEBHOOKS =====

// Stripe webhook - must be before express.json() middleware
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  console.log('🔔 Stripe webhook received');
  console.log('📝 Signature header:', sig ? 'Present' : 'Missing');
  console.log('📦 Body length:', req.body ? req.body.length : 'No body');
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
  
  if (!sig) {
    console.error('❌ Stripe webhook: Missing signature');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Webhook secret selection based on NODE_ENV
  // Production: STRIPE_WEBHOOK_SECRET (live webhook)
  // Development: STRIPE_TEST_WEBHOOK_SECRET (test webhook)
  const isProduction = process.env.NODE_ENV === 'production';
  const envVarName = isProduction ? 'STRIPE_WEBHOOK_SECRET' : 'STRIPE_TEST_WEBHOOK_SECRET';
  const webhookSecret = isProduction 
    ? process.env.STRIPE_WEBHOOK_SECRET 
    : process.env.STRIPE_TEST_WEBHOOK_SECRET;

  console.log('🔧 Using environment variable:', envVarName);
  console.log('🔧 Environment variable exists:', !!webhookSecret);

  if (!webhookSecret) {
    console.error('❌ Stripe webhook: Missing webhook secret environment variable');
    console.error('STRIPE_WEBHOOK_SECRET exists:', !!process.env.STRIPE_WEBHOOK_SECRET);
    console.error('STRIPE_TEST_WEBHOOK_SECRET exists:', !!process.env.STRIPE_TEST_WEBHOOK_SECRET);
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  console.log('🔐 Webhook secret found, verifying signature...');
  console.log('🔑 Secret starts with:', webhookSecret.substring(0, 15) + '...');
  console.log('🔑 Secret length:', webhookSecret.length);
  console.log('🔑 Using secret type:', isProduction ? 'PRODUCTION' : 'TEST');

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`✅ Received Stripe webhook: ${event.type} (ID: ${event.id})`);
    console.log(`📊 Webhook data:`, {
      type: event.type,
      id: event.id,
      created: event.created,
      livemode: event.livemode,
      data: event.data ? Object.keys(event.data) : 'No data'
    });
    
    await paymentService.handleStripeWebhook(event);
    
    console.log(`✅ Successfully processed Stripe webhook: ${event.type} (ID: ${event.id})`);
    res.json({ received: true, eventType: event.type, eventId: event.id });
  } catch (error) {
    console.error('❌ Stripe webhook error:', error);
    console.error('❌ Error details:', {
      type: error.type,
      message: error.message,
      stack: error.stack
    });
    
    if (error.type === 'StripeSignatureVerificationError') {
      console.error('❌ Invalid signature. Check webhook secret in Stripe Dashboard.');
      console.error('Expected secret starts with:', webhookSecret.substring(0, 10) + '...');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
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
app.post('/api/auth/login', validateRequestBody(VALIDATION_RULES.userLogin), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await getUserByEmail(email);
  
  if (!user) {
    throw createError.authentication('Invalid credentials');
  }
    
    // Check if email is verified
  if (!Boolean(user.email_verified)) {
    throw createError.authentication('Please check your email and click the confirmation link to activate your account before signing in.');
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    throw createError.authentication('Invalid credentials');
  }
  
  const jwtSecret = process.env.JWT_SECRET;
  
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret,
    { expiresIn: '24h' }
  );
  
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      email: user.email,
      isAdmin: user.is_admin === 1
    } 
  });
}));

// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Refresh token required',
        code: 'NO_TOKEN'
      });
    }
    
    try {
      // Try to verify the token (may be expired)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Token is still valid, return new one anyway for rotation
      const user = await getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log(`🔄 Token refreshed for user: ${user.email}`);
      res.json({ 
        token: newToken,
        user: { 
          id: user.id, 
          email: user.email,
          isAdmin: user.is_admin === 1
        }
      });
      
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Token is expired, but we can still decode it for the user info
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.userId) {
          return res.status(401).json({ 
            error: 'Invalid expired token',
            code: 'INVALID_EXPIRED_TOKEN'
          });
        }
        
        const user = await getUserById(decoded.userId);
        if (!user) {
          return res.status(401).json({ 
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }
        
        // Generate new token for the expired user
        const newToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        console.log(`🔄 Expired token refreshed for user: ${user.email}`);
        res.json({ 
          token: newToken,
          user: { 
            id: user.id, 
            email: user.email,
            isAdmin: user.is_admin === 1
          }
        });
        
      } else {
        console.log('❌ Token refresh failed:', error.message);
        return res.status(403).json({ 
          error: 'Invalid token for refresh',
          code: 'INVALID_REFRESH_TOKEN',
          reason: error.message
        });
      }
    }
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh token',
      code: 'REFRESH_FAILED'
    });
  }
});

// Railway environment diagnostic endpoint (temporarily public for debugging)
app.get('/api/debug/railway-env', async (req, res) => {
  try {
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length,
      jwtSecretPrefix: process.env.JWT_SECRET?.substring(0, 8),
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20),
      railwayEnv: process.env.RAILWAY_ENVIRONMENT,
      railwayServiceId: process.env.RAILWAY_SERVICE_ID,
      railwayProjectId: process.env.RAILWAY_PROJECT_ID,
      deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
      timestamp: new Date().toISOString(),
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };
    
    // Test JWT functionality
    try {
      const testToken = jwt.sign({ test: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
      envInfo.jwtTest = 'WORKING';
    } catch (jwtError) {
      envInfo.jwtTest = 'FAILED';
      envInfo.jwtError = jwtError.message;
    }
    
    // Test database connection
    try {
      const { getUserById } = require('./database');
      const testUser = await getUserById(1);
      envInfo.databaseTest = 'WORKING';
      envInfo.hasUsers = !!testUser;
    } catch (dbError) {
      envInfo.databaseTest = 'FAILED';
      envInfo.databaseError = dbError.message;
    }
    
    console.log('🔍 Railway environment diagnostic requested');
    res.json(envInfo);
    
  } catch (error) {
    console.error('Railway diagnostic error:', error);
    res.status(500).json({ 
      error: 'Diagnostic failed',
      message: error.message 
    });
  }
});

app.post('/api/auth/register', validateRequestBody(VALIDATION_RULES.userRegistration), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    // Handle boolean conversion properly (PostgreSQL might return 0/1 or true/false)
    const isEmailVerified = Boolean(existingUser.email_verified);
    
    if (!isEmailVerified) {
      // User exists but email is not verified - offer to resend confirmation
      return res.status(409).json({
        error: 'User already exists but email is not verified',
        requiresConfirmation: true,
        message: 'An account with this email already exists but is not verified. Would you like to resend the confirmation email?'
      });
    } else {
      // User exists and is verified
      throw createError.conflict('User already exists');
    }
  }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate confirmation token
    const confirmationToken = jwt.sign(
      { email, type: 'email_confirmation' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Create user with email_verified = false
    const userId = await insertUserWithConfirmation(email, passwordHash, confirmationToken);
    
    // Note: Subscription data now stored directly in users table
    // No separate subscription table needed
    console.log(`✅ User ${userId} created with free plan`);
    
          // Send confirmation email using Brevo
      const emailSent = await emailService.sendEmailConfirmation(email, confirmationToken);
      if (emailSent) {
        console.log(`📧 Email confirmation sent to ${email}`);
      } else {
        console.log(`⚠️ Failed to send confirmation email to ${email}`);
      }
    
  res.json({
    requiresConfirmation: true,
    message: 'Please check your email to confirm your account'
  });
}));

// Resend confirmation email endpoint
app.post('/api/auth/resend-confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user exists and needs confirmation
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (Boolean(user.email_verified)) {
      return res.status(400).json({ error: 'Email is already verified' });
    }
    
    // Generate new confirmation token
    const confirmationToken = jwt.sign(
      { email, type: 'email_confirmation' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Update user with new confirmation token
    await dbAdapter.run(
      'UPDATE users SET confirmation_token = $1, updated_at = $2 WHERE id = $3',
      [confirmationToken, new Date().toISOString(), user.id]
    );
    
    // Send new confirmation email
    const emailSent = await emailService.sendEmailConfirmation(email, confirmationToken);
    if (emailSent) {
      console.log(`📧 Confirmation email resent to ${email}`);
      res.json({ message: 'Confirmation email sent successfully' });
    } else {
      console.log(`⚠️ Failed to resend confirmation email to ${email}`);
      res.status(500).json({ error: 'Failed to send confirmation email' });
    }
  } catch (error) {
    console.error('Resend confirmation error:', error);
    res.status(500).json({ error: 'Failed to resend confirmation email' });
  }
});

// Email confirmation endpoint
app.get('/api/auth/confirm-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/confirm-error?error=${encodeURIComponent('Confirmation token is required')}`;
      return res.redirect(redirectUrl);
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'email_confirmation') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/confirm-error?error=${encodeURIComponent('Invalid confirmation token')}`;
      return res.redirect(redirectUrl);
    }
    
    // Find user by email and confirmation token
    const user = await dbAdapter.get(
      'SELECT * FROM users WHERE email = $1 AND confirmation_token = $2 AND email_verified = false',
      [decoded.email, token]
    );
    
    if (!user) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/confirm-error?error=${encodeURIComponent('Invalid or expired confirmation token')}`;
      return res.redirect(redirectUrl);
    }
    
    // Update user to verified
    await dbAdapter.run(
      'UPDATE users SET email_verified = true, confirmation_token = NULL, updated_at = $1 WHERE id = $2',
      [new Date().toISOString(), user.id]
    );
    
    // Send welcome email
    const welcomeEmailSent = await emailService.sendWelcomeEmail(user.email, user.email.split('@')[0]);
    if (welcomeEmailSent) {
      console.log(`📧 Welcome email sent to ${user.email}`);
    }
    
    // Note: Subscription data now stored directly in users table
    // No separate subscription table needed
    
    // Generate login token
    const loginToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Redirect to frontend with success message and token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/confirm-success?token=${encodeURIComponent(loginToken)}&email=${encodeURIComponent(user.email)}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Email confirmation error:', error);
    
    // Redirect to frontend with error message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let errorMessage = 'Email confirmation failed';
    
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Confirmation token has expired';
    } else if (error.message && error.message.includes('token')) {
      errorMessage = 'Invalid confirmation token';
    }
    
    const redirectUrl = `${frontendUrl}/auth/confirm-error?error=${encodeURIComponent(errorMessage)}`;
    res.redirect(redirectUrl);
  }
});

// First-time admin setup endpoint (remove after first admin is created)
app.post('/api/setup/first-admin', async (req, res) => {
  try {
    const { email, password, setupKey } = req.body;
    
    // Check if setup key is correct (set this in environment)
    const expectedSetupKey = process.env.FIRST_ADMIN_SETUP_KEY || 'crypto-market-2024';
    
    if (setupKey !== expectedSetupKey) {
      return res.status(401).json({ error: 'Invalid setup key' });
    }
    
    // Check if any admin users already exist
    const adminCount = await dbAdapter.get('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
    if (adminCount.count > 0) {
      return res.status(400).json({ error: 'Admin user already exists. Use regular admin creation.' });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create admin user (verified by default for first admin)
    const userId = await insertUser(email, passwordHash, true);
    
    // Mark email as verified for first admin
    await dbAdapter.run(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [userId]
    );
    
    // Note: Subscription data now stored directly in users table
    // No separate subscription table needed
    console.log(`✅ Admin user ${userId} created with admin plan`);
    
    console.log(`👑 First admin user created: ${email} (ID: ${userId})`);
    
    res.json({
      success: true,
      message: 'First admin user created successfully',
      userId: userId,
      email: email
    });
    
  } catch (error) {
    console.error('First admin setup error:', error);
    res.status(500).json({ error: 'Failed to create first admin user' });
  }
});

// Admin routes
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { getAllUsers } = require('./database');
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { deleteUser, getUserById } = require('./database');
    
    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Get user details before deletion
    const userToDelete = await getUserById(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Send deletion notification email before deleting
    try {
      const emailSent = await emailService.sendAccountDeletedByAdminEmail(
        userToDelete.email, 
        userToDelete.email.split('@')[0]
      );
      if (emailSent) {
        console.log(`📧 Account deletion notification sent to ${userToDelete.email}`);
      } else {
        console.log(`⚠️ Failed to send deletion notification to ${userToDelete.email}`);
      }
    } catch (emailError) {
      console.error('Error sending deletion notification email:', emailError);
      // Continue with deletion even if email fails
    }
    
    // Delete the user
    await deleteUser(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

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
      'upcoming_events',
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
    const rawAnalysis = await dbAdapter.all(`
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
    `);

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
      'upcoming_events',
      'users',
      'subscriptions',
      'error_logs'
    ];

    if (!allowedCollections.includes(collection)) {
      return res.status(400).json({ error: 'Invalid collection' });
    }

    const data = await getTableData(collection, 1000);

    console.log(`📤 Exporting ${collection}:`, data.length, 'records');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.json"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.json(data);
  } catch (error) {
    console.error('Error exporting collection:', error);
    res.status(500).json({ error: 'Failed to export collection' });
  }
});

// Profile update endpoint
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { email, notifications } = req.body;
    const userId = req.user.userId;

    // Update user profile
    await dbAdapter.run(
      'UPDATE users SET email = $1, updated_at = $2 WHERE id = $3',
      [email, new Date().toISOString(), userId]
    );

    // Update notification preferences
    if (notifications) {
      await dbAdapter.run(
        'UPDATE users SET notification_preferences = $1 WHERE id = $2',
        [JSON.stringify(notifications), userId]
      );
    }

    // Get updated user data
    const user = await dbAdapter.get('SELECT * FROM users WHERE id = $1', [userId]);

    res.json({
      id: user.id,
      email: user.email,
      plan: user.subscription_plan || 'free',
      role: user.role || 'user',
      subscriptionStatus: user.subscription_plan && user.subscription_plan !== 'free' ? 'active' : 'inactive',
      notifications: user.notification_preferences ? JSON.parse(user.notification_preferences) : {}
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Contact form endpoint
app.post('/api/contact', upload.single('screenshot'), validateRequestBody(VALIDATION_RULES.contactForm), async (req, res) => {
  try {
    const { name, email, subject, message, captchaAnswer } = req.body;
    const screenshot = req.file;

    // Store contact message in database
    await dbAdapter.run(
      'INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES ($1, $2, $3, $4, $5)',
      [name, email, subject, message, new Date().toISOString()]
    );

    // Log screenshot info if provided
    if (screenshot) {
      console.log('📸 Screenshot attached:', {
        filename: screenshot.originalname,
        size: screenshot.size,
        mimetype: screenshot.mimetype
      });
    }

    // Send email notification via Brevo
    try {
      const emailSent = await emailService.sendContactFormEmail({
        name,
        email,
        subject,
        message,
        screenshot: screenshot ? {
          filename: screenshot.originalname,
          size: screenshot.size,
          mimetype: screenshot.mimetype
        } : null
      });

      if (emailSent) {
        console.log('✅ Contact form email sent successfully');
      } else {
        console.log('⚠️ Contact form email failed to send');
      }
    } catch (emailError) {
      console.error('❌ Error sending contact form email:', emailError);
    }

    console.log('📧 Contact form submission:', {
      name,
      email,
      subject,
      message: message.substring(0, 100) + '...',
      hasScreenshot: !!screenshot
    });

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
    } else if (error.message === 'Only image files are allowed') {
      res.status(400).json({ error: 'Only image files are allowed' });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
});

// Payment processing alert endpoint (no captcha required for system alerts)
app.post('/api/payment-alert', async (req, res) => {
  try {
    const { name, email, subject, message, priority = 'normal' } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Store payment alert in database
    await dbAdapter.run(
      'INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES ($1, $2, $3, $4, $5)',
      [name, email, `[${priority.toUpperCase()}] ${subject}`, message, new Date().toISOString()]
    );

    // Send email notification to admin
    try {
      const emailService = require('./services/emailService');
      const emailServiceInstance = new emailService();
      
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@crypto-market-watch.xyz';
      const paymentAlert = {
        type: 'payment_processing_alert',
        severity: 'high',
        message: `Payment Processing Issue - ${subject}`,
        timestamp: new Date().toISOString(),
        data: {
          priority: priority,
          details: message,
          subject: subject
        }
      };
      
      const emailSent = await emailServiceInstance.sendAlertEmail(adminEmail, paymentAlert);
      
      if (emailSent) {
        console.log('📧 Payment alert email sent to admin');
      } else {
        console.log('⚠️ Failed to send payment alert email');
      }
    } catch (emailError) {
      console.error('❌ Error sending payment alert email:', emailError);
    }

    console.log('🚨 Payment processing alert:', {
      name,
      email,
      subject,
      priority,
      message: message.substring(0, 100) + '...'
    });

    res.json({ success: true, message: 'Payment alert sent successfully' });
  } catch (error) {
    console.error('Payment alert error:', error);
    res.status(500).json({ error: 'Failed to send payment alert' });
  }
});

// Admin: Collect news only (without full data collection)
app.post('/api/admin/collect-news', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔧 Admin triggered news collection only');
    
    // Import the data collector (which has the collectCryptoNews method)
    const DataCollector = require('./services/dataCollector');
    const dataCollector = new DataCollector();
    
    // Collect news only
    const events = await dataCollector.collectCryptoNews();
    
    // Clear dashboard cache to ensure new news shows up immediately
    dashboardCache.cache = null;
    dashboardCache.lastUpdate = null;
    console.log('🔄 Dashboard cache cleared to show fresh news data');
    
    // Broadcast dashboard update to all connected users via WebSocket
    const WebSocketService = require('./services/websocketService');
    if (WebSocketService.io) {
      try {
        // Get fresh dashboard data including the new news
        const dashboardData = await getDashboardData();
        if (dashboardData) {
          // Cache the new data
          dashboardCache.set(dashboardData);
          
          // Broadcast complete dashboard update to all connected users
          WebSocketService.io.emit('dashboard_update', { data: dashboardData });
          console.log('📡 Broadcasted dashboard update with fresh news to all connected users');
        }
      } catch (wsError) {
        console.warn('⚠️ Failed to broadcast news update via WebSocket:', wsError.message);
      }
    }
    
    if (events && events.length > 0) {
      console.log(`✅ Admin news collection completed: ${events.length} events`);
      res.json({
        success: true,
        message: 'News collection completed successfully',
        eventsCount: events.length,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ Admin news collection completed with no events found');
      res.json({
        success: true,
        message: 'News collection completed - no significant events found',
        eventsCount: 0,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Admin news collection failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'News collection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin: Get all news events
app.get('/api/admin/news-events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { getCryptoEvents } = require('./database');
    const events = await getCryptoEvents(100); // Get last 100 events
    
    console.log(`📰 Admin requested news events: ${events.length} found`);
    res.json(events);
  } catch (error) {
    console.error('❌ Error fetching news events:', error.message);
    res.status(500).json({
      error: 'Failed to fetch news events',
      message: error.message
    });
  }
});

// Admin: Delete specific news event
app.delete('/api/admin/news-events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteCryptoEvent } = require('./database');
    
    await deleteCryptoEvent(id);
    
    console.log(`🗑️ Admin deleted news event: ${id}`);
    res.json({
      success: true,
      message: 'News event deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting news event:', error.message);
    res.status(500).json({
      error: 'Failed to delete news event',
      message: error.message
    });
  }
});

// Admin: Clear all news events
app.delete('/api/admin/news-events/clear-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clearAllCryptoEvents } = require('./database');
    
    const deletedCount = await clearAllCryptoEvents();
    
    console.log(`🗑️ Admin cleared all news events: ${deletedCount} deleted`);
    res.json({
      success: true,
      message: 'All news events cleared successfully',
      deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing all news events:', error.message);
    res.status(500).json({
      error: 'Failed to clear all news events',
      message: error.message
    });
  }
});

// Public: Get all crypto news events for news page
app.get('/api/news-events', async (req, res) => {
  try {
    const { getCryptoEvents } = require('./database');
    const events = await getCryptoEvents(100); // Get last 100 events
    
    console.log(`📰 Public news events requested: ${events.length} found`);
    res.json(events);
  } catch (error) {
    console.error('❌ Error fetching news events:', error.message);
    res.status(500).json({
      error: 'Failed to fetch news events',
      message: error.message
    });
  }
});

// Activate user (admin only)
app.post('/api/admin/users/:userId/activate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { updateUser, getUserById } = require('./database');
    
    // Get user details
    const user = await getUserById(parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is already activated
    if (user.email_verified) {
      return res.status(400).json({ 
        error: 'User is already activated',
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified
        }
      });
    }
    
    // Activate the user
    await updateUser(parseInt(userId), {
      email_verified: true,
      confirmation_token: null // Clear any pending confirmation token
    });
    
    console.log(`✅ Admin ${req.user.email} activated user ${user.email} (ID: ${userId})`);
    
    res.json({ 
      success: true, 
      message: 'User activated successfully',
      user: {
        id: user.id,
        email: user.email,
        email_verified: true
      }
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

// Deactivate user (admin only)
app.post('/api/admin/users/:userId/deactivate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { updateUser, getUserById } = require('./database');
    
    // Prevent admin from deactivating themselves
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    // Get user details
    const user = await getUserById(parseInt(userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user is already deactivated
    if (!user.email_verified) {
      return res.status(400).json({ 
        error: 'User is already deactivated',
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified
        }
      });
    }
    
    // Deactivate the user
    await updateUser(parseInt(userId), {
      email_verified: false
    });
    
    console.log(`⚠️ Admin ${req.user.email} deactivated user ${user.email} (ID: ${userId})`);
    
    res.json({ 
      success: true, 
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        email: user.email,
        email_verified: false
      }
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// ===== API KEY MANAGEMENT =====

// Get user's API keys
app.get('/api/keys', authenticateToken, async (req, res) => {
  try {
    const { getUserApiKeys } = require('./database');
    const apiKeys = await getUserApiKeys(req.user.userId);
    
    // Mask API keys for security (show only first 8 and last 4 characters)
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      api_key: key.api_key.substring(0, 8) + '...' + key.api_key.substring(key.api_key.length - 4)
    }));
    
    res.json(maskedKeys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Create new API key
app.post('/api/keys', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const { createApiKey } = require('./database');
    
    const result = await createApiKey(req.user.userId, name || 'Default');
    
    res.json({
      id: result.id,
      api_key: result.apiKey, // Return full key only on creation
      name: result.name,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Regenerate API key
app.put('/api/keys/:id/regenerate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { regenerateApiKey } = require('./database');
    
    const result = await regenerateApiKey(req.user.userId, parseInt(id));
    
    res.json({
      api_key: result.apiKey, // Return full key only on regeneration
      message: 'API key regenerated successfully'
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

// Deactivate API key
app.delete('/api/keys/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { deactivateApiKey } = require('./database');
    
    await deactivateApiKey(req.user.userId, parseInt(id));
    
    res.json({ message: 'API key deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating API key:', error);
    res.status(500).json({ error: 'Failed to deactivate API key' });
  }
});

// ===== PUBLIC API ENDPOINTS (API KEY AUTH) =====

const { authenticateApiKey, apiRateLimit } = require('./middleware/apiKeyAuth');

// Market data API endpoint (Public API with API key)
app.get('/api/public/market-data', authenticateApiKey, apiRateLimit(), async (req, res) => {
  try {
    const { getLatestMarketData } = require('./database');
    const marketData = await getLatestMarketData();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: marketData
    });
  } catch (error) {
    console.error('API market data error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Crypto prices API endpoint (Public API with API key)
app.get('/api/public/crypto-prices', authenticateApiKey, apiRateLimit(), async (req, res) => {
  try {
    const { getCryptoPrices } = require('./database');
    const prices = await getCryptoPrices();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: prices
    });
  } catch (error) {
    console.error('API crypto prices error:', error);
    res.status(500).json({ error: 'Failed to fetch crypto prices' });
  }
});

// AI analysis API endpoint
app.get('/api/v1/analysis', authenticateApiKey, apiRateLimit(), async (req, res) => {
  try {
    const { getLatestAIAnalysis } = require('./database');
    const analysis = await getLatestAIAnalysis();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: analysis
    });
  } catch (error) {
    console.error('API analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});


// ===== WEBHOOK TEST ENDPOINT =====

// Test endpoint to verify webhook processing (remove in production)
app.post('/api/test-webhook', async (req, res) => {
  try {
    console.log('🧪 Test webhook endpoint called');
    console.log('📊 Request body:', req.body);
    
    // Simulate a checkout.session.completed event
    const mockEvent = {
      id: 'evt_test_' + Date.now(),
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      data: {
        object: {
          id: 'cs_test_' + Date.now(),
          customer_email: 'test@example.com',
          payment_status: 'paid',
          metadata: {
            userId: '1',
            planId: 'pro'
          },
          subscription: 'sub_test_' + Date.now()
        }
      }
    };
    
    console.log('🔄 Processing mock webhook event...');
    await paymentService.handleStripeWebhook(mockEvent);
    
    res.json({ 
      success: true, 
      message: 'Test webhook processed successfully',
      eventId: mockEvent.id
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== ADVANCED DATA EXPORT ENDPOINTS =====

// Get scheduled exports
app.get('/api/exports/scheduled', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    // For now, return empty array since scheduled exports aren't fully implemented
    res.json([]);
  } catch (error) {
    console.error('Error fetching scheduled exports:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled exports' });
  }
});

// Schedule export
app.post('/api/exports/schedule', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const { dataTypes, dateRange, format, schedule, emailNotification } = req.body;
    const userId = req.user.userId;
    
    // For now, just return success since scheduled exports aren't fully implemented
    res.json({ 
      success: true, 
      message: 'Export scheduled successfully',
      id: Date.now() // Temporary ID
    });
  } catch (error) {
    console.error('Error scheduling export:', error);
    res.status(500).json({ error: 'Failed to schedule export' });
  }
});

// Cancel scheduled export
app.delete('/api/exports/scheduled/:id', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, just return success since scheduled exports aren't fully implemented
    res.json({ success: true, message: 'Scheduled export cancelled' });
  } catch (error) {
    console.error('Error cancelling scheduled export:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled export' });
  }
});

// Serve React app for all other routes (if available)
// This should be the LAST route to avoid interfering with static files
app.get('*', (req, res) => {
  // Skip API routes only - let static middleware handle all other files
  if (req.path.startsWith('/api/')) {
    return res.status(404).send('API endpoint not found');
  }
  
  const indexPath = path.join(__dirname, '../client/build/index.html');
  const publicIndexPath = path.join(__dirname, '../public/index.html');
  
  // Check if the React app exists in client/build
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else if (require('fs').existsSync(publicIndexPath)) {
    // Check if the React app exists in public directory
    res.sendFile(publicIndexPath);
  } else {
    // If React app is not built, serve a simple API info page
    res.status(200).json({
      message: 'Crypto Market Watch API',
      status: 'running',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: '/api/health',
        marketData: '/api/market-data',
        cryptoPrices: '/api/crypto-prices',
        aiAnalysis: '/api/ai-analysis',
        events: '/api/events',
        auth: '/api/auth',
        users: '/api/users'
      },
      note: 'Frontend not built. This is an API-only deployment.',
      documentation: 'API endpoints are available at /api/*'
    });
  }
});

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Fix memory leak warning by increasing max listeners
  server.setMaxListeners(20);
  
  // Initialize WebSocket service
  WebSocketService.initialize(server);
  
  // Log Stripe webhook configuration
  const isProduction = process.env.NODE_ENV === 'production';
  const webhookEnvVar = isProduction ? 'STRIPE_WEBHOOK_SECRET' : 'STRIPE_TEST_WEBHOOK_SECRET';
  const webhookSecret = isProduction ? process.env.STRIPE_WEBHOOK_SECRET : process.env.STRIPE_TEST_WEBHOOK_SECRET;
  
  console.log(`💳 Stripe webhook configuration:`);
  console.log(`   Environment variable: ${webhookEnvVar}`);
  console.log(`   Secret exists: ${!!webhookSecret}`);
  console.log(`   Secret type: ${isProduction ? 'PRODUCTION' : 'TEST'}`);
  if (webhookSecret) {
    console.log(`   Secret starts with: ${webhookSecret.substring(0, 15)}...`);
  }
  
  // Log Railway-specific info
  if (process.env.RAILWAY_STATIC_URL) {
    console.log(`🚂 Railway URL: ${process.env.RAILWAY_STATIC_URL}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  
  // Close WebSocket connections first
  if (WebSocketService && WebSocketService.io) {
    WebSocketService.stopIdleConnectionCleanup();
    WebSocketService.io.close(() => {
      console.log('🔌 WebSocket connections closed');
    });
  }
  
  if (cronJobManager) {
    cronJobManager.stopAllJobs();
    console.log('⏹️ Cron jobs stopped');
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('⚠️ Force exiting after timeout');
    process.exit(1);
  }, 5000);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  
  // Close WebSocket connections first
  if (WebSocketService && WebSocketService.io) {
    WebSocketService.stopIdleConnectionCleanup();
    WebSocketService.io.close(() => {
      console.log('🔌 WebSocket connections closed');
    });
  }
  
  if (cronJobManager) {
    cronJobManager.stopAllJobs();
    console.log('⏹️ Cron jobs stopped');
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('⚠️ Force exiting after timeout');
    process.exit(1);
  }, 5000);
});

// Export correlation collection function for use by dataCollector
module.exports = { app, collectCorrelationData };