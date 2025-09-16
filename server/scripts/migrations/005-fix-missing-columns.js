#!/usr/bin/env node

/**
 * Migration: Fix missing columns in VARCHAR limit increases
 * This migration checks for column existence before attempting to alter them
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixMissingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running migration: Fix missing columns in VARCHAR limit increases...');
    
    // Helper function to check if column exists
    async function columnExists(tableName, columnName) {
      const result = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [tableName, columnName]);
      return result.rows.length > 0;
    }
    
    // List of column alterations that were failing
    const columnFixes = [
      { table: 'stablecoin_metrics', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      { table: 'exchange_flows', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      { table: 'api_usage', column: 'user_agent', newType: 'TEXT', description: 'Change user_agent to TEXT' },
      { table: 'api_usage', column: 'ip_address', newType: 'VARCHAR(45)', description: 'Increase ip_address limit' },
      { table: 'derivatives_data', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      { table: 'onchain_data', column: 'metric', newType: 'VARCHAR(100)', description: 'Increase metric limit' }
    ];
    
    // Execute each alteration only if column exists
    for (const fix of columnFixes) {
      try {
        const exists = await columnExists(fix.table, fix.column);
        
        if (exists) {
          console.log(`🔧 ${fix.description} for ${fix.table}.${fix.column}...`);
          await client.query(`
            ALTER TABLE ${fix.table} 
            ALTER COLUMN ${fix.column} TYPE ${fix.newType}
          `);
          console.log(`✅ ${fix.description} for ${fix.table}.${fix.column} - completed`);
        } else {
          console.log(`⚠️  Column ${fix.table}.${fix.column} does not exist, skipping`);
        }
      } catch (error) {
        console.error(`❌ Failed to alter ${fix.table}.${fix.column}:`, error.message);
      }
    }
    
    // Also check and fix any other VARCHAR limits that might be needed
    const otherFixes = [
      { table: 'market_data', column: 'data_type', newType: 'VARCHAR(100)', description: 'Increase data_type limit' },
      { table: 'market_data', column: 'symbol', newType: 'VARCHAR(50)', description: 'Increase symbol limit' },
      { table: 'market_data', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      { table: 'ai_analysis', column: 'market_direction', newType: 'VARCHAR(50)', description: 'Increase market_direction limit' },
      { table: 'crypto_prices', column: 'symbol', newType: 'VARCHAR(20)', description: 'Increase symbol limit' },
      { table: 'upcoming_events', column: 'title', newType: 'VARCHAR(500)', description: 'Increase title limit' },
      { table: 'layer1_data', column: 'name', newType: 'VARCHAR(200)', description: 'Increase name limit' },
      { table: 'layer1_data', column: 'narrative', newType: 'TEXT', description: 'Change narrative to TEXT' },
      { table: 'inflation_data', column: 'source', newType: 'VARCHAR(255)', description: 'Increase source limit' },
      { table: 'economic_data', column: 'series_id', newType: 'VARCHAR(255)', description: 'Increase series_id limit' },
      { table: 'alerts', column: 'message', newType: 'TEXT', description: 'Change message to TEXT' },
      { table: 'trending_narratives', column: 'narrative', newType: 'TEXT', description: 'Change narrative to TEXT' }
    ];
    
    for (const fix of otherFixes) {
      try {
        const exists = await columnExists(fix.table, fix.column);
        
        if (exists) {
          console.log(`🔧 ${fix.description} for ${fix.table}.${fix.column}...`);
          await client.query(`
            ALTER TABLE ${fix.table} 
            ALTER COLUMN ${fix.column} TYPE ${fix.newType}
          `);
          console.log(`✅ ${fix.description} for ${fix.table}.${fix.column} - completed`);
        } else {
          console.log(`⚠️  Column ${fix.table}.${fix.column} does not exist, skipping`);
        }
      } catch (error) {
        console.error(`❌ Failed to alter ${fix.table}.${fix.column}:`, error.message);
      }
    }
    
    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Only run if called directly
if (require.main === module) {
  fixMissingColumns().catch(console.error);
}

module.exports = { fixMissingColumns };
