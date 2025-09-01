#!/usr/bin/env node

/**
 * Network connectivity test script
 * Tests connectivity to various APIs used by the application
 */

const axios = require('axios');

const testEndpoints = [
  {
    name: 'BLS API (CPI Data)',
    url: 'https://api.bls.gov/publicAPI/v2/timeseries/data/CUSR0000SA0',
    method: 'POST',
    timeout: 30000
  },
  {
    name: 'BEA API (PCE Data)',
    url: 'https://apps.bea.gov/api/data',
    method: 'GET',
    timeout: 30000
  },
  {
    name: 'Alternative.me (Fear & Greed)',
    url: 'https://api.alternative.me/fng/',
    method: 'GET',
    timeout: 10000
  },
  {
    name: 'CryptoCompare (Sentiment)',
    url: 'https://min-api.cryptocompare.com/data/social/sentiment/latest',
    method: 'GET',
    timeout: 10000
  },
  {
    name: 'Binance API (Futures)',
    url: 'https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT',
    method: 'GET',
    timeout: 10000
  },
  {
    name: 'Blockchain.info (Bitcoin)',
    url: 'https://blockchain.info/stats?format=json',
    method: 'GET',
    timeout: 15000
  },
  {
    name: 'Etherscan (Ethereum)',
    url: 'https://api.etherscan.io/api?module=stats&action=ethsupply',
    method: 'GET',
    timeout: 10000
  }
];

async function testConnectivity() {
  console.log('🌐 Testing API Connectivity...\n');
  
  const results = [];
  
  for (const endpoint of testEndpoints) {
    console.log(`Testing ${endpoint.name}...`);
    
    try {
      const startTime = Date.now();
      
      let response;
      if (endpoint.method === 'POST') {
        response = await axios.post(endpoint.url, {}, {
          timeout: endpoint.timeout,
          headers: {
            'User-Agent': 'CryptoMarketWatch/1.0',
            'Accept': 'application/json'
          }
        });
      } else {
        response = await axios.get(endpoint.url, {
          timeout: endpoint.timeout,
          headers: {
            'User-Agent': 'CryptoMarketWatch/1.0',
            'Accept': 'application/json'
          }
        });
      }
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      results.push({
        name: endpoint.name,
        status: 'SUCCESS',
        responseTime: responseTime,
        statusCode: response.status,
        message: `Connected in ${responseTime}ms`
      });
      
      console.log(`  ✅ ${endpoint.name}: ${response.status} (${responseTime}ms)`);
      
    } catch (error) {
      let errorMessage = 'Unknown error';
      let statusCode = 'N/A';
      
      if (error.response) {
        statusCode = error.response.status;
        errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
      } else if (error.code) {
        errorMessage = `${error.code}: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
      
      results.push({
        name: endpoint.name,
        status: 'FAILED',
        responseTime: null,
        statusCode: statusCode,
        message: errorMessage
      });
      
      console.log(`  ❌ ${endpoint.name}: ${errorMessage}`);
    }
  }
  
  // Summary
  console.log('\n📊 Connectivity Test Summary:');
  console.log('=' .repeat(60));
  
  const successful = results.filter(r => r.status === 'SUCCESS');
  const failed = results.filter(r => r.status === 'FAILED');
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Working APIs:');
    successful.forEach(result => {
      console.log(`  - ${result.name}: ${result.message}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed APIs:');
    failed.forEach(result => {
      console.log(`  - ${result.name}: ${result.message}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (failed.some(f => f.name.includes('BLS') || f.name.includes('BEA'))) {
    console.log('  - Government APIs (BLS/BEA) may be experiencing issues');
    console.log('  - Consider using fallback data or retry mechanisms');
  }
  
  if (failed.some(f => f.name.includes('Telegram'))) {
    console.log('  - Telegram API rate limiting detected');
    console.log('  - Implement cooldown periods between webhook setups');
  }
  
  if (failed.some(f => f.message.includes('ETIMEDOUT'))) {
    console.log('  - Network timeout issues detected');
    console.log('  - Consider increasing timeout values or using retry logic');
  }
  
  if (failed.some(f => f.message.includes('ENOTFOUND'))) {
    console.log('  - DNS resolution issues detected');
    console.log('  - Check internet connectivity and DNS settings');
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  testConnectivity()
    .then((results) => {
      const successCount = results.filter(r => r.status === 'SUCCESS').length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        console.log('\n🎉 All connectivity tests passed!');
        process.exit(0);
      } else {
        console.log(`\n⚠️ ${totalCount - successCount} connectivity tests failed`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Connectivity test failed:', error.message);
      process.exit(1);
    });
}

module.exports = testConnectivity;
