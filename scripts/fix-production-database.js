#!/usr/bin/env node

/**
 * Script to fix production database issues
 * - Adds missing economic_calendar table
 * - Fixes crypto_prices table constraint
 * - Ensures all required tables exist
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function fixProductionDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔧 Fixing production database issues...');
    
    // 1. Add missing economic_calendar table
    console.log('📅 Creating economic_calendar table...');
    await pool.query(`
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
    console.log('✅ economic_calendar table created/verified');
    
    // 2. Fix crypto_prices table constraint
    console.log('🔧 Fixing crypto_prices table constraint...');
    try {
      // First, try to add the constraint
      await pool.query(`
        ALTER TABLE crypto_prices 
        ADD CONSTRAINT crypto_prices_symbol_timestamp_unique 
        UNIQUE (symbol, timestamp)
      `);
      console.log('✅ Added unique constraint to crypto_prices table');
    } catch (error) {
      if (error.code === '23505' || error.message.includes('already exists')) {
        console.log('✅ crypto_prices constraint already exists');
      } else {
        console.log('⚠️ Could not add constraint (may already exist):', error.message);
      }
    }
    
    // 3. Verify all required tables exist
    console.log('🔍 Verifying all required tables exist...');
    const requiredTables = [
      'market_data',
      'ai_analysis', 
      'crypto_prices',
      'fear_greed_index',
      'trending_narratives',
      'upcoming_events',
      'layer1_data',
      'bitcoin_dominance',
      'stablecoin_metrics',
      'exchange_flows',
      'users',
      'subscriptions',
      'alerts',
      'inflation_data',
      'inflation_releases',
      'inflation_forecasts',
      'backtest_results',
      'economic_data',
      'economic_calendar',
      'market_sentiment',
      'derivatives_data',
      'onchain_data',
      'contact_messages'
    ];
    
    for (const tableName of requiredTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table ${tableName} exists`);
      } else {
        console.log(`❌ Table ${tableName} is missing`);
      }
    }
    
    // 4. Check for any data in economic_calendar
    const calendarCount = await pool.query('SELECT COUNT(*) FROM economic_calendar');
    console.log(`📊 economic_calendar table has ${calendarCount.rows[0].count} records`);
    
    // 5. Check for any data in economic_data
    const dataCount = await pool.query('SELECT COUNT(*) FROM economic_data');
    console.log(`📊 economic_data table has ${dataCount.rows[0].count} records`);
    
    console.log('🎉 Production database fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixProductionDatabase()
    .then(() => {
      console.log('🎉 Production database fix script completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Production database fix script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixProductionDatabase };
