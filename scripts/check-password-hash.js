#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Railway production database URL
const DATABASE_URL = process.env.DATABASE_URL;

async function checkPasswordHash() {
  console.log('🔍 Checking password hash for raul@palm-tree-tech.xyz...\n');

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to production database');

    // Get user's password hash
    const userResult = await client.query(`
      SELECT id, email, password_hash, created_at, updated_at
      FROM users 
      WHERE email = $1
    `, ['raul@palm-tree-tech.xyz']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('📝 User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password hash length: ${user.password_hash.length}`);
    console.log(`   Password hash prefix: ${user.password_hash.substring(0, 10)}...`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Updated: ${user.updated_at}`);

    // Test common passwords
    console.log('\n🔐 Testing common passwords...');
    const commonPasswords = [
      'password123',
      'Password123',
      'admin123',
      'Admin123',
      'railway123',
      'Railway123',
      'crypto123',
      'Crypto123',
      'palm123',
      'Palm123',
      'tech123',
      'Tech123'
    ];

    let passwordFound = false;
    for (const password of commonPasswords) {
      try {
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (isValid) {
          console.log(`✅ Password found: "${password}"`);
          passwordFound = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Error testing password "${password}": ${error.message}`);
      }
    }

    if (!passwordFound) {
      console.log('❌ None of the common passwords worked');
      console.log('🔧 The password hash might be corrupted or the password is not common');
    }

    // Check if password hash is valid bcrypt format
    console.log('\n🔍 Checking password hash format...');
    const hashParts = user.password_hash.split('$');
    if (hashParts.length === 4) {
      console.log('✅ Password hash appears to be valid bcrypt format');
      console.log(`   Algorithm: ${hashParts[1]}`);
      console.log(`   Cost: ${hashParts[2]}`);
      console.log(`   Salt + Hash: ${hashParts[3].substring(0, 20)}...`);
    } else {
      console.log('❌ Password hash does not appear to be valid bcrypt format');
      console.log('   This might explain the authentication issues');
    }

    await client.release();
    console.log('\n✅ Password hash check completed');

  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the check
checkPasswordHash().catch(console.error);
