const DataCollector = require('../server/services/dataCollector');
const AIAnalyzer = require('../server/services/aiAnalyzer');
const EventNotificationService = require('../server/services/eventNotificationService');
const { initDatabase } = require('../server/database');
require('dotenv').config();

async function runDataCollection(analysisOnly = false) {
  const mode = analysisOnly ? 'AI Analysis Only' : 'Full Data Collection';
  console.log(`Starting ${mode}...`);
  const timestamp = new Date().toISOString();
  
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized');
    
    // Initialize services
    const dataCollector = new DataCollector();
    const aiAnalyzer = new AIAnalyzer();
    const eventNotificationService = new EventNotificationService();
    
    if (!analysisOnly) {
      // Collect all market data
      console.log('Collecting market data...');
      const dataSuccess = await dataCollector.collectAllData();
      
      if (!dataSuccess) {
        console.error('Data collection failed');
        return false;
      }
      
      console.log('Market data collection completed successfully');
    } else {
      console.log('Skipping data collection - using existing data for analysis only');
    }
    
    // Get latest AI analysis from database (no new AI call)
    console.log('Retrieving latest AI analysis from database...');
    const { getLatestAIAnalysis } = require('../server/database');
    const analysis = await getLatestAIAnalysis();
    
    if (analysis) {
      const direction = analysis.overall_direction || analysis.market_direction || 'UNKNOWN';
      const confidence = analysis.overall_confidence || analysis.confidence || 'UNKNOWN';
      console.log(`✅ Latest AI Analysis: ${direction} (${confidence}% confidence)`);
      
      // Run backtest if needed
      console.log('Running backtest analysis...');
      const backtestResults = await aiAnalyzer.backtestPredictions();
      
      if (backtestResults) {
        console.log(`Backtest completed for ${backtestResults.length} assets`);
      }
    } else {
      console.log('No AI analysis found in database');
    }
    
    // Check for upcoming event notifications
    console.log('Checking for upcoming event notifications...');
    const eventNotifications = await eventNotificationService.checkUpcomingEventNotifications();
    if (eventNotifications.length > 0) {
      console.log(`Created ${eventNotifications.length} event notifications`);
    }
    
    console.log(`Data collection and analysis completed at ${timestamp}`);
    return true;
  } catch (error) {
    console.error('Error in data collection script:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  // Check for analysis-only flag
  const analysisOnly = process.argv.includes('--analysis-only') || process.argv.includes('-a');
  
  runDataCollection(analysisOnly)
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