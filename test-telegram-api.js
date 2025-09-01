require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testTelegramAPI() {
  console.log('🧪 Testing Telegram API Endpoints...\n');
  
  const baseURL = 'http://localhost:3001';
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.log('❌ TELEGRAM_BOT_TOKEN not found in .env.local');
    return;
  }

  console.log('✅ Bot token found:', token.substring(0, 15) + '...');
  console.log('🌐 Testing against:', baseURL);
  console.log('');

  // Test 1: Direct Telegram API
  console.log('1. Testing Direct Telegram API...');
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (response.data.ok) {
      console.log('   ✅ Direct API working');
      console.log('   Bot Name:', response.data.result.first_name);
      console.log('   Bot Username:', response.data.result.username);
    } else {
      console.log('   ❌ Direct API error:', response.data);
    }
  } catch (error) {
    console.log('   ❌ Direct API failed:', error.message);
  }

  console.log('');

  // Test 2: Check if server is running
  console.log('2. Testing Server Connection...');
  try {
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log('   ✅ Server is running');
    console.log('   Health status:', healthResponse.data.status);
  } catch (error) {
    console.log('   ❌ Server not running or not accessible');
    console.log('   Error:', error.message);
    console.log('');
    console.log('💡 Solution: Start your server with: npm start');
    return;
  }

  console.log('');

  // Test 3: Test Telegram status endpoint (without auth)
  console.log('3. Testing Telegram Status Endpoint (no auth)...');
  try {
    const statusResponse = await axios.get(`${baseURL}/api/telegram/status`);
    console.log('   ✅ Status endpoint working (no auth required)');
    console.log('   Response:', statusResponse.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ⚠️ Status endpoint requires authentication (expected)');
    } else {
      console.log('   ❌ Status endpoint error:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
  }

  console.log('');

  // Test 4: Test subscribers endpoint (without auth)
  console.log('4. Testing Subscribers Endpoint (no auth)...');
  try {
    const subscribersResponse = await axios.get(`${baseURL}/api/telegram/subscribers`);
    console.log('   ✅ Subscribers endpoint working (no auth required)');
    console.log('   Response:', subscribersResponse.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   ⚠️ Subscribers endpoint requires authentication (expected)');
    } else {
      console.log('   ❌ Subscribers endpoint error:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
  }

  console.log('');
  console.log('🎉 API testing completed!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Make sure your server is running (npm start)');
  console.log('2. Check the admin dashboard again');
  console.log('3. If still inactive, check browser console for errors');
}

// Run the test
testTelegramAPI().catch(console.error);
