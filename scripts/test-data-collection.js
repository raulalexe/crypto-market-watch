#!/usr/bin/env node

/**
 * Test script for data collection
 * Tests the data collector service directly
 */

require('dotenv').config({ path: '.env.local' });

async function testDataCollection() {
  console.log('🧪 Testing Data Collection Service...\n');
  
  try {
    // Test database connection first
    console.log('🔍 Testing database connection...');
    const { Pool } = require('pg');
    const db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    const client = await db.connect();
    console.log('✅ Database connection successful');
    client.release();
    await db.end();
    
    // Test data collector service
    console.log('\n🔍 Testing data collector service...');
    const DataCollector = require('../server/services/dataCollector');
    const dataCollector = new DataCollector();
    
    console.log('✅ Data collector service initialized');
    
    // Test individual collection methods
    console.log('\n🔍 Testing individual collection methods...');
    
    try {
      console.log('📊 Testing crypto prices collection...');
      await dataCollector.collectCryptoPrices();
      console.log('  ✅ Crypto prices collected');
    } catch (error) {
      console.log(`  ❌ Crypto prices collection failed: ${error.message}`);
    }
    
    try {
      console.log('📊 Testing fear & greed index collection...');
      await dataCollector.collectFearGreedIndex();
      console.log('  ✅ Fear & greed index collected');
    } catch (error) {
      console.log(`  ❌ Fear & greed index collection failed: ${error.message}`);
    }
    
    try {
      console.log('📊 Testing trending narratives collection...');
      await dataCollector.collectTrendingNarratives();
      console.log('  ✅ Trending narratives collected');
    } catch (error) {
      console.log(`  ❌ Trending narratives collection failed: ${error.message}`);
    }
    
    try {
      console.log('📊 Testing stablecoin metrics collection...');
      await dataCollector.collectStablecoinMetricsOptimized();
      console.log('  ✅ Stablecoin metrics collected');
    } catch (error) {
      console.log(`  ❌ Stablecoin metrics collection failed: ${error.message}`);
    }
    
    try {
      console.log('📊 Testing Bitcoin dominance collection...');
      await dataCollector.collectBitcoinDominanceOptimized();
      console.log('  ✅ Bitcoin dominance collected');
    } catch (error) {
      console.log(`  ❌ Bitcoin dominance collection failed: ${error.message}`);
    }
    
    try {
      console.log('📊 Testing M2 money supply collection...');
      await dataCollector.collectM2MoneySupply();
      console.log('  ✅ M2 money supply collected');
    } catch (error) {
      console.log(`  ❌ M2 money supply collection failed: ${error.message}`);
    }
    
    try {
      console.log('📊 Testing Layer 1 data collection...');
      await dataCollector.collectLayer1DataOptimized();
      console.log('  ✅ Layer 1 data collected');
    } catch (error) {
      console.log(`  ❌ Layer 1 data collection failed: ${error.message}`);
    }
    
    // Test advanced data collection
    try {
      console.log('\n📊 Testing advanced data collection...');
      await dataCollector.advancedDataCollector.collectAllAdvancedData();
      console.log('  ✅ Advanced data collected');
    } catch (error) {
      console.log(`  ❌ Advanced data collection failed: ${error.message}`);
    }
    
    // Test inflation data collection
    try {
      console.log('\n📊 Testing inflation data collection...');
      const inflationService = require('../server/services/inflationDataService');
      const inflationData = await inflationService.fetchLatestData();
      if (inflationData) {
        console.log('  ✅ Inflation data collected');
        console.log(`    CPI: ${inflationData.cpi ? 'Available' : 'Not available'}`);
        console.log(`    PCE: ${inflationData.pce ? 'Available' : 'Not available'}`);
      } else {
        console.log('  ⚠️ Inflation data not available (APIs may be down)');
      }
    } catch (error) {
      console.log(`  ❌ Inflation data collection failed: ${error.message}`);
    }
    
    console.log('\n✅ Data collection test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDataCollection().catch(console.error);
}

module.exports = testDataCollection;
