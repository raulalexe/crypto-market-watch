const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Support both SQLite and PostgreSQL
const usePostgreSQL = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');

let db;
let dbPath;

if (usePostgreSQL) {
  // PostgreSQL configuration (for Railway)
  console.log('🗄️ Using PostgreSQL database');
  const { Pool } = require('pg');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  // SQLite configuration (for development)
  console.log('🗄️ Using SQLite database');
  dbPath = process.env.DATABASE_PATH || './data/market_data.db';
  
  // Ensure data directory exists
  const fs = require('fs');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  db = new sqlite3.Database(dbPath);
}

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    if (usePostgreSQL) {
      // PostgreSQL initialization
      const createTables = async () => {
        try {
          const client = await db.connect();
          
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
              user_id INTEGER REFERENCES users(id),
              alert_type VARCHAR(50),
              message TEXT,
              is_acknowledged BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
          
          await client.query(`
            CREATE TABLE IF NOT EXISTS api_keys (
              id SERIAL PRIMARY KEY,
              user_id INTEGER REFERENCES users(id),
              api_key VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255),
              is_active BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              last_used TIMESTAMP,
              usage_count INTEGER DEFAULT 0
            )
          `);
          
          // Add stripe_customer_id column if it doesn't exist (migration)
          try {
            await client.query(`
              ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255)
            `);
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.log('⚠️ Migration note: stripe_customer_id column already exists');
            }
          }
          
          client.release();
          console.log('✅ PostgreSQL database initialized successfully');
          resolve();
        } catch (error) {
          console.error('❌ PostgreSQL initialization failed:', error);
          reject(error);
        }
      };
      
      createTables();
    } else {
      // SQLite initialization (existing code)
      db.serialize(() => {
        // Market data table
        db.run(`
          CREATE TABLE IF NOT EXISTS market_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_type TEXT NOT NULL,
            symbol TEXT,
            value REAL,
            metadata TEXT,
            source TEXT
          )
        `);

        // AI analysis table
        db.run(`
          CREATE TABLE IF NOT EXISTS ai_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            market_direction TEXT,
            confidence REAL,
            reasoning TEXT,
            factors_analyzed TEXT,
            analysis_data TEXT
          )
        `);

        // Crypto prices table
        db.run(`
          CREATE TABLE IF NOT EXISTS crypto_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            symbol TEXT NOT NULL,
            price REAL,
            volume_24h REAL,
            market_cap REAL,
            change_24h REAL
          )
        `);

        // Fear & Greed Index table
        db.run(`
          CREATE TABLE IF NOT EXISTS fear_greed_index (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            value INTEGER,
            classification TEXT,
            source TEXT
          )
        `);

        // Trending narratives table
        db.run(`
          CREATE TABLE IF NOT EXISTS trending_narratives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            narrative TEXT,
            sentiment TEXT,
            relevance_score REAL,
            source TEXT
          )
        `);
        
        db.run(`
          CREATE TABLE IF NOT EXISTS upcoming_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            impact TEXT,
            date DATETIME NOT NULL,
            source TEXT,
            ignored INTEGER DEFAULT 0
          )
        `);

        // Layer 1 data table
        db.run(`
          CREATE TABLE IF NOT EXISTS layer1_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            chain_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            symbol TEXT NOT NULL,
            price REAL NOT NULL,
            change_24h REAL NOT NULL,
            market_cap REAL NOT NULL,
            volume_24h REAL NOT NULL,
            tps INTEGER NOT NULL,
            active_addresses INTEGER NOT NULL,
            hash_rate REAL,
            dominance REAL NOT NULL,
            narrative TEXT NOT NULL,
            sentiment TEXT NOT NULL
          )
        `);

        // Bitcoin dominance table
        db.run(`
          CREATE TABLE IF NOT EXISTS bitcoin_dominance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            value REAL,
            source TEXT
          )
        `);

        // Stablecoin metrics table
        db.run(`
          CREATE TABLE IF NOT EXISTS stablecoin_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            metric_type TEXT,
            value REAL,
            metadata TEXT,
            source TEXT
          )
        `);

        // Exchange flows table
        db.run(`
          CREATE TABLE IF NOT EXISTS exchange_flows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            flow_type TEXT,
            amount REAL,
            asset TEXT,
            exchange TEXT,
            source TEXT
          )
        `);

        // Users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            email_verified INTEGER DEFAULT 0,
            confirmation_token TEXT,
            stripe_customer_id TEXT,
            email_notifications INTEGER DEFAULT 0,
            push_notifications INTEGER DEFAULT 0,
            telegram_notifications INTEGER DEFAULT 0,
            notification_preferences TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Subscriptions table
        db.run(`
          CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            plan_type TEXT,
            status TEXT,
            stripe_subscription_id TEXT,
            current_period_start DATETIME,
            current_period_end DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // API usage table
        db.run(`
          CREATE TABLE IF NOT EXISTS api_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            endpoint TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Alerts table
        db.run(`
          CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            message TEXT,
            severity TEXT,
            metric TEXT,
            value TEXT,
            eventId INTEGER,
            eventDate TEXT,
            eventTitle TEXT,
            eventCategory TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Error logs table
        db.run(`
          CREATE TABLE IF NOT EXISTS error_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            source TEXT,
            message TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Push subscriptions table
        db.run(`
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // API keys table
        db.run(`
          CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            api_key TEXT UNIQUE NOT NULL,
            name TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_used DATETIME,
            usage_count INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Backtest results table
        db.run(`
          CREATE TABLE IF NOT EXISTS backtest_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prediction_date DATETIME,
            actual_date DATETIME,
            predicted_direction TEXT,
            actual_direction TEXT,
            accuracy REAL,
            crypto_symbol TEXT,
            price_at_prediction REAL,
            price_at_actual REAL,
            correlation_score REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Contact messages table
        db.run(`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create user_alert_thresholds table
        db.run(`
          CREATE TABLE IF NOT EXISTS user_alert_thresholds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            threshold_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            metric TEXT NOT NULL,
            condition TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT,
            enabled INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        // Create post_release_analysis table
        db.run(`
          CREATE TABLE IF NOT EXISTS post_release_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            release_id TEXT NOT NULL,
            release_type TEXT NOT NULL,
            release_date TEXT NOT NULL,
            analysis_data TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create economic_predictions table
        db.run(`
          CREATE TABLE IF NOT EXISTS economic_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            release_date TEXT NOT NULL,
            prediction_data TEXT NOT NULL,
            accuracy INTEGER DEFAULT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        console.log('✅ SQLite database initialized successfully');
        
        // Add stripe_customer_id column if it doesn't exist (migration)
        db.run(`
          ALTER TABLE users ADD COLUMN stripe_customer_id TEXT
        `, [], (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.log('⚠️ Migration note: stripe_customer_id column already exists');
          }
        });
        
        resolve();
      });
    }
  });
};

// Database adapter for both SQLite and PostgreSQL
const dbAdapter = {
  // Run a query (for INSERT, UPDATE, DELETE)
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      if (usePostgreSQL) {
        db.query(query, params)
          .then(result => resolve({ lastID: result.rows[0]?.id || result.rowCount }))
          .catch(reject);
      } else {
        db.run(query, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        });
      }
    });
  },

  // Get a single row
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      if (usePostgreSQL) {
        db.query(query, params)
          .then(result => resolve(result.rows[0] || null))
          .catch(reject);
      } else {
        db.get(query, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    });
  },

  // Get multiple rows
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      if (usePostgreSQL) {
        db.query(query, params)
          .then(result => resolve(result.rows))
          .catch(reject);
      } else {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }
    });
  }
};

// Helper functions for database operations
const insertMarketData = (dataType, symbol, value, metadata = {}, source = 'Unknown') => {
  return new Promise((resolve, reject) => {
    const metadataStr = JSON.stringify(metadata);
    
    if (usePostgreSQL) {
      dbAdapter.run(
        'INSERT INTO market_data (data_type, symbol, value, metadata, source) VALUES ($1, $2, $3, $4, $5)',
        [dataType, symbol, value, metadataStr, source]
      ).then(result => resolve(result.lastID))
       .catch(reject);
    } else {
      dbAdapter.run(
        'INSERT INTO market_data (data_type, symbol, value, metadata, source) VALUES (?, ?, ?, ?, ?)',
        [dataType, symbol, value, metadataStr, source]
      ).then(result => resolve(result.lastID))
       .catch(reject);
    }
  });
};

const getMarketData = (dataType, limit = 100, symbol = null) => {
  return new Promise((resolve, reject) => {
    let query, params;
    
    if (symbol) {
      query = 'SELECT * FROM market_data WHERE data_type = ? AND symbol = ? ORDER BY timestamp DESC LIMIT ?';
      params = [dataType, symbol, limit];
    } else {
      query = 'SELECT * FROM market_data WHERE data_type = ? ORDER BY timestamp DESC LIMIT ?';
      params = [dataType, limit];
    }
    
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getLatestMarketData = (dataType, symbol) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM market_data WHERE data_type = ? AND symbol = ? ORDER BY timestamp DESC LIMIT 1',
      [dataType, symbol],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const insertAIAnalysis = (marketDirection, confidence, reasoning, factorsAnalyzed, analysisData = null) => {
  return new Promise((resolve, reject) => {
    const factorsStr = JSON.stringify(factorsAnalyzed);
    // analysisData is already a JSON string, don't double-encode it
    const analysisDataStr = analysisData;
    
    db.run(
      'INSERT INTO ai_analysis (market_direction, confidence, reasoning, factors_analyzed, analysis_data) VALUES (?, ?, ?, ?, ?)',
      [marketDirection, confidence, reasoning, factorsStr, analysisDataStr],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getLatestAIAnalysis = () => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM ai_analysis ORDER BY timestamp DESC LIMIT 1',
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const insertCryptoPrice = (symbol, price, volume24h, marketCap, change24h) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO crypto_prices (symbol, price, volume_24h, market_cap, change_24h) VALUES (?, ?, ?, ?, ?)',
      [symbol, price, volume24h, marketCap, change24h],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getCryptoPrices = (symbol, limit = 100) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM crypto_prices WHERE symbol = ? ORDER BY timestamp DESC LIMIT ?',
      [symbol, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const getLatestCryptoPrice = (symbol) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM crypto_prices WHERE symbol = ? ORDER BY timestamp DESC LIMIT 1',
      [symbol],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const insertFearGreedIndex = (value, classification, source) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO fear_greed_index (value, classification, source) VALUES (?, ?, ?)',
      [value, classification, source],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getLatestFearGreedIndex = () => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM fear_greed_index ORDER BY timestamp DESC LIMIT 1',
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const insertTrendingNarrative = (narrative, sentiment, relevanceScore, source) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO trending_narratives (narrative, sentiment, relevance_score, source) VALUES (?, ?, ?, ?)',
      [narrative, sentiment, relevanceScore, source],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

  const getTrendingNarratives = (limit = 10) => {
    return new Promise((resolve, reject) => {
      // Get the latest entry for each narrative to avoid duplicates
      db.all(
        `SELECT * FROM trending_narratives 
         WHERE id IN (
           SELECT MAX(id) 
           FROM trending_narratives 
           GROUP BY narrative
         ) 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  };

  const getLayer1Data = () => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM layer1_data ORDER BY market_cap DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  };

  const insertLayer1Data = (chainId, name, symbol, price, change24h, marketCap, volume24h, tps, activeAddresses, hashRate, dominance, narrative, sentiment) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO layer1_data 
         (chain_id, name, symbol, price, change_24h, market_cap, volume_24h, tps, active_addresses, hash_rate, dominance, narrative, sentiment) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [chainId, name, symbol, price, change24h, marketCap, volume24h, tps, activeAddresses, hashRate, dominance, narrative, sentiment],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  };

const insertBacktestResult = (predictionDate, actualDate, predictedDirection, actualDirection, accuracy, cryptoSymbol, priceAtPrediction, priceAtActual, correlationScore) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO backtest_results (prediction_date, actual_date, predicted_direction, actual_direction, accuracy, crypto_symbol, price_at_prediction, price_at_actual, correlation_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [predictionDate, actualDate, predictedDirection, actualDirection, accuracy, cryptoSymbol, priceAtPrediction, priceAtActual, correlationScore],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getBacktestResults = (limit = 50) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM backtest_results ORDER BY timestamp DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Error logging functions
const insertErrorLog = (errorData) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO error_logs (type, source, message, details, timestamp) VALUES (?, ?, ?, ?, ?)',
      [errorData.type, errorData.source, errorData.message, errorData.details, errorData.timestamp],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getErrorLogs = (limit = 50) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// User management functions
const insertUser = (email, passwordHash, isAdmin = false) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)',
      [email, passwordHash, isAdmin ? 1 : 0],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const insertUserWithConfirmation = (email, passwordHash, confirmationToken) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (email, password_hash, email_verified, confirmation_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [email, passwordHash, 0, confirmationToken, new Date().toISOString(), new Date().toISOString()],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const updateUser = (id, updates) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    db.run(
      `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const isUserAdmin = (userId) => {
  return new Promise((resolve, reject) => {
    // First check user is_admin field
    db.get(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId],
      (err, userRow) => {
        if (err) {
          reject(err);
          return;
        }
        
        // If user has is_admin = 1, they are admin
        if (userRow && userRow.is_admin === 1) {
          resolve(true);
          return;
        }
        
        // Otherwise check for active admin subscription
        db.get(
          'SELECT plan_type FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
          [userId],
          (err, subRow) => {
            if (err) {
              reject(err);
              return;
            }
            
            // User is admin if they have an active admin subscription
            resolve(subRow && subRow.plan_type === 'admin');
          }
        );
      }
    );
  });
};

// Subscription management functions
const insertSubscription = (subscriptionData) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(subscriptionData).join(', ');
    const placeholders = Object.keys(subscriptionData).map(() => '?').join(', ');
    const values = Object.values(subscriptionData);
    
    db.run(
      `INSERT INTO subscriptions (${fields}) VALUES (${placeholders})`,
      values,
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getActiveSubscription = (userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const updateSubscription = (subscriptionId, updates) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(subscriptionId);
    
    db.run(
      `UPDATE subscriptions SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

// API usage tracking
const trackApiUsage = (userId, endpoint, ipAddress, userAgent) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO api_usage (user_id, endpoint, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [userId, endpoint, ipAddress, userAgent],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getApiUsage = (userId, days = 30) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM api_usage WHERE user_id = ? AND timestamp >= datetime("now", "-" || ? || " days") ORDER BY timestamp DESC',
      [userId, days],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Bitcoin Dominance functions
const insertBitcoinDominance = (value, source = 'CoinGecko') => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO bitcoin_dominance (value, source) VALUES (?, ?)',
      [value, source],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getLatestBitcoinDominance = () => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM bitcoin_dominance ORDER BY timestamp DESC LIMIT 1',
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const getBitcoinDominanceHistory = (days = 30) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM bitcoin_dominance WHERE timestamp >= datetime("now", "-" || ? || " days") ORDER BY timestamp DESC',
      [days],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Stablecoin metrics functions
const insertStablecoinMetric = (metricType, value, metadata = null, source = 'CoinGecko') => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO stablecoin_metrics (metric_type, value, metadata, source) VALUES (?, ?, ?, ?)',
      [metricType, value, metadata ? JSON.stringify(metadata) : null, source],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getLatestStablecoinMetrics = () => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM stablecoin_metrics ORDER BY timestamp DESC LIMIT 10',
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Exchange flows functions
const insertExchangeFlow = (flowType, value, asset, exchange = null, source = 'Glassnode') => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO exchange_flows (flow_type, value, asset, exchange, source) VALUES (?, ?, ?, ?, ?)',
      [flowType, value, asset, exchange, source],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getLatestExchangeFlows = (asset = null) => {
  return new Promise((resolve, reject) => {
    const query = asset 
      ? 'SELECT * FROM exchange_flows WHERE asset = ? ORDER BY timestamp DESC LIMIT 10'
      : 'SELECT * FROM exchange_flows ORDER BY timestamp DESC LIMIT 10';
    const params = asset ? [asset] : [];
    
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Alert functions
const insertAlert = (alert) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO alerts (type, message, severity, metric, value, eventId, eventDate, eventTitle, eventCategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [alert.type, alert.message, alert.severity, alert.metric, alert.value, alert.eventId || null, alert.eventDate || null, alert.eventTitle || null, alert.eventCategory || null],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const checkAlertExists = (alert, timeWindow = 3600000) => { // 1 hour default
  return new Promise((resolve, reject) => {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const cutoffTimeStr = cutoffTime.toISOString().slice(0, 19).replace('T', ' '); // Format as SQLite datetime
    
    // For event notifications, check by eventId and type
    if (alert.type === 'UPCOMING_EVENT' && alert.eventId) {
      db.get(
        'SELECT id FROM alerts WHERE type = ? AND eventId = ? AND timestamp > ?',
        [alert.type, alert.eventId, cutoffTimeStr],
        (err, row) => {
          if (err) {
            console.error('Error checking alert existence:', err);
            reject(err);
          } else {
            const exists = row !== undefined;
            resolve(exists);
          }
        }
      );
    } else {
      // Check for exact duplicates (same type, metric, and value) within time window
      db.get(
        'SELECT id FROM alerts WHERE type = ? AND metric = ? AND value = ? AND timestamp > ?',
        [alert.type, alert.metric, alert.value, cutoffTimeStr],
        (err, row) => {
          if (err) {
            console.error('Error checking alert existence:', err);
            reject(err);
          } else {
            const exists = row !== undefined;
            resolve(exists);
          }
        }
      );
    }
  });
};

const getAlerts = (limit = 10) => {
  return new Promise((resolve, reject) => {
    // Get alerts with deduplication - only return the most recent alert of each type/metric combination
    db.all(
      `SELECT * FROM alerts 
       WHERE id IN (
         SELECT MAX(id) 
         FROM alerts 
         GROUP BY type, metric
       )
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

// Get user's custom alert thresholds
const getUserAlertThresholds = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM user_alert_thresholds WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Error getting user alert thresholds:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

// Save user's custom alert thresholds
const saveUserAlertThresholds = (userId, thresholds) => {
  return new Promise((resolve, reject) => {
    // First, delete existing thresholds for this user
    db.run('DELETE FROM user_alert_thresholds WHERE user_id = ?', [userId], (err) => {
      if (err) {
        console.error('Error deleting existing thresholds:', err);
        reject(err);
        return;
      }

      // Then insert new thresholds
      const stmt = db.prepare(
        'INSERT INTO user_alert_thresholds (user_id, threshold_id, name, description, metric, condition, value, unit, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      const timestamp = new Date().toISOString();
      thresholds.forEach(threshold => {
        stmt.run([
          userId,
          threshold.id,
          threshold.name,
          threshold.description,
          threshold.metric,
          threshold.condition,
          threshold.value,
          threshold.unit,
          threshold.enabled ? 1 : 0,
          timestamp
        ]);
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error saving thresholds:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

const getUniqueAlerts = (limit = 10) => {
  return new Promise((resolve, reject) => {
    // Get unique alerts by type and metric, prioritizing the most recent ones
    db.all(
      `SELECT DISTINCT a.* 
       FROM alerts a
       INNER JOIN (
         SELECT type, metric, MAX(timestamp) as max_timestamp
         FROM alerts
         GROUP BY type, metric
       ) b ON a.type = b.type AND a.metric = b.metric AND a.timestamp = b.max_timestamp
       ORDER BY a.timestamp DESC 
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const acknowledgeAlert = (alertId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE alerts SET acknowledged = TRUE WHERE id = ?',
      [alertId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

// Push subscription functions
const insertPushSubscription = (userId, endpoint, p256dh, auth) => {
  return new Promise((resolve, reject) => {

    
    db.run(
      'INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)',
      [userId, endpoint, p256dh, auth],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
};

const getPushSubscriptions = (userId = null) => {
  return new Promise((resolve, reject) => {
    const query = userId 
      ? 'SELECT * FROM push_subscriptions WHERE user_id = ?'
      : 'SELECT * FROM push_subscriptions';
    const params = userId ? [userId] : [];
    
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const deletePushSubscription = (userId, endpoint) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
      [userId, endpoint],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

// Notification preference functions
const updateNotificationPreferences = (userId, preferences) => {
  return new Promise((resolve, reject) => {
    const { emailNotifications, pushNotifications, telegramNotifications, notificationPreferences } = preferences;
    
    db.run(
      `UPDATE users SET 
        email_notifications = ?, 
        push_notifications = ?, 
        telegram_notifications = ?,
        notification_preferences = ?
       WHERE id = ?`,
      [
        emailNotifications ? 1 : 0,
        pushNotifications ? 1 : 0,
        telegramNotifications ? 1 : 0,
        JSON.stringify(notificationPreferences || {}),
        userId
      ],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const getNotificationPreferences = (userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT email_notifications, push_notifications, telegram_notifications, notification_preferences FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else {
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
        }
      }
    );
  });
};

const getUsersWithNotifications = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT u.id, u.email, u.email_notifications, u.push_notifications, u.telegram_notifications,
              ps.endpoint, ps.p256dh, ps.auth
       FROM users u
       LEFT JOIN push_subscriptions ps ON u.id = ps.user_id
       WHERE (u.email_notifications = 1 OR u.push_notifications = 1 OR u.telegram_notifications = 1)
       AND u.email IS NOT NULL AND u.email != ''`,
      (err, rows) => {
        if (err) reject(err);
        else {
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
        }
      }
    );
  });
};

const cleanupOldAlerts = (daysToKeep = 7) => {
  return new Promise((resolve, reject) => {
    const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)).toISOString();
    db.run(
      'DELETE FROM alerts WHERE timestamp < ?',
      [cutoffDate],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const cleanupDuplicateAlerts = () => {
  return new Promise((resolve, reject) => {
    // Delete duplicate alerts, keeping only the most recent one for each type/metric combination
    db.run(
      `DELETE FROM alerts 
       WHERE id NOT IN (
         SELECT MAX(id) 
         FROM alerts 
         GROUP BY type, metric
       )`,
      function(err) {
        if (err) {
          console.error('Error cleaning up duplicate alerts:', err);
          reject(err);
        } else {
          console.log(`Cleaned up ${this.changes} duplicate alerts`);
          resolve(this.changes);
        }
      }
    );
  });
};

// Upcoming Events functions
const insertUpcomingEvent = (title, description, category, impact, date, source) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO upcoming_events (title, description, category, impact, date, source) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, category, impact, date, source],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getUpcomingEvents = (limit = 20) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM upcoming_events WHERE date > datetime("now") AND ignored = 0 ORDER BY date ASC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const getAllUpcomingEvents = (limit = 20) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM upcoming_events WHERE date > datetime("now") ORDER BY date ASC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const ignoreUpcomingEvent = (eventId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE upcoming_events SET ignored = 1 WHERE id = ?',
      [eventId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const unignoreUpcomingEvent = (eventId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE upcoming_events SET ignored = 0 WHERE id = ?',
      [eventId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const deleteUpcomingEvent = (eventId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM upcoming_events WHERE id = ?',
      [eventId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
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
      default:
        orderByColumn = 'timestamp';
    }
    
    const query = `SELECT * FROM ${tableName} ORDER BY ${orderByColumn} DESC LIMIT ?`;
    db.all(query, [limit], (err, rows) => {
      if (err) {
        console.error(`Error fetching from ${tableName}:`, err);
        resolve([]);
      } else {
        resolve(rows || []);
      }
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
    db.run(
      'INSERT INTO api_keys (user_id, api_key, name) VALUES (?, ?, ?)',
      [userId, apiKey, name],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, apiKey, name });
      }
    );
  });
};

const getUserApiKeys = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, api_key, name, is_active, created_at, last_used, usage_count FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

const getApiKeyByKey = (apiKey) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM api_keys WHERE api_key = ? AND is_active = 1',
      [apiKey],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const updateApiKeyUsage = (apiKeyId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1 WHERE id = ?',
      [apiKeyId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const deactivateApiKey = (userId, apiKeyId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?',
      [apiKeyId, userId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

const regenerateApiKey = (userId, apiKeyId) => {
  return new Promise((resolve, reject) => {
    const newApiKey = generateApiKey();
    db.run(
      'UPDATE api_keys SET api_key = ?, last_used = NULL, usage_count = 0 WHERE id = ? AND user_id = ?',
      [newApiKey, apiKeyId, userId],
      function(err) {
        if (err) reject(err);
        else resolve({ apiKey: newApiKey });
      }
    );
  });
};

// Post-release analysis functions
const insertPostReleaseAnalysis = (analysisData) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO post_release_analysis (release_id, release_type, release_date, analysis_data, timestamp) VALUES (?, ?, ?, ?, ?)',
      [
        analysisData.release_id,
        analysisData.release_type,
        analysisData.release_date,
        analysisData.analysis_data,
        analysisData.timestamp
      ],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getPostReleaseAnalysis = (releaseId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM post_release_analysis WHERE release_id = ? ORDER BY timestamp DESC LIMIT 1',
      [releaseId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const getMarketDataBeforeTime = (timestamp) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM crypto_prices WHERE timestamp < ? ORDER BY timestamp DESC LIMIT 1',
      [timestamp],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

// Economic prediction functions
const insertEconomicPrediction = (predictionData) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO economic_predictions (type, release_date, prediction_data, timestamp) VALUES (?, ?, ?, ?)',
      [
        predictionData.type,
        predictionData.release_date,
        predictionData.prediction_data,
        predictionData.timestamp
      ],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getEconomicPrediction = (type, releaseDate) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM economic_predictions WHERE type = ? AND release_date = ? ORDER BY timestamp DESC LIMIT 1',
      [type, releaseDate],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

const getPredictionAccuracy = (type) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as total, SUM(CASE WHEN accuracy = 1 THEN 1 ELSE 0 END) as correct FROM economic_predictions WHERE type = ?',
      [type],
      (err, row) => {
        if (err) reject(err);
        else {
          const accuracy = row.total > 0 ? (row.correct / row.total) * 100 : 0;
          resolve({
            correct: row.correct || 0,
            total: row.total || 0,
            accuracy: Math.round(accuracy * 100) / 100
          });
        }
      }
    );
  });
};

const getEconomicPredictions = (type, limit = 10) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM economic_predictions WHERE type = ? ORDER BY timestamp DESC LIMIT ?',
      [type, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

module.exports = {
  db,
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
  // Post-release analysis
  insertPostReleaseAnalysis,
  getPostReleaseAnalysis,
  getMarketDataBeforeTime,
  // Economic predictions
  insertEconomicPrediction,
  getEconomicPrediction,
  getPredictionAccuracy,
  getEconomicPredictions
};