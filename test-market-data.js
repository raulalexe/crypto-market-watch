const DataCollector = require('./server/services/dataCollector');
const AIAnalyzer = require('./server/services/aiAnalyzer');

async function testMarketData() {
  try {
    console.log('🔍 Testing market data for AI analysis...');
    
    const dataCollector = new DataCollector();
    const aiAnalyzer = new AIAnalyzer();
    
    // Get market data summary
    console.log('📊 Getting market data summary...');
    const marketData = await dataCollector.getMarketDataSummary();
    console.log('Market Data Summary:', JSON.stringify(marketData, null, 2));
    
    // Get advanced metrics
    console.log('\n📈 Getting advanced metrics...');
    const advancedMetrics = await dataCollector.getAdvancedMetricsSummary();
    console.log('Advanced Metrics:', JSON.stringify(advancedMetrics, null, 2));
    
    // Get upcoming events for AI analysis
    console.log('\n📅 Getting upcoming events...');
    const EventCollector = require('./server/services/eventCollector');
    const eventCollector = new EventCollector();
    const upcomingEvents = await eventCollector.getUpcomingEvents(10);
    console.log('Upcoming Events:', JSON.stringify(upcomingEvents, null, 2));

    // Get Fear & Greed Index
    console.log('\n😨 Getting Fear & Greed Index...');
    const { getLatestFearGreedIndex } = require('./server/database');
    const fearGreed = await getLatestFearGreedIndex();
    console.log('Fear & Greed:', JSON.stringify(fearGreed, null, 2));

    // Add regulatory news (only if we have real data)
    const regulatoryNews = null; // We'll get this from real sources when available

    // Combine data for AI analysis
    console.log('\n🔗 Combining data for AI analysis...');
    const comprehensiveData = {
      ...marketData,
      bitcoin_dominance: advancedMetrics?.bitcoinDominance?.value,
      stablecoin_metrics: advancedMetrics?.stablecoinMetrics,
      exchange_flows: advancedMetrics?.exchangeFlows,
      market_sentiment: advancedMetrics?.marketSentiment,
      derivatives: advancedMetrics?.derivatives,
      onchain: advancedMetrics?.onchain,
      upcoming_events: upcomingEvents,
      fear_greed: fearGreed,
      regulatory_news: regulatoryNews
    };
    
    console.log('Comprehensive Data for AI:', JSON.stringify(comprehensiveData, null, 2));
    
    // Test AI analysis with this data
    console.log('\n🤖 Testing AI analysis...');
    const analysis = await aiAnalyzer.analyzeMarketDirection(comprehensiveData);
    console.log('AI Analysis Result:', JSON.stringify(analysis, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing market data:', error.message);
  }
}

testMarketData();
