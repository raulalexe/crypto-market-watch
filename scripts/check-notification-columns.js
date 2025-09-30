#!/usr/bin/env node

const { Pool } = require('pg');

// Railway production database URL
const DATABASE_URL = process.env.DATABASE_URL;

async function checkNotificationColumns() {
  console.log('🔍 Checking notification-related columns in users table...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to production database');

    // Check all columns in users table
    console.log('📝 All columns in users table:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    columnsResult.rows.forEach(column => {
      console.log(`   ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    // Check specific notification-related columns
    console.log('\n🔍 Checking notification-related columns:');
    const notificationColumns = [
      'email_notifications',
      'push_notifications', 
      'telegram_notifications',
      'notification_preferences',
      'event_notifications',
      'event_notification_windows',
      'event_notification_channels',
      'event_impact_filter',
      'crypto_news_notifications',
      'crypto_news_channels',
      'crypto_news_impact_filter'
    ];

    for (const column of notificationColumns) {
      const exists = columnsResult.rows.some(row => row.column_name === column);
      console.log(`   ${column}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    // Check user's current notification data
    console.log('\n📝 Current user notification data:');
    const userResult = await client.query(`
      SELECT 
        id, email,
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
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email Notifications: ${user.email_notifications}`);
      console.log(`   Push Notifications: ${user.push_notifications}`);
      console.log(`   Telegram Notifications: ${user.telegram_notifications}`);
      console.log(`   Notification Preferences: ${user.notification_preferences}`);
      console.log(`   Event Notifications: ${user.event_notifications}`);
      console.log(`   Event Windows: ${user.event_notification_windows}`);
      console.log(`   Event Channels: ${user.event_notification_channels}`);
      console.log(`   Event Impact Filter: ${user.event_impact_filter}`);
      console.log(`   Crypto News Notifications: ${user.crypto_news_notifications}`);
      console.log(`   Crypto News Channels: ${user.crypto_news_channels}`);
      console.log(`   Crypto News Impact Filter: ${user.crypto_news_impact_filter}`);
    }

    await client.release();
    console.log('\n✅ Column check completed');

  } catch (error) {
    console.log('❌ Column check failed:', error.message);
    console.log('📝 Error details:', error);
  } finally {
    await pool.end();
  }
}

// Run the check
checkNotificationColumns().catch(console.error);
