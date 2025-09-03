const moment = require('moment');
require('dotenv').config({ path: '.env.local' });

const {
  insertAIAnalysis,
  insertBacktestResult,
  getLatestAIAnalysis,
  getCryptoPrices
} = require('../database');

class AIAnalyzer {
  constructor() {
    this.veniceApiKey = process.env.VENICE_AI_API_KEY;
    this.veniceApiUrl = 'https://api.venice.ai/api/v1/chat/completions';
    this.openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Log API configuration for debugging
    console.log('🔧 AI Configuration:');
    console.log('  Venice AI Key:', this.veniceApiKey ? '✅ Configured' : '❌ Missing');
    console.log('  Venice AI URL:', this.veniceApiUrl);
    console.log('  OpenAI Key:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
  }

  // Analyze market data using AI with inflation integration
  async analyzeMarketDirection(marketData) {
    try {
      // Get inflation data and sentiment
      const inflationData = await this.getInflationData();
      
      // Use the new AI analysis method
      const analysis = await this.aiAnalysis(marketData, inflationData);
      
      return analysis;
    } catch (error) {
      console.error('Error in AI analysis:', error.message);
      throw error;
    }
  }

  // Get inflation data and sentiment
  async getInflationData() {
    try {
      const inflationService = require('./inflationDataService');
      const data = await inflationService.fetchLatestData();
      const sentiment = await inflationService.analyzeInflationData(data);
      
      return {
        data,
        sentiment: sentiment.overallSentiment,
        marketImpact: sentiment.marketImpact,
        description: sentiment.marketImpact?.description || 'No inflation impact data'
      };
    } catch (error) {
      console.log('Inflation data not available for AI analysis:', error.message);
      return null;
    }
  }



  // AI-powered market analysis - complete analysis by AI
  async aiAnalysis(marketData, inflationData = null) {
    try {
      console.log('🤖 Starting AI-powered market analysis...');
      
      // Get upcoming events data
      const upcomingEvents = await this.getUpcomingEvents();
      
      // Create comprehensive prompt for AI analysis
      const prompt = this.createAnalysisPrompt(marketData, inflationData, upcomingEvents);
      
      // Call AI for complete analysis
      const response = await this.callAI(prompt);
      
      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const content = response.choices[0].message.content;
        
        try {
          // Clean the content - remove markdown formatting if present
          let cleanContent = content.trim();
          
          // Remove markdown code blocks if present
          if (cleanContent.startsWith('```json')) {
            cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          // Try to fix common JSON issues
          cleanContent = cleanContent.trim();
          
          // If JSON is incomplete (missing closing braces), try to complete it
          const openBraces = (cleanContent.match(/\{/g) || []).length;
          const closeBraces = (cleanContent.match(/\}/g) || []).length;
          
          if (openBraces > closeBraces) {
            const missingBraces = openBraces - closeBraces;
            cleanContent += '}'.repeat(missingBraces);
          }
          
          // If JSON is cut off mid-string, try to complete it
          if (cleanContent.includes('"time_horizon"') && !cleanContent.includes('"long_term"')) {
            // Complete the long_term section if it's cut off
            cleanContent = cleanContent.replace(/"time_horizon"[^}]*$/, '"time_horizon": "1-6 months", "key_factors": ["Factor 1", "Factor 2", "Factor 3"], "risk_factors": ["Risk 1", "Risk 2", "Risk 3"], "reasoning": "Long-term outlook based on fundamental factors" } } }');
          }
          
          // If JSON is cut off, try to find the last complete object and close it
          if (cleanContent.includes('"inflation_impact": {')) {
            const inflationStart = cleanContent.indexOf('"inflation_impact": {');
            if (inflationStart !== -1) {
              // Find the last complete object before inflation_impact
              const beforeInflation = cleanContent.substring(0, inflationStart);
              const lastCompleteObject = beforeInflation.lastIndexOf('},');
              if (lastCompleteObject !== -1) {
                cleanContent = cleanContent.substring(0, lastCompleteObject + 1) + '}';
              }
            }
          }
          
          // Parse AI response
          const analysis = JSON.parse(cleanContent);
          
          // Validate and structure the response
          const structuredAnalysis = this.validateAndStructureAnalysis(analysis);
          
          // Add timestamp
          structuredAnalysis.timestamp = new Date().toISOString();
          
          await this.saveAnalysis(structuredAnalysis);
          console.log('✅ AI analysis completed successfully');
          
          return structuredAnalysis;
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError.message);
          console.error('Raw content:', content);
          throw new Error('AI response format invalid');
        }
      } else {
        throw new Error('Invalid AI response structure');
      }
    } catch (error) {
      console.error('❌ AI analysis failed:', error.message);
      throw error;
    }
  }

  // Get upcoming events data
  async getUpcomingEvents() {
    try {
      const { getUpcomingEvents } = require('../database');
      const events = await getUpcomingEvents(30); // Get events for next 30 days
      return events || [];
    } catch (error) {
      console.log('Could not fetch upcoming events:', error.message);
      return [];
    }
  }

  // Create comprehensive analysis prompt
  createAnalysisPrompt(marketData, inflationData, upcomingEvents) {
    const marketDataStr = JSON.stringify(marketData, null, 2);
    const inflationDataStr = JSON.stringify(inflationData, null, 2);
    const eventsStr = JSON.stringify(upcomingEvents, null, 2);

    return `You are a senior crypto market analyst with 15+ years of experience. Your task is to provide a comprehensive, detailed analysis of the cryptocurrency market based on the provided data.

CRITICAL ANALYSIS REQUIREMENTS:
1. **Bitcoin Price Analysis**: Pay special attention to BTC price levels, 24h changes, and volume patterns
2. **Bitcoin Dominance (BTC.D)**: Analyze Bitcoin's market dominance percentage and its implications
3. **Market Sentiment**: Consider Fear & Greed Index, VIX volatility, and overall market mood
4. **Macro Factors**: Evaluate DXY (dollar strength), Treasury yields, equity markets, oil prices, and M2 money supply
5. **Inflation Impact**: Assess how inflation data affects crypto markets specifically
6. **M2 Money Supply**: Analyze M2 money supply trends and their impact on crypto liquidity and risk appetite
7. **Technical Indicators**: Consider price levels, volume, and market structure
7. **Fundamental Factors**: Upcoming events, regulatory news, and adoption trends
8. **Trending Narratives**: Consider trending narratives for the crypto market

MARKET DATA:
${marketDataStr}

INFLATION DATA:
${inflationDataStr}

UPCOMING EVENTS:
${eventsStr}

Please provide a structured JSON response with detailed reasoning:

{
  "overall_direction": "BEARISH|BULLISH|NEUTRAL",
  "overall_confidence": 85,
  "overall_reasoning": "COMPREHENSIVE explanation including: 1) Current BTC price analysis and significance, 2) Bitcoin dominance implications, 3) Key macro factors driving the market, 4) Technical and fundamental analysis, 5) Risk assessment and market sentiment. Minimum 3-4 sentences with specific data points.",
  "short_term": {
    "market_direction": "BEARISH|BULLISH|NEUTRAL",
    "confidence": 75,
    "time_horizon": "1-7 days",
    "key_factors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4", "Factor 5", "Factor 6"],
    "risk_factors": ["Risk 1", "Risk 2", "Risk 3", "Risk 4", "Risk 5"],
    "reasoning": "DETAILED explanation including: 1) Immediate price action expectations, 2) Key support/resistance levels, 3) Volume analysis, 4) Short-term catalysts, 5) Intraday volatility expectations. Minimum 4-5 sentences with specific technical and fundamental analysis."
  },
  "medium_term": {
    "market_direction": "BEARISH|BULLISH|NEUTRAL",
    "confidence": 80,
    "time_horizon": "1-4 weeks",
    "key_factors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4", "Factor 5", "Factor 6"],
    "risk_factors": ["Risk 1", "Risk 2", "Risk 3", "Risk 4", "Risk 5"],
    "reasoning": "DETAILED explanation including: 1) Weekly trend analysis, 2) Key events impact assessment, 3) Market structure analysis, 4) Institutional flow expectations, 5) Regulatory environment impact. Minimum 4-5 sentences with specific analysis."
  },
  "long_term": {
    "market_direction": "BEARISH|BULLISH|NEUTRAL",
    "confidence": 70,
    "time_horizon": "1-6 months",
    "key_factors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4", "Factor 5", "Factor 6"],
    "risk_factors": ["Risk 1", "Risk 2", "Risk 3", "Risk 4", "Risk 5"],
    "reasoning": "DETAILED explanation including: 1) Fundamental trend analysis, 2) Adoption and institutional adoption trends, 3) Macroeconomic cycle positioning, 4) Regulatory landscape evolution, 5) Technology and network development impact. Minimum 4-5 sentences with specific analysis."
  },
  "inflation_impact": {
    "sentiment": "very_bearish|bearish|slightly_bearish|neutral|slightly_bullish|bullish|very_bullish",
    "market_impact": {
      "crypto": "strong_negative|negative|slightly_negative|neutral|slightly_positive|positive|strong_positive",
      "stocks": "strong_negative|negative|slightly_negative|neutral|slightly_positive|positive|strong_positive",
      "bonds": "strong_negative|negative|slightly_negative|neutral|slightly_positive|positive|strong_positive",
      "dollar": "strong_negative|negative|slightly_negative|neutral|slightly_positive|positive|strong_positive"
    },
    "description": "DETAILED explanation of how inflation data specifically impacts crypto markets, including correlation analysis and historical context. Minimum 2-3 sentences."
  }
}

ANALYSIS REQUIREMENTS:
- **MUST** analyze BTC price levels and 24h changes specifically
- **MUST** evaluate Bitcoin dominance (BTC.D) percentage and implications
- **MUST** consider Fear & Greed Index for market sentiment
- **MUST** assess VIX volatility impact on crypto markets
- **MUST** evaluate DXY dollar strength correlation with crypto
- **MUST** analyze Treasury yield impact on risk assets
- **MUST** consider equity market correlation (SP500, NASDAQ)
- **MUST** assess oil price impact on inflation and crypto
- **MUST** analyze M2 money supply trends and their impact on crypto liquidity
- Provide realistic confidence scores (0-100) based on data strength
- Include specific price levels, percentages, and data points in reasoning
- Key factors should be the most important drivers of market direction
- Risk factors should be the biggest threats to your prediction
- Ensure all JSON fields are properly formatted
- Provide ONLY the JSON response, no additional text`;
  }

  // Validate and structure AI analysis response
  validateAndStructureAnalysis(analysis) {
    // Ensure required fields exist
    const required = ['overall_direction', 'overall_confidence', 'short_term', 'medium_term', 'long_term'];
    for (const field of required) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate timeframe structures
    const timeframes = ['short_term', 'medium_term', 'long_term'];
    for (const timeframe of timeframes) {
      const tf = analysis[timeframe];
      const tfRequired = ['market_direction', 'confidence', 'time_horizon', 'key_factors', 'risk_factors'];
      for (const field of tfRequired) {
        if (!tf[field]) {
          throw new Error(`Missing required field in ${timeframe}: ${field}`);
        }
      }
    }

    // Ensure arrays are properly formatted
    for (const timeframe of timeframes) {
      if (!Array.isArray(analysis[timeframe].key_factors)) {
        analysis[timeframe].key_factors = [];
      }
      if (!Array.isArray(analysis[timeframe].risk_factors)) {
        analysis[timeframe].risk_factors = [];
      }
    }

    // Ensure confidence scores are numbers
    analysis.overall_confidence = Math.min(Math.max(Number(analysis.overall_confidence) || 50, 0), 100);
    for (const timeframe of timeframes) {
      analysis[timeframe].confidence = Math.min(Math.max(Number(analysis[timeframe].confidence) || 50, 0), 100);
    }

    return analysis;
  }





  // Call AI API (Venice AI or OpenAI fallback)
  async callAI(prompt) {
    try {
      const axios = require('axios');
      
      // Try Venice AI first
      if (this.veniceApiKey) {
        try {
          const response = await axios.post(this.veniceApiUrl, {
            model: 'llama-3.3-70b',
            messages: [
              {
                role: 'system',
                content: 'You are a financial analyst specializing in cryptocurrency markets. Provide concise, accurate analysis based on market data.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            venice_parameters: {
              enable_web_search: 'off',
              include_venice_system_prompt: false
            },
            frequency_penalty: 0,
            presence_penalty: 0,
            max_tokens: 2000,
            max_completion_tokens: 1998,
            temperature: 0.3,
            top_p: 0.1,
            stream: false
          }, {
            headers: {
              'Authorization': `Bearer ${this.veniceApiKey}`,
              'Content-Type': 'application/json'
            }
          });

          return response.data;
        } catch (veniceError) {
          console.log('Venice AI failed, trying OpenAI fallback:', veniceError.message);
        }
      }
      
      // Fallback to OpenAI if Venice AI fails or not configured
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const response = await axios.post(this.openaiApiUrl, {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a financial analyst specializing in cryptocurrency markets. Provide concise, accurate analysis based on market data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
                      max_tokens: 2000,
          temperature: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          }
        });

        return response.data;
      }
      
      throw new Error('No AI API configured');
    } catch (error) {
      console.error('AI API call failed:', error.message);
      throw error;
    }
  }

  // Save analysis to database
  async saveAnalysis(analysis) {
    try {
      // Use the overall direction and confidence
      const marketDirection = analysis.overall_direction;
      const confidence = analysis.overall_confidence;
      const reasoning = analysis.short_term?.reasoning || 'Multi-timeframe analysis';
      const factorsAnalyzed = analysis.short_term?.factors_analyzed || [];
      
      // Store the complete analysis data as JSON (ensure it's not already a string)
      const analysisData = typeof analysis === 'string' ? analysis : JSON.stringify(analysis);

      await insertAIAnalysis(
        marketDirection,
        confidence,
        reasoning,
        factorsAnalyzed,
        analysisData
      );
      console.log('Multi-timeframe AI analysis saved to database');
    } catch (error) {
      console.error('Error saving AI analysis:', error.message);
    }
  }

  // Backtest previous predictions
  async backtestPredictions() {
    try {
      console.log('Starting backtest analysis...');
      
      // Get latest AI analysis
      const latestAnalysis = await getLatestAIAnalysis();
      if (!latestAnalysis) {
        console.log('No AI analysis found for backtesting');
        return;
      }

      // Parse the analysis data to get overall direction
      let predictedDirection = latestAnalysis.market_direction;
      if (latestAnalysis.analysis_data) {
        try {
          const analysisData = JSON.parse(latestAnalysis.analysis_data);
          predictedDirection = analysisData.overall_direction || latestAnalysis.market_direction;
        } catch (error) {
          console.log('Could not parse analysis_data, using market_direction');
        }
      }

      // Get crypto prices from prediction time and current time
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
      const backtestResults = [];

      for (const symbol of cryptoSymbols) {
        const prices = await getCryptoPrices(symbol, 2);
        if (prices && prices.length >= 2) {
          const currentPrice = prices[0].price;
          const previousPrice = prices[1].price;
          
          // Determine actual direction
          const actualDirection = currentPrice > previousPrice ? 'BULLISH' : 'BEARISH';
          
          // Calculate accuracy
          const accuracy = predictedDirection === actualDirection ? 100 : 0;
          
          // Calculate correlation score
          const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
          const correlationScore = this.calculateCorrelationScore(predictedDirection, priceChange);
          
          const result = {
            prediction_date: latestAnalysis.timestamp,
            actual_date: new Date().toISOString(),
            predicted_direction: predictedDirection,
            actual_direction: actualDirection,
            accuracy: accuracy,
            crypto_symbol: symbol,
            price_at_prediction: previousPrice,
            price_at_actual: currentPrice,
            correlation_score: correlationScore
          };
          
          backtestResults.push(result);
          
          // Save to database
          await insertBacktestResult(
            result.prediction_date,
            result.actual_date,
            result.predicted_direction,
            result.actual_direction,
            result.accuracy,
            result.crypto_symbol,
            result.price_at_prediction,
            result.price_at_actual,
            result.correlation_score
          );
        }
      }

      console.log(`Backtest completed for ${backtestResults.length} crypto assets`);
      return backtestResults;
    } catch (error) {
      console.error('Error in backtest analysis:', error.message);
      return null;
    }
  }

  // Calculate correlation score between prediction and actual price movement
  calculateCorrelationScore(predictedDirection, priceChange) {
    let score = 0;
    
    if (predictedDirection === 'BULLISH' && priceChange > 0) {
      score = Math.min(Math.abs(priceChange) * 2, 100);
    } else if (predictedDirection === 'BEARISH' && priceChange < 0) {
      score = Math.min(Math.abs(priceChange) * 2, 100);
    } else if (predictedDirection === 'NEUTRAL') {
      score = Math.max(50 - Math.abs(priceChange) * 5, 0);
    }
    
    return Math.round(score);
  }

  // Get analysis summary for frontend
  async getAnalysisSummary() {
    try {
      const latestAnalysis = await getLatestAIAnalysis();
      if (!latestAnalysis) {
        return null;
      }

      // Parse the complete analysis data
      let analysisData = null;
      if (latestAnalysis.analysis_data) {
        try {
          analysisData = JSON.parse(latestAnalysis.analysis_data);
          // Handle double encoding - if the result is still a string, parse it again
          if (typeof analysisData === 'string') {
            analysisData = JSON.parse(analysisData);
          }
        } catch (error) {
          console.error('Could not parse analysis_data:', error.message);
          return null;
        }
      }

      // Return the multi-timeframe format only
      if (analysisData && (analysisData.short_term || analysisData.medium_term || analysisData.long_term)) {
        return {
          timestamp: latestAnalysis.timestamp,
          overall_direction: analysisData.overall_direction,
          overall_confidence: analysisData.overall_confidence,
          short_term: analysisData.short_term,
          medium_term: analysisData.medium_term,
          long_term: analysisData.long_term
        };
      }

      // If no valid multi-timeframe data, return null
      return null;
    } catch (error) {
      console.error('Error getting analysis summary:', error.message);
      return null;
    }
  }

  // Get backtest performance metrics
  async getBacktestMetrics() {
    try {
      const { getBacktestResults } = require('../database');
      const results = await getBacktestResults(100);
      
      if (!results || results.length === 0) {
        return null;
      }

      // Calculate overall accuracy
      const totalPredictions = results.length;
      const correctPredictions = results.filter(r => r.accuracy === 100).length;
      const overallAccuracy = (correctPredictions / totalPredictions) * 100;

      // Calculate average correlation score
      const avgCorrelation = results.reduce((sum, r) => sum + r.correlation_score, 0) / totalPredictions;

      // Group by crypto symbol
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
      const bySymbol = {};
      cryptoSymbols.forEach(symbol => {
        const symbolResults = results.filter(r => r.crypto_symbol === symbol);
        if (symbolResults.length > 0) {
          bySymbol[symbol] = {
            accuracy: (symbolResults.filter(r => r.accuracy === 100).length / symbolResults.length) * 100,
            avgCorrelation: symbolResults.reduce((sum, r) => sum + r.correlation_score, 0) / symbolResults.length,
            totalPredictions: symbolResults.length
          };
        }
      });

      return {
        overall_accuracy: Math.round(overallAccuracy * 100) / 100,
        average_correlation: Math.round(avgCorrelation * 100) / 100,
        total_predictions: totalPredictions,
        by_symbol: bySymbol,
        recent_results: results.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting backtest metrics:', error.message);
      return null;
    }
  }
}

module.exports = AIAnalyzer;