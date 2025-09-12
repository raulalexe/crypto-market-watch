#!/usr/bin/env node

/**
 * Migration script to add updated_at column to subscriptions table
 * Run this on Railway to fix the database schema
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addUpdatedAtColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding updated_at column to subscriptions table...');
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name = 'updated_at'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ updated_at column already exists in subscriptions table');
      return;
    }
    
    // Add the updated_at column
    await client.query(`
      ALTER TABLE subscriptions 
      ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    console.log('✅ Successfully added updated_at column to subscriptions table');
    
    // Update existing rows to have updated_at = created_at
    await client.query(`
      UPDATE subscriptions 
      SET updated_at = created_at 
      WHERE updated_at IS NULL
    `);
    
    console.log('✅ Updated existing subscription records with updated_at timestamps');
    
  } catch (error) {
    console.error('❌ Error adding updated_at column:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addUpdatedAtColumn();
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

main();
