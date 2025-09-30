#!/usr/bin/env node

const { Pool } = require('pg');

// Railway production database URL
const DATABASE_URL = process.env.DATABASE_URL;

async function addMissingNotificationColumns() {
  console.log('🔧 Adding missing notification columns to users table...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to production database');

    // Add missing columns
    console.log('📝 Adding crypto_news_channels column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS crypto_news_channels TEXT DEFAULT '["email","push","telegram"]'
    `);
    console.log('✅ crypto_news_channels column added');

    console.log('📝 Adding crypto_news_impact_filter column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS crypto_news_impact_filter TEXT DEFAULT 'medium'
    `);
    console.log('✅ crypto_news_impact_filter column added');

    // Verify columns were added
    console.log('\n🔍 Verifying columns were added...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('crypto_news_channels', 'crypto_news_impact_filter')
      ORDER BY column_name
    `);
    
    console.log('📝 Added columns:');
    columnsResult.rows.forEach(column => {
      console.log(`   ${column.column_name}: ${column.data_type} (default: ${column.column_default})`);
    });

    // Test the notification preferences query
    console.log('\n🧪 Testing notification preferences query...');
    try {
      const testResult = await client.query(`
        SELECT 
          email_notifications, 
          push_notifications, 
          telegram_notifications, 
          notification_preferences, 
          event_notifications, 
          event_notification_windows, 
          event_notification_channels, 
          event_impact_filter, 
          crypto_news_notifications, 
          crypto_news_channels, 
          crypto_news_impact_filter 
        FROM users 
        WHERE email = $1
      `, ['raul@palm-tree-tech.xyz']);
      
      if (testResult.rows.length > 0) {
        console.log('✅ Notification preferences query successful!');
        const user = testResult.rows[0];
        console.log('📝 User notification data:');
        console.log(`   Email Notifications: ${user.email_notifications}`);
        console.log(`   Push Notifications: ${user.push_notifications}`);
        console.log(`   Telegram Notifications: ${user.telegram_notifications}`);
        console.log(`   Crypto News Notifications: ${user.crypto_news_notifications}`);
        console.log(`   Crypto News Channels: ${user.crypto_news_channels}`);
        console.log(`   Crypto News Impact Filter: ${user.crypto_news_impact_filter}`);
      }
    } catch (testError) {
      console.log('❌ Notification preferences query failed:', testError.message);
    }

    await client.release();
    console.log('\n✅ Missing columns added successfully');

  } catch (error) {
    console.log('❌ Failed to add missing columns:', error.message);
    console.log('📝 Error details:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
addMissingNotificationColumns().catch(console.error);
