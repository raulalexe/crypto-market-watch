#!/usr/bin/env node

/**
 * Admin User Verification Script
 * This script manually verifies an admin user's email
 */

require('dotenv').config();
const { initDatabase } = require('../server/database');

async function verifyAdmin() {
  try {
    console.log('🔐 Verifying admin user...\n');
    
    // Initialize database
    await initDatabase();
    
    // Get database instance
    const { db } = require('../server/database');
    
    // Get admin user by email
    const email = process.argv[2] || 'admin@crypto-market-watch.xyz';
    
    console.log(`📧 Looking for admin user: ${email}`);
    
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`👤 Found user: ${user.email} (ID: ${user.id})`);
    console.log(`   Admin: ${user.is_admin ? '✅ Yes' : '❌ No'}`);
    console.log(`   Email Verified: ${user.email_verified ? '✅ Yes' : '❌ No'}`);
    
    if (user.email_verified) {
      console.log('✅ User is already verified');
      return;
    }
    
    // Verify the user
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET email_verified = 1, confirmation_token = NULL, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });
    
    console.log('✅ User email verified successfully');
    
    // Create subscription if it doesn't exist
    const subscription = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM subscriptions WHERE user_id = ?', [user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!subscription) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO subscriptions (user_id, plan, status, created_at) VALUES (?, ?, ?, ?)',
          [user.id, 'free', 'active', new Date().toISOString()],
          function(err) {
            if (err) reject(err);
            else resolve(this);
          }
        );
      });
      console.log('✅ Free subscription created');
    } else {
      console.log('✅ Subscription already exists');
    }
    
    console.log('\n🎉 Admin user is now ready to use!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 You can now log in with your password`);
    
  } catch (error) {
    console.error('❌ Error verifying admin:', error.message);
  } finally {
    process.exit(0);
  }
}

verifyAdmin();
