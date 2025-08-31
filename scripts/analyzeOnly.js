#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const DataCollector = require('../server/services/dataCollector');
const AIAnalyzer = require('../server/services/aiAnalyzer');

async function runAnalysisOnly() {
  try {
    console.log('🤖 Starting AI Analysis Only Mode...');
    console.log('📊 Using latest market data from database...');
    
    // Initialize data collector to get market data summary
    const dataCollector = new DataCollector();
    
    // Get latest market data from database
    const marketData = await dataCollector.getMarketDataSummary();
    
    if (!marketData) {
      console.error('❌ No market data found in database. Run collectData.js first.');
      process.exit(1);
    }
    
    console.log('✅ Found market data from:', new Date(marketData.timestamp).toLocaleString());
    
    // Get latest AI analysis from database (no new AI call)
    console.log('📊 Retrieving latest AI analysis from database...');
    const aiAnalyzer = new AIAnalyzer();
    const analysis = await aiAnalyzer.getAnalysisSummary();
    
    if (!analysis) {
      console.error('❌ No AI analysis found in database. Run collectData.js first to generate analysis.');
      process.exit(1);
    }
    
    console.log('✅ AI Analysis completed successfully');
    console.log(`📈 Overall direction: ${analysis.overall_direction}, Confidence: ${analysis.overall_confidence}%`);
    
    // Display key insights
    if (analysis.short_term) {
      console.log('\n📋 Short Term Analysis:');
      console.log(`   Direction: ${analysis.short_term.market_direction}`);
      console.log(`   Confidence: ${analysis.short_term.confidence}%`);
      console.log(`   Key Factors: ${analysis.short_term.key_factors.slice(0, 3).join(', ')}`);
      console.log(`   Risk Factors: ${analysis.short_term.risk_factors.join(', ')}`);
    }
    
    if (analysis.medium_term) {
      console.log('\n📋 Medium Term Analysis:');
      console.log(`   Direction: ${analysis.medium_term.market_direction}`);
      console.log(`   Confidence: ${analysis.medium_term.confidence}%`);
      console.log(`   Key Factors: ${analysis.medium_term.key_factors.slice(0, 3).join(', ')}`);
      console.log(`   Risk Factors: ${analysis.medium_term.risk_factors.join(', ')}`);
    }
    
    if (analysis.long_term) {
      console.log('\n📋 Long Term Analysis:');
      console.log(`   Direction: ${analysis.long_term.market_direction}`);
      console.log(`   Confidence: ${analysis.long_term.confidence}%`);
      console.log(`   Key Factors: ${analysis.long_term.key_factors.slice(0, 3).join(', ')}`);
      console.log(`   Risk Factors: ${analysis.long_term.risk_factors.join(', ')}`);
    }
    
    console.log('\n🎯 Analysis completed at', new Date().toLocaleString());
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAnalysisOnly();
}

module.exports = { runAnalysisOnly };
