#!/usr/bin/env node

/**
 * Fix Existing Subscriptions Script
 * This script migrates subscription data from the subscriptions table to the users table
 * for users who were created before the subscription columns were added to the users table
 */

const { Pool } = require('pg');

async function fixExistingSubscriptions() {
  console.log('🔄 Fixing existing subscriptions...');
  
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set - skipping subscription fix');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    const client = await pool.connect();
    
    // Get all users who don't have subscription_plan set (or it's null)
    const usersWithoutPlan = await client.query(`
      SELECT u.id, u.email, u.is_admin, s.plan_type, s.status, s.current_period_end
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.subscription_plan IS NULL OR u.subscription_plan = 'free'
      ORDER BY u.id
    `);
    
    console.log(`📊 Found ${usersWithoutPlan.rows.length} users to check...`);
    
    for (const user of usersWithoutPlan.rows) {
      let planType = 'free';
      let expiresAt = null;
      
      // Determine plan type
      if (user.is_admin) {
        planType = 'admin';
      } else if (user.plan_type && user.plan_type !== 'free') {
        planType = user.plan_type;
        expiresAt = user.current_period_end;
      }
      
      // Update user with correct subscription plan
      await client.query(
        'UPDATE users SET subscription_plan = $1, subscription_expires_at = $2, updated_at = NOW() WHERE id = $3',
        [planType, expiresAt, user.id]
      );
      
      console.log(`✅ Updated user ${user.email} (ID: ${user.id}) to ${planType} plan`);
    }
    
    // Also check for users who might have subscription_plan set but need to be updated based on admin status
    const adminUsers = await client.query(`
      SELECT id, email, subscription_plan, is_admin
      FROM users
      WHERE is_admin = true AND (subscription_plan IS NULL OR subscription_plan != 'admin')
    `);
    
    for (const user of adminUsers.rows) {
      await client.query(
        'UPDATE users SET subscription_plan = $1, subscription_expires_at = NULL, updated_at = NOW() WHERE id = $2',
        ['admin', user.id]
      );
      console.log(`✅ Updated admin user ${user.email} (ID: ${user.id}) to admin plan`);
    }
    
    client.release();
    console.log('🎉 Subscription fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixExistingSubscriptions().catch(console.error);
}

module.exports = { fixExistingSubscriptions };
