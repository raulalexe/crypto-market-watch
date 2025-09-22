const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// PostgreSQL-only configuration
console.log('🗄️ Using PostgreSQL database');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'test') {
    // Provide a dummy connection string during tests to avoid process.exit
    process.env.DATABASE_URL = 'postgresql://testuser:testpass@localhost:5432/testdb';
    console.warn('⚠️ DATABASE_URL not set. Using dummy connection string for tests.');
  } else {
    console.error('❌ ERROR: DATABASE_URL environment variable is required');
    console.error('   Please set DATABASE_URL in your environment variables');
    console.error('   For local development, you can use a local PostgreSQL instance');
    console.error('   For Railway, add a PostgreSQL plugin to your project');
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test' && !process.env.DATABASE_URL.startsWith('postgresql://')) {
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
        change_24h DECIMAL,
        UNIQUE(symbol, timestamp)
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
      CREATE TABLE IF NOT EXISTS correlation_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        symbol1 VARCHAR(10) NOT NULL,
        symbol2 VARCHAR(10) NOT NULL,
        correlation DECIMAL(10,6) NOT NULL,
        period_days INTEGER DEFAULT 30,
        calculation_method VARCHAR(20) DEFAULT 'pearson',
        source VARCHAR(100),
        UNIQUE(symbol1, symbol2, timestamp)
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
        subscription_plan VARCHAR(50) DEFAULT 'free',
        subscription_expires_at TIMESTAMP,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        user_id INTEGER,
        alert_type VARCHAR(50),
        message TEXT,
        is_acknowledged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(50),
        metric VARCHAR(50),
        severity VARCHAR(20),
        value TEXT,
        eventId INTEGER,
        eventDate TEXT,
        eventTitle TEXT,
        eventCategory TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure all required columns exist (for existing databases)
    
    // Add subscription columns to users table if they don't exist
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free'
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }
    
    // Add updated_at column to subscriptions table if it doesn't exist
    await client.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    // Update existing subscription records to have updated_at = created_at
    await client.query(`
      UPDATE subscriptions 
      SET updated_at = created_at 
      WHERE updated_at IS NULL
    `);
    
    const alertsColumns = [
      { name: 'user_id', type: 'INTEGER' },
      { name: 'alert_type', type: 'VARCHAR(50)' },
      { name: 'is_acknowledged', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'type', type: 'VARCHAR(50)' },
      { name: 'metric', type: 'VARCHAR(50)' },
      { name: 'severity', type: 'VARCHAR(20)' },
      { name: 'message', type: 'TEXT' },
      { name: 'value', type: 'TEXT' },
      { name: 'eventId', type: 'INTEGER' },
      { name: 'eventDate', type: 'TEXT' },
      { name: 'eventTitle', type: 'TEXT' },
      { name: 'eventCategory', type: 'TEXT' },
      { name: 'timestamp', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    for (const column of alertsColumns) {
      try {
        await client.query(`
          ALTER TABLE alerts ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
      } catch (error) {
        // Column might already exist, ignore error
        console.log(`ℹ️ Column ${column.name} check completed`);
      }
    }
    
    // Create index on timestamp column for better performance
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)
      `);
      console.log('✅ Alerts timestamp index created/verified');
    } catch (error) {
      console.log(`ℹ️ Alerts timestamp index: ${error.message}`);
    }
    
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
        mom_change DECIMAL,
        core_mom_change DECIMAL,
        source VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(type, date)
      )
    `);
    
    // Add missing columns if they don't exist (for existing tables)
    try {
      await client.query(`
        ALTER TABLE inflation_data 
        ADD COLUMN IF NOT EXISTS mom_change DECIMAL
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }
    
    try {
      await client.query(`
        ALTER TABLE inflation_data 
        ADD COLUMN IF NOT EXISTS core_mom_change DECIMAL
      `);
    } catch (error) {
      // Column might already exist, ignore error
    }
    
    // Add unique constraint if it doesn't exist
    try {
      // Check if constraint already exists
      const constraintCheck = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'inflation_data' AND constraint_name = 'inflation_data_type_date_unique'
      `);
      
      if (constraintCheck.rows.length === 0) {
        await client.query(`
          ALTER TABLE inflation_data 
          ADD CONSTRAINT inflation_data_type_date_unique UNIQUE (type, date)
        `);
      }
    } catch (error) {
      // Constraint might already exist, ignore error
    }
    
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
      CREATE TABLE IF NOT EXISTS economic_data (
        id SERIAL PRIMARY KEY,
        series_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        value DECIMAL,
        previous_value DECIMAL,
        change_value DECIMAL,
        core_value DECIMAL,
        previous_core_value DECIMAL,
        source VARCHAR(10),
        description TEXT,
        ai_analysis JSONB,
        market_alert_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(series_id, date)
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS economic_calendar (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        impact VARCHAR(20),
        date DATE NOT NULL,
        time TIME,
        timezone VARCHAR(50),
        source VARCHAR(100),
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, date)
      )
    `);
    
    
    
    // Market Sentiment Data
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_sentiment (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sentiment_type VARCHAR(50) NOT NULL,
        value DECIMAL,
        classification VARCHAR(50),
        metadata TEXT,
        source VARCHAR(100)
      )
    `);
    
    // Derivatives Data
    await client.query(`
      CREATE TABLE IF NOT EXISTS derivatives_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        asset VARCHAR(10) NOT NULL,
        derivative_type VARCHAR(20) NOT NULL,
        open_interest DECIMAL,
        volume_24h DECIMAL,
        funding_rate DECIMAL,
        long_short_ratio DECIMAL,
        metadata TEXT,
        source VARCHAR(100)
      )
    `);
    
    // On-Chain Data
    await client.query(`
      CREATE TABLE IF NOT EXISTS onchain_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blockchain VARCHAR(20) NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL,
        metadata TEXT,
        source VARCHAR(100)
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
    
    // Run data integrity constraints migration
    try {
      const { addDataConstraints } = require('./scripts/migrations/003-add-data-constraints');
      await addDataConstraints();
    } catch (migrationError) {
      console.warn('⚠️ Data constraints migration failed (non-critical):', migrationError.message);
    }
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
        .then(result => resolve({ 
          lastID: result.rows[0]?.id || result.rowCount,
          changes: result.rowCount 
        }))
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
    // Input validation
    if (!symbol || !price || price <= 0) {
      return reject(new Error('Symbol and positive price are required'));
    }
    
    // Normalize symbol
    const normalizedSymbol = symbol.trim().toUpperCase();
    
    dbAdapter.run(
      `INSERT INTO crypto_prices (symbol, price, volume_24h, market_cap, change_24h) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (symbol, timestamp) DO UPDATE SET
         price = EXCLUDED.price,
         volume_24h = EXCLUDED.volume_24h,
         market_cap = EXCLUDED.market_cap,
         change_24h = EXCLUDED.change_24h`,
      [normalizedSymbol, price, volume24h, marketCap, change24h]
    ).then(result => {
      console.log(`✅ Crypto price updated: ${normalizedSymbol} = $${price}`);
      resolve(result.lastID);
    }).catch(error => {
      console.error(`❌ Error inserting crypto price for ${normalizedSymbol}:`, error);
      reject(error);
    });
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
      'INSERT INTO trending_narratives (narrative, sentiment, relevance_score, source, timestamp) VALUES ($1, $2, $3, $4, NOW())',
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

  const getProcessedTrendingNarratives = (limit = 10) => {
    return new Promise((resolve, reject) => {
      getTrendingNarratives(limit).then(rawNarratives => {
        try {
          const processedNarratives = rawNarratives.map(narrative => {
            // Parse the source JSON to extract coin data
            let sourceData = {};
            try {
              sourceData = JSON.parse(narrative.source || '{}');
            } catch (e) {
              console.error('Error parsing narrative source:', e);
              sourceData = {};
            }

            const coins = sourceData.coins || [];
            const totalVolume24h = sourceData.total_volume_24h || 0;
            const totalMarketCap = sourceData.total_market_cap || 0;
            const avgChange24h = sourceData.avg_change_24h || 0;

            // Calculate market insights
            const marketInsights = {
              trend_analysis: avgChange24h > 2 ? 'Strong Uptick' : avgChange24h > 0 ? 'Slight Uptick' : avgChange24h > -2 ? 'Slight Downtick' : 'Strong Downtick',
              volume_analysis: totalVolume24h > 1e9 ? 'High Trading Activity' : totalVolume24h > 1e8 ? 'Moderate Trading' : 'Low Trading Activity',
              risk_level: coins.length > 3 ? 'Lower Risk - Diversified' : coins.length > 1 ? 'Medium Risk - Limited Diversification' : 'Medium Risk - Single Asset',
              opportunity_score: Math.min(100, Math.max(0, 50 + (avgChange24h * 5) + (coins.length * 2))),
              opportunity_rating: function() {
                const score = this.opportunity_score;
                if (score >= 80) return 'Excellent';
                if (score >= 60) return 'Good';
                if (score >= 40) return 'Fair';
                return 'Poor';
              }
            };

            return {
              narrative: narrative.narrative,
              sentiment: narrative.sentiment,
              relevance_score: parseFloat(narrative.relevance_score) || 0,
              total_volume_24h: totalVolume24h,
              total_market_cap: totalMarketCap,
              avg_change_24h: avgChange24h,
              coin_count: coins.length,
              coins: coins,
              market_insights: marketInsights
            };
          });

          resolve(processedNarratives);
        } catch (error) {
          console.error('Error processing trending narratives:', error);
          reject(error);
        }
      }).catch(reject);
    });
  };

  const getDerivativesData = () => {
    return new Promise((resolve, reject) => {
      dbAdapter.all(
        'SELECT * FROM derivatives_data ORDER BY timestamp DESC'
      ).then(resolve).catch(reject);
    });
  };

  const getOnchainData = () => {
    return new Promise((resolve, reject) => {
      dbAdapter.all(
        'SELECT * FROM onchain_data ORDER BY timestamp DESC'
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

  const getLatestLayer1Data = (symbol) => {
    return new Promise((resolve, reject) => {
      dbAdapter.get(
        'SELECT * FROM layer1_data WHERE symbol = $1 ORDER BY timestamp DESC LIMIT 1',
        [symbol.toUpperCase()]
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
    db.query(
      'INSERT INTO error_logs (type, source, message, details, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [errorData.type, errorData.source, errorData.message, errorData.details, errorData.timestamp]
    ).then(result => resolve(result.rows[0].id))
     .catch(reject);
  });
};

const getErrorLogs = (limit = 50) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT $1',
      [limit]
    ).then(result => resolve(result.rows)).catch(reject);
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
      
      // Note: Admin status now determined by is_admin field in users table
      // No separate subscription table needed
      return null;
    }).then(() => {
      // User is not admin (already checked is_admin field above)
      resolve(false);
    }).catch(reject);
  });
};

