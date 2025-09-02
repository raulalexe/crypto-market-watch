#!/usr/bin/env node

/**
 * Create Advanced Data Tables Script
 * Ensures all required tables for advanced data collection exist
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function createAdvancedDataTables() {
  console.log('🔧 Creating Advanced Data Tables...\n');
  
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
    
    // Create market_sentiment table
    console.log('\n🔧 Creating market_sentiment table...');
    try {
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
      console.log('  ✅ market_sentiment table created/verified');
    } catch (error) {
      console.log(`  ⚠️ Error with market_sentiment table: ${error.message}`);
    }
    
    // Create derivatives_data table
    console.log('\n🔧 Creating derivatives_data table...');
    try {
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
      console.log('  ✅ derivatives_data table created/verified');
    } catch (error) {
      console.log(`  ⚠️ Error with derivatives_data table: ${error.message}`);
    }
    
    // Create onchain_data table
    console.log('\n🔧 Creating onchain_data table...');
    try {
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
      console.log('  ✅ onchain_data table created/verified');
    } catch (error) {
      console.log(`  ⚠️ Error with onchain_data table: ${error.message}`);
    }
    
    // Verify all tables exist
    console.log('\n🔍 Verifying table creation...');
    const tables = ['market_sentiment', 'derivatives_data', 'onchain_data'];
    
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
          
          // Show table structure
          const columns = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position
          `, [tableName]);
          
          console.log(`    📋 Columns:`);
          columns.rows.forEach(row => {
            console.log(`      - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
          });
        } else {
          console.log(`  ❌ ${tableName} table does not exist`);
        }
      } catch (error) {
        console.log(`  ⚠️ Error checking ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Advanced data tables creation completed!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run the creation
if (require.main === module) {
  createAdvancedDataTables().catch(console.error);
}

module.exports = createAdvancedDataTables;
