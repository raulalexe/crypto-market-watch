#!/usr/bin/env node

/**
 * Fix Production Blockchain Column Length
 * This script fixes the blockchain column length issue in production
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function fixProductionBlockchainColumn() {
  console.log('🔧 Fixing Production Blockchain Column Length...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('✅ Connected to production database');

    // Check current column definition
    console.log('🔍 Checking current blockchain column definition...');
    const columnResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'onchain_data' 
      AND column_name = 'blockchain'
    `);
    
    console.log('Current column definition:', columnResult.rows[0]);

    // Fix the column length if needed
    if (columnResult.rows.length > 0 && columnResult.rows[0].character_maximum_length === 20) {
      console.log('🔧 Updating blockchain column from VARCHAR(20) to VARCHAR(50)...');
      await pool.query('ALTER TABLE onchain_data ALTER COLUMN blockchain TYPE VARCHAR(50)');
      console.log('✅ Blockchain column updated successfully');
    } else {
      console.log('ℹ️ Blockchain column already has correct length or does not exist');
    }

    // Verify the fix
    console.log('🔍 Verifying updated column definition...');
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'onchain_data' 
      AND column_name = 'blockchain'
    `);
    
    console.log('Updated column definition:', verifyResult.rows[0]);

    // Test inserting data with long blockchain name
    console.log('🧪 Testing with long blockchain name...');
    try {
      await pool.query(`
        INSERT INTO onchain_data (blockchain, metric_type, value, metadata, source) 
        VALUES ('Multi-Chain Aggregate', 'test_metric', 1.0, '{"test": true}', 'test')
      `);
      console.log('✅ Long blockchain name test successful');
      
      // Clean up test data
      await pool.query("DELETE FROM onchain_data WHERE blockchain = 'Multi-Chain Aggregate' AND metric_type = 'test_metric'");
      console.log('🧹 Test data cleaned up');
      
    } catch (error) {
      console.error('❌ Long blockchain name test failed:', error.message);
      throw error;
    }

    console.log('\n🎉 Production blockchain column fix completed successfully!');
    console.log('✅ The onchain_data table now supports blockchain names up to 50 characters');
    console.log('✅ "Multi-Chain Aggregate" and other long names will now work properly');

  } catch (error) {
    console.error('❌ Error fixing production blockchain column:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixProductionBlockchainColumn().catch(console.error);
}

module.exports = fixProductionBlockchainColumn;
