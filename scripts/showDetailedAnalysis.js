#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const AIAnalyzer = require('../server/services/aiAnalyzer');

async function showDetailedAnalysis() {
  try {
    console.log('🔍 Retrieving detailed AI analysis...');
    
    const aiAnalyzer = new AIAnalyzer();
    const analysis = await aiAnalyzer.getAnalysisSummary();
    
    if (!analysis) {
      console.error('❌ No AI analysis found in database. Run collectData.js first to generate analysis.');
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🤖 COMPREHENSIVE AI MARKET ANALYSIS');
    console.log('='.repeat(80));
    
    // Overall Analysis
    console.log('\n📊 OVERALL MARKET OUTLOOK');
    console.log('-'.repeat(40));
    console.log(`Direction: ${analysis.overall_direction}`);
    console.log(`Confidence: ${analysis.overall_confidence}%`);
    console.log(`\n📝 Detailed Reasoning:`);
    console.log(analysis.overall_reasoning || 'No detailed reasoning available');
    
    // Short Term Analysis
    if (analysis.short_term) {
      console.log('\n\n⏰ SHORT TERM ANALYSIS (1-7 days)');
      console.log('-'.repeat(40));
      console.log(`Direction: ${analysis.short_term.market_direction}`);
      console.log(`Confidence: ${analysis.short_term.confidence}%`);
      console.log(`Time Horizon: ${analysis.short_term.time_horizon}`);
      
      console.log(`\n🔑 Key Factors:`);
      analysis.short_term.key_factors.forEach((factor, index) => {
        console.log(`  ${index + 1}. ${factor}`);
      });
      
      console.log(`\n⚠️ Risk Factors:`);
      analysis.short_term.risk_factors.forEach((risk, index) => {
        console.log(`  ${index + 1}. ${risk}`);
      });
      
      console.log(`\n📝 Detailed Reasoning:`);
      console.log(analysis.short_term.reasoning || 'No detailed reasoning available');
    }
    
    // Medium Term Analysis
    if (analysis.medium_term) {
      console.log('\n\n📅 MEDIUM TERM ANALYSIS (1-4 weeks)');
      console.log('-'.repeat(40));
      console.log(`Direction: ${analysis.medium_term.market_direction}`);
      console.log(`Confidence: ${analysis.medium_term.confidence}%`);
      console.log(`Time Horizon: ${analysis.medium_term.time_horizon}`);
      
      console.log(`\n🔑 Key Factors:`);
      analysis.medium_term.key_factors.forEach((factor, index) => {
        console.log(`  ${index + 1}. ${factor}`);
      });
      
      console.log(`\n⚠️ Risk Factors:`);
      analysis.medium_term.risk_factors.forEach((risk, index) => {
        console.log(`  ${index + 1}. ${risk}`);
      });
      
      console.log(`\n📝 Detailed Reasoning:`);
      console.log(analysis.medium_term.reasoning || 'No detailed reasoning available');
    }
    
    // Long Term Analysis
    if (analysis.long_term) {
      console.log('\n\n🎯 LONG TERM ANALYSIS (1-6 months)');
      console.log('-'.repeat(40));
      console.log(`Direction: ${analysis.long_term.market_direction}`);
      console.log(`Confidence: ${analysis.long_term.confidence}%`);
      console.log(`Time Horizon: ${analysis.long_term.time_horizon}`);
      
      console.log(`\n🔑 Key Factors:`);
      analysis.long_term.key_factors.forEach((factor, index) => {
        console.log(`  ${index + 1}. ${factor}`);
      });
      
      console.log(`\n⚠️ Risk Factors:`);
      analysis.long_term.risk_factors.forEach((risk, index) => {
        console.log(`  ${index + 1}. ${risk}`);
      });
      
      console.log(`\n📝 Detailed Reasoning:`);
      console.log(analysis.long_term.reasoning || 'No detailed reasoning available');
    }
    
    // Inflation Impact
    if (analysis.inflation_impact) {
      console.log('\n\n💰 INFLATION IMPACT ANALYSIS');
      console.log('-'.repeat(40));
      console.log(`Sentiment: ${analysis.inflation_impact.sentiment}`);
      
      if (analysis.inflation_impact.market_impact) {
        console.log(`\nMarket Impact:`);
        console.log(`  Crypto: ${analysis.inflation_impact.market_impact.crypto}`);
        console.log(`  Stocks: ${analysis.inflation_impact.market_impact.stocks}`);
        console.log(`  Bonds: ${analysis.inflation_impact.market_impact.bonds}`);
        console.log(`  Dollar: ${analysis.inflation_impact.market_impact.dollar}`);
      }
      
      console.log(`\n📝 Detailed Description:`);
      console.log(analysis.inflation_impact.description || 'No detailed description available');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis completed at', new Date().toLocaleString());
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error retrieving detailed analysis:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  showDetailedAnalysis();
}

module.exports = { showDetailedAnalysis };
