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
        blockchain VARCHAR(50) NOT NULL,
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
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'layer1_data_chain_id_unique'
        ) THEN
          ALTER TABLE layer1_data ADD CONSTRAINT layer1_data_chain_id_unique UNIQUE (chain_id);
        END IF;
      END $$;
    `
  },
  {
    name: 'fix_crypto_prices_constraints',
    description: 'Add unique constraint to crypto_prices table for ON CONFLICT support',
    sql: `
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'crypto_prices_symbol_unique'
        ) THEN
          ALTER TABLE crypto_prices ADD CONSTRAINT crypto_prices_symbol_unique UNIQUE (symbol);
        END IF;
      END $$;
    `
  },
  {
    name: 'fix_varchar_length_issues',
    description: 'Fix varchar length constraints that are too short',
    sql: `
      -- Fix market_data source column
      ALTER TABLE market_data ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix fear_greed_index source column
      ALTER TABLE fear_greed_index ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix upcoming_events source column
      ALTER TABLE upcoming_events ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix bitcoin_dominance source column
      ALTER TABLE bitcoin_dominance ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix stablecoin_metrics source column
      ALTER TABLE stablecoin_metrics ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix exchange_flows source column
      ALTER TABLE exchange_flows ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix market_sentiment source column
      ALTER TABLE market_sentiment ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix derivatives_data source column
      ALTER TABLE derivatives_data ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix onchain_data source column
      ALTER TABLE onchain_data ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix inflation_data source column
      ALTER TABLE inflation_data ALTER COLUMN source TYPE VARCHAR(255);
      
      -- Fix inflation_releases source column
      ALTER TABLE inflation_releases ALTER COLUMN source TYPE VARCHAR(255);
    `
  },
  {
    name: 'add_missing_email_notifications_column',
    description: 'Add missing email_notifications column to users table if it does not exist',
    sql: `
      DO $$ 
      BEGIN
        -- Add email_notifications column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'email_notifications'
        ) THEN
          ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add push_notifications column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'push_notifications'
        ) THEN
          ALTER TABLE users ADD COLUMN push_notifications BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add telegram_notifications column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'telegram_notifications'
        ) THEN
          ALTER TABLE users ADD COLUMN telegram_notifications BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add notification_preferences column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'notification_preferences'
        ) THEN
          ALTER TABLE users ADD COLUMN notification_preferences TEXT DEFAULT '{}';
        END IF;
      END $$;
    `
  },
  {
    name: 'add_event_notification_preferences',
    description: 'Add event notification preference columns to users table',
    sql: `
      DO $$ 
      BEGIN
        -- Add event_notifications column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'event_notifications'
        ) THEN
          ALTER TABLE users ADD COLUMN event_notifications BOOLEAN DEFAULT TRUE;
        END IF;
        
        -- Add event_notification_windows column if it doesn't exist (JSON array for multi-select)
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'event_notification_windows'
        ) THEN
          ALTER TABLE users ADD COLUMN event_notification_windows TEXT DEFAULT '[3]';
        END IF;
        
        -- Add event_notification_channels column if it doesn't exist (JSON array for channel selection)
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'event_notification_channels'
        ) THEN
          ALTER TABLE users ADD COLUMN event_notification_channels TEXT DEFAULT '["email","push"]';
        END IF;
        
        -- Add event_impact_filter column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'event_impact_filter'
        ) THEN
          ALTER TABLE users ADD COLUMN event_impact_filter TEXT DEFAULT 'all';
        END IF;
      END $$;
    `
  },
  {
    name: 'add_telegram_verification_system',
    description: 'Add Telegram verification code system to users table',
    sql: `
      DO $$ 
      BEGIN
        -- Add telegram_verification_code column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'telegram_verification_code'
        ) THEN
          ALTER TABLE users ADD COLUMN telegram_verification_code VARCHAR(10);
        END IF;
        
        -- Add telegram_verification_expires_at column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'telegram_verification_expires_at'
        ) THEN
          ALTER TABLE users ADD COLUMN telegram_verification_expires_at TIMESTAMP;
        END IF;
        
        -- Add telegram_verified column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'telegram_verified'
        ) THEN
          ALTER TABLE users ADD COLUMN telegram_verified BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `
  },
  {
    name: 'create_economic_calendar_table',
    description: 'Create economic_calendar table for economic events',
    sql: `
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
    `
  },
  {
    name: 'fix_crypto_prices_constraint',
    description: 'Ensure crypto_prices table has correct symbol constraint',
    sql: `
      DO $migration$
      BEGIN
        -- Drop any existing constraints
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'crypto_prices_symbol_timestamp_unique'
        ) THEN
          ALTER TABLE crypto_prices DROP CONSTRAINT crypto_prices_symbol_timestamp_unique;
        END IF;
        
        -- Add the correct constraint on symbol only (to match ON CONFLICT (symbol))
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'crypto_prices_symbol_unique'
        ) THEN
          ALTER TABLE crypto_prices ADD CONSTRAINT crypto_prices_symbol_unique UNIQUE (symbol);
        END IF;
      END $migration$;
    `
  },
  {
    name: 'fix_onchain_data_blockchain_length',
    description: 'Increase blockchain column length in onchain_data table',
    sql: `
      DO $fix_blockchain$
      BEGIN
        -- Check if the column exists and has the old length
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'onchain_data' 
          AND column_name = 'blockchain' 
          AND character_maximum_length = 20
        ) THEN
          ALTER TABLE onchain_data ALTER COLUMN blockchain TYPE VARCHAR(50);
        END IF;
      END $fix_blockchain$;
    `
  },
  {
    name: 'fix_market_data_symbol_length',
    description: 'Fix market_data symbol column length to accommodate longer symbol names',
    sql: `
      DO $fix_symbol$ 
      BEGIN
        -- Check if the column exists and has the old length
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'market_data' 
          AND column_name = 'symbol' 
          AND character_maximum_length = 20
        ) THEN
          ALTER TABLE market_data ALTER COLUMN symbol TYPE VARCHAR(50);
        END IF;
      END $fix_symbol$;
    `
  },
  {
    name: 'add_subscription_plan_column',
    description: 'Add subscription_plan column to users table',
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free';`
  },
  {
    name: 'add_subscription_expires_at_column',
    description: 'Add subscription_expires_at column to users table',
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;`
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
