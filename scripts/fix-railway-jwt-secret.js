#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'https://crypto-market-watch-production.up.railway.app';

async function fixRailwayJWTSecret() {
  console.log('🔐 Fixing Railway JWT secret mismatch...\n');

  try {
    // Step 1: Check Railway environment
    console.log('1. Checking Railway environment...');
    const diagResponse = await axios.get(`${BASE_URL}/api/debug/railway-env`);
    console.log('✅ Railway diagnostic accessible');
    console.log('📝 JWT_SECRET length:', diagResponse.data.jwtSecretLength);
    console.log('📝 JWT test:', diagResponse.data.jwtTest);
    console.log('📝 Environment:', diagResponse.data.nodeEnv);
    console.log('📝 Railway environment:', diagResponse.data.railwayEnv);
    
    // Step 2: Try emergency token regeneration
    console.log('\n2. Testing emergency token regeneration...');
    try {
      const regenerateResponse = await axios.post(`${BASE_URL}/api/auth/regenerate`, {
        email: 'raul@palm-tree-tech.xyz',
        password: 'your-password-here' // Replace with actual password
      });
      console.log('✅ Emergency token regeneration successful');
      console.log('📝 New token length:', regenerateResponse.data.token.length);
      console.log('📝 Message:', regenerateResponse.data.message);
      
      const newToken = regenerateResponse.data.token;
      
      // Step 3: Test the new token
      console.log('\n3. Testing new token with notification preferences...');
      try {
        const prefsResponse = await axios.get(`${BASE_URL}/api/notifications/preferences`, {
          headers: {
            'Authorization': `Bearer ${newToken}`
          }
        });
        console.log('✅ New token works for notification preferences');
        console.log('📝 Preferences:', prefsResponse.data);
      } catch (error) {
        console.log('❌ New token failed for notification preferences:');
        console.log('   Status:', error.response?.status);
        console.log('   Error:', error.response?.data);
      }
      
    } catch (error) {
      console.log('❌ Emergency token regeneration failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data);
    }
    
    // Step 4: Check if there are multiple JWT secrets
    console.log('\n4. Checking for JWT secret consistency...');
    console.log('📝 Current JWT_SECRET length:', diagResponse.data.jwtSecretLength);
    console.log('📝 JWT_SECRET prefix:', diagResponse.data.jwtSecretPrefix);
    
    if (diagResponse.data.jwtTest === 'WORKING') {
      console.log('✅ JWT functionality is working on the server');
      console.log('❌ But client tokens are failing - this suggests:');
      console.log('   1. Client has old tokens signed with different secret');
      console.log('   2. JWT_SECRET changed between deployments');
      console.log('   3. Multiple JWT secrets in different environments');
    }
    
    console.log('\n🔧 Recommended fixes:');
    console.log('1. Clear browser localStorage and cookies');
    console.log('2. Log out and log in again to get fresh tokens');
    console.log('3. Check Railway environment variables for JWT_SECRET consistency');
    console.log('4. Ensure JWT_SECRET is the same across all deployments');
    
  } catch (error) {
    console.log('❌ Railway diagnostic failed:', error.message);
    console.log('📝 This might indicate the Railway deployment is not accessible');
  }
}

// Run the fix
fixRailwayJWTSecret().catch(console.error);
