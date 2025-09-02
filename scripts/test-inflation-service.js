#!/usr/bin/env node

/**
 * Test script for inflation data service
 * Tests the service without fallback data
 */

require('dotenv').config({ path: '.env.local' });

async function testInflationService() {
  console.log('🧪 Testing Inflation Data Service (No Fallback Data)...\n');
  
  try {
    const service = require('../server/services/inflationDataService');
    
    console.log('📋 Environment Variables Check:');
    console.log(`  BLS_API_KEY: ${process.env.BLS_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`  BEA_API_KEY: ${process.env.BEA_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}\n`);
    
    console.log('🔍 Testing CPI Data Collection:');
    try {
      const cpiData = await service.fetchCPIData();
      if (cpiData) {
        console.log('  ✅ CPI data collected successfully');
        console.log(`     CPI: ${cpiData.cpi}`);
        console.log(`     Core CPI: ${cpiData.coreCPI}`);
        console.log(`     Source: ${cpiData.source}`);
      } else {
        console.log('  ⚠️ CPI data collection returned null (API unavailable)');
      }
    } catch (error) {
      console.log('  ❌ CPI data collection failed:', error.message);
    }
    
    console.log('\n🔍 Testing PCE Data Collection:');
    try {
      const pceData = await service.fetchPCEData();
      if (pceData) {
        console.log('  ✅ PCE data collected successfully');
        console.log(`     PCE: ${pceData.pce}`);
        console.log(`     Core PCE: ${pceData.corePCE}`);
        console.log(`     Source: ${pceData.source}`);
      } else {
        console.log('  ⚠️ PCE data collection returned null (API unavailable)');
      }
    } catch (error) {
      console.log('  ❌ PCE data collection failed:', error.message);
    }
    
    console.log('\n🔍 Testing Combined Data Collection:');
    try {
      const combinedData = await service.fetchLatestData();
      if (combinedData) {
        console.log('  ✅ Combined data collected successfully');
        console.log(`     Has CPI: ${!!combinedData.cpi}`);
        console.log(`     Has PCE: ${!!combinedData.pce}`);
      } else {
        console.log('  ⚠️ Combined data collection returned null (no data available)');
      }
    } catch (error) {
      console.log('  ❌ Combined data collection failed:', error.message);
    }
    
    console.log('\n📚 Summary:');
    console.log('  - No fallback data is generated');
    console.log('  - Service returns null when APIs are unavailable');
    console.log('  - This ensures data integrity (no fake data)');
    console.log('  - Applications should handle null responses gracefully');
    
    console.log('\n✅ Inflation service test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testInflationService().catch(console.error);
}

module.exports = testInflationService;
