#!/usr/bin/env node

/**
 * Migration: Add missing unique constraints for inflation data tables
 * This ensures the constraints exist even on existing databases
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running migration: Add inflation data constraints...');
    
    // Add unique constraint to inflation_data table if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'inflation_data' 
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%type%'
        ) THEN
          ALTER TABLE inflation_data 
          ADD CONSTRAINT inflation_data_type_date_unique UNIQUE (type, date);
          RAISE NOTICE 'Added unique constraint to inflation_data table';
        ELSE
          RAISE NOTICE 'inflation_data table already has unique constraint';
        END IF;
      END $$;
    `);
    
    // Add unique constraint to inflation_releases table if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'inflation_releases' 
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%type%'
        ) THEN
          ALTER TABLE inflation_releases 
          ADD CONSTRAINT inflation_releases_type_date_unique UNIQUE (type, date);
          RAISE NOTICE 'Added unique constraint to inflation_releases table';
        ELSE
          RAISE NOTICE 'inflation_releases table already has unique constraint';
        END IF;
      END $$;
    `);
    
    // Add unique constraint to economic_data table if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'economic_data' 
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%series_id%'
        ) THEN
          ALTER TABLE economic_data 
          ADD CONSTRAINT economic_data_series_id_date_unique UNIQUE (series_id, date);
          RAISE NOTICE 'Added unique constraint to economic_data table';
        ELSE
          RAISE NOTICE 'economic_data table already has unique constraint';
        END IF;
      END $$;
    `);
    
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
  runMigration()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
