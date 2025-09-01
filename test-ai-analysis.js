const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Create PostgreSQL connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testAIAnalysis() {
  try {
    // Get the latest AI analysis
    const analysis = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM ai_analysis ORDER BY timestamp DESC LIMIT 1')
        .then(result => resolve(result.rows[0] || null))
        .catch(reject);
    });

    if (analysis) {
      if (analysis.analysis_data) {
        try {
          // First, let's see what the raw data looks like
          console.log('\n🔍 Raw Analysis Data (first 200 chars):');
          console.log(analysis.analysis_data.substring(0, 200) + '...');
          
          // Handle potential double encoding
          let parsedData;
          try {
            parsedData = JSON.parse(analysis.analysis_data);
            // Check if the result is still a string (double encoded)
            if (typeof parsedData === 'string') {
              console.log('\n⚠️  Detected double encoding, parsing again...');
              parsedData = JSON.parse(parsedData);
            }
          } catch (parseError) {
            console.error('❌ Error parsing analysis data:', parseError.message);
            console.error('Raw data:', analysis.analysis_data);
            return;
          }
          
          console.log('\n📋 Parsed Analysis Data:');
          console.log(JSON.stringify(parsedData, null, 2));
          
          console.log('\n🔍 Multi-timeframe Check:');
          console.log(`  Has short_term: ${!!parsedData.short_term}`);
          console.log(`  Has medium_term: ${!!parsedData.medium_term}`);
          console.log(`  Has long_term: ${!!parsedData.long_term}`);
          console.log(`  Has overall_direction: ${!!parsedData.overall_direction}`);
          console.log(`  Has overall_confidence: ${!!parsedData.overall_confidence}`);
          
          if (parsedData.short_term) {
            console.log('\n📊 Short Term Analysis:');
            console.log(`  Direction: ${parsedData.short_term.market_direction}`);
            console.log(`  Confidence: ${parsedData.short_term.confidence}%`);
            console.log(`  Reasoning: ${parsedData.short_term.reasoning}`);
          }
          
          if (parsedData.medium_term) {
            console.log('\n📊 Medium Term Analysis:');
            console.log(`  Direction: ${parsedData.medium_term.market_direction}`);
            console.log(`  Confidence: ${parsedData.medium_term.confidence}%`);
            console.log(`  Reasoning: ${parsedData.medium_term.reasoning}`);
          }
          
          if (parsedData.long_term) {
            console.log('\n📊 Long Term Analysis:');
            console.log(`  Direction: ${parsedData.long_term.market_direction}`);
            console.log(`  Confidence: ${parsedData.long_term.confidence}%`);
            console.log(`  Reasoning: ${parsedData.long_term.reasoning}`);
          }
          
          // Test the getAnalysisSummary logic
          console.log('\n🧪 Testing getAnalysisSummary Logic:');
          let analysisData = parsedData;
          
          // Check if we have multi-timeframe data
          const hasMultiTimeframe = analysisData && (analysisData.short_term || analysisData.medium_term || analysisData.long_term);
          console.log(`  Has multi-timeframe data: ${hasMultiTimeframe}`);
          
          if (hasMultiTimeframe) {
            console.log('✅ Should return multi-timeframe format');
            const expectedResult = {
              timestamp: analysis.timestamp,
              overall_direction: analysisData.overall_direction,
              overall_confidence: analysisData.overall_confidence,
              short_term: analysisData.short_term,
              medium_term: analysisData.medium_term,
              long_term: analysisData.long_term
            };
            console.log('Expected result structure:', Object.keys(expectedResult));
          } else {
            console.log('❌ Should return legacy format');
          }
          
        } catch (error) {
          console.error('❌ Error parsing analysis data:', error.message);
          console.error('Raw data:', analysis.analysis_data);
        }
      }
    } else {
      console.log('❌ No AI analysis found');
    }

  } catch (error) {
    console.error('❌ Error testing AI analysis:', error.message);
  } finally {
    db.close();
  }
}

testAIAnalysis();
