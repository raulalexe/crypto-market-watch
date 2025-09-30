#!/usr/bin/env node

const { Pool } = require('pg');

// Railway production database URL
const DATABASE_URL = process.env.DATABASE_URL;

async function checkProductionUser() {
  console.log('🔍 Checking production database for user...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to database
    console.log('1. Connecting to production database...');
    const client = await pool.connect();
    console.log('✅ Connected to production database');

    // Check if users table exists
    console.log('\n2. Checking users table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log('📝 Users table exists:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist');
      return;
    }

    // Get all users
    console.log('\n3. Fetching all users...');
    const usersResult = await client.query(`
      SELECT 
        id, 
        email, 
        email_verified, 
        is_admin, 
        created_at, 
        updated_at,
        subscription_plan
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log(`📝 Found ${usersResult.rows.length} users:`);
    usersResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Verified: ${user.email_verified}, Admin: ${user.is_admin}, Plan: ${user.subscription_plan || 'null'}`);
    });

    // Check specifically for raul@palm-tree-tech.xyz
    console.log('\n4. Checking for raul@palm-tree-tech.xyz...');
    const specificUser = await client.query(`
      SELECT 
        id, 
        email, 
        email_verified, 
        is_admin, 
        created_at, 
        updated_at,
        subscription_plan,
        notification_preferences,
        telegram_chat_id,
        telegram_verified
      FROM users 
      WHERE email = $1
    `, ['raul@palm-tree-tech.xyz']);
    
    if (specificUser.rows.length > 0) {
      const user = specificUser.rows[0];
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Is Admin: ${user.is_admin}`);
      console.log(`   Subscription Plan: ${user.subscription_plan || 'null'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Updated: ${user.updated_at}`);
      console.log(`   Telegram Chat ID: ${user.telegram_chat_id || 'null'}`);
      console.log(`   Telegram Verified: ${user.telegram_verified || 'null'}`);
      
      if (user.notification_preferences) {
        try {
          const prefs = JSON.parse(user.notification_preferences);
          console.log(`   Notification Preferences: ${JSON.stringify(prefs, null, 2)}`);
        } catch (e) {
          console.log(`   Notification Preferences: ${user.notification_preferences}`);
        }
      }
      
      // Check if user needs activation
      if (!user.email_verified) {
        console.log('\n🚨 USER NEEDS ACTIVATION:');
        console.log('   The user exists but email_verified is false');
        console.log('   Admin needs to activate this user');
      } else {
        console.log('\n✅ USER IS ACTIVATED:');
        console.log('   Email is verified, user should be able to log in');
      }
      
    } else {
      console.log('❌ User raul@palm-tree-tech.xyz not found in database');
      console.log('   This explains the "Invalid credentials" error');
    }

    // Check database schema
    console.log('\n5. Checking users table schema...');
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📝 Users table columns:');
    schemaResult.rows.forEach(column => {
      console.log(`   ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    // Check for any JWT-related issues in error logs
    console.log('\n6. Checking recent error logs...');
    try {
      const errorLogs = await client.query(`
        SELECT 
          id, 
          error_type, 
          error_message, 
          source, 
          created_at
        FROM error_logs 
        WHERE created_at > NOW() - INTERVAL '1 hour'
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      if (errorLogs.rows.length > 0) {
        console.log(`📝 Found ${errorLogs.rows.length} recent error logs:`);
        errorLogs.rows.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.created_at}: ${log.error_type} - ${log.error_message}`);
        });
      } else {
        console.log('📝 No recent error logs found');
      }
    } catch (error) {
      console.log('📝 Error logs table might not exist or be accessible');
    }

    await client.release();
    console.log('\n✅ Database check completed');

  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('📝 Error details:', error);
  } finally {
    await pool.end();
  }
}

// Run the check
checkProductionUser().catch(console.error);
