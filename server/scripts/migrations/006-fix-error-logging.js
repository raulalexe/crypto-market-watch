// Migration: Fix error logging table and ensure proper constraints
// This migration ensures error_logs table has proper structure and constraints

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await db.connect();
  
  try {
    console.log('🔧 Fixing error logging table...');
    
    // Ensure error_logs table has proper structure
    await client.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50),
        source VARCHAR(100),
        message TEXT,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp 
      ON error_logs (timestamp DESC)
    `);
    
    // Add index for type filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_error_logs_type 
      ON error_logs (type)
    `);
    
    console.log('✅ Error logging table structure ensured');
    
  } catch (error) {
    console.error('❌ Error fixing error logging table:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { runMigration };
