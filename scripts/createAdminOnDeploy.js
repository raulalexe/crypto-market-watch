#!/usr/bin/env node

/**
 * Admin and PRO User Creation on Deploy Script
 * Creates an admin user on deployment if ADMIN_EMAIL and ADMIN_PASSWORD are set
 * Creates a PRO user on deployment if PRO_EMAIL and PRO_PASSWORD are set
 * Only creates if the users don't already exist
 * 
 * This script runs automatically on Railway deployment
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Helper function to create a user
async function createUser(client, email, password, planType, isAdmin) {
  console.log(`🔍 Checking if ${planType} user exists: ${email}...`);
  
  const existingUser = await client.query(
    'SELECT id, email, is_admin FROM users WHERE email = $1',
    [email]
  );
  
  if (existingUser.rows.length > 0) {
    const user = existingUser.rows[0];
    console.log(`👤 ${planType.toUpperCase()} user already exists: ${email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Is Admin: ${user.is_admin}`);
    
    // Check if they need to be updated
    if (isAdmin && !user.is_admin) {
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
    } else if (!isAdmin && user.is_admin) {
      console.log('🔄 Updating admin to regular user...');
      await client.query(
        'UPDATE users SET is_admin = false, updated_at = NOW() WHERE id = $1',
        [user.id]
      );
      
      // Update subscription to pro
      await client.query(
        'UPDATE subscriptions SET plan_type = $1, status = $2 WHERE user_id = $3',
        ['pro', 'active', user.id]
      );
      console.log('✅ User updated to pro');
    } else {
      console.log(`✅ User is already configured as ${planType} - no action needed`);
    }
    
  } else {
    console.log(`👤 Creating new ${planType} user: ${email}...`);
    
    // Hash password
    console.log('🔒 Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, is_admin, email_verified, created_at, updated_at) 
       VALUES ($1, $2, $3, true, NOW(), NOW()) 
       RETURNING id`,
      [email, passwordHash, isAdmin]
    );
    
    const userId = userResult.rows[0].id;
    console.log(`✅ ${planType.toUpperCase()} user created`);
    
    // Create subscription
    console.log(`💳 Creating ${planType} subscription...`);
    await client.query(
      `INSERT INTO subscriptions (user_id, plan_type, status, created_at) 
       VALUES ($1, $2, 'active', NOW())`,
      [userId, planType]
    );
    console.log(`✅ ${planType.toUpperCase()} subscription created`);
  }
}

async function createAdminOnDeploy() {
  console.log('🚀 Checking for admin and PRO user creation on deploy...\n');
  
  // Check if admin credentials are provided
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Check if PRO credentials are provided
  const proEmail = process.env.PRO_EMAIL;
  const proPassword = process.env.PRO_PASSWORD;
  
  if (!adminEmail && !proEmail) {
    console.log('⏭️  Skipping user creation - no user credentials provided');
    console.log('   To create users on deploy, set these environment variables:');
    console.log('   For Admin User:');
    console.log('   - ADMIN_EMAIL=your-admin@email.com');
    console.log('   - ADMIN_PASSWORD=your-secure-password');
    console.log('   For PRO User:');
    console.log('   - PRO_EMAIL=your-pro@email.com');
    console.log('   - PRO_PASSWORD=your-secure-password');
    return;
  }
  
  // Check if we have DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set - skipping admin creation');
    return;
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
    
    // Create admin user if credentials provided
    if (adminEmail && adminPassword) {
      await createUser(client, adminEmail, adminPassword, 'admin', true);
    }
    
    // Create PRO user if credentials provided
    if (proEmail && proPassword) {
      await createUser(client, proEmail, proPassword, 'pro', false);
    }
    
    client.release();
    
    console.log('\n🎉 User setup complete!');
    
    // Display summary
    if (adminEmail) {
      console.log('\n📋 Admin User Details:');
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log(`│ Email:    ${adminEmail.padEnd(44)} │`);
      console.log(`│ Plan:     admin${' '.repeat(40)} │`);
      console.log(`│ Admin:    true${' '.repeat(40)} │`);
      console.log('└─────────────────────────────────────────────────────────────┘');
    }
    
    if (proEmail) {
      console.log('\n📋 PRO User Details:');
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log(`│ Email:    ${proEmail.padEnd(44)} │`);
      console.log(`│ Plan:     pro${' '.repeat(42)} │`);
      console.log(`│ Admin:    false${' '.repeat(38)} │`);
      console.log('└─────────────────────────────────────────────────────────────┘');
    }
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error('\nThis might happen if:');
    console.error('  - The database is not accessible');
    console.error('  - The users or subscriptions table does not exist');
    console.error('  - There are database connection issues');
    console.error('  - The email format is invalid');
  } finally {
    await pool.end();
  }
}

// Export for use in server/index.js
module.exports = { createAdminOnDeploy };

// Run the admin creation if called directly
if (require.main === module) {
  createAdminOnDeploy().catch(console.error);
}
