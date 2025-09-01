const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const AIAnalyzer = require('./server/services/aiAnalyzer');
const DataCollector = require('./server/services/dataCollector');

// Create PostgreSQL connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function clearAndRerunAI() {
  try {
    console.log('🧹 Clearing AI analysis table...');
    
    // Clear the ai_analysis table
    await db.query('DELETE FROM ai_analysis');
    console.log('✅ AI analysis table cleared');

    // Clear backtest results as well since they reference old analysis
    await db.query('DELETE FROM backtest_results');
    console.log('✅ Backtest results table cleared');

    console.log('🔄 Collecting fresh market data...');
    
    // Collect fresh market data
    const dataCollector = new DataCollector();
    const marketData = await dataCollector.collectAllData();
    
    if (!marketData) {
      throw new Error('Failed to collect market data');
    }
    
    console.log('✅ Market data collected successfully');
    console.log('🤖 Running AI analysis with new multi-timeframe format...');
    
    // Run AI analysis with new format
    const aiAnalyzer = new AIAnalyzer();
    const analysis = await aiAnalyzer.analyzeMarketDirection(marketData);
    
    if (analysis) {
      console.log('✅ AI analysis completed successfully');
      console.log('📊 Analysis summary:');
      console.log(`  Overall Direction: ${analysis.overall_direction}`);
      console.log(`  Overall Confidence: ${analysis.overall_confidence}%`);
      console.log(`  Short Term: ${analysis.short_term?.market_direction} (${analysis.short_term?.confidence}%)`);
      console.log(`  Medium Term: ${analysis.medium_term?.market_direction} (${analysis.medium_term?.confidence}%)`);
      console.log(`  Long Term: ${analysis.long_term?.market_direction} (${analysis.long_term?.confidence}%)`);
    } else {
      console.error('❌ AI analysis failed');
    }

    // Verify the data was saved correctly
    const savedAnalysis = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM ai_analysis ORDER BY timestamp DESC LIMIT 1', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (savedAnalysis) {
      console.log('✅ Analysis saved to database');
      console.log('📋 Saved analysis details:');
      console.log(`  Market Direction: ${savedAnalysis.market_direction}`);
      console.log(`  Confidence: ${savedAnalysis.confidence}%`);
      console.log(`  Analysis Data: ${savedAnalysis.analysis_data ? 'Present' : 'Missing'}`);
      
      if (savedAnalysis.analysis_data) {
        try {
          const parsedData = JSON.parse(savedAnalysis.analysis_data);
          console.log('✅ Analysis data is valid JSON with multi-timeframe format');
          console.log(`  Has short_term: ${!!parsedData.short_term}`);
          console.log(`  Has medium_term: ${!!parsedData.medium_term}`);
          console.log(`  Has long_term: ${!!parsedData.long_term}`);
        } catch (error) {
          console.error('❌ Analysis data is not valid JSON:', error.message);
        }
      }
    } else {
      console.error('❌ No analysis found in database');
    }

  } catch (error) {
    console.error('❌ Error during clear and rerun:', error.message);
  } finally {
    await db.end();
    console.log('✅ Database connection closed');
  }
}

clearAndRerunAI();
