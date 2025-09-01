const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// PostgreSQL-only configuration
console.log('🗄️ Using PostgreSQL database');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  console.error('   Please set DATABASE_URL in your environment variables');
  console.error('   For local development, you can use a local PostgreSQL instance');
  console.error('   For Railway, add a PostgreSQL plugin to your project');
  process.exit(1);
}

if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error('❌ ERROR: DATABASE_URL must be a PostgreSQL connection string');
  console.error('   Expected format: postgresql://user:password@host:port/database');
  process.exit(1);
}

// Create PostgreSQL connection pool
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database health check function
const checkDatabaseHealth = async () => {
  try {
    const client = await db.connect();
    await client.query('SELECT 1');
    client.release();
    return { status: 'healthy', type: 'PostgreSQL', connected: true };
  } catch (error) {
    return { status: 'unhealthy', type: 'PostgreSQL', connected: false, error: error.message };
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    console.log('🔌 Testing PostgreSQL connection...');
    const client = await db.connect();
    console.log('✅ PostgreSQL connection successful');
    
    // Test the connection
    await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL query test successful');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_type VARCHAR(50) NOT NULL,
        symbol VARCHAR(20),
        value DECIMAL,
        metadata TEXT,
        source VARCHAR(100)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_analysis (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        market_direction VARCHAR(20),
        confidence DECIMAL,
        reasoning TEXT,
        factors_analyzed TEXT,
        analysis_data TEXT
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS crypto_prices (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        symbol VARCHAR(10) NOT NULL,
        price DECIMAL,
        volume_24h DECIMAL,
        market_cap DECIMAL,
        change_24h DECIMAL
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS fear_greed_index (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        value INTEGER,
        classification VARCHAR(20),
        source VARCHAR(100)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS trending_narratives (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        narrative TEXT,
        sentiment VARCHAR(20),
        relevance_score DECIMAL,
        source TEXT
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS upcoming_events (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        impact VARCHAR(20),
        date TIMESTAMP NOT NULL,
        source VARCHAR(100),
        ignored BOOLEAN DEFAULT FALSE
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS layer1_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        chain_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        price DECIMAL NOT NULL,
        change_24h DECIMAL NOT NULL,
        market_cap DECIMAL NOT NULL,
        volume_24h DECIMAL NOT NULL,
        tps INTEGER NOT NULL,
        active_addresses INTEGER NOT NULL,
        hash_rate DECIMAL,
        dominance DECIMAL NOT NULL,
        narrative TEXT NOT NULL,
        sentiment VARCHAR(20) NOT NULL
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS bitcoin_dominance (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        value DECIMAL,
        source VARCHAR(100)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS stablecoin_metrics (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metric_type VARCHAR(50),
        value DECIMAL,
        metadata TEXT,
        source VARCHAR(100)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS exchange_flows (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        flow_type VARCHAR(20),
        amount DECIMAL,
        asset VARCHAR(10),
        exchange VARCHAR(50),
        source VARCHAR(100)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        confirmation_token VARCHAR(500),
        stripe_customer_id VARCHAR(255),
        email_notifications BOOLEAN DEFAULT FALSE,
        push_notifications BOOLEAN DEFAULT FALSE,
        telegram_notifications BOOLEAN DEFAULT FALSE,
        notification_preferences TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        plan_type VARCHAR(50),
        status VARCHAR(20),
        stripe_subscription_id VARCHAR(100),
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        endpoint VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50),
        message TEXT,
        severity VARCHAR(20),
        metric VARCHAR(50),
        value TEXT,
        eventId INTEGER,
        eventDate TEXT,
        eventTitle TEXT,
        eventCategory TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50),
        source VARCHAR(100),
        message TEXT,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        api_key VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP,
        usage_count INTEGER DEFAULT 0
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_alert_thresholds (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        threshold_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        metric TEXT NOT NULL,
        condition TEXT NOT NULL,
        value DECIMAL NOT NULL,
        unit TEXT,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS inflation_data (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        value DECIMAL,
        core_value DECIMAL,
        yoy_change DECIMAL,
        core_yoy_change DECIMAL,
        source VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS inflation_releases (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        time TIME,
        timezone VARCHAR(50),
        source VARCHAR(10),
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type, date)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS inflation_forecasts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        forecast_data JSONB,
        confidence DECIMAL,
        factors JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS backtest_results (
        id SERIAL PRIMARY KEY,
        prediction_date TIMESTAMP,
        actual_date TIMESTAMP,
        predicted_direction VARCHAR(20),
        actual_direction VARCHAR(20),
        accuracy DECIMAL,
        crypto_symbol VARCHAR(10),
        price_at_prediction DECIMAL,
        price_at_actual DECIMAL,
        correlation_score DECIMAL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    client.release();
    console.log('✅ PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('❌ PostgreSQL initialization failed:', error);
    throw error;
  }
};

// PostgreSQL database adapter
const dbAdapter = {
  // Run a query (for INSERT, UPDATE, DELETE)
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(query, params)
        .then(result => resolve({ lastID: result.rows[0]?.id || result.rowCount }))
        .catch(reject);
    });
  },

  // Get a single row
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(query, params)
        .then(result => resolve(result.rows[0] || null))
        .catch(reject);
    });
  },

  // Get multiple rows
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(query, params)
        .then(result => resolve(result.rows))
        .catch(reject);
    });
  }
};

// Helper functions for database operations
const insertMarketData = (dataType, symbol, value, metadata = {}, source = 'Unknown') => {
  return new Promise((resolve, reject) => {
    const metadataStr = JSON.stringify(metadata);
    
    dbAdapter.run(
      'INSERT INTO market_data (data_type, symbol, value, metadata, source) VALUES ($1, $2, $3, $4, $5)',
      [dataType, symbol, value, metadataStr, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getMarketData = (dataType, limit = 100, symbol = null) => {
  return new Promise((resolve, reject) => {
    let query, params;
    
    if (symbol) {
      query = 'SELECT * FROM market_data WHERE data_type = $1 AND symbol = $2 ORDER BY timestamp DESC LIMIT $3';
      params = [dataType, symbol, limit];
    } else {
      query = 'SELECT * FROM market_data WHERE data_type = $1 ORDER BY timestamp DESC LIMIT $2';
      params = [dataType, limit];
    }
    
    dbAdapter.all(query, params)
      .then(resolve)
      .catch(reject);
  });
};

const getLatestMarketData = (dataType, symbol) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM market_data WHERE data_type = $1 AND symbol = $2 ORDER BY timestamp DESC LIMIT 1',
      [dataType, symbol]
    ).then(resolve).catch(reject);
  });
};

const insertAIAnalysis = (marketDirection, confidence, reasoning, factorsAnalyzed, analysisData = null) => {
  return new Promise((resolve, reject) => {
    const factorsStr = JSON.stringify(factorsAnalyzed);
    // analysisData is already a JSON string, don't double-encode it
    const analysisDataStr = analysisData;
    
    dbAdapter.run(
      'INSERT INTO ai_analysis (market_direction, confidence, reasoning, factors_analyzed, analysis_data) VALUES ($1, $2, $3, $4, $5)',
      [marketDirection, confidence, reasoning, factorsStr, analysisDataStr]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getLatestAIAnalysis = () => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM ai_analysis ORDER BY timestamp DESC LIMIT 1'
    ).then(resolve).catch(reject);
  });
};

const insertCryptoPrice = (symbol, price, volume24h, marketCap, change24h) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO crypto_prices (symbol, price, volume_24h, market_cap, change_24h) VALUES ($1, $2, $3, $4, $5)',
      [symbol, price, volume24h, marketCap, change24h]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getCryptoPrices = (symbol, limit = 100) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM crypto_prices WHERE symbol = $1 ORDER BY timestamp DESC LIMIT $2',
      [symbol, limit]
    ).then(resolve).catch(reject);
  });
};

