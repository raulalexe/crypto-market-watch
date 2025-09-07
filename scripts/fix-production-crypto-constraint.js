#!/usr/bin/env node

/**
 * Fix Production Crypto Prices Constraint
 * This script fixes the crypto_prices table constraint issue in production
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function fixProductionConstraint() {
  console.log('🔧 Fixing Production Crypto Prices Constraint...\n');
  
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

    // Check current constraints
    console.log('🔍 Checking current constraints...');
    const constraintsResult = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'crypto_prices' 
      AND constraint_type = 'UNIQUE'
    `);
    
    console.log('Current constraints:', constraintsResult.rows);

    // Drop old constraint if it exists
    console.log('🗑️ Dropping old constraint...');
    try {
      await pool.query('ALTER TABLE crypto_prices DROP CONSTRAINT IF EXISTS crypto_prices_symbol_unique');
      console.log('✅ Old constraint dropped');
    } catch (error) {
      console.log('ℹ️ Old constraint not found or already dropped');
    }

    // Add new constraint
    console.log('➕ Adding new constraint...');
    try {
      await pool.query(`
        ALTER TABLE crypto_prices 
        ADD CONSTRAINT crypto_prices_symbol_timestamp_unique 
        UNIQUE (symbol, timestamp)
      `);
      console.log('✅ New constraint added successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ New constraint already exists');
      } else {
        throw error;
      }
    }

    // Verify the constraint
    console.log('🔍 Verifying new constraint...');
    const verifyResult = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'crypto_prices' 
      AND constraint_type = 'UNIQUE'
    `);
    
    console.log('Updated constraints:', verifyResult.rows);

    // Test the constraint with a sample insert
    console.log('🧪 Testing constraint with sample data...');
    try {
      await pool.query(`
        INSERT INTO crypto_prices (symbol, price, volume_24h, market_cap, change_24h) 
        VALUES ('TEST', 100.0, 1000000, 1000000000, 5.0)
        ON CONFLICT (symbol, timestamp) DO UPDATE SET
          price = EXCLUDED.price,
          volume_24h = EXCLUDED.volume_24h,
          market_cap = EXCLUDED.market_cap,
          change_24h = EXCLUDED.change_24h
      `);
      console.log('✅ Constraint test successful');
      
      // Clean up test data
      await pool.query("DELETE FROM crypto_prices WHERE symbol = 'TEST'");
      console.log('🧹 Test data cleaned up');
      
    } catch (error) {
      console.error('❌ Constraint test failed:', error.message);
      throw error;
    }

    console.log('\n🎉 Production constraint fix completed successfully!');
    console.log('✅ The crypto_prices table now has the correct (symbol, timestamp) constraint');
    console.log('✅ ON CONFLICT clauses will now work properly');

  } catch (error) {
    console.error('❌ Error fixing production constraint:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixProductionConstraint().catch(console.error);
}

module.exports = fixProductionConstraint;