const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      `SELECT id, email, is_admin, email_verified, subscription_plan, subscription_expires_at, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    ).then(rows => {
      const users = rows.map(row => ({
        id: row.id,
        email: row.email,
        isAdmin: Boolean(row.is_admin),
        emailVerified: Boolean(row.email_verified),
        plan: row.subscription_plan || 'free',
        subscriptionStatus: row.subscription_plan && row.subscription_plan !== 'free' ? 'active' : 'inactive',
        startDate: null, // Not stored separately anymore
        endDate: row.subscription_expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      resolve(users);
    }).catch(reject);
  });
};

const deleteUser = (userId) => {
  return new Promise((resolve, reject) => {
    // Start a transaction to delete user and related data
    dbAdapter.run('BEGIN TRANSACTION')
      .then(() => {
        // Note: Subscription data now stored in users table, no separate deletion needed
        // Delete user's alert thresholds
        return dbAdapter.run('DELETE FROM user_alert_thresholds WHERE user_id = $1', [userId]);
      })
      .then(() => {
        // Delete user's push subscriptions
        return dbAdapter.run('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
      })
      .then(() => {
        // Delete user's API keys
        return dbAdapter.run('DELETE FROM api_keys WHERE user_id = $1', [userId]);
      })
      .then(() => {
        // Finally delete the user
        return dbAdapter.run('DELETE FROM users WHERE id = $1', [userId]);
      })
      .then(() => {
        // Commit the transaction
        return dbAdapter.run('COMMIT');
      })
      .then(() => resolve())
      .catch(error => {
        // Rollback on error
        dbAdapter.run('ROLLBACK')
          .then(() => reject(error))
          .catch(rollbackError => {
            console.error('Rollback failed:', rollbackError);
            reject(error); // Still reject with original error
          });
      });
  });
};

// Note: Subscription management now handled directly in users table
// No separate subscriptions table needed

const getUserByStripeCustomerId = (stripeCustomerId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT * FROM users WHERE stripe_customer_id = $1',
      [stripeCustomerId]
    ).then(resolve).catch(reject);
  });
};

// Note: updateSubscription removed - subscription updates now handled via updateUser

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
      'SELECT * FROM api_usage WHERE user_id = $1 AND timestamp >= CURRENT_TIMESTAMP - INTERVAL $2 ORDER BY timestamp DESC',
      [userId, `${days} days`]
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
      'SELECT * FROM bitcoin_dominance WHERE timestamp >= CURRENT_TIMESTAMP - INTERVAL $1 ORDER BY timestamp DESC',
      [`${days} days`]
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
    // First try to update existing subscription
    dbAdapter.run(
      'UPDATE push_subscriptions SET p256dh = $3, auth = $4 WHERE user_id = $1 AND endpoint = $2',
      [userId, endpoint, p256dh, auth]
    ).then(updateResult => {
      // If no rows were updated, insert a new subscription
      if (updateResult.changes === 0) {
        return dbAdapter.run(
          'INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)',
          [userId, endpoint, p256dh, auth]
        );
      }
      return updateResult;
    }).then(result => resolve(result.lastID))
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
    const { 
      emailNotifications, 
      pushNotifications, 
      telegramNotifications, 
      notificationPreferences,
      eventNotifications,
      eventNotificationWindows,
      eventNotificationChannels,
      eventImpactFilter
    } = preferences;
    
    
    dbAdapter.run(
      `UPDATE users SET 
        email_notifications = $1, 
        push_notifications = $2, 
        telegram_notifications = $3,
        notification_preferences = $4,
        event_notifications = $5,
        event_notification_windows = $6,
        event_notification_channels = $7,
        event_impact_filter = $8
       WHERE id = $9`,
      [
        emailNotifications,
        pushNotifications,
        telegramNotifications,
        JSON.stringify(notificationPreferences || {}),
        eventNotifications,
        JSON.stringify(eventNotificationWindows || [3]),
        JSON.stringify(eventNotificationChannels || ['email', 'push']),
        eventImpactFilter,
        userId
      ]
    ).then(result => {
      resolve(result.changes);
    })
     .catch(error => {
       console.error('❌ [ERROR] Database: Update failed:', error);
       reject(error);
     });
  });
};

const getNotificationPreferences = (userId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT email_notifications, push_notifications, telegram_notifications, notification_preferences, event_notifications, event_notification_windows, event_notification_channels, event_impact_filter FROM users WHERE id = $1',
      [userId]
    ).then(row => {
      if (row) {
        resolve({
          emailNotifications: Boolean(row.email_notifications),
          pushNotifications: Boolean(row.push_notifications),
          telegramNotifications: Boolean(row.telegram_notifications),
          notificationPreferences: JSON.parse(row.notification_preferences || '{}'),
          eventNotifications: Boolean(row.event_notifications),
          eventNotificationWindows: JSON.parse(row.event_notification_windows || '[3]'),
          eventNotificationChannels: JSON.parse(row.event_notification_channels || '["email","push"]'),
          eventImpactFilter: row.event_impact_filter || 'all'
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
              u.event_notifications, u.event_notification_windows, u.event_notification_channels, u.event_impact_filter,
              u.telegram_chat_id, u.telegram_verified,
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
            eventNotifications: Boolean(row.event_notifications),
            eventNotificationWindows: JSON.parse(row.event_notification_windows || '[3]'),
            eventNotificationChannels: JSON.parse(row.event_notification_channels || '["email","push"]'),
            eventImpactFilter: row.event_impact_filter || 'all',
            telegramChatId: row.telegram_chat_id,
            telegramVerified: Boolean(row.telegram_verified),
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

// Telegram verification functions
const generateTelegramVerificationCode = (userId) => {
  return new Promise((resolve, reject) => {
    // Generate a more reliable 6-character code
    const code = Math.random().toString(36).substring(2).padEnd(6, '0').substring(0, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    console.log(`🔑 Generated Telegram verification code: "${code}" for user ${userId}, expires at: ${expiresAt.toISOString()}`);
    
    dbAdapter.run(
      'UPDATE users SET telegram_verification_code = $1, telegram_verification_expires_at = $2 WHERE id = $3',
      [code, expiresAt.toISOString(), userId]
    ).then(result => {
      console.log(`✅ Telegram verification code stored in database for user ${userId}`);
      resolve({ code, expiresAt });
    }).catch(error => {
      console.error(`❌ Failed to store Telegram verification code for user ${userId}:`, error);
      reject(error);
    });
  });
};

const verifyTelegramCode = (code, chatId) => {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Verifying Telegram code: "${code}" for chat ID: ${chatId}`);
    
    // Normalize the code to uppercase for consistent comparison
    const normalizedCode = code.toUpperCase().trim();
    console.log(`🔍 Normalized code: "${normalizedCode}"`);
    
    dbAdapter.get(
      'SELECT id, telegram_verification_expires_at FROM users WHERE UPPER(telegram_verification_code) = $1',
      [normalizedCode]
    ).then(user => {
      if (!user) {
        console.log(`❌ No user found with verification code: "${code}"`);
        resolve({ success: false, error: 'Invalid verification code' });
        return;
      }
      
      console.log(`👤 Found user ${user.id} with verification code, expires at: ${user.telegram_verification_expires_at}`);
      
      const now = new Date();
      const expiresAt = new Date(user.telegram_verification_expires_at);
      
      if (now > expiresAt) {
        console.log(`⏰ Verification code expired. Now: ${now.toISOString()}, Expires: ${expiresAt.toISOString()}`);
        resolve({ success: false, error: 'Verification code has expired' });
        return;
      }
      
      console.log(`✅ Verification code is valid, linking chat ID ${chatId} to user ${user.id}`);
      
      // Link the chat ID to the user and mark as verified
      dbAdapter.run(
        'UPDATE users SET telegram_chat_id = $1, telegram_verified = true, telegram_verification_code = NULL, telegram_verification_expires_at = NULL WHERE id = $2',
        [chatId, user.id]
      ).then(result => {
        console.log(`✅ Successfully linked Telegram chat ID ${chatId} to user ${user.id}`);
        resolve({ success: true, userId: user.id });
      }).catch(error => {
        console.error(`❌ Failed to link Telegram chat ID ${chatId} to user ${user.id}:`, error);
        reject(error);
      });
    }).catch(error => {
      console.error(`❌ Database error during verification:`, error);
      reject(error);
    });
  });
};

