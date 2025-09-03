#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Add the project root to the require path
const projectRoot = path.join(__dirname, '..');
require('module')._preloadModules = function(requests) {
  // Custom module loading logic
};

// Import the comprehensive data collection script
const runDataCollection = require('./collectData');

async function runComprehensiveDataCollection() {
  console.log('🚀 Starting comprehensive scheduled data collection...');
  console.log('📅 Time:', new Date().toISOString());
  
  try {
    // Run the comprehensive data collection (includes all data types)
    const success = await runDataCollection(false); // false = full data collection, not analysis-only
    
    if (success) {
      console.log('✅ Comprehensive data collection completed successfully');
      
      // Log the completion for monitoring
      const logEntry = {
        timestamp: new Date().toISOString(),
        status: 'success',
        message: 'All data types collected: inflation, crypto prices, advanced metrics, trending narratives, upcoming events, and backtest results'
      };
      
      console.log('📊 Collection summary:', JSON.stringify(logEntry, null, 2));
      
    } else {
      console.log('⚠️ Data collection failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error during comprehensive data collection:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  console.log('🎉 Comprehensive data collection script completed');
  process.exit(0);
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n⚠️ Received SIGINT, terminating gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Received SIGTERM, terminating gracefully...');
  process.exit(0);
});

// Run the comprehensive collection
runComprehensiveDataCollection();
