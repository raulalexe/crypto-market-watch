#!/usr/bin/env node

/**
 * Wipe All Users from PostgreSQL Database
 * This script removes all users and related data from the database
 */

async function wipeAllUsers() {
  console.log('🗑️  Wiping all users from PostgreSQL database...\n');
  
  // Check if we're in production with PostgreSQL
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.log('⚠️  Not in PostgreSQL environment, skipping user wipe');
    return;
  }

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    console.log('🔍 Checking current users...');
    
    // Get current user count
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = userCountResult.rows[0].count;
    console.log(`📊 Found ${userCount} users in database`);
    
    if (userCount === 0) {
      console.log('✅ No users to delete');
      client.release();
      await pool.end();
      return;
    }
    
    console.log('🗑️  Deleting all users and related data...');
    
    // Delete in order to respect foreign key constraints
    // 1. Delete API usage records
    const apiUsageResult = await client.query('DELETE FROM api_usage');
    console.log(`   Deleted ${apiUsageResult.rowCount} API usage records`);
    
    // 2. Delete API keys
    const apiKeysResult = await client.query('DELETE FROM api_keys');
    console.log(`   Deleted ${apiKeysResult.rowCount} API keys`);
    
    // 3. Delete push subscriptions
    const pushSubsResult = await client.query('DELETE FROM push_subscriptions');
    console.log(`   Deleted ${pushSubsResult.rowCount} push subscriptions`);
    
    // 4. Delete user alert thresholds
    const thresholdsResult = await client.query('DELETE FROM user_alert_thresholds');
    console.log(`   Deleted ${thresholdsResult.rowCount} user alert thresholds`);
    
    // 5. Delete subscriptions
    const subscriptionsResult = await client.query('DELETE FROM subscriptions');
    console.log(`   Deleted ${subscriptionsResult.rowCount} subscriptions`);
    
    // 6. Delete alerts
    const alertsResult = await client.query('DELETE FROM alerts');
    console.log(`   Deleted ${alertsResult.rowCount} alerts`);
    
    // 7. Finally, delete users
    const usersResult = await client.query('DELETE FROM users');
    console.log(`   Deleted ${usersResult.rowCount} users`);
    
    console.log('\n✅ All users and related data wiped successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${usersResult.rowCount}`);
    console.log(`   - Subscriptions: ${subscriptionsResult.rowCount}`);
    console.log(`   - API Keys: ${apiKeysResult.rowCount}`);
    console.log(`   - Push Subscriptions: ${pushSubsResult.rowCount}`);
    console.log(`   - API Usage: ${apiUsageResult.rowCount}`);
    console.log(`   - Alerts: ${alertsResult.rowCount}`);
    console.log(`   - User Alert Thresholds: ${thresholdsResult.rowCount}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error wiping users:', error.message);
    process.exit(1);
  }
}

// Run the script
wipeAllUsers().catch(console.error);