const disconnectTelegram = (userId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(
      'UPDATE users SET telegram_chat_id = NULL, telegram_verified = false, telegram_verification_code = NULL, telegram_verification_expires_at = NULL WHERE id = $1',
      [userId]
    ).then(result => {
      resolve({ success: true, changes: result.changes });
    }).catch(reject);
  });
};

const getTelegramStatus = (userId) => {
  return new Promise((resolve, reject) => {
    dbAdapter.get(
      'SELECT telegram_chat_id, telegram_verified, telegram_verification_code, telegram_verification_expires_at FROM users WHERE id = $1',
      [userId]
    ).then(user => {
      if (!user) {
        resolve(null);
        return;
      }
      
      const now = new Date();
      const expiresAt = user.telegram_verification_expires_at ? new Date(user.telegram_verification_expires_at) : null;
      const hasValidCode = user.telegram_verification_code && expiresAt && now < expiresAt;
      
      resolve({
        chatId: user.telegram_chat_id,
        verified: Boolean(user.telegram_verified),
        hasValidCode,
        code: hasValidCode ? user.telegram_verification_code : null,
        expiresAt: expiresAt
      });
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

// Upcoming Events functions with improved deduplication
const insertUpcomingEvent = (title, description, category, impact, date, source) => {
  return new Promise((resolve, reject) => {
    // Input validation
    if (!title || !date || !category) {
      return reject(new Error('Title, date, and category are required'));
    }
    
    // Normalize inputs
    const normalizedTitle = title.trim();
    const normalizedDate = new Date(date);
    const normalizedCategory = category.trim().toLowerCase();
    
    // Enhanced deduplication logic with multiple strategies
    const checkForDuplicates = async () => {
      try {
        // Strategy 1: Exact match (title, date, source)
        let exactMatch = await dbAdapter.get(
          'SELECT id FROM upcoming_events WHERE title = $1 AND date = $2 AND source = $3',
          [normalizedTitle, normalizedDate.toISOString(), source]
        );
        
        if (exactMatch) {
          console.log(`Exact duplicate found: ${normalizedTitle} on ${normalizedDate.toISOString()}`);
          return exactMatch.id;
        }
        
        // Strategy 2: Similar events within date range (for economic events)
        const economicKeywords = ['cpi', 'consumer price index', 'ppi', 'producer price index', 'fomc', 'fed meeting', 'nfp', 'non-farm payroll'];
        const isEconomicEvent = economicKeywords.some(keyword => 
          normalizedTitle.toLowerCase().includes(keyword)
        );
        
        if (isEconomicEvent) {
          const eventDate = normalizedDate;
          const startDate = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before
          const endDate = new Date(eventDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after
          
          const similarMatch = await dbAdapter.get(`
            SELECT id FROM upcoming_events 
            WHERE title ILIKE $1 
            AND date BETWEEN $2 AND $3 
            AND category = $4
            AND source = $5
          `, [
            `%${normalizedTitle.toLowerCase()}%`,
            startDate.toISOString(),
            endDate.toISOString(),
            normalizedCategory,
            source
          ]);
          
          if (similarMatch) {
            console.log(`Similar economic event found: ${normalizedTitle} on ${normalizedDate.toISOString()}`);
            return similarMatch.id;
          }
        }
        
        // Strategy 3: Check for events with same title and category within 7 days
        const weekStart = new Date(normalizedDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(normalizedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const weeklyMatch = await dbAdapter.get(`
          SELECT id FROM upcoming_events 
          WHERE title ILIKE $1 
          AND date BETWEEN $2 AND $3 
          AND category = $4
        `, [
          `%${normalizedTitle.toLowerCase()}%`,
          weekStart.toISOString(),
          weekEnd.toISOString(),
          normalizedCategory
        ]);
        
        if (weeklyMatch) {
          console.log(`Weekly duplicate found: ${normalizedTitle} on ${normalizedDate.toISOString()}`);
          return weeklyMatch.id;
        }
        
        return null; // No duplicates found
      } catch (error) {
        console.error('Error checking for duplicates:', error);
        throw error;
      }
    };
    
    // Check for duplicates and insert if none found
    checkForDuplicates()
      .then(existingId => {
        if (existingId) {
          return existingId;
        } else {
          // Insert new event
          return dbAdapter.run(
            'INSERT INTO upcoming_events (title, description, category, impact, date, source) VALUES ($1, $2, $3, $4, $5, $6)',
            [normalizedTitle, description, category, impact, normalizedDate.toISOString(), source]
          ).then(result => result.lastID);
        }
      })
      .then(eventId => {
        console.log(`✅ Event processed: ${normalizedTitle} (ID: ${eventId})`);
        resolve(eventId);
      })
      .catch(error => {
        console.error('Error in insertUpcomingEvent:', error);
        reject(error);
      });
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

// Get approaching events for email notifications (3 days, 1 day, or same day)
const getApproachingEvents = () => {
  return new Promise((resolve, reject) => {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    dbAdapter.all(`
      SELECT * FROM upcoming_events 
      WHERE date >= NOW() 
      AND date <= $1 
      AND ignored = false 
      ORDER BY date ASC
    `, [threeDaysFromNow.toISOString()]).then(resolve).catch(reject);
  });
};

// Get historical market data for a specific data type and symbol within a date range
const getMarketDataHistory = (dataType, symbol, startDate, endDate, limit = 10) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(`
      SELECT * FROM market_data 
      WHERE data_type = $1 
      AND symbol = $2 
      AND timestamp >= $3 
      AND timestamp <= $4 
      ORDER BY timestamp DESC 
      LIMIT $5
    `, [dataType, symbol, startDate.toISOString(), endDate.toISOString(), limit])
    .then(resolve)
    .catch(reject);
  });
};

// Clean up duplicate events
const cleanupDuplicateEvents = () => {
  return new Promise((resolve, reject) => {
    // Enhanced cleanup for CPI and other economic events
    // First, clean up CPI duplicates specifically
    const cleanupCPIQuery = `
      DELETE FROM upcoming_events 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM upcoming_events 
        WHERE (title ILIKE '%cpi%' OR title ILIKE '%consumer price index%')
        AND category = 'fed'
        GROUP BY DATE_TRUNC('month', date), category
      )
      AND (title ILIKE '%cpi%' OR title ILIKE '%consumer price index%')
      AND category = 'fed'
    `;
    
    // Then clean up other duplicates
    const cleanupGeneralQuery = `
      DELETE FROM upcoming_events 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM upcoming_events 
        WHERE NOT (title ILIKE '%cpi%' OR title ILIKE '%consumer price index%')
        GROUP BY title, date, source
      )
      AND NOT (title ILIKE '%cpi%' OR title ILIKE '%consumer price index%')
    `;
    
    // Execute both cleanup queries
    Promise.all([
      dbAdapter.run(cleanupCPIQuery),
      dbAdapter.run(cleanupGeneralQuery)
    ]).then(results => {
      const totalCleaned = results.reduce((sum, result) => sum + (result.changes || 0), 0);
      console.log(`Cleaned up ${totalCleaned} duplicate events (${results[0].changes || 0} CPI events, ${results[1].changes || 0} other events)`);
      resolve(totalCleaned);
    }).catch(reject);
  });
};

// Clean up alerts for past events
const cleanupPastEventAlerts = () => {
  return new Promise((resolve, reject) => {
    dbAdapter.run(`
      DELETE FROM alerts 
      WHERE type = 'UPCOMING_EVENT' 
      AND eventId IN (
        SELECT id FROM upcoming_events WHERE date <= NOW()
      )
    `).then(result => {
      const totalCleaned = result.changes;
      console.log(`🧹 Cleaned up ${totalCleaned} alerts for past events`);
      resolve(totalCleaned);
    }).catch(reject);
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

const getPastEvents = (limit = 50) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM upcoming_events WHERE date <= NOW() ORDER BY date DESC LIMIT $1',
      [limit]
    ).then(resolve).catch(reject);
  });
};

const getAllEvents = (limit = 100) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(
      'SELECT * FROM upcoming_events ORDER BY date DESC LIMIT $1',
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
    // Use explicit type casting to ensure proper data handling
    const query = `
      INSERT INTO inflation_data (
        type, date, value, core_value, yoy_change, core_yoy_change, mom_change, core_mom_change, source, created_at
      ) VALUES ($1::VARCHAR(10), $2::DATE, $3::NUMERIC, $4::NUMERIC, $5::NUMERIC, $6::NUMERIC, $7::NUMERIC, $8::NUMERIC, $9::VARCHAR(10), CURRENT_TIMESTAMP)
      ON CONFLICT (type, date) DO UPDATE SET
        value = EXCLUDED.value,
        core_value = EXCLUDED.core_value,
        yoy_change = EXCLUDED.yoy_change,
        core_yoy_change = EXCLUDED.core_yoy_change,
        mom_change = EXCLUDED.mom_change,
        core_mom_change = EXCLUDED.core_mom_change,
        source = EXCLUDED.source,
        created_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    const params = [
      data.type, 
      data.date, 
      data.value, 
      data.coreValue, 
      data.yoyChange, 
      data.coreYoYChange, 
      data.momChange || null,
      data.coreMomChange || null,
      data.source
    ];
    
    db.query(query, params)
    .then(result => {
      const id = result.rows[0]?.id;
      resolve(id);
    })
    .catch(reject);
  });
};

const getLatestInflationData = (type) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT * FROM inflation_data 
      WHERE type = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [type])
    .then(result => resolve(result.rows[0] || null))
    .catch(reject);
  });
};

// Get latest inflation data for all types (CPI, PCE, PPI)
const getLatestInflationDataAll = () => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT DISTINCT ON (type) 
        type, date, value, core_value, yoy_change, core_yoy_change, 
        mom_change, core_mom_change, source, created_at
      FROM inflation_data 
      ORDER BY type, created_at DESC
    `)
    .then(result => {
      // Organize data by type
      const data = {};
      result.rows.forEach(row => {
        data[row.type.toLowerCase()] = {
          date: row.date,
          [row.type.toLowerCase()]: row.value,
          [`core${row.type}`]: row.core_value,
          [`${row.type.toLowerCase()}YoY`]: row.yoy_change,
          [`core${row.type}YoY`]: row.core_yoy_change,
          ...(row.type === 'PPI' && {
            [`${row.type.toLowerCase()}MoM`]: row.mom_change,
            [`core${row.type}MoM`]: row.core_mom_change
          })
        };
      });
      resolve(data);
    })
    .catch(reject);
  });
};

const getInflationDataHistory = (type, months = 12) => {
  return new Promise((resolve, reject) => {
    dbAdapter.all(`
      SELECT * FROM inflation_data 
      WHERE type = $1 
      AND date >= CURRENT_DATE - INTERVAL $2
      ORDER BY date DESC
    `, [type, `${months} months`])
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
    db.query(`
      SELECT * FROM inflation_releases 
      WHERE date = $1 AND status = 'scheduled'
      ORDER BY time
    `, [date])
    .then(result => resolve(result.rows))
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
      .update(email + process.env.JWT_SECRET)
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

// Economic Data Functions
const insertEconomicData = (data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO economic_data (
        series_id, date, value, previous_value, change_value, core_value, 
        previous_core_value, source, description, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT (series_id, date) DO UPDATE SET
        value = EXCLUDED.value,
        previous_value = EXCLUDED.previous_value,
        change_value = EXCLUDED.change_value,
        core_value = EXCLUDED.core_value,
        previous_core_value = EXCLUDED.previous_core_value,
        source = EXCLUDED.source,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    const params = [
      data.seriesId,
      data.date,
      data.value,
      data.previousValue,
      data.change,
      data.coreValue,
      data.previousCoreValue,
      data.source,
      data.description
    ];
    
    db.query(query, params)
    .then(result => {
      const id = result.rows[0]?.id;
      resolve(id);
    })
    .catch(reject);
  });
};

const getLatestEconomicData = (seriesId) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT * FROM economic_data 
      WHERE series_id = $1 
      ORDER BY date DESC 
      LIMIT 1
    `, [seriesId])
    .then(result => resolve(result.rows[0] || null))
    .catch(reject);
  });
};

const getEconomicDataHistory = (seriesId, months = 12) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT * FROM economic_data 
      WHERE series_id = $1 
      AND date >= CURRENT_DATE - INTERVAL $2
      ORDER BY date DESC
    `, [seriesId, `${months} months`])
    .then(result => resolve(result.rows))
    .catch(reject);
  });
};


const getEconomicEventsForAnalysis = () => {
  return new Promise((resolve, reject) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    db.query(`
      SELECT ed.*, ec.title, ec.impact, ec.category
      FROM economic_data ed
      LEFT JOIN economic_calendar ec ON ed.series_id = ec.event_id
      WHERE ed.created_at >= $1 
        AND ed.ai_analysis IS NULL
        AND ed.market_alert_sent = FALSE
      ORDER BY ed.created_at DESC
    `, [oneHourAgo])
    .then(result => resolve(result.rows))
    .catch(reject);
  });
};

const updateEconomicDataAnalysis = (id, analysis) => {
  return new Promise((resolve, reject) => {
    db.query(`
      UPDATE economic_data 
      SET ai_analysis = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [JSON.stringify(analysis), id])
    .then(result => resolve(result.rowCount))
    .catch(reject);
  });
};

const markEconomicDataAlertSent = (id) => {
  return new Promise((resolve, reject) => {
    db.query(`
      UPDATE economic_data 
      SET market_alert_sent = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id])
    .then(result => resolve(result.rowCount))
    .catch(reject);
  });
};

