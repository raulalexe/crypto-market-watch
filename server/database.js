const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './data/market_data.db';

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
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
          factors_analyzed TEXT
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

      // Backtest results table
      db.run(`
        CREATE TABLE IF NOT EXISTS backtest_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          prediction_date DATETIME,
          actual_date DATETIME,
          predicted_direction TEXT,
          actual_direction TEXT,
          accuracy REAL,
          crypto_symbol TEXT,
          price_at_prediction REAL,
          price_at_actual REAL,
          correlation_score REAL
        )
      `);

      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Subscriptions table
      db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          plan_type TEXT NOT NULL,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          status TEXT NOT NULL,
          current_period_start DATETIME,
          current_period_end DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // API usage tracking table
      db.run(`
        CREATE TABLE IF NOT EXISTS api_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          endpoint TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      db.run('PRAGMA journal_mode=WAL', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

// Helper functions for database operations
const insertMarketData = (dataType, symbol, value, metadata = {}, source = '') => {
  return new Promise((resolve, reject) => {
    const metadataStr = JSON.stringify(metadata);
    db.run(
      'INSERT INTO market_data (data_type, symbol, value, metadata, source) VALUES (?, ?, ?, ?, ?)',
      [dataType, symbol, value, metadataStr, source],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

const getMarketData = (dataType, limit = 100) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM market_data WHERE data_type = ? ORDER BY timestamp DESC LIMIT ?',
      [dataType, limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const insertAIAnalysis = (marketDirection, confidence, reasoning, factorsAnalyzed) => {
  return new Promise((resolve, reject) => {
    const factorsStr = JSON.stringify(factorsAnalyzed);
    db.run(
      'INSERT INTO ai_analysis (market_direction, confidence, reasoning, factors_analyzed) VALUES (?, ?, ?, ?)',
      [marketDirection, confidence, reasoning, factorsStr],
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
    db.all(
      'SELECT * FROM trending_narratives ORDER BY timestamp DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
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

// User management functions
const insertUser = (email, passwordHash) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash],
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

module.exports = {
  db,
  initDatabase,
  insertMarketData,
  getMarketData,
  insertAIAnalysis,
  getLatestAIAnalysis,
  insertCryptoPrice,
  getCryptoPrices,
  insertFearGreedIndex,
  getLatestFearGreedIndex,
  insertTrendingNarrative,
  getTrendingNarratives,
  insertBacktestResult,
  getBacktestResults,
  // User management
  insertUser,
  getUserById,
  getUserByEmail,
  updateUser,
  // Subscription management
  insertSubscription,
  getActiveSubscription,
  updateSubscription,
  // API usage tracking
  trackApiUsage,
  getApiUsage
};