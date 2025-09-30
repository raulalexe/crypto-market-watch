const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function testApiProtection() {
  console.log('🧪 Testing API Protection System...\n');

  // Test 1: Frontend request (should work with JWT or no auth)
  console.log('1️⃣ Testing frontend request (no API key)...');
  try {
    const response = await axios.get(`${BASE_URL}/api/dashboard`, {
      headers: {
        'Origin': 'http://localhost:3000',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('✅ Frontend request successful (no auth required for dashboard)');
  } catch (error) {
    console.log('❌ Frontend request failed:', error.response?.data || error.message);
  }

  // Test 2: API request without API key (should fail)
  console.log('\n2️⃣ Testing API request without API key...');
  try {
    const response = await axios.get(`${BASE_URL}/api/market-data`, {
      headers: {
        'User-Agent': 'MyApp/1.0'
      }
    });
    console.log('❌ API request should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ API request correctly rejected (401 Unauthorized)');
      console.log('   Error:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  // Test 3: API request with invalid API key (should fail)
  console.log('\n3️⃣ Testing API request with invalid API key...');
  try {
    const response = await axios.get(`${BASE_URL}/api/market-data`, {
      headers: {
        'X-API-Key': 'invalid-key-12345',
        'User-Agent': 'MyApp/1.0'
      }
    });
    console.log('❌ API request should have failed but succeeded');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ API request with invalid key correctly rejected (401 Unauthorized)');
      console.log('   Error:', error.response.data.error);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }

  // Test 4: API request with valid API key (should work if user has Pro subscription)
  console.log('\n4️⃣ Testing API request with valid API key...');
  console.log('   (This will only work if you have a valid API key for a Pro user)');
  
  // You would need to replace this with an actual API key from a Pro user
  const testApiKey = process.env.TEST_API_KEY || 'your-pro-user-api-key-here';
  
  if (testApiKey === 'your-pro-user-api-key-here') {
    console.log('   ⚠️  Skipping - no test API key provided');
    console.log('   To test with a real API key, set TEST_API_KEY environment variable');
  } else {
    try {
      const response = await axios.get(`${BASE_URL}/api/market-data`, {
        headers: {
          'X-API-Key': testApiKey,
          'User-Agent': 'MyApp/1.0'
        }
      });
      console.log('✅ API request with valid key successful');
      console.log('   Response keys:', Object.keys(response.data));
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ API request rejected - user needs Pro subscription');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
  }

  console.log('\n🎯 API Protection Test Complete!');
  console.log('\nSummary:');
  console.log('- Frontend requests: Should work without API key');
  console.log('- API requests without key: Should be rejected (401)');
  console.log('- API requests with invalid key: Should be rejected (401)');
  console.log('- API requests with valid Pro key: Should work');
}

// Run the test
testApiProtection().catch(console.error);