// Market Sentiment Functions
const insertMarketSentiment = (sentimentType, value, classification = null, metadata = {}, source = 'Unknown') => {
  return new Promise((resolve, reject) => {
    const metadataStr = JSON.stringify(metadata);
    
    dbAdapter.run(
      'INSERT INTO market_sentiment (sentiment_type, value, classification, metadata, source) VALUES ($1, $2, $3, $4, $5)',
      [sentimentType, value, classification, metadataStr, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getLatestMarketSentiment = (sentimentType = null) => {
  return new Promise((resolve, reject) => {
    let query, params;
    
    if (sentimentType) {
      query = 'SELECT * FROM market_sentiment WHERE sentiment_type = $1 ORDER BY timestamp DESC LIMIT 1';
      params = [sentimentType];
    } else {
      query = 'SELECT * FROM market_sentiment ORDER BY timestamp DESC LIMIT 1';
      params = [];
    }
    
    dbAdapter.get(query, params)
      .then(row => {
        if (row && row.metadata) {
          row.metadata = JSON.parse(row.metadata);
        }
        resolve(row);
      })
      .catch(reject);
  });
};

// Derivatives Data Functions
const insertDerivativesData = (asset, derivativeType, openInterest = null, volume24h = null, fundingRate = null, longShortRatio = null, metadata = {}, source = 'Unknown') => {
  return new Promise((resolve, reject) => {
    const metadataStr = JSON.stringify(metadata);
    
    dbAdapter.run(
      'INSERT INTO derivatives_data (asset, derivative_type, open_interest, volume_24h, funding_rate, long_short_ratio, metadata, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [asset, derivativeType, openInterest, volume24h, fundingRate, longShortRatio, metadataStr, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getLatestDerivativesData = (asset = null, derivativeType = null) => {
  return new Promise((resolve, reject) => {
    let query, params;
    
    if (asset && derivativeType) {
      query = 'SELECT * FROM derivatives_data WHERE asset = $1 AND derivative_type = $2 ORDER BY timestamp DESC LIMIT 1';
      params = [asset, derivativeType];
    } else if (asset) {
      query = 'SELECT * FROM derivatives_data WHERE asset = $1 ORDER BY timestamp DESC LIMIT 1';
      params = [asset];
    } else {
      query = 'SELECT * FROM derivatives_data ORDER BY timestamp DESC LIMIT 1';
      params = [];
    }
    
    dbAdapter.get(query, params)
      .then(row => {
        if (row && row.metadata) {
          row.metadata = JSON.parse(row.metadata);
        }
        resolve(row);
      })
      .catch(reject);
  });
};

// On-Chain Data Functions
const insertOnchainData = (blockchain, metricType, value, metadata = {}, source = 'Unknown') => {
  return new Promise((resolve, reject) => {
    const metadataStr = JSON.stringify(metadata);
    
    dbAdapter.run(
      'INSERT INTO onchain_data (blockchain, metric_type, value, metadata, source) VALUES ($1, $2, $3, $4, $5)',
      [blockchain, metricType, value, metadataStr, source]
    ).then(result => resolve(result.lastID))
     .catch(reject);
  });
};

const getLatestOnchainData = (blockchain = null, metricType = null) => {
  return new Promise((resolve, reject) => {
    let query, params;
    
    if (blockchain && metricType) {
      query = 'SELECT * FROM onchain_data WHERE blockchain = $1 AND metric_type = $2 ORDER BY timestamp DESC LIMIT 1';
      params = [blockchain, metricType];
    } else if (blockchain) {
      query = 'SELECT * FROM onchain_data WHERE blockchain = $1 ORDER BY timestamp DESC LIMIT 1';
      params = [blockchain];
    } else {
      query = 'SELECT * FROM onchain_data ORDER BY timestamp DESC LIMIT 1';
      params = [];
    }
    
    dbAdapter.get(query, params)
      .then(row => {
        if (row && row.metadata) {
          row.metadata = JSON.parse(row.metadata);
        }
        resolve(row);
      })
      .catch(reject);
  });
};

// Correlation data functions
const insertCorrelationData = (symbol1, symbol2, correlation, periodDays = 30, method = 'pearson', source = 'calculated') => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO correlation_data (symbol1, symbol2, correlation, period_days, calculation_method, source)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (symbol1, symbol2, timestamp) 
      DO UPDATE SET 
        correlation = EXCLUDED.correlation,
        period_days = EXCLUDED.period_days,
        calculation_method = EXCLUDED.calculation_method,
        source = EXCLUDED.source
    `;
    const params = [symbol1, symbol2, correlation, periodDays, method, source];
    
    dbAdapter.run(query, params)
      .then(() => resolve())
      .catch(reject);
  });
};

const getLatestCorrelationData = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT ON (symbol1, symbol2) 
        symbol1, symbol2, correlation, period_days, calculation_method, source, timestamp
      FROM correlation_data 
      ORDER BY symbol1, symbol2, timestamp DESC
    `;
    
    dbAdapter.all(query, [])
      .then(rows => {
        // Convert to object format for easier use
        const correlationData = {};
        rows.forEach(row => {
          const pair = [row.symbol1, row.symbol2].sort().join('_');
          correlationData[pair] = parseFloat(row.correlation);
        });
        resolve(correlationData);
      })
      .catch(reject);
  });
};

const getCorrelationData = (limit = 100) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM correlation_data ORDER BY timestamp DESC LIMIT $1';
    dbAdapter.all(query, [limit])
      .then(resolve)
      .catch(reject);
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
  insertMarketSentiment,
  getLatestMarketSentiment,
  insertDerivativesData,
  getLatestDerivativesData,
  insertOnchainData,
  getLatestOnchainData,
  insertTrendingNarrative,
  getTrendingNarratives,
  getProcessedTrendingNarratives,
  getDerivativesData,
  getOnchainData,
  getLayer1Data,
  getLatestLayer1Data,
  insertLayer1Data,
  insertCorrelationData,
  getLatestCorrelationData,
  getCorrelationData,
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
  getAllUsers,
  deleteUser,
  // Subscription management
  getUserByStripeCustomerId,
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
  // Telegram verification
  generateTelegramVerificationCode,
  verifyTelegramCode,
  disconnectTelegram,
  getTelegramStatus,
  // Admin functions
  getTableData,
  // Upcoming Events
  insertUpcomingEvent,
  getUpcomingEvents,
  getApproachingEvents,
  getAllUpcomingEvents,
  getPastEvents,
  getAllEvents,
  cleanupDuplicateEvents,
  cleanupPastEventAlerts,
  ignoreUpcomingEvent,
  unignoreUpcomingEvent,
  deleteUpcomingEvent,
  // Market Data History
  getMarketDataHistory,
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
  getLatestInflationDataAll,
  getInflationDataHistory,
  
  // Economic data functions
  insertEconomicData,
  getLatestEconomicData,
  getEconomicDataHistory,
  getEconomicEventsForAnalysis,
  updateEconomicDataAnalysis,
  markEconomicDataAlertSent,
  
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