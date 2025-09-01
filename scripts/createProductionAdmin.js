#!/usr/bin/env node

/**
 * Production Admin Creation Script
 * Creates an admin user for production deployment
 * 
 * Usage: npm run create-admin
 * 
 * This script will prompt for admin credentials or use environment variables
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createProductionAdmin() {
  console.log('🚀 Production Admin Creation Script\n');
  
  // Check if we have DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set - cannot create admin user');
    console.log('   Please set DATABASE_URL environment variable');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Get admin credentials
    let adminEmail, adminPassword;
    
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      console.log('📧 Using environment variables for admin credentials');
      adminEmail = process.env.ADMIN_EMAIL;
      adminPassword = process.env.ADMIN_PASSWORD;
    } else {
      console.log('📧 Please provide admin credentials:');
      adminEmail = await askQuestion('Admin Email: ');
      adminPassword = await askQuestion('Admin Password: ');
    }
    
    if (!adminEmail || !adminPassword) {
      console.log('❌ Email and password are required');
      process.exit(1);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      console.log('❌ Invalid email format');
      process.exit(1);
    }
    
    // Check if admin user already exists
    console.log('🔍 Checking if admin user exists...');
    const existingUser = await client.query(
      'SELECT id, email, is_admin FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log(`👤 User already exists: ${adminEmail}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Is Admin: ${user.is_admin}`);
      
      // Check if they're already an admin
      if (user.is_admin) {
        console.log('✅ User is already an admin - no action needed');
      } else {
        console.log('🔄 Updating user to admin...');
        await client.query(
          'UPDATE users SET is_admin = true, email_verified = true, updated_at = NOW() WHERE id = $1',
          [user.id]
        );
        
        // Update subscription to admin
        await client.query(
          'UPDATE subscriptions SET plan_type = $1, status = $2 WHERE user_id = $3',
          ['admin', 'active', user.id]
        );
        console.log('✅ User updated to admin');
      }
      
    } else {
      console.log('👤 Creating new admin user...');
      
      // Hash password
      console.log('🔒 Hashing password...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
      
      // Create admin user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, is_admin, email_verified, created_at, updated_at) 
         VALUES ($1, $2, true, true, NOW(), NOW()) 
         RETURNING id`,
        [adminEmail, passwordHash]
      );
      
      const userId = userResult.rows[0].id;
      console.log('✅ Admin user created');
      
      // Create admin subscription
      console.log('💳 Creating admin subscription...');
      await client.query(
        `INSERT INTO subscriptions (user_id, plan_type, status, created_at) 
         VALUES ($1, 'admin', 'active', NOW())`,
        [userId]
      );
      console.log('✅ Admin subscription created');
    }
    
    client.release();
    
    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 Admin Details:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log(`│ Email:    ${adminEmail.padEnd(44)} │`);
    console.log(`│ Plan:     admin${' '.repeat(40)} │`);
    console.log(`│ Admin:    true${' '.repeat(40)} │`);
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    console.log('\n💡 You can now log in to the admin panel with these credentials');
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error('\nThis might happen if:');
    console.error('  - The database is not accessible');
    console.error('  - The users or subscriptions table does not exist');
    console.error('  - There are database connection issues');
    console.error('  - The email format is invalid');
    process.exit(1);
  } finally {
    await pool.end();
    rl.close();
  }
}

// Run the admin creation
if (require.main === module) {
  createProductionAdmin().catch(console.error);
}

module.exports = { createProductionAdmin };
