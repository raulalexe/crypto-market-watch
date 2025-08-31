#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const DataCollector = require('../server/services/dataCollector');

async function showMarketData() {
  try {
    console.log('📊 Retrieving market data for AI analysis...');
    
    const dataCollector = new DataCollector();
    
    // Get market data summary
    const marketDataSummary = await dataCollector.getMarketDataSummary();
    console.log('\n📈 MARKET DATA SUMMARY:');
    console.log('-'.repeat(40));
    console.log(JSON.stringify(marketDataSummary, null, 2));
    
    // Get advanced metrics
    const advancedMetrics = await dataCollector.getAdvancedMetricsSummary();
    console.log('\n🔍 ADVANCED METRICS:');
    console.log('-'.repeat(40));
    console.log(JSON.stringify(advancedMetrics, null, 2));
    
    // Get upcoming events
    const EventCollector = require('../server/services/eventCollector');
    const eventCollector = new EventCollector();
    const upcomingEvents = await eventCollector.getUpcomingEvents(10);
    console.log('\n📅 UPCOMING EVENTS:');
    console.log('-'.repeat(40));
    console.log(JSON.stringify(upcomingEvents, null, 2));
    
    // Get Fear & Greed Index
    const { getLatestFearGreedIndex } = require('../server/database');
    const fearGreed = await getLatestFearGreedIndex();
    console.log('\n😨 FEAR & GREED INDEX:');
    console.log('-'.repeat(40));
    console.log(JSON.stringify(fearGreed, null, 2));
    
    console.log('\n✅ Market data retrieval completed');
    
  } catch (error) {
    console.error('❌ Error retrieving market data:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  showMarketData();
}

module.exports = { showMarketData };
