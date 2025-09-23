const axios = require('axios');

async function testEndpoints() {
  const baseURL = 'http://localhost:3001';
  
  try {
    console.log('🧪 Testing API endpoints...\n');
    
    // Test inflation data endpoint
    console.log('📊 Testing inflation data endpoint...');
    try {
      const inflationResponse = await axios.get(`${baseURL}/api/inflation`);
      console.log('✅ Inflation data response:', JSON.stringify(inflationResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Inflation data error:', error.response?.data || error.message);
    }
    
    console.log('\n📈 Testing advanced metrics endpoint...');
    try {
      const advancedResponse = await axios.get(`${baseURL}/api/advanced-metrics`);
      console.log('✅ Advanced metrics response:', JSON.stringify(advancedResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Advanced metrics error:', error.response?.data || error.message);
    }
    
    console.log('\n🔗 Testing Layer 1 data endpoint...');
    try {
      const layer1Response = await axios.get(`${baseURL}/api/layer1-data`);
      console.log('✅ Layer 1 data response:', JSON.stringify(layer1Response.data, null, 2));
    } catch (error) {
      console.log('❌ Layer 1 data error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

testEndpoints();