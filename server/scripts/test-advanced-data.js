#!/usr/bin/env node

/**
 * Test script for advanced data collection
 * This script tests the new market sentiment, derivatives, and on-chain data collection
 */

require('dotenv').config({ path: '.env.local' });
const AdvancedDataCollector = require('../services/advancedDataCollector');

async function testAdvancedDataCollection() {
  console.log('🚀 Testing Advanced Data Collection...\n');
  
  const collector = new AdvancedDataCollector();
  
  try {
    // Test individual data collection methods
    console.log('📊 Testing Market Sentiment Collection...');
    await collector.collectMarketSentiment();
    console.log('✅ Market Sentiment Collection Complete\n');
    
    console.log('📈 Testing Derivatives Data Collection...');
    await collector.collectDerivativesData();
    console.log('✅ Derivatives Data Collection Complete\n');
    
    console.log('⛓️ Testing On-Chain Data Collection...');
    await collector.collectOnchainData();
    console.log('✅ On-Chain Data Collection Complete\n');
    
    // Test getting latest data
    console.log('📋 Testing Data Retrieval...');
    const latestData = await collector.getLatestAdvancedData();
    
    if (latestData) {
      console.log('✅ Data Retrieval Successful:');
      console.log('  - Market Sentiment:', latestData.marketSentiment ? 'Available' : 'Not Available');
      console.log('  - Derivatives:', latestData.derivatives ? 'Available' : 'Not Available');
      console.log('  - On-Chain:', latestData.onchain ? 'Available' : 'Not Available');
    } else {
      console.log('⚠️ No data retrieved');
    }
    
    console.log('\n🎉 Advanced Data Collection Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAdvancedDataCollection()
    .then(() => {
      console.log('\n✅ All tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = testAdvancedDataCollection;