const getLatestCryptoPrice = (symbol) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM crypto_prices WHERE symbol = $1 ORDER BY timestamp DESC LIMIT 1',
      [symbol]
    ).then(resolve).catch(reject);
  });
};

const insertFearGreedIndex = (value, classification, source) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO fear_greed_index (value, classification, source) VALUES ($1, $2, $3)',
      [value, classification, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getLatestFearGreedIndex = () => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM fear_greed_index ORDER BY timestamp DESC LIMIT 1'
    ).then(resolve).catch(reject);
  });
};

const insertTrendingNarrative = (narrative, sentiment, relevanceScore, source) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO trending_narratives (narrative, sentiment, relevance_score, source) VALUES ($1, $2, $3, $4)',
      [narrative, sentiment, relevanceScore, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

  const getTrendingNarratives = (limit = 10) => {
    return new Promise((resolve, reject) => {
      // Get the latest entry for each narrative to avoid duplicates
      dbAdapter.all(
        `SELECT * FROM trending_narratives 
         WHERE id IN (
           SELECT MAX(id) 
           FROM trending_narratives 
           GROUP BY narrative
         ) 
         ORDER BY timestamp DESC 
         LIMIT $1`,
        [limit]
      ).then(resolve).catch(reject);
    });
  };

  const getLayer1Data = () => {
    return new Promise((resolve, reject) => {
      dbAdapter.all(
        'SELECT * FROM layer1_data ORDER BY market_cap DESC'
      ).then(resolve).catch(reject);
    });
  };

  const insertLayer1Data = (chainId, name, symbol, price, change24h, marketCap, volume24h, tps, activeAddresses, hashRate, dominance, narrative, sentiment) => {
    return new Promise((resolve, reject) => {
      dbAdapter.run(
        `INSERT INTO layer1_data 
         (chain_id, name, symbol, price, change_24h, market_cap, volume_24h, tps, active_addresses, hash_rate, dominance, narrative, sentiment) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (chain_id) DO UPDATE SET
         name = EXCLUDED.name,
         symbol = EXCLUDED.symbol,
         price = EXCLUDED.price,
         change_24h = EXCLUDED.change_24h,
         market_cap = EXCLUDED.market_cap,
         volume_24h = EXCLUDED.volume_24h,
         tps = EXCLUDED.tps,
         active_addresses = EXCLUDED.active_addresses,
         hash_rate = EXCLUDED.hash_rate,
         dominance = EXCLUDED.dominance,
         narrative = EXCLUDED.narrative,
         sentiment = EXCLUDED.sentiment`,
        [chainId, name, symbol, price, change24h, marketCap, volume24h, tps, activeAddresses, hashRate, dominance, narrative, sentiment]
      ).then(result => resolve(result.lastID))
       .catch(reject);
    });
  };

const insertBacktestResult = (predictionDate, actualDate, predictedDirection, actualDirection, accuracy, cryptoSymbol, priceAtPrediction, priceAtActual, correlationScore) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO backtest_results (prediction_date, actual_date, predicted_direction, actual_direction, accuracy, crypto_symbol, price_at_prediction, price_at_actual, correlation_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [predictionDate, actualDate, predictedDirection, actualDirection, accuracy, cryptoSymbol, priceAtPrediction, priceAtActual, correlationScore]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getBacktestResults = (limit = 50) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM backtest_results ORDER BY timestamp DESC LIMIT $1',
      [limit]
    ).then(resolve).catch(reject);
  });
};

