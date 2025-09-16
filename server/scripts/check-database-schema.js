#!/usr/bin/env node

/**
 * Script to check database schema and identify missing columns
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database schema...');
    
    // Tables to check
    const tables = [
      'stablecoin_metrics',
      'exchange_flows', 
      'api_usage',
      'derivatives_data',
      'onchain_data',
      'market_data',
      'ai_analysis',
      'crypto_prices',
      'upcoming_events',
      'layer1_data',
      'inflation_data',
      'economic_data',
      'alerts',
      'trending_narratives'
    ];
    
    for (const table of tables) {
      try {
        console.log(`\n=== ${table.toUpperCase()} TABLE ===`);
        const result = await client.query(`
          SELECT column_name, data_type, character_maximum_length, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [table]);
        
        if (result.rows.length === 0) {
          console.log(`❌ Table ${table} does not exist`);
        } else {
          result.rows.forEach(row => {
            const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
            console.log(`  ${row.column_name}: ${row.data_type}${length} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error checking table ${table}:`, error.message);
      }
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

// Only run if called directly
if (require.main === module) {
  checkSchema().catch(console.error);
}

module.exports = { checkSchema };
