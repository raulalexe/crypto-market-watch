#!/usr/bin/env node

/**
 * Script to reset database schema and fix migration issues
 * This will drop and recreate tables with the correct schema
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetDatabaseSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Resetting database schema...');
    
    // First, let's check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:', tablesResult.rows.map(r => r.table_name));
    
    // Drop problematic tables that have schema issues
    const problematicTables = [
      'stablecoin_metrics',
      'exchange_flows',
      'derivatives_data',
      'onchain_data'
    ];
    
    for (const table of problematicTables) {
      try {
        const exists = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [table]);
        
        if (exists.rows.length > 0) {
          console.log(`🗑️  Dropping table ${table}...`);
          await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
          console.log(`✅ Table ${table} dropped`);
        }
      } catch (error) {
        console.log(`⚠️  Could not drop table ${table}:`, error.message);
      }
    }
    
    // Recreate tables with correct schema
    console.log('🔨 Recreating tables with correct schema...');
    
    // Stablecoin metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stablecoin_metrics (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_supply DECIMAL,
        market_cap DECIMAL,
        circulating_supply DECIMAL,
        source VARCHAR(255)
      )
    `);
    console.log('✅ Created stablecoin_metrics table');
    
    // Exchange flows table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exchange_flows (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        flow_type VARCHAR(50),
        amount DECIMAL,
        source VARCHAR(255)
      )
    `);
    console.log('✅ Created exchange_flows table');
    
    // Derivatives data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS derivatives_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_type VARCHAR(100),
        value DECIMAL,
        metadata TEXT,
        source VARCHAR(255)
      )
    `);
    console.log('✅ Created derivatives_data table');
    
    // Onchain data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS onchain_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blockchain VARCHAR(100),
        data_type VARCHAR(100),
        value DECIMAL,
        metadata TEXT,
        source VARCHAR(255)
      )
    `);
    console.log('✅ Created onchain_data table');
    
    // Fix API usage table if it exists but has wrong columns
    try {
      const apiUsageExists = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'api_usage'
      `);
      
      if (apiUsageExists.rows.length > 0) {
        // Check if columns exist
        const columns = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'api_usage'
        `);
        
        const columnNames = columns.rows.map(r => r.column_name);
        
        if (!columnNames.includes('user_agent')) {
          await client.query(`ALTER TABLE api_usage ADD COLUMN user_agent TEXT`);
          console.log('✅ Added user_agent column to api_usage');
        }
        
        if (!columnNames.includes('ip_address')) {
          await client.query(`ALTER TABLE api_usage ADD COLUMN ip_address VARCHAR(45)`);
          console.log('✅ Added ip_address column to api_usage');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not fix api_usage table:', error.message);
    }
    
    console.log('✅ Database schema reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database schema reset failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Only run if called directly
if (require.main === module) {
  resetDatabaseSchema().catch(console.error);
}

module.exports = { resetDatabaseSchema };
