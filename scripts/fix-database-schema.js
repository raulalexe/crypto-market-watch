#!/usr/bin/env node

/**
 * Database Schema Fix Script
 * Fixes missing columns in deployed databases
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function fixDatabaseSchema() {
  console.log('🔧 Fixing Database Schema Issues...\n');
  
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
    
    // Fix alerts table
    console.log('\n🔧 Fixing alerts table...');
    
    const alertsColumns = [
      { name: 'type', type: 'VARCHAR(50)' },
      { name: 'metric', type: 'VARCHAR(50)' },
      { name: 'severity', type: 'VARCHAR(20)' },
      { name: 'message', type: 'TEXT' },
      { name: 'value', type: 'TEXT' },
      { name: 'eventId', type: 'INTEGER' },
      { name: 'eventDate', type: 'TEXT' },
      { name: 'eventTitle', type: 'TEXT' },
      { name: 'eventCategory', type: 'TEXT' }
    ];
    
    for (const column of alertsColumns) {
      try {
        await client.query(`
          ALTER TABLE alerts ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        console.log(`  ✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.code === '42701') { // Column already exists
          console.log(`  ℹ️ Column already exists: ${column.name}`);
        } else {
          console.log(`  ⚠️ Error with column ${column.name}: ${error.message}`);
        }
      }
    }
    
    // Check if alerts table exists, if not create it
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          type VARCHAR(50),
          message TEXT,
          severity VARCHAR(20),
          metric VARCHAR(50),
          value TEXT,
          eventId INTEGER,
          eventDate TEXT,
          eventTitle TEXT,
          eventCategory TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ Alerts table structure verified');
    } catch (error) {
      console.log(`  ⚠️ Error creating alerts table: ${error.message}`);
    }
    
    // Fix other tables that might have missing columns
    console.log('\n🔧 Checking other tables...');
    
    // Check crypto_prices table
    try {
      await client.query(`
        ALTER TABLE crypto_prices ADD COLUMN IF NOT EXISTS change_24h DECIMAL
      `);
      console.log('  ✅ crypto_prices.change_24h column verified');
    } catch (error) {
      console.log(`  ℹ️ crypto_prices table: ${error.message}`);
    }
    
    // Check fear_greed_index table
    try {
      await client.query(`
        ALTER TABLE fear_greed_index ADD COLUMN IF NOT EXISTS source VARCHAR(100)
      `);
      console.log('  ✅ fear_greed_index.source column verified');
    } catch (error) {
      console.log(`  ℹ️ fear_greed_index table: ${error.message}`);
    }
    
    // Check market_data table
    try {
      await client.query(`
        ALTER TABLE market_data ADD COLUMN IF NOT EXISTS source VARCHAR(100)
      `);
      console.log('  ✅ market_data.source column verified');
    } catch (error) {
      console.log(`  ℹ️ market_data table: ${error.message}`);
    }
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    
    try {
      const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'alerts' 
        ORDER BY ordinal_position
      `);
      
      console.log('  📋 Alerts table columns:');
      result.rows.forEach(row => {
        console.log(`    - ${row.column_name}: ${row.data_type}`);
      });
      
      // Check if required columns exist
      const requiredColumns = ['type', 'metric', 'severity', 'message'];
      const existingColumns = result.rows.map(row => row.column_name);
      
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('  ✅ All required columns are present');
      } else {
        console.log(`  ❌ Missing columns: ${missingColumns.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`  ⚠️ Error verifying table structure: ${error.message}`);
    }
    
    console.log('\n✅ Database schema fix completed!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database schema fix failed:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run the fix
if (require.main === module) {
  fixDatabaseSchema().catch(console.error);
}

module.exports = fixDatabaseSchema;
