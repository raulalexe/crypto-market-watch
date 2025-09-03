#!/usr/bin/env node

/**
 * Test script for Binance API integration
 * Tests the exchange flow calculation using real Binance data
 */

require('dotenv').config({ path: '.env.local' });

async function testBinanceAPI() {
  console.log('🧪 Testing Binance API Integration...\n');
  
  try {
    const DataCollector = require('./server/services/dataCollector');
    const dataCollector = new DataCollector();
    
    console.log('🔍 Testing Binance ticker data collection...');
    const tickerData = await dataCollector.getBinanceTickerData(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'SUIUSDT']);
    
    if (tickerData) {
      console.log('✅ Binance ticker data collected successfully!');
      console.log('\n📊 Raw Ticker Data:');
      tickerData.forEach(ticker => {
        console.log(`  ${ticker.symbol}:`);
        console.log(`    Price: $${parseFloat(ticker.lastPrice).toFixed(2)}`);
        console.log(`    24h Change: ${parseFloat(ticker.priceChangePercent).toFixed(2)}%`);
        console.log(`    24h Volume: $${(parseFloat(ticker.quoteVolume) / 1e6).toFixed(2)}M`);
        console.log(`    High: $${parseFloat(ticker.highPrice).toFixed(2)}`);
        console.log(`    Low: $${parseFloat(ticker.lowPrice).toFixed(2)}`);
      });
      
      console.log('\n🔄 Testing exchange flow calculation...');
      const flows = dataCollector.calculateExchangeFlowsFromBinance(tickerData);
      
      if (flows) {
        console.log('✅ Exchange flows calculated successfully!');
        console.log('\n💰 Calculated Exchange Flows:');
        Object.entries(flows).forEach(([asset, flowData]) => {
          console.log(`  ${asset.toUpperCase()}:`);
          console.log(`    Inflow: $${(flowData.inflow / 1e6).toFixed(2)}M`);
          console.log(`    Outflow: $${(flowData.outflow / 1e6).toFixed(2)}M`);
          console.log(`    Net Flow: $${(flowData.netFlow / 1e6).toFixed(2)}M`);
          console.log(`    Volume: $${(flowData.volume / 1e6).toFixed(2)}M`);
          console.log(`    Price Change: ${flowData.priceChange.toFixed(2)}%`);
        });
      } else {
        console.log('❌ Exchange flow calculation failed');
      }
    } else {
      console.log('❌ Failed to collect Binance ticker data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testBinanceAPI().catch(console.error);
}

module.exports = testBinanceAPI;
