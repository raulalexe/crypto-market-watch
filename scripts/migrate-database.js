#!/usr/bin/env node

/**
 * Database Migration Script
 * Automatically migrates database schema on startup
 * Safe to run multiple times
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

// Migration definitions
const migrations = [
  {
    name: 'create_market_sentiment_table',
    description: 'Create market_sentiment table',
    sql: `
      CREATE TABLE IF NOT EXISTS market_sentiment (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sentiment_type VARCHAR(50) NOT NULL,
        value DECIMAL,
        classification VARCHAR(50),
        metadata TEXT,
        source VARCHAR(100)
      )
    `
  },
  {
    name: 'create_derivatives_data_table',
    description: 'Create derivatives_data table',
    sql: `
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
    `
  },
  {
    name: 'create_onchain_data_table',
    description: 'Create onchain_data table',
    sql: `
      CREATE TABLE IF NOT EXISTS onchain_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blockchain VARCHAR(20) NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL,
        metadata TEXT,
        source VARCHAR(100)
      )
    `
  },
  {
    name: 'create_crypto_prices_table',
    description: 'Create crypto_prices table',
    sql: `
      CREATE TABLE IF NOT EXISTS crypto_prices (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        symbol VARCHAR(10) NOT NULL,
        price DECIMAL,
        volume_24h DECIMAL,
        market_cap DECIMAL,
        change_24h DECIMAL
      )
    `
  },
  {
    name: 'create_fear_greed_index_table',
    description: 'Create fear_greed_index table',
    sql: `
      CREATE TABLE IF NOT EXISTS fear_greed_index (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        value INTEGER,
        classification VARCHAR(20),
        source VARCHAR(100)
      )
    `
  },
  {
    name: 'create_market_data_table',
    description: 'Create market_data table',
    sql: `
      CREATE TABLE IF NOT EXISTS market_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_type VARCHAR(50) NOT NULL,
        symbol VARCHAR(20),
        value DECIMAL,
        metadata TEXT,
        source VARCHAR(100)
      )
    `
  },
  {
    name: 'create_alerts_table',
    description: 'Create alerts table with proper schema',
    sql: `
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
    `
  },
  {
    name: 'create_alerts_timestamp_index',
    description: 'Create index on alerts timestamp column for performance',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)
    `
  },
  {
    name: 'create_users_table',
    description: 'Create users table with complete schema',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        subscription_status VARCHAR(50),
        subscription_plan VARCHAR(50),
        subscription_expires_at TIMESTAMP,
        telegram_chat_id VARCHAR(100),
        push_subscription TEXT,
        api_key VARCHAR(255),
        last_login TIMESTAMP,
        email_notifications BOOLEAN DEFAULT TRUE,
        push_notifications BOOLEAN DEFAULT TRUE,
        telegram_notifications BOOLEAN DEFAULT FALSE,
        notification_preferences TEXT,
        confirmation_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_subscriptions_table',
    description: 'Create subscriptions table with correct schema',
    sql: `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        plan_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_upcoming_events_table',
    description: 'Create upcoming_events table',
    sql: `
      CREATE TABLE IF NOT EXISTS upcoming_events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        impact VARCHAR(50),
        date TIMESTAMP NOT NULL,
        source VARCHAR(100),
        ignored BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_ai_analysis_table',
    description: 'Create ai_analysis table',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_analysis (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        market_direction VARCHAR(20),
        confidence DECIMAL,
        reasoning TEXT,
        factors_analyzed TEXT,
        analysis_data TEXT
      )
    `
  },
  {
    name: 'create_trending_narratives_table',
    description: 'Create trending_narratives table',
    sql: `
      CREATE TABLE IF NOT EXISTS trending_narratives (
        id SERIAL PRIMARY KEY,
        narrative VARCHAR(255) NOT NULL,
        sentiment VARCHAR(20),
        relevance_score DECIMAL,
        source VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_bitcoin_dominance_table',
    description: 'Create bitcoin_dominance table',
    sql: `
      CREATE TABLE IF NOT EXISTS bitcoin_dominance (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        value DECIMAL NOT NULL,
        source VARCHAR(100)
      )
    `
  },
  {
    name: 'create_layer1_data_table',
    description: 'Create layer1_data table',
    sql: `
      CREATE TABLE IF NOT EXISTS layer1_data (
        id SERIAL PRIMARY KEY,
        chain_id VARCHAR(20) NOT NULL,
        name VARCHAR(100),
        symbol VARCHAR(20),
        price DECIMAL,
        change_24h DECIMAL,
        market_cap DECIMAL,
        volume_24h DECIMAL,
        tps DECIMAL,
        active_addresses DECIMAL,
        hash_rate DECIMAL,
        dominance DECIMAL,
        narrative TEXT,
        sentiment VARCHAR(20),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_inflation_data_table',
    description: 'Create inflation_data table',
    sql: `
      CREATE TABLE IF NOT EXISTS inflation_data (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        value DECIMAL NOT NULL,
        core_value DECIMAL,
        yoy_change DECIMAL,
        core_yoy_change DECIMAL,
        source VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_inflation_releases_table',
    description: 'Create inflation_releases table',
    sql: `
      CREATE TABLE IF NOT EXISTS inflation_releases (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        time TIME,
        timezone VARCHAR(50),
        source VARCHAR(100),
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_inflation_forecasts_table',
    description: 'Create inflation_forecasts table',
    sql: `
      CREATE TABLE IF NOT EXISTS inflation_forecasts (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        forecast_data TEXT,
        confidence DECIMAL,
        factors TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_stablecoin_metrics_table',
    description: 'Create stablecoin_metrics table',
    sql: `
      CREATE TABLE IF NOT EXISTS stablecoin_metrics (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL,
        metadata TEXT,
        source VARCHAR(100)
      )
    `
  },
  {
    name: 'create_exchange_flows_table',
    description: 'Create exchange_flows table',
    sql: `
      CREATE TABLE IF NOT EXISTS exchange_flows (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        asset VARCHAR(10) NOT NULL,
        flow_type VARCHAR(20) NOT NULL,
        value DECIMAL,
        volume DECIMAL,
        source VARCHAR(100)
      )
    `
  },
  {
    name: 'create_api_usage_table',
    description: 'Create api_usage table',
    sql: `
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        response_time INTEGER,
        status_code INTEGER,
        metadata TEXT
      )
    `
  },
  {
    name: 'create_api_keys_table',
    description: 'Create api_keys table',
    sql: `
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_used TIMESTAMP,
        usage_count INTEGER DEFAULT 0
      )
    `
  },
  {
    name: 'create_push_subscriptions_table',
    description: 'Create push_subscriptions table',
    sql: `
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_user_alert_thresholds_table',
    description: 'Create user_alert_thresholds table',
    sql: `
      CREATE TABLE IF NOT EXISTS user_alert_thresholds (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
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
    `
  },
  {
    name: 'create_error_logs_table',
    description: 'Create error_logs table',
    sql: `
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50),
        source VARCHAR(100),
        message TEXT,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'create_contact_messages_table',
    description: 'Create contact_messages table',
    sql: `
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending'
      )
    `
  },
  {
    name: 'create_backtest_results_table',
    description: 'Create backtest_results table',
    sql: `
      CREATE TABLE IF NOT EXISTS backtest_results (
        id SERIAL PRIMARY KEY,
        prediction_date TIMESTAMP,
        actual_date TIMESTAMP,
        predicted_direction VARCHAR(20),
        actual_direction VARCHAR(20),
        accuracy DECIMAL,
        crypto_symbol VARCHAR(20),
        price_at_prediction DECIMAL,
        price_at_actual DECIMAL,
        correlation_score DECIMAL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    name: 'fix_layer1_data_constraints',
    description: 'Add unique constraint to layer1_data table for ON CONFLICT support',
    sql: `
      ALTER TABLE layer1_data ADD CONSTRAINT IF NOT EXISTS layer1_data_chain_id_unique UNIQUE (chain_id);
    `
  },
  {
    name: 'fix_crypto_prices_constraints',
    description: 'Add unique constraint to crypto_prices table for ON CONFLICT support',
    sql: `
      ALTER TABLE crypto_prices ADD CONSTRAINT IF NOT EXISTS crypto_prices_symbol_unique UNIQUE (symbol);
    `
  }
];

async function migrateDatabase() {
  console.log('🚀 Starting Database Migration...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await db.connect();
    console.log('✅ Connected to database');
    
    // Create migrations table if it doesn't exist
    console.log('\n🔧 Setting up migration tracking...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          execution_time_ms INTEGER
        )
      `);
      console.log('  ✅ Migration tracking table ready');
    } catch (error) {
      console.log(`  ⚠️ Error creating migrations table: ${error.message}`);
    }
    
    // Get executed migrations
    let executedMigrations = [];
    try {
      const result = await client.query('SELECT name FROM migrations');
      executedMigrations = result.rows.map(row => row.name);
    } catch (error) {
      console.log('  ℹ️ No migrations table or empty, starting fresh');
    }
    
    // Run pending migrations
    console.log('\n🔧 Running pending migrations...');
    let totalExecutionTime = 0;
    
    for (const migration of migrations) {
      if (executedMigrations.includes(migration.name)) {
        console.log(`  ℹ️ Migration already executed: ${migration.name}`);
        continue;
      }
      
      console.log(`  🔄 Running: ${migration.name}`);
      console.log(`     Description: ${migration.description}`);
      
      const startTime = Date.now();
      
      try {
        // Split SQL into individual statements
        const statements = migration.sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await client.query(statement);
          }
        }
        
        const executionTime = Date.now() - startTime;
        totalExecutionTime += executionTime;
        
        // Record successful migration
        await client.query(`
          INSERT INTO migrations (name, description, execution_time_ms)
          VALUES ($1, $2, $3)
        `, [migration.name, migration.description, executionTime]);
        
        console.log(`     ✅ Completed in ${executionTime}ms`);
        
      } catch (error) {
        console.log(`     ❌ Failed: ${error.message}`);
        
        // Record failed migration attempt
        try {
          await client.query(`
            INSERT INTO migrations (name, description, execution_time_ms)
            VALUES ($1, $2, $3)
            ON CONFLICT (name) DO UPDATE SET
              description = EXCLUDED.description,
              execution_time_ms = EXCLUDED.execution_time_ms
          `, [migration.name, `${migration.description} (FAILED: ${error.message})`, Date.now() - startTime]);
        } catch (recordError) {
          console.log(`     ⚠️ Could not record migration attempt: ${recordError.message}`);
        }
      }
    }
    
    // Verify final schema
    console.log('\n🔍 Verifying final schema...');
    const tables = ['alerts', 'market_sentiment', 'derivatives_data', 'onchain_data'];
    
    for (const tableName of tables) {
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [tableName]);
        
        if (result.rows[0].exists) {
          console.log(`  ✅ ${tableName} table exists`);
        } else {
          console.log(`  ❌ ${tableName} table missing`);
        }
      } catch (error) {
        console.log(`  ⚠️ Error checking ${tableName}: ${error.message}`);
      }
    }
    
    // Show migration summary
    console.log('\n📊 Migration Summary:');
    try {
      const summary = await client.query(`
        SELECT 
          COUNT(*) as total_migrations,
          COUNT(CASE WHEN execution_time_ms > 0 THEN 1 END) as successful_migrations,
          AVG(execution_time_ms) as avg_execution_time_ms
        FROM migrations
      `);
      
      const stats = summary.rows[0];
      console.log(`  Total migrations: ${stats.total_migrations}`);
      console.log(`  Successful: ${stats.successful_migrations}`);
      console.log(`  Average execution time: ${Math.round(stats.avg_execution_time_ms || 0)}ms`);
      console.log(`  Total execution time: ${totalExecutionTime}ms`);
      
    } catch (error) {
      console.log(`  ⚠️ Could not get migration summary: ${error.message}`);
    }
    
    console.log('\n✅ Database migration completed!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run migration
if (require.main === module) {
  migrateDatabase().catch(console.error);
}

module.exports = migrateDatabase;