// Error logging functions
const insertErrorLog = (errorData) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO error_logs (type, source, message, details, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [errorData.type, errorData.source, errorData.message, errorData.details, errorData.timestamp]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getErrorLogs = (limit = 50) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT $1',
      [limit]
    ).then(resolve).catch(reject);
  });
};

// User management functions
const insertUser = (email, passwordHash, isAdmin = false) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, $3)',
      [email, passwordHash, isAdmin]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const insertUserWithConfirmation = (email, passwordHash, confirmationToken) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO users (email, password_hash, email_verified, confirmation_token, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [email, passwordHash, false, confirmationToken, new Date().toISOString(), new Date().toISOString()]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM users WHERE id = $1',
      [id]
    ).then(resolve).catch(reject);
  });
};

const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM users WHERE email = $1',
      [email]
    ).then(resolve).catch(reject);
  });
};

const updateUser = (id, updates) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    dbAdapter.run(
      `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`,
      values
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const isUserAdmin = (userId) => {
  return new Promise((resolve, reject) => {
    // First check user is_admin field
    dbAdapter.get(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    ).then(userRow => {
      // If user has is_admin = true, they are admin
      if (userRow && userRow.is_admin === true) {
        resolve(true);
        return;
      }
      
      // Otherwise check for active admin subscription
      return dbAdapter.get(
        'SELECT plan_type FROM subscriptions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, 'active']
      );
    }).then(subRow => {
      // User is admin if they have an active admin subscription
      resolve(subRow && subRow.plan_type === 'admin');
    }).catch(reject);
  });
};

// Subscription management functions
const insertSubscription = (subscriptionData) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(subscriptionData).join(', ');
    const placeholders = Object.keys(subscriptionData).map((_, index) => `$${index + 1}`).join(', ');
    const values = Object.values(subscriptionData);
    
    dbAdapter.run(
      `INSERT INTO subscriptions (${fields}) VALUES (${placeholders})`,
      values
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getActiveSubscription = (userId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [userId, 'active']
    ).then(resolve).catch(reject);
  });
};

const updateSubscription = (subscriptionId, updates) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(subscriptionId);
    
    dbAdapter.run(
      `UPDATE subscriptions SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`,
      values
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

// API usage tracking
const trackApiUsage = (userId, endpoint, ipAddress, userAgent) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO api_usage (user_id, endpoint, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [userId, endpoint, ipAddress, userAgent]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getApiUsage = (userId, days = 30) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM api_usage WHERE user_id = $1 AND timestamp >= CURRENT_TIMESTAMP - INTERVAL \'${days} days\' ORDER BY timestamp DESC',
      [userId]
    ).then(resolve).catch(reject);
  });
};

// Bitcoin Dominance functions
const insertBitcoinDominance = (value, source = 'CoinGecko') => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO bitcoin_dominance (value, source) VALUES ($1, $2)',
      [value, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getLatestBitcoinDominance = () => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM bitcoin_dominance ORDER BY timestamp DESC LIMIT 1'
    ).then(resolve).catch(reject);
  });
};

const getBitcoinDominanceHistory = (days = 30) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM bitcoin_dominance WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL \'${days} days\' ORDER BY timestamp DESC'
    ).then(resolve).catch(reject);
  });
};

// Stablecoin metrics functions
const insertStablecoinMetric = (metricType, value, metadata = null, source = 'CoinGecko') => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO stablecoin_metrics (metric_type, value, metadata, source) VALUES ($1, $2, $3, $4)',
      [metricType, value, metadata ? JSON.stringify(metadata) : null, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getLatestStablecoinMetrics = () => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM stablecoin_metrics ORDER BY timestamp DESC LIMIT 10'
    ).then(resolve).catch(reject);
  });
};

// Exchange flows functions
const insertExchangeFlow = (flowType, value, asset, exchange = null, source = 'Glassnode') => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO exchange_flows (flow_type, value, asset, exchange, source) VALUES ($1, $2, $3, $4, $5)',
      [flowType, value, asset, exchange, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getLatestExchangeFlows = (asset = null) => {
  return new Promise((resolve, reject) => {
    const query = asset 
      ? 'SELECT * FROM exchange_flows WHERE asset = $1 ORDER BY timestamp DESC LIMIT 10'
      : 'SELECT * FROM exchange_flows ORDER BY timestamp DESC LIMIT 10';
    const params = asset ? [asset] : [];
    
    dbAdapter.all(query, params)
      .then(resolve)
      .catch(reject);
  });
};

// Alert functions
const insertAlert = (alert) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO alerts (type, message, severity, metric, value, eventId, eventDate, eventTitle, eventCategory) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [alert.type, alert.message, alert.severity, alert.metric, alert.value, alert.eventId || null, alert.eventDate || null, alert.eventTitle || null, alert.eventCategory || null]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const checkAlertExists = (alert, timeWindow = 3600000) => { // 1 hour default
  return new Promise((resolve, reject) => {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const cutoffTimeStr = cutoffTime.toISOString();
    
    // For event notifications, check by eventId and type
    if (alert.type === 'UPCOMING_EVENT' && alert.eventId) {
      dbAdapter.get(
        'SELECT id FROM alerts WHERE type = $1 AND eventId = $2 AND timestamp > $3',
        [alert.type, alert.eventId, cutoffTimeStr]
      ).then(row => {
        const exists = row !== null;
        resolve(exists);
      }).catch(err => {
        console.error('Error checking alert existence:', err);
        reject(err);
      });
    } else {
      // Check for exact duplicates (same type, metric, and value) within time window
      dbAdapter.get(
        'SELECT id FROM alerts WHERE type = $1 AND metric = $2 AND value = $3 AND timestamp > $4',
        [alert.type, alert.metric, alert.value, cutoffTimeStr]
      ).then(row => {
        const exists = row !== null;
        resolve(exists);
      }).catch(err => {
        console.error('Error checking alert existence:', err);
        reject(err);
      });
    }
  });
};

const getAlerts = (limit = 10) => {
  return new Promise((resolve, reject) => {
    // Get alerts with deduplication - only return the most recent alert of each type/metric combination
    dbAdapter.all(
      `SELECT * FROM alerts 
       WHERE id IN (
         SELECT MAX(id) 
         FROM alerts 
         GROUP BY type, metric
       )
       ORDER BY timestamp DESC 
       LIMIT $1`,
      [limit]
    ).then(resolve).catch(reject);
  });
};

// Get user's custom alert thresholds
const getUserAlertThresholds = (userId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM user_alert_thresholds WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    ).then(resolve).catch(err => {
      console.error('Error getting user alert thresholds:', err);
      reject(err);
    });
  });
};

// Save user's custom alert thresholds
const saveUserAlertThresholds = (userId, thresholds) => {
  return new Promise((resolve, reject) => {
    // First, delete existing thresholds for this user
    dbAdapter.run('DELETE FROM user_alert_thresholds WHERE user_id = $1', [userId])
      .then(() => {
        // Then insert new thresholds
        const timestamp = new Date().toISOString();
        const insertPromises = thresholds.map(threshold => 
          dbAdapter.run(
            'INSERT INTO user_alert_thresholds (user_id, threshold_id, name, description, metric, condition, value, unit, enabled, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [
              userId,
              threshold.id,
              threshold.name,
              threshold.description,
              threshold.metric,
              threshold.condition,
              threshold.value,
              threshold.unit,
              threshold.enabled,
              timestamp
            ]
          )
        );
        
        return Promise.all(insertPromises);
      })
      .then(() => resolve())
      .catch(err => {
        console.error('Error saving thresholds:', err);
        reject(err);
      });
  });
};

const getUniqueAlerts = (limit = 10) => {
  return new Promise((resolve, reject) => {
    // Get unique alerts by type and metric, prioritizing the most recent ones
    dbAdapter.all(
      `SELECT DISTINCT a.* 
       FROM alerts a
       INNER JOIN (
         SELECT type, metric, MAX(timestamp) as max_timestamp
         FROM alerts
         GROUP BY type, metric
       ) b ON a.type = b.type AND a.metric = b.metric AND a.timestamp = b.max_timestamp
       ORDER BY a.timestamp DESC 
       LIMIT $1`,
      [limit]
    ).then(resolve).catch(reject);
  });
};

const acknowledgeAlert = (alertId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'UPDATE alerts SET acknowledged = TRUE WHERE id = $1',
      [alertId]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

// Push subscription functions
const insertPushSubscription = (userId, endpoint, p256dh, auth) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth',
      [userId, endpoint, p256dh, auth]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getPushSubscriptions = (userId = null) => {
  return new Promise((resolve, reject) => {
    const query = userId 
      ? 'SELECT * FROM push_subscriptions WHERE user_id = $1'
      : 'SELECT * FROM push_subscriptions';
    const params = userId ? [userId] : [];
    
    dbAdapter.all(query, params)
      .then(resolve)
      .catch(reject);
  });
};

const deletePushSubscription = (userId, endpoint) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [userId, endpoint]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

// Notification preference functions
const updateNotificationPreferences = (userId, preferences) => {
  return new Promise((resolve, reject) => {
    const { emailNotifications, pushNotifications, telegramNotifications, notificationPreferences } = preferences;
    
    dbAdapter.run(
      `UPDATE users SET 
        email_notifications = $1, 
        push_notifications = $2, 
        telegram_notifications = $3,
        notification_preferences = $4
       WHERE id = $5`,
      [
        emailNotifications,
        pushNotifications,
        telegramNotifications,
        JSON.stringify(notificationPreferences || {}),
        userId
      ]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getNotificationPreferences = (userId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT email_notifications, push_notifications, telegram_notifications, notification_preferences FROM users WHERE id = $1',
      [userId]
    ).then(row => {
      if (row) {
        resolve({
          emailNotifications: Boolean(row.email_notifications),
          pushNotifications: Boolean(row.push_notifications),
          telegramNotifications: Boolean(row.telegram_notifications),
          notificationPreferences: JSON.parse(row.notification_preferences || '{}')
        });
      } else {
        resolve(null);
      }
    }).catch(reject);
  });
};

const getUsersWithNotifications = () => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      `SELECT u.id, u.email, u.email_notifications, u.push_notifications, u.telegram_notifications,
              ps.endpoint, ps.p256dh, ps.auth
       FROM users u
       LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
       WHERE (u.email_notifications = true OR u.push_notifications = true OR u.telegram_notifications = true)
       AND u.email IS NOT NULL AND u.email != ''`
    ).then(rows => {
      // Group by user and combine push subscriptions
      const users = {};
      rows.forEach(row => {
        if (!users[row.id]) {
          users[row.id] = {
            id: row.id,
            email: row.email,
            emailNotifications: Boolean(row.email_notifications),
            pushNotifications: Boolean(row.push_notifications),
            telegramNotifications: Boolean(row.telegram_notifications),
            pushSubscriptions: []
          };
        }
        
        if (row.endpoint) {
          users[row.id].pushSubscriptions.push({
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth
            }
          });
        }
      });
      
      resolve(Object.values(users));
    }).catch(reject);
  });
};

const cleanupOldAlerts = (daysToKeep = 7) => {
  return new Promise((resolve, reject) => {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)).toISOString();
    dbAdapter.run(
      'DELETE FROM alerts WHERE timestamp < $1',
      [cutoffDate]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const cleanupDuplicateAlerts = () => {
  return new Promise((resolve, reject) => {
    // Delete duplicate alerts, keeping only the most recent one for each type/metric combination
    dbAdapter.run(
      `DELETE FROM alerts 
       WHERE id NOT IN (
         SELECT MAX(id) 
         FROM alerts 
         GROUP BY type, metric
       )`
    ).then(result => {
      console.log(`Cleaned up ${result.lastID} duplicate alerts`);
      resolve(result.lastID);
    }).catch(err => {
      console.error('Error cleaning up duplicate alerts:', err);
      reject(err);
    });
  });
};

// Upcoming Events functions
const insertUpcomingEvent = (title, description, category, impact, date, source) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'INSERT INTO upcoming_events (title, description, category, impact, date, source) VALUES ($1, $2, $3, $4, $5, $6)',
      [title, description, category, impact, date, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getUpcomingEvents = (limit = 20) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM upcoming_events WHERE date > NOW() AND ignored = false ORDER BY date ASC LIMIT $1',
      [limit]
    ).then(resolve).catch(reject);
  });
};

const getAllUpcomingEvents = (limit = 20) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM upcoming_events WHERE date > NOW() ORDER BY date ASC LIMIT $1',
      [limit]
    ).then(resolve).catch(reject);
  });
};

const ignoreUpcomingEvent = (eventId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'UPDATE upcoming_events SET ignored = true WHERE id = $1',
      [eventId]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const unignoreUpcomingEvent = (eventId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'UPDATE upcoming_events SET ignored = false WHERE id = $1',
      [eventId]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const deleteUpcomingEvent = (eventId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'DELETE FROM upcoming_events WHERE id = $1',
      [eventId]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

// Admin functions for getting table data
const getTableData = (tableName, limit = 100) => {
  return new Promise((resolve, reject) => {
    // Different tables use different timestamp columns
    let orderByColumn;
    switch (tableName) {
      case 'users':
        orderByColumn = 'created_at';
        break;
      case 'subscriptions':
        orderByColumn = 'created_at';
        break;
      case 'api_keys':
        orderByColumn = 'created_at';
        break;
      case 'alerts':
        orderByColumn = 'created_at';
        break;
      case 'push_subscriptions':
        orderByColumn = 'created_at';
        break;
      case 'contact_messages':
        orderByColumn = 'created_at';
        break;
      case 'upcoming_events':
        orderByColumn = 'date';
        break;
      default:
        orderByColumn = 'timestamp';
    }
    
    const query = `SELECT * FROM ${tableName} ORDER BY ${orderByColumn} DESC LIMIT $1`;
    dbAdapter.all(query, [limit])
      .then(rows => resolve(rows || []))
      .catch(err => {
        console.error(`Error fetching from ${tableName}:`, err);
        resolve([]);
      });
  });
};

// API Key management functions
const generateApiKey = () => {
  const crypto = require('crypto');
  return 'sk_' + crypto.randomBytes(32).toString('hex');
};

const createApiKey = (userId, name = 'Default') => {
  return new Promise((resolve, reject) => {
    const apiKey = generateApiKey();
    dbAdapter.run(
      'INSERT INTO api_keys (user_id, api_key, name) VALUES ($1, $2, $3)',
      [userId, apiKey, name]
    ).then(result => resolve({ id: result.lastID, apiKey, name }))
     .catch(reject);
  });
};

const getUserApiKeys = (userId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT id, api_key, name, is_active, created_at, last_used, usage_count FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    ).then(rows => resolve(rows || []))
     .catch(reject);
  });
};

const getApiKeyByKey = (apiKey) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM api_keys WHERE api_key = $1 AND is_active = true',
      [apiKey]
    ).then(resolve).catch(reject);
  });
};

const updateApiKeyUsage = (apiKeyId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = $1',
      [apiKeyId]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const deactivateApiKey = (userId, apiKeyId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2',
      [apiKeyId, userId]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const regenerateApiKey = (userId, apiKeyId) => {
  return new Promise((resolve, reject) => {
    const newApiKey = generateApiKey();
    dbAdapter.run(
      'UPDATE api_keys SET api_key = $1, last_used = NULL, usage_count = 0 WHERE id = $2 AND user_id = $3',
      [newApiKey, apiKeyId, userId]
    ).then(result => resolve({ apiKey: newApiKey }))
     .catch(reject);
  });
};

// Inflation data functions
const insertInflationData = (data) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(`
      INSERT INTO inflation_data (
        type, date, value, core_value, yoy_change, core_yoy_change, source, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `, [data.type, data.date, data.value, data.coreValue, data.yoyChange, data.coreYoYChange, data.source])
    .then(result => resolve(result.lastID))
    .catch(reject);
  });
};

const getLatestInflationData = (type) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(`
      SELECT * FROM inflation_data 
      WHERE type = $1 
      ORDER BY date DESC 
      LIMIT 1
    `, [type])
    .then(resolve)
    .catch(reject);
  });
};

const getInflationDataHistory = (type, months = 12) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(`
      SELECT * FROM inflation_data 
      WHERE type = $1 
      AND date >= CURRENT_DATE - INTERVAL '${months} months'
      ORDER BY date DESC
    `, [type])
    .then(resolve)
    .catch(reject);
  });
};

// Inflation release schedule functions
const insertInflationRelease = (release) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(`
      INSERT INTO inflation_releases (
        type, date, time, timezone, source, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'scheduled', CURRENT_TIMESTAMP)
      ON CONFLICT (type, date) DO UPDATE SET
        time = EXCLUDED.time,
        timezone = EXCLUDED.timezone,
        source = EXCLUDED.source
    `, [release.type, release.date, release.time, release.timezone, release.source])
    .then(result => resolve(result.lastID))
    .catch(reject);
  });
};

const getInflationReleases = (date) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(`
      SELECT * FROM inflation_releases 
      WHERE date = $1 AND status = 'scheduled'
      ORDER BY time
    `, [date])
    .then(resolve)
    .catch(reject);
  });
};

const updateInflationRelease = (type, date, status) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(`
      UPDATE inflation_releases 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE type = $2 AND date = $3
    `, [status, type, date])
    .then(result => resolve(result.lastID))
    .catch(reject);
  });
};

// Inflation forecasts functions
const insertInflationForecast = (forecast) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(`
      INSERT INTO inflation_forecasts (
        type, forecast_data, confidence, factors, created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `, [forecast.type, JSON.stringify(forecast.forecast), forecast.confidence, JSON.stringify(forecast.factors)])
    .then(result => resolve(result.lastID))
    .catch(reject);
  });
};

const getLatestInflationForecast = (type) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(`
      SELECT * FROM inflation_forecasts 
      WHERE type = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [type])
    .then(row => {
      if (row) {
        row.forecast_data = JSON.parse(row.forecast_data);
        row.factors = JSON.parse(row.factors);
      }
      resolve(row);
    })
    .catch(reject);
  });
};

// Email unsubscribe functions
const unsubscribeFromEmailNotifications = (email, token) => {
  return new Promise((resolve, reject) => {
    // First, verify the token is valid for this email
    // For simplicity, we'll use a simple hash-based token
    const crypto = require('crypto');
    const expectedToken = crypto.createHash('sha256')
      .update(email + process.env.JWT_SECRET || 'default-secret')
      .digest('hex');
    
    if (token !== expectedToken) {
      return resolve({ success: false, error: 'Invalid unsubscribe token' });
    }
    
    // Update the user's email notification preference
    dbAdapter.run(
      'UPDATE users SET email_notifications = false WHERE email = $1',
      [email]
    ).then(result => {
      if (result.lastID > 0) {
        resolve({ success: true, message: 'Successfully unsubscribed from email notifications' });
      } else {
        resolve({ success: false, error: 'Email not found' });
      }
    }).catch(reject);
  });
};

module.exports = {
  db,
  dbAdapter,
  initDatabase,
  insertMarketData,
  getMarketData,
  getLatestMarketData,
  insertAIAnalysis,
  getLatestAIAnalysis,
  insertCryptoPrice,
  getCryptoPrices,
  getLatestCryptoPrice,
  insertFearGreedIndex,
  getLatestFearGreedIndex,
  insertTrendingNarrative,
  getTrendingNarratives,
  getLayer1Data,
  insertLayer1Data,
  insertBacktestResult,
  getBacktestResults,
  // Error logging
  insertErrorLog,
  getErrorLogs,
  // User management
  insertUser,
  insertUserWithConfirmation,
  getUserById,
  getUserByEmail,
  updateUser,
  isUserAdmin,
  // Subscription management
  insertSubscription,
  getActiveSubscription,
  updateSubscription,
  // API usage tracking
  trackApiUsage,
  getApiUsage,
  // Bitcoin Dominance
  insertBitcoinDominance,
  getLatestBitcoinDominance,
  getBitcoinDominanceHistory,
  // Stablecoin metrics
  insertStablecoinMetric,
  getLatestStablecoinMetrics,
  // Exchange flows
  insertExchangeFlow,
  getLatestExchangeFlows,
  // Alerts
  insertAlert,
  checkAlertExists,
  getAlerts,
  getUniqueAlerts,
  acknowledgeAlert,
  cleanupOldAlerts,
  cleanupDuplicateAlerts,
  getUserAlertThresholds,
  saveUserAlertThresholds,
  insertPushSubscription,
  getPushSubscriptions,
  deletePushSubscription,
  updateNotificationPreferences,
  getNotificationPreferences,
  getUsersWithNotifications,
  // Admin functions
  getTableData,
  // Upcoming Events
  insertUpcomingEvent,
  getUpcomingEvents,
  getAllUpcomingEvents,
  ignoreUpcomingEvent,
  unignoreUpcomingEvent,
  deleteUpcomingEvent,
  // API Key management
  createApiKey,
  getUserApiKeys,
  getApiKeyByKey,
  updateApiKeyUsage,
  deactivateApiKey,
  regenerateApiKey,
  
  // Inflation data functions
  insertInflationData,
  getLatestInflationData,
  getInflationDataHistory,
  
  // Inflation release functions
  insertInflationRelease,
  getInflationReleases,
  updateInflationRelease,
  
  // Inflation forecast functions
  insertInflationForecast,
  getLatestInflationForecast,
  
  // Email unsubscribe functions
  unsubscribeFromEmailNotifications,
  
  // Database health check
  checkDatabaseHealth
};