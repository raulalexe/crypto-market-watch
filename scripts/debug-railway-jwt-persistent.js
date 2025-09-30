#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'https://crypto-market-watch-production.up.railway.app';

async function debugRailwayJWTPersistent() {
  console.log('🔐 Debugging persistent Railway JWT signature issues...\n');

  try {
    // Step 1: Check Railway environment
    console.log('1. Checking Railway environment...');
    const diagResponse = await axios.get(`${BASE_URL}/api/debug/railway-env`);
    console.log('✅ Railway diagnostic accessible');
    console.log('📝 JWT_SECRET length:', diagResponse.data.jwtSecretLength);
    console.log('📝 JWT_SECRET prefix:', diagResponse.data.jwtSecretPrefix);
    console.log('📝 JWT test:', diagResponse.data.jwtTest);
    console.log('📝 Environment:', diagResponse.data.nodeEnv);
    
    // Step 2: Try to login and get a fresh token
    console.log('\n2. Testing fresh login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'raul@palm-tree-tech.xyz',
        password: 'your-actual-password' // You need to provide the real password
      });
      
      if (loginResponse.data.token) {
        console.log('✅ Fresh login successful');
        console.log('📝 Token length:', loginResponse.data.token.length);
        console.log('📝 Token prefix:', loginResponse.data.token.substring(0, 20) + '...');
        console.log('📝 User ID:', loginResponse.data.user.id);
        console.log('📝 Is Admin:', loginResponse.data.user.isAdmin);
        
        const token = loginResponse.data.token;
        
        // Step 3: Immediately test the fresh token
        console.log('\n3. Testing fresh token immediately...');
        try {
          const prefsResponse = await axios.get(`${BASE_URL}/api/notifications/preferences`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Fresh token works for notification preferences');
          console.log('📝 Preferences:', prefsResponse.data);
        } catch (error) {
          console.log('❌ Fresh token failed for notification preferences:');
          console.log('   Status:', error.response?.status);
          console.log('   Error:', error.response?.data);
          
          if (error.response?.data?.code === 'INVALID_SIGNATURE') {
            console.log('🚨 CRITICAL: Even fresh tokens have signature issues!');
            console.log('   This indicates a serious JWT_SECRET problem on Railway');
          }
        }
        
        // Step 4: Test token refresh
        console.log('\n4. Testing token refresh...');
        try {
          const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Token refresh successful');
          console.log('📝 New token length:', refreshResponse.data.token.length);
          
          const refreshedToken = refreshResponse.data.token;
          
          // Test the refreshed token
          console.log('\n5. Testing refreshed token...');
          try {
            const refreshedPrefsResponse = await axios.get(`${BASE_URL}/api/notifications/preferences`, {
              headers: {
                'Authorization': `Bearer ${refreshedToken}`
              }
            });
            console.log('✅ Refreshed token works for notification preferences');
          } catch (error) {
            console.log('❌ Refreshed token failed for notification preferences:');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data);
          }
          
        } catch (error) {
          console.log('❌ Token refresh failed:');
          console.log('   Status:', error.response?.status);
          console.log('   Error:', error.response?.data);
        }
        
        // Step 5: Test emergency token regeneration
        console.log('\n6. Testing emergency token regeneration...');
        try {
          const regenerateResponse = await axios.post(`${BASE_URL}/api/auth/regenerate`, {
            email: 'raul@palm-tree-tech.xyz',
            password: 'your-actual-password' // You need to provide the real password
          });
          console.log('✅ Emergency token regeneration successful');
          console.log('📝 New token length:', regenerateResponse.data.token.length);
          
          const emergencyToken = regenerateResponse.data.token;
          
          // Test the emergency token
          console.log('\n7. Testing emergency token...');
          try {
            const emergencyPrefsResponse = await axios.get(`${BASE_URL}/api/notifications/preferences`, {
              headers: {
                'Authorization': `Bearer ${emergencyToken}`
              }
            });
            console.log('✅ Emergency token works for notification preferences');
          } catch (error) {
            console.log('❌ Emergency token failed for notification preferences:');
            console.log('   Status:', error.response?.status);
            console.log('   Error:', error.response?.data);
          }
          
        } catch (error) {
          console.log('❌ Emergency token regeneration failed:');
          console.log('   Status:', error.response?.status);
          console.log('   Error:', error.response?.data);
        }
        
      } else {
        console.log('❌ Login failed - no token received');
      }
      
    } catch (error) {
      console.log('❌ Login failed:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data);
    }
    
    console.log('\n🔧 Railway JWT Secret Debugging:');
    console.log('📝 Current JWT_SECRET length:', diagResponse.data.jwtSecretLength);
    console.log('📝 Current JWT_SECRET prefix:', diagResponse.data.jwtSecretPrefix);
    console.log('📝 JWT functionality test:', diagResponse.data.jwtTest);
    
    if (diagResponse.data.jwtTest === 'WORKING') {
      console.log('\n🚨 DIAGNOSIS: JWT functionality works on server but client tokens fail');
      console.log('   This indicates one of these issues:');
      console.log('   1. JWT_SECRET is different between server instances');
      console.log('   2. Railway has multiple JWT_SECRET values');
      console.log('   3. JWT_SECRET is being overridden somewhere');
      console.log('   4. There are multiple deployments with different secrets');
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('   1. Check Railway environment variables for JWT_SECRET consistency');
      console.log('   2. Ensure JWT_SECRET is the same across all Railway services');
      console.log('   3. Redeploy with a fresh JWT_SECRET');
      console.log('   4. Clear all Railway caches and restart services');
    }
    
  } catch (error) {
    console.log('❌ Railway diagnostic failed:', error.message);
  }
}

// Run the debug
debugRailwayJWTPersistent().catch(console.error);
