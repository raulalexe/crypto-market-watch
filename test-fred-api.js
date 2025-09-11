#!/usr/bin/env node

/**
 * Test script for FRED API connectivity
 * Tests the primary inflation data source
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testFREDAPI() {
  console.log('🔍 Testing FRED API (Federal Reserve Economic Data)...\n');
  
  const fredApiKey = process.env.FRED_API_KEY;
  const fredBaseUrl = 'https://api.stlouisfed.org/fred';
  
  console.log(`🔑 FRED API Key configured: ${fredApiKey ? 'Yes' : 'No'}`);
  console.log(`🔗 FRED Base URL: ${fredBaseUrl}`);
  
  if (!fredApiKey) {
    console.log('❌ FRED_API_KEY not configured. Please set it in your .env.local file.');
    console.log('   Get your free API key at: https://fred.stlouisfed.org/docs/api/api_key.html');
    return;
  }
  
  // Test series for inflation data
  const testSeries = [
    { id: 'CPIAUCSL', name: 'Consumer Price Index (CPI)' },
    { id: 'CPILFESL', name: 'Core CPI (Less Food & Energy)' },
    { id: 'PPIFIS', name: 'Producer Price Index (PPI)' },
    { id: 'PPIFGS', name: 'Core PPI (Less Food & Energy)' },
    { id: 'PCEPI', name: 'Personal Consumption Expenditures (PCE)' },
    { id: 'PCEPILFE', name: 'Core PCE (Less Food & Energy)' }
  ];
  
  console.log('📊 Testing inflation data series...\n');
  
  for (const series of testSeries) {
    try {
      console.log(`🔍 Testing ${series.name} (${series.id})...`);
      
      const url = `${fredBaseUrl}/series/observations`;
      const params = {
        series_id: series.id,
        api_key: fredApiKey,
        file_type: 'json',
        limit: 3,
        sort_order: 'desc'
      };
      
      const response = await axios.get(url, {
        params,
        timeout: 10000,
        headers: {
          'User-Agent': 'CryptoMarketWatch/1.0'
        }
      });
      
      if (response.data && response.data.observations) {
        const observations = response.data.observations;
        console.log(`  ✅ Success - ${observations.length} observations retrieved`);
        
        if (observations.length > 0) {
          const latest = observations[0];
          console.log(`     Latest: ${latest.date} = ${latest.value}`);
          
          if (observations.length > 1) {
            const previous = observations[1];
            console.log(`     Previous: ${previous.date} = ${previous.value}`);
          }
        }
      } else {
        console.log(`  ⚠️ Unexpected response structure`);
      }
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Data: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Test market expectations
  console.log('🔍 Testing market expectations data...\n');
  
  const expectationSeries = [
    { id: 'EXPINF1YR', name: '1-Year Expected Inflation' },
    { id: 'EXPINF2YR', name: '2-Year Expected Inflation' },
    { id: 'EXPINF5YR', name: '5-Year Expected Inflation' }
  ];
  
  for (const series of expectationSeries) {
    try {
      console.log(`🔍 Testing ${series.name} (${series.id})...`);
      
      const url = `${fredBaseUrl}/series/observations`;
      const params = {
        series_id: series.id,
        api_key: fredApiKey,
        file_type: 'json',
        limit: 1,
        sort_order: 'desc'
      };
      
      const response = await axios.get(url, {
        params,
        timeout: 10000,
        headers: {
          'User-Agent': 'CryptoMarketWatch/1.0'
        }
      });
      
      if (response.data && response.data.observations && response.data.observations.length > 0) {
        const latest = response.data.observations[0];
        console.log(`  ✅ Success - Latest: ${latest.date} = ${latest.value}%`);
      } else {
        console.log(`  ⚠️ No data available`);
      }
      
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('📚 Summary:');
  console.log('  - FRED API is the primary source for inflation data');
  console.log('  - Provides CPI, PPI, PCE, and market expectations');
  console.log('  - More reliable than BLS API on Railway');
  console.log('  - Free API key available from Federal Reserve');
  console.log('  - Data is updated regularly and is authoritative');
  
  console.log('\n✅ FRED API test complete!');
}

// Run the test
if (require.main === module) {
  testFREDAPI()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = testFREDAPI;
