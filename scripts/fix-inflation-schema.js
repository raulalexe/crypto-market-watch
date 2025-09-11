#!/usr/bin/env node

/**
 * Database migration script to fix inflation_data table schema
 * Adds missing mom_change and core_mom_change columns
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixInflationSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing inflation_data table schema...');
    
    // Check if columns exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inflation_data' 
      AND column_name IN ('mom_change', 'core_mom_change')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    // Add missing columns
    if (!existingColumns.includes('mom_change')) {
      console.log('➕ Adding mom_change column...');
      await client.query(`
        ALTER TABLE inflation_data 
        ADD COLUMN mom_change DECIMAL
      `);
    }
    
    if (!existingColumns.includes('core_mom_change')) {
      console.log('➕ Adding core_mom_change column...');
      await client.query(`
        ALTER TABLE inflation_data 
        ADD COLUMN core_mom_change DECIMAL
      `);
    }
    
    // Add unique constraint if it doesn't exist
    try {
      console.log('🔒 Adding unique constraint on (type, date)...');
      await client.query(`
        ALTER TABLE inflation_data 
        ADD CONSTRAINT inflation_data_type_date_unique UNIQUE (type, date)
      `);
    } catch (error) {
      if (error.code === '23505') {
        console.log('✅ Unique constraint already exists');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Inflation data schema fixed successfully!');
    
    // Show current schema
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'inflation_data'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current inflation_data table schema:');
    schema.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing inflation schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
fixInflationSchema()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
