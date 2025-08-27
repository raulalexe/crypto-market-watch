#!/usr/bin/env node

/**
 * Basic Test Script for Crypto Market Watch
 * 
 * This script helps automate basic testing tasks for the application.
 * Run with: node test-script.js
 */

const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuration
const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:3001',
  databasePath: path.join(__dirname, 'data', 'market_data.db'),
  testUser: {
    email: 'admin@example.com',
    password: 'admin123'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Test functions
async function testBackendHealth() {
  try {
    const response = await axios.get(`${config.backendUrl}/api/health`);
    const passed = response.status === 200 && (response.data.status === 'ok' || response.data.status === 'healthy');
    logTest('Backend Health Check', passed, `Status: ${response.status}, Health: ${response.data.status}`);
    return passed;
  } catch (error) {
    logTest('Backend Health Check', false, `Error: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnection() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        logTest('Database Connection', false, `Error: ${err.message}`);
        resolve(false);
        return;
      }
      
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        db.close();
        if (err) {
          logTest('Database Connection', false, `Error: ${err.message}`);
          resolve(false);
        } else {
          const passed = row !== undefined;
          logTest('Database Connection', passed, 'Users table exists');
          resolve(passed);
        }
      });
    });
  });
}

async function testDashboardEndpoint() {
  try {
    const response = await axios.get(`${config.backendUrl}/api/dashboard`);
    const passed = response.status === 200 && response.data;
    logTest('Dashboard Endpoint', passed, `Status: ${response.status}`);
    return passed;
  } catch (error) {
    logTest('Dashboard Endpoint', false, `Error: ${error.message}`);
    return false;
  }
}

async function testSubscriptionEndpoint() {
  try {
    // This will fail without authentication, but we can test the endpoint exists
    const response = await axios.get(`${config.backendUrl}/api/subscription`);
    logTest('Subscription Endpoint', false, 'Should require authentication');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logTest('Subscription Endpoint', true, 'Properly requires authentication');
      return true;
    } else {
      logTest('Subscription Endpoint', false, `Unexpected error: ${error.message}`);
      return false;
    }
  }
}

async function testHistoricalDataEndpoint() {
  try {
    const response = await axios.get(`${config.backendUrl}/api/history/CRYPTO_PRICE`);
    const passed = response.status === 200 && Array.isArray(response.data);
    logTest('Historical Data Endpoint', passed, `Status: ${response.status}, Data count: ${response.data.length}`);
    return passed;
  } catch (error) {
    logTest('Historical Data Endpoint', false, `Error: ${error.message}`);
    return false;
  }
}

async function testPredictionsEndpoint() {
  try {
    const response = await axios.get(`${config.backendUrl}/api/predictions`);
    const passed = response.status === 200 && response.data;
    logTest('Predictions Endpoint', passed, `Status: ${response.status}`);
    return passed;
  } catch (error) {
    logTest('Predictions Endpoint', false, `Error: ${error.message}`);
    return false;
  }
}

async function testExportEndpoints() {
  const endpoints = [
    { path: '/api/exports/history', method: 'GET' },
    { path: '/api/exports/create', method: 'POST', data: { type: 'crypto_prices', dateRange: '7d', format: 'json' } }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const requestConfig = {
        method: endpoint.method,
        url: `${config.backendUrl}${endpoint.path}`,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (endpoint.data) {
        requestConfig.data = endpoint.data;
      }
      
      const response = await axios(requestConfig);
      logTest(`Export Endpoint ${endpoint.path}`, false, 'Should require authentication');
      allPassed = false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logTest(`Export Endpoint ${endpoint.path}`, true, 'Properly requires authentication');
      } else {
        logTest(`Export Endpoint ${endpoint.path}`, false, `Unexpected error: ${error.message}`);
        allPassed = false;
      }
    }
  }
  
  return allPassed;
}

async function testDatabaseTables() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        logTest('Database Tables', false, `Error: ${err.message}`);
        resolve(false);
        return;
      }
      
      const requiredTables = [
        'users',
        'crypto_prices',
        'market_data',
        'trending_narratives',
        'layer1_data',
        'ai_analysis',
        'fear_greed_index',
        'stablecoin_metrics',
        'exchange_flows'
      ];
      
      let allTablesExist = true;
      let checkedTables = 0;
      
      requiredTables.forEach(tableName => {
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, row) => {
          checkedTables++;
          const exists = row !== undefined;
          if (!exists) {
            allTablesExist = false;
          }
          
          if (checkedTables === requiredTables.length) {
            db.close();
            logTest('Database Tables', allTablesExist, `Checked ${requiredTables.length} tables`);
            resolve(allTablesExist);
          }
        });
      });
    });
  });
}

async function testDataCollection() {
  try {
    const response = await axios.post(`${config.backendUrl}/api/collect-data`);
    const passed = response.status === 200;
    logTest('Data Collection Trigger', passed, `Status: ${response.status}`);
    return passed;
  } catch (error) {
    logTest('Data Collection Trigger', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting Crypto Market Watch Tests\n', 'blue');
  
  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Database Tables', fn: testDatabaseTables },
    { name: 'Dashboard Endpoint', fn: testDashboardEndpoint },
    { name: 'Subscription Endpoint', fn: testSubscriptionEndpoint },
    { name: 'Historical Data Endpoint', fn: testHistoricalDataEndpoint },
    { name: 'Predictions Endpoint', fn: testPredictionsEndpoint },
    { name: 'Export Endpoints', fn: testExportEndpoints },
    { name: 'Data Collection', fn: testDataCollection }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      if (passed) passedTests++;
    } catch (error) {
      logTest(test.name, false, `Unexpected error: ${error.message}`);
    }
  }
  
  log('\n📊 Test Results Summary', 'blue');
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'blue');
  
  if (passedTests === totalTests) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the details above.', 'yellow');
  }
  
  log('\n📝 Next Steps:', 'blue');
  log('1. Review failed tests and fix issues', 'yellow');
  log('2. Run manual tests for UI/UX functionality', 'yellow');
  log('3. Test with different user roles (admin vs regular)', 'yellow');
  log('4. Test export functionality with real data', 'yellow');
  log('5. Test responsive design on different screen sizes', 'yellow');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    log(`\n💥 Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testBackendHealth,
  testDatabaseConnection,
  testDashboardEndpoint,
  testSubscriptionEndpoint,
  testHistoricalDataEndpoint,
  testPredictionsEndpoint,
  testExportEndpoints,
  testDatabaseTables,
  testDataCollection
};
