const axios = require('axios');

async function testRequest() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@cryptowatch.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('🔍 Token received:', token.substring(0, 30) + '...');
    
    // Test dashboard with detailed logging
    console.log('\n🔍 Making dashboard request...');
    const dashboardResponse = await axios.get('http://localhost:3001/api/dashboard', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Test-Script'
      }
    });
    
    console.log('🔍 Response received:');
    console.log('  Status:', dashboardResponse.status);
    console.log('  Headers:', dashboardResponse.headers);
    console.log('  Data keys:', Object.keys(dashboardResponse.data));
    console.log('  Has subscriptionStatus:', !!dashboardResponse.data.subscriptionStatus);
    console.log('  subscriptionStatus:', dashboardResponse.data.subscriptionStatus);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testRequest();
