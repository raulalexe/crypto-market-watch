#!/usr/bin/env node

/**
 * Test script for M2 Money Supply data collection
 * This script tests the M2 data collection functionality
 */

require('dotenv').config({ path: '.env.local' });

async function testM2DataCollection() {
  console.log('🧪 Testing M2 Money Supply Data Collection...\n');
  
  try {
    // Test data collector service
    console.log('🔍 Testing M2 data collection...');
    const DataCollector = require('./server/services/dataCollector');
    const dataCollector = new DataCollector();
    
    console.log('✅ Data collector service initialized');
    
    // Test M2 money supply collection
    try {
      console.log('📊 Testing M2 money supply collection...');
      const m2Data = await dataCollector.collectM2MoneySupply();
      
      if (m2Data) {
        console.log('  ✅ M2 money supply collected successfully');
        console.log(`    Current Value: $${(m2Data.value / 1e12).toFixed(2)}T`);
        console.log(`    Month-over-Month Change: ${m2Data.monthOverMonthChange?.toFixed(2)}%`);
        console.log(`    Year-over-Year Change: ${m2Data.yearOverYearChange?.toFixed(2)}%`);
        console.log(`    Previous Value: $${(m2Data.previousValue / 1e12).toFixed(2)}T`);
      } else {
        console.log('  ⚠️ M2 data collection returned null (check FRED API key)');
      }
    } catch (error) {
      console.log(`  ❌ M2 money supply collection failed: ${error.message}`);
      if (error.message.includes('FRED API key not configured')) {
        console.log('    💡 Set FRED_API_KEY in your .env.local file');
        console.log('    🔗 Get free API key from: https://fred.stlouisfed.org/docs/api/api_key.html');
      }
    }
    
    // Test getting M2 data from database
    try {
      console.log('\n📊 Testing M2 data retrieval from database...');
      const { getLatestMarketData } = require('./server/database');
      const m2DataFromDB = await getLatestMarketData('M2_MONEY_SUPPLY', 'M2SL');
      
      if (m2DataFromDB) {
        console.log('  ✅ M2 data retrieved from database');
        console.log(`    Value: $${(m2DataFromDB.value / 1e12).toFixed(2)}T`);
        console.log(`    Timestamp: ${m2DataFromDB.timestamp}`);
        console.log(`    Source: ${m2DataFromDB.source}`);
        if (m2DataFromDB.metadata) {
          console.log(`    Month-over-Month: ${m2DataFromDB.metadata.month_over_month_change?.toFixed(2)}%`);
          console.log(`    Year-over-Year: ${m2DataFromDB.metadata.year_over_year_change?.toFixed(2)}%`);
        }
      } else {
        console.log('  ⚠️ No M2 data found in database');
      }
    } catch (error) {
      console.log(`  ❌ Database retrieval failed: ${error.message}`);
    }
    
    console.log('\n✅ M2 Money Supply test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testM2DataCollection().catch(console.error);
}

module.exports = testM2DataCollection;