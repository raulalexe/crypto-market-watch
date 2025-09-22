/**
 * Migration: Add subscription_plan and subscription_expires_at columns to users table
 * This migration adds the missing subscription columns that the application expects
 */

const { Pool } = require('pg');

async function addSubscriptionColumnsToUsers() {
  console.log('🔄 Adding subscription columns to users table...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    // Check if columns already exist
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('subscription_plan', 'subscription_expires_at')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    // Add subscription_plan column if it doesn't exist
    if (!existingColumns.includes('subscription_plan')) {
      console.log('📝 Adding subscription_plan column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'free'
      `);
      console.log('✅ subscription_plan column added');
    } else {
      console.log('✅ subscription_plan column already exists');
    }
    
    // Add subscription_expires_at column if it doesn't exist
    if (!existingColumns.includes('subscription_expires_at')) {
      console.log('📝 Adding subscription_expires_at column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN subscription_expires_at TIMESTAMP
      `);
      console.log('✅ subscription_expires_at column added');
    } else {
      console.log('✅ subscription_expires_at column already exists');
    }
    
    client.release();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  addSubscriptionColumnsToUsers().catch(console.error);
}

module.exports = { addSubscriptionColumnsToUsers };
