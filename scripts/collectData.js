const DataCollector = require('../server/services/dataCollector');
const AIAnalyzer = require('../server/services/aiAnalyzer');
const EventNotificationService = require('../server/services/eventNotificationService');
const { initDatabase } = require('../server/database');
require('dotenv').config();

async function runDataCollection() {
  console.log('Starting scheduled data collection...');
  const timestamp = new Date().toISOString();
  
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized');
    
    // Initialize services
    const dataCollector = new DataCollector();
    const aiAnalyzer = new AIAnalyzer();
    const eventNotificationService = new EventNotificationService();
    
    // Collect all market data
    console.log('Collecting market data...');
    const dataSuccess = await dataCollector.collectAllData();
    
    if (dataSuccess) {
      console.log('Market data collection completed successfully');
      
      // Get market data summary for AI analysis
      console.log('Preparing data for AI analysis...');
      const marketData = await dataCollector.getMarketDataSummary();
      
      if (marketData) {
        // Run AI analysis
        console.log('Running AI analysis...');
        const analysis = await aiAnalyzer.analyzeMarketDirection(marketData);
        
        if (analysis) {
          console.log(`AI Analysis completed: ${analysis.market_direction} (${analysis.confidence}% confidence)`);
          
          // Run backtest
          console.log('Running backtest analysis...');
          const backtestResults = await aiAnalyzer.backtestPredictions();
          
          if (backtestResults) {
            console.log(`Backtest completed for ${backtestResults.length} assets`);
          }
        }
      }
      
      // Check for upcoming event notifications
      console.log('Checking for upcoming event notifications...');
      const eventNotifications = await eventNotificationService.checkUpcomingEventNotifications();
      if (eventNotifications.length > 0) {
        console.log(`Created ${eventNotifications.length} event notifications`);
      }
      
      console.log(`Data collection and analysis completed at ${timestamp}`);
      return true;
    } else {
      console.error('Data collection failed');
      return false;
    }
  } catch (error) {
    console.error('Error in data collection script:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runDataCollection()
    .then(success => {
      if (success) {
        console.log('Script completed successfully');
        process.exit(0);
      } else {
        console.error('Script failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Script error:', error);
      process.exit(1);
    });
}

module.exports = runDataCollection;