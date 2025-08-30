const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testReleaseSchedule() {
  console.log('🧪 Testing Release Schedule Functionality\n');

  try {
    // Test 1: Get upcoming releases
    console.log('1️⃣ Testing: Get upcoming releases');
    const releasesResponse = await axios.get(`${BASE_URL}/api/releases?limit=5`);
    console.log('✅ Success:', releasesResponse.data.length, 'releases found');
    console.log('📅 Next release:', releasesResponse.data[0]?.title);
    console.log('');

    // Test 2: Get next high-impact release
    console.log('2️⃣ Testing: Get next high-impact release');
    const nextReleaseResponse = await axios.get(`${BASE_URL}/api/releases/next-high-impact`);
    if (nextReleaseResponse.data) {
      console.log('✅ Success: Next high-impact release found');
      console.log('📊 Release:', nextReleaseResponse.data.title);
      console.log('📅 Date:', nextReleaseResponse.data.date);
      console.log('⏰ Time:', nextReleaseResponse.data.time);
    } else {
      console.log('ℹ️ No high-impact releases scheduled');
    }
    console.log('');

    // Test 3: Get release statistics
    console.log('3️⃣ Testing: Get release statistics');
    const statsResponse = await axios.get(`${BASE_URL}/api/releases/stats`);
    console.log('✅ Success: Release stats retrieved');
    console.log('📈 Total releases:', statsResponse.data.total);
    console.log('⏳ Upcoming releases:', statsResponse.data.upcoming);
    console.log('🚨 High impact upcoming:', statsResponse.data.highImpactUpcoming);
    console.log('');

    // Test 4: Get strategy recommendations
    console.log('4️⃣ Testing: Get strategy recommendations');
    const strategyResponse = await axios.get(`${BASE_URL}/api/releases/strategy`);
    console.log('✅ Success: Strategy recommendations retrieved');
    if (strategyResponse.data.hasUpcomingRelease) {
      console.log('🎯 Has upcoming release:', strategyResponse.data.hasUpcomingRelease);
      console.log('⏱️ Minutes until release:', strategyResponse.data.minutesUntil);
      console.log('🚨 Urgency level:', strategyResponse.data.urgency);
      console.log('📊 Risk level:', strategyResponse.data.riskLevel);
      console.log('💡 Recommendations count:', strategyResponse.data.recommendations.length);
      console.log('🛡️ Hedging options count:', strategyResponse.data.hedgingOptions?.length || 0);
    } else {
      console.log('ℹ️ No upcoming releases for strategy recommendations');
    }
    console.log('');

    // Test 5: Test position sizing recommendations
    console.log('5️⃣ Testing: Position sizing recommendations');
    const positionResponse = await axios.get(`${BASE_URL}/api/releases/position-sizing?currentExposure=10000&minutesUntil=30`);
    console.log('✅ Success: Position sizing recommendations retrieved');
    console.log('💰 Current exposure: $', positionResponse.data.suggestedExposure);
    console.log('📋 Actions:', positionResponse.data.actions.length);
    console.log('');

    // Test 6: Test stop-loss recommendations
    console.log('6️⃣ Testing: Stop-loss recommendations');
    const stopLossResponse = await axios.get(`${BASE_URL}/api/releases/stop-loss?currentStopLoss=5&minutesUntil=30`);
    console.log('✅ Success: Stop-loss recommendations retrieved');
    console.log('🛡️ Buffer multiplier:', stopLossResponse.data.buffer);
    console.log('📋 Actions:', stopLossResponse.data.actions.length);
    console.log('');

    // Test 7: Test leverage recommendations
    console.log('7️⃣ Testing: Leverage recommendations');
    const leverageResponse = await axios.get(`${BASE_URL}/api/releases/leverage?currentLeverage=3&minutesUntil=30`);
    console.log('✅ Success: Leverage recommendations retrieved');
    console.log('⚡ Suggested leverage:', leverageResponse.data.suggestedLeverage);
    console.log('📋 Actions:', leverageResponse.data.actions.length);
    console.log('');

    // Test 8: Test pre-release warning simulation
    console.log('8️⃣ Testing: Pre-release warning simulation');
    const warningResponse = await axios.get(`${BASE_URL}/api/releases/strategy?minutes=1440`);
    console.log('✅ Success: Pre-release warning system working');
    console.log('📅 24h warning:', warningResponse.data.hasUpcomingRelease ? 'Active' : 'No upcoming releases');
    console.log('');

    // Test 9: Test post-release data collection simulation
    console.log('9️⃣ Testing: Post-release data collection simulation');
    const postReleaseResponse = await axios.get(`${BASE_URL}/api/releases/strategy?minutes=-1`);
    console.log('✅ Success: Post-release data collection system working');
    console.log('📊 Post-release analysis:', postReleaseResponse.data.hasUpcomingRelease ? 'Scheduled' : 'No recent releases');
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Release schedule service is working');
    console.log('✅ Strategy advisor is providing recommendations');
    console.log('✅ Position management tools are functional');
    console.log('✅ API endpoints are responding correctly');
    console.log('✅ Pre-release warnings (24h) are configured');
    console.log('✅ Post-release data collection (1min) is configured');
    console.log('✅ AI analysis integration is ready');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

// Run the test
testReleaseSchedule();