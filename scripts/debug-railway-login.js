#!/usr/bin/env node

const axios = require('axios');

// Railway production URL
const RAILWAY_URL = 'https://crypto-market-watch-production.up.railway.app';

async function debugRailwayLogin() {
  console.log('🔍 Debugging Railway login and JWT issues...\n');

  try {
    // Step 1: Test login with the reset password
    console.log('1. Testing login with reset password...');
    const loginResponse = await axios.post(`${RAILWAY_URL}/api/auth/login`, {
      email: 'raul@palm-tree-tech.xyz',
      password: 'NewPassword123'
    });

    console.log('✅ Login successful!');
    console.log(`   Token length: ${loginResponse.data.token.length}`);
    console.log(`   User ID: ${loginResponse.data.user.id}`);
    console.log(`   Is Admin: ${loginResponse.data.user.isAdmin}`);

    const token = loginResponse.data.token;

    // Step 2: Test token verification
    console.log('\n2. Testing token verification...');
    try {
      const verifyResponse = await axios.get(`${RAILWAY_URL}/api/debug/jwt-secret`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Token verification successful!');
      console.log('   JWT Secret length:', verifyResponse.data.jwtSecretLength);
      console.log('   JWT Test:', verifyResponse.data.jwtTest);
    } catch (verifyError) {
      console.log('❌ Token verification failed:', verifyError.response?.data || verifyError.message);
    }

    // Step 3: Test protected endpoint
    console.log('\n3. Testing protected endpoint...');
    try {
      const protectedResponse = await axios.get(`${RAILWAY_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Protected endpoint access successful!');
      console.log('   Dashboard data received:', Object.keys(protectedResponse.data));
    } catch (protectedError) {
      console.log('❌ Protected endpoint failed:', protectedError.response?.data || protectedError.message);
    }

    // Step 4: Test notification preferences (the failing endpoint)
    console.log('\n4. Testing notification preferences...');
    try {
      const notificationResponse = await axios.get(`${RAILWAY_URL}/api/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Notification preferences access successful!');
      console.log('   Preferences:', notificationResponse.data);
    } catch (notificationError) {
      console.log('❌ Notification preferences failed:', notificationError.response?.data || notificationError.message);
    }

    // Step 5: Test saving preferences
    console.log('\n5. Testing save preferences...');
    try {
      const saveResponse = await axios.post(`${RAILWAY_URL}/api/notifications/preferences`, {
        emailNotifications: true,
        pushNotifications: false,
        telegramNotifications: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Save preferences successful!');
      console.log('   Response:', saveResponse.data);
    } catch (saveError) {
      console.log('❌ Save preferences failed:', saveError.response?.data || saveError.message);
    }

  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔍 Login failed - checking if password was actually reset...');
      
      // Check if the password reset actually worked
      try {
        const { Pool } = require('pg');
        const DATABASE_URL = process.env.DATABASE_URL;
        
        const pool = new Pool({
          connectionString: DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        
        const client = await pool.connect();
        const userResult = await client.query(`
          SELECT id, email, password_hash, updated_at
          FROM users 
          WHERE email = $1
        `, ['raul@palm-tree-tech.xyz']);
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          console.log('📝 User found in database:');
          console.log(`   ID: ${user.id}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Password hash: ${user.password_hash.substring(0, 20)}...`);
          console.log(`   Updated: ${user.updated_at}`);
          
          // Test the password hash
          const bcrypt = require('bcrypt');
          const isValid = await bcrypt.compare('NewPassword123', user.password_hash);
          console.log(`   Password "NewPassword123" is valid: ${isValid}`);
        }
        
        await client.release();
        await pool.end();
      } catch (dbError) {
        console.log('❌ Database check failed:', dbError.message);
      }
    }
  }
}

// Run the debug
debugRailwayLogin().catch(console.error);
