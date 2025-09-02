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
    name: 'fix_alerts_table',
    description: 'Add missing columns to alerts table',
    sql: `
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS type VARCHAR(50);
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS metric VARCHAR(50);
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS message TEXT;
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS value TEXT;
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS eventId INTEGER;
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS eventDate TEXT;
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS eventTitle TEXT;
      ALTER TABLE alerts ADD COLUMN IF NOT EXISTS eventCategory TEXT;
    `
  },
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
    name: 'fix_crypto_prices_table',
    description: 'Add missing columns to crypto_prices table',
    sql: `
      ALTER TABLE crypto_prices ADD COLUMN IF NOT EXISTS change_24h DECIMAL;
    `
  },
  {
    name: 'fix_fear_greed_index_table',
    description: 'Add missing columns to fear_greed_index table',
    sql: `
      ALTER TABLE fear_greed_index ADD COLUMN IF NOT EXISTS source VARCHAR(100);
    `
  },
  {
    name: 'fix_market_data_table',
    description: 'Add missing columns to market_data table',
    sql: `
      ALTER TABLE market_data ADD COLUMN IF NOT EXISTS source VARCHAR(100);
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
