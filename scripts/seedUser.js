#!/usr/bin/env node

/**
 * User Seeding Script
 * Creates a user with specified email, password, and plan
 * 
 * Usage: node scripts/seedUser.js <email> <password> <plan>
 * 
 * Plans: free, pro, premium, admin
 * 
 * Examples:
 *   node scripts/seedUser.js admin@example.com mypassword admin
 *   node scripts/seedUser.js user@example.com mypassword pro
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Valid plans
const VALID_PLANS = ['free', 'pro', 'premium', 'admin'];

async function seedUser(email, password, plan) {
  console.log('🌱 Seeding user...\n');
  
  // Validate inputs
  if (!email || !password || !plan) {
    console.error('❌ Missing required parameters');
    console.error('Usage: node scripts/seedUser.js <email> <password> <plan>');
    console.error('Plans: free, pro, premium, admin');
    process.exit(1);
  }
  
  if (!VALID_PLANS.includes(plan)) {
    console.error(`❌ Invalid plan: ${plan}`);
    console.error(`Valid plans: ${VALID_PLANS.join(', ')}`);
    process.exit(1);
  }
  
  // Check if we have DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    console.error('   Please set DATABASE_URL in your environment variables');
    console.error('   Example: postgresql://user:password@localhost:5432/database');
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
    
    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await client.query(
      'SELECT id, email, is_admin FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists, updating...');
      const userId = existingUser.rows[0].id;
      
      // Hash password
      console.log('🔒 Hashing password...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Update user
      const isAdmin = plan === 'admin';
      await client.query(
        'UPDATE users SET password_hash = $1, is_admin = $2, email_verified = true, updated_at = NOW() WHERE id = $3',
        [passwordHash, isAdmin, userId]
      );
      console.log('✅ User updated');
      
      // Update subscription
      await client.query(
        'UPDATE subscriptions SET plan_type = $1, status = $2 WHERE user_id = $3',
        [plan, 'active', userId]
      );
      console.log('✅ Subscription updated');
      
    } else {
      console.log('👤 Creating new user...');
      
      // Hash password
      console.log('🔒 Hashing password...');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create user
      const isAdmin = plan === 'admin';
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, is_admin, email_verified, created_at, updated_at) 
         VALUES ($1, $2, $3, true, NOW(), NOW()) 
         RETURNING id`,
        [email, passwordHash, isAdmin]
      );
      
      const userId = userResult.rows[0].id;
      console.log('✅ User created');
      
      // Create subscription
      console.log('💳 Creating subscription...');
      await client.query(
        `INSERT INTO subscriptions (user_id, plan_type, status, created_at) 
         VALUES ($1, $2, 'active', NOW())`,
        [userId, plan]
      );
      console.log('✅ Subscription created');
    }
    
    client.release();
    
    console.log('\n🎉 User seeding complete!');
    console.log('\n📋 User Details:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log(`│ Email:    ${email.padEnd(44)} │`);
    console.log(`│ Plan:     ${plan.padEnd(44)} │`);
    console.log(`│ Admin:    ${(plan === 'admin').toString().padEnd(44)} │`);
    console.log('└─────────────────────────────────────────────────────────────┘');
    
  } catch (error) {
    console.error('\n❌ Error seeding user:', error.message);
    console.error('\nThis might happen if:');
    console.error('  - The database is not accessible');
    console.error('  - The users or subscriptions table does not exist');
    console.error('  - There are database connection issues');
    console.error('  - The email format is invalid');
  } finally {
    await pool.end();
  }
}

// Get command line arguments
const [,, email, password, plan] = process.argv;

// Run the seeding
seedUser(email, password, plan).catch(console.error);
