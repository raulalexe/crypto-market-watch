const moment = require('moment');
require('dotenv').config({ path: '.env.local' });

const {
  insertAIAnalysis,
  insertBacktestResult,
  getLatestAIAnalysis,
  getCryptoPrices
} = require('../database');

const HuggingFaceService = require('./huggingFaceService');
const GroqService = require('./groqService');

class AIAnalyzer {
  constructor() {
    this.veniceApiKey = process.env.VENICE_AI_API_KEY;
    this.veniceApiUrl = 'https://api.venice.ai/api/v1/chat/completions';
    this.openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Initialize AI services
    this.huggingFaceService = new HuggingFaceService();
    this.groqService = new GroqService();
    
    // Log API configuration for debugging
    console.log('🔧 AI Configuration:');
    console.log('  Venice AI Key:', this.veniceApiKey ? '✅ Configured' : '❌ Missing');
    console.log('  Venice AI URL:', this.veniceApiUrl);
    console.log('  OpenAI Key:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
    console.log('  Hugging Face Key:', process.env.HUGGING_FACE_TOKEN ? '✅ Configured' : '❌ Missing');
    console.log('  Groq Key:', process.env.GROQ_TOKEN ? '✅ Configured' : '❌ Missing');
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

  // Get inflation data and sentiment - DATABASE ONLY, NO API CALLS
  async getInflationData() {
    try {
      console.log('📊 Getting inflation data from database (no API calls)...');
      
      // Use cached data from database instead of fetching fresh data
      const { getLatestInflationData } = require('../database');
      const cpiData = await getLatestInflationData('CPI');
      const pceData = await getLatestInflationData('PCE');
      
      if (!cpiData && !pceData) {
        console.log('⚠️ No inflation data available in database for AI analysis');
        return null;
      }
      
      // Format the data for AI analysis
      const data = {
        cpi: cpiData ? {
          value: cpiData.value,
          core_value: cpiData.core_value,
          yoy_change: cpiData.yoy_change,
          core_yoy_change: cpiData.core_yoy_change,
          date: cpiData.date
        } : null,
        pce: pceData ? {
          value: pceData.value,
          core_value: pceData.core_value,
          yoy_change: pceData.yoy_change,
          core_yoy_change: pceData.core_yoy_change,
          date: pceData.date
        } : null
      };
      
      // Simple sentiment analysis based on the data
      const sentiment = this.analyzeInflationSentiment(data);
      
      console.log('✅ Inflation data retrieved from database successfully');
      return {
        data,
        sentiment: sentiment.overallSentiment,
        marketImpact: sentiment.marketImpact,
        description: sentiment.description
      };
    } catch (error) {
      console.log('⚠️ Inflation data not available for AI analysis:', error.message);
      return null;
    }
  }

  // Simple inflation sentiment analysis
  analyzeInflationSentiment(data) {
    let overallSentiment = 'neutral';
    let description = 'Inflation data shows neutral impact on markets.';
    
    if (data.cpi || data.pce) {
      const cpiYoY = data.cpi?.yoy_change || 0;
      const pceYoY = data.pce?.yoy_change || 0;
      const avgInflation = (cpiYoY + pceYoY) / 2;
      
      if (avgInflation > 3.5) {
        overallSentiment = 'bearish';
        description = 'High inflation may pressure risk assets and crypto markets.';
      } else if (avgInflation < 2.0) {
        overallSentiment = 'bullish';
        description = 'Low inflation supports risk assets and crypto markets.';
      } else {
        overallSentiment = 'neutral';
        description = 'Moderate inflation has neutral impact on crypto markets.';
      }
    }
    
    return {
      overallSentiment,
      marketImpact: {
        crypto: overallSentiment,
        stocks: overallSentiment,
        bonds: overallSentiment === 'bearish' ? 'bullish' : overallSentiment === 'bullish' ? 'bearish' : 'neutral',
        dollar: overallSentiment === 'bearish' ? 'bullish' : overallSentiment === 'bullish' ? 'bearish' : 'neutral'
      },
      description
    };
  }



  // AI-powered market analysis - complete analysis by AI
  async aiAnalysis(marketData, inflationData = null) {
    try {
      console.log('🤖 Starting multi-AI market analysis...');
      
      // Get upcoming events data
      const upcomingEvents = await this.getUpcomingEvents();
      
      // Run Venice AI analysis (primary)
      const veniceAnalysis = await this.getVeniceAnalysis(marketData, inflationData, upcomingEvents);
      
      // Hugging Face analysis disabled temporarily
      let huggingFaceAnalysis = null;
      console.log('⚠️ Hugging Face analysis disabled temporarily');
      
      // Try Groq analysis (optional)
      let groqAnalysis = null;
      try {
        groqAnalysis = await this.getGroqAnalysis(marketData, inflationData, upcomingEvents);
      } catch (error) {
        console.log('⚠️ Groq analysis skipped:', error.message);
        // Continue with other AI providers
      }
      
      // Combine results
      const combinedAnalysis = this.combineAnalysisResults(veniceAnalysis, huggingFaceAnalysis, groqAnalysis);
      
      // Add timestamp
      combinedAnalysis.timestamp = new Date().toISOString();
      
      await this.saveAnalysis(combinedAnalysis);
      console.log('✅ Multi-AI analysis completed successfully');
      
      return combinedAnalysis;
    } catch (error) {
      console.error('❌ Multi-AI analysis failed:', error.message);
      throw error;
    }
  }

  // Get Venice AI analysis
  async getVeniceAnalysis(marketData, inflationData, upcomingEvents) {
    try {
      console.log('🔮 Getting Venice AI analysis...');
      
      // Create comprehensive prompt for AI analysis
      const prompt = this.createAnalysisPrompt(marketData, inflationData, upcomingEvents);
      
      // Call Venice AI for complete analysis
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
          
          // Parse AI response
          const analysis = JSON.parse(cleanContent);
          
          // Validate and structure the response
          const structuredAnalysis = this.validateAndStructureAnalysis(analysis);
          structuredAnalysis.provider = 'Venice AI';
          
          return structuredAnalysis;
        } catch (parseError) {
          console.error('❌ Failed to parse Venice AI response:', parseError.message);
          throw new Error('Venice AI response format invalid');
        }
      } else {
        throw new Error('Invalid Venice AI response structure');
      }
    } catch (error) {
      console.error('❌ Venice AI analysis failed:', error.message);
      throw error;
    }
  }

  // Get Hugging Face analysis
  async getHuggingFaceAnalysis(marketData, inflationData, upcomingEvents) {
    try {
      console.log('🤗 Getting Hugging Face analysis...');
      
      const analysis = await this.huggingFaceService.generateMarketAnalysis(
        marketData, 
        inflationData, 
        upcomingEvents
      );
      
      analysis.provider = 'Hugging Face';
      return analysis;
    } catch (error) {
      console.error('❌ Hugging Face analysis failed:', error.message);
      throw error;
    }
  }

  // Get Groq analysis
  async getGroqAnalysis(marketData, inflationData, upcomingEvents) {
    try {
      console.log('🚀 Getting Groq analysis...');
      
      const analysis = await this.groqService.generateMarketAnalysis(
        marketData, 
        inflationData, 
        upcomingEvents
      );
      
      analysis.provider = 'Groq';
      return analysis;
    } catch (error) {
      console.error('❌ Groq analysis failed:', error.message);
      throw error;
    }
  }

  // Combine analysis results from multiple AI providers
  combineAnalysisResults(veniceAnalysis, huggingFaceAnalysis, groqAnalysis) {
    const combined = {
      overall_direction: this.getConsensusDirection(veniceAnalysis, huggingFaceAnalysis, groqAnalysis),
      overall_confidence: this.getConsensusConfidence(veniceAnalysis, huggingFaceAnalysis, groqAnalysis),
      overall_reasoning: this.combineReasoning(veniceAnalysis, huggingFaceAnalysis, groqAnalysis),
      short_term: this.combineTimeframe(veniceAnalysis?.short_term, huggingFaceAnalysis?.short_term, groqAnalysis?.short_term),
      medium_term: this.combineTimeframe(veniceAnalysis?.medium_term, huggingFaceAnalysis?.medium_term, groqAnalysis?.medium_term),
      long_term: this.combineTimeframe(veniceAnalysis?.long_term, huggingFaceAnalysis?.long_term, groqAnalysis?.long_term),
      providers: {
        venice: veniceAnalysis,
        huggingface: huggingFaceAnalysis,
        groq: groqAnalysis
      }
    };

    return combined;
  }

  // Get consensus direction from multiple analyses
  getConsensusDirection(veniceAnalysis, huggingFaceAnalysis, groqAnalysis) {
    const analyses = [veniceAnalysis, huggingFaceAnalysis, groqAnalysis].filter(Boolean);
    if (analyses.length === 0) return 'NEUTRAL';
    if (analyses.length === 1) return analyses[0].overall_direction;
    
    // Count directions
    const directions = analyses.map(a => a.overall_direction);
    const bullishCount = directions.filter(d => d === 'BULLISH').length;
    const bearishCount = directions.filter(d => d === 'BEARISH').length;
    const neutralCount = directions.filter(d => d === 'NEUTRAL').length;
    
    // If majority agree, use that direction
    if (bullishCount > bearishCount && bullishCount > neutralCount) return 'BULLISH';
    if (bearishCount > bullishCount && bearishCount > neutralCount) return 'BEARISH';
    if (neutralCount > bullishCount && neutralCount > bearishCount) return 'NEUTRAL';
    
    // If tied, use weighted consensus based on confidence
    const weightedScores = { BULLISH: 0, BEARISH: 0, NEUTRAL: 0 };
    
    analyses.forEach(analysis => {
      const direction = analysis.overall_direction;
      const confidence = analysis.overall_confidence || 50;
      weightedScores[direction] += confidence;
    });
    
    // Return the direction with highest weighted score
    const bestDirection = Object.keys(weightedScores).reduce((a, b) => 
      weightedScores[a] > weightedScores[b] ? a : b
    );
    
    return bestDirection;
  }

  // Get consensus confidence from multiple analyses
  getConsensusConfidence(veniceAnalysis, huggingFaceAnalysis, groqAnalysis) {
    const analyses = [veniceAnalysis, huggingFaceAnalysis, groqAnalysis].filter(Boolean);
    if (analyses.length === 0) return 50;
    if (analyses.length === 1) return analyses[0].overall_confidence || 50;
    
    // Average confidence when multiple are available
    const totalConfidence = analyses.reduce((sum, analysis) => sum + (analysis.overall_confidence || 50), 0);
    return Math.round(totalConfidence / analyses.length);
  }

  // Combine reasoning from multiple analyses
  combineReasoning(veniceAnalysis, huggingFaceAnalysis, groqAnalysis) {
    const analyses = [veniceAnalysis, huggingFaceAnalysis, groqAnalysis].filter(Boolean);
    if (analyses.length === 0) return 'Multi-AI analysis completed with consensus prediction.';
    if (analyses.length === 1) return analyses[0].overall_reasoning || 'Analysis completed.';
    
    // Combine reasoning from all available analyses
    const reasoningParts = analyses.map((analysis, index) => {
      const provider = analysis.provider || `AI ${index + 1}`;
      const reasoning = analysis.overall_reasoning || 'Analysis completed.';
      return `${provider}: ${reasoning.substring(0, 150)}...`;
    });
    
    return reasoningParts.join(' ');
  }

  // Combine timeframe analysis from multiple providers
  combineTimeframe(veniceTimeframe, huggingFaceTimeframe, groqTimeframe) {
    const timeframes = [veniceTimeframe, huggingFaceTimeframe, groqTimeframe].filter(Boolean);
    if (timeframes.length === 0) {
      return {
        market_direction: 'NEUTRAL',
        confidence: 50,
        time_horizon: '1-7 days',
        key_factors: [],
        risk_factors: [],
        reasoning: 'No analysis available'
      };
    }
    
    if (timeframes.length === 1) return timeframes[0];
    
    // Combine multiple timeframes
    const directions = timeframes.map(t => t.market_direction);
    const bullishCount = directions.filter(d => d === 'BULLISH').length;
    const bearishCount = directions.filter(d => d === 'BEARISH').length;
    const neutralCount = directions.filter(d => d === 'NEUTRAL').length;
    
    let consensusDirection = 'NEUTRAL';
    if (bullishCount > bearishCount && bullishCount > neutralCount) consensusDirection = 'BULLISH';
    else if (bearishCount > bullishCount && bearishCount > neutralCount) consensusDirection = 'BEARISH';
    
    const avgConfidence = Math.round(timeframes.reduce((sum, t) => sum + (t.confidence || 50), 0) / timeframes.length);
    const allKeyFactors = [...new Set(timeframes.flatMap(t => t.key_factors || []))].slice(0, 6);
    const allRiskFactors = [...new Set(timeframes.flatMap(t => t.risk_factors || []))].slice(0, 5);
    
    return {
      market_direction: consensusDirection,
      confidence: avgConfidence,
      time_horizon: timeframes[0].time_horizon || '1-7 days',
      key_factors: allKeyFactors,
      risk_factors: allRiskFactors,
      reasoning: `Multi-AI consensus: ${consensusDirection} with ${avgConfidence}% confidence based on ${timeframes.length} AI providers.`
    };
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
4. **Macro Factors**: Evaluate DXY (dollar strength), Treasury yields, equity markets, and oil prices
5. **Inflation Impact**: Assess how inflation data affects crypto markets specifically
6. **Technical Indicators**: Consider price levels, volume, and market structure
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
  "overall_reasoning": "CLEAR, USER-FRIENDLY explanation in simple terms: 1) What the current Bitcoin price means for investors, 2) How Bitcoin's market dominance affects other cryptocurrencies, 3) The main economic factors influencing crypto right now, 4) Whether this is a good time to buy, sell, or hold, 5) What investors should watch out for. Use everyday language, avoid jargon, and focus on practical implications.",
  "short_term": {
    "market_direction": "BEARISH|BULLISH|NEUTRAL",
    "confidence": 75,
    "time_horizon": "1-7 days",
    "key_factors": ["Clear, simple factor 1", "Clear, simple factor 2", "Clear, simple factor 3", "Clear, simple factor 4", "Clear, simple factor 5", "Clear, simple factor 6"],
    "risk_factors": ["Clear risk 1", "Clear risk 2", "Clear risk 3", "Clear risk 4", "Clear risk 5"],
    "reasoning": "SIMPLE, PRACTICAL explanation: 1) What to expect in the next few days, 2) Key price levels to watch, 3) Trading volume insights, 4) Upcoming events that matter, 5) How much volatility to expect. Use plain language and focus on actionable insights."
  },
  "medium_term": {
    "market_direction": "BEARISH|BULLISH|NEUTRAL",
    "confidence": 80,
    "time_horizon": "1-4 weeks",
    "key_factors": ["Clear, simple factor 1", "Clear, simple factor 2", "Clear, simple factor 3", "Clear, simple factor 4", "Clear, simple factor 5", "Clear, simple factor 6"],
    "risk_factors": ["Clear risk 1", "Clear risk 2", "Clear risk 3", "Clear risk 4", "Clear risk 5"],
    "reasoning": "SIMPLE, PRACTICAL explanation: 1) What to expect over the next few weeks, 2) Important events coming up, 3) How the market structure looks, 4) Whether big investors are buying or selling, 5) How regulations might affect prices. Use plain language and focus on what matters to regular investors."
  },
  "long_term": {
    "market_direction": "BEARISH|BULLISH|NEUTRAL",
    "confidence": 70,
    "time_horizon": "1-6 months",
    "key_factors": ["Clear, simple factor 1", "Clear, simple factor 2", "Clear, simple factor 3", "Clear, simple factor 4", "Clear, simple factor 5", "Clear, simple factor 6"],
    "risk_factors": ["Clear risk 1", "Clear risk 2", "Clear risk 3", "Clear risk 4", "Clear risk 5"],
    "reasoning": "SIMPLE, PRACTICAL explanation: 1) Long-term trend outlook, 2) How adoption is growing, 3) Where we are in the economic cycle, 4) How regulations are evolving, 5) Technology improvements coming. Use plain language and focus on what long-term investors need to know."
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
- **MUST** check news and other sources for any major events that could impact the market
- **MUST** analyze BTC price levels and 24h changes specifically
- **MUST** evaluate Bitcoin dominance (BTC.D) percentage and implications
- **MUST** consider Fear & Greed Index for market sentiment
- **MUST** assess VIX volatility impact on crypto markets
- **MUST** evaluate DXY dollar strength correlation with crypto
- **MUST** analyze Treasury yield impact on risk assets
- **MUST** consider equity market correlation (SP500, NASDAQ)
- **MUST** assess oil price impact on inflation and crypto
- **MUST** assess future planned economic events and their impact on the crypto market
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
        // Get current price
        const currentPrices = await getCryptoPrices(symbol, 1);
        if (currentPrices && currentPrices.length > 0) {
          const currentPrice = parseFloat(currentPrices[0].price);
          
          // Get price at the time of prediction (or closest available)
          const predictionTime = new Date(latestAnalysis.timestamp);
          const timeDiff = Date.now() - predictionTime.getTime();
          
          // If prediction was made more than 1 hour ago, we can do a meaningful backtest
          if (timeDiff > 60 * 60 * 1000) {
            // Get historical price data around prediction time
            const historicalPrices = await getCryptoPrices(symbol, 10);
            let predictionPrice = currentPrice; // fallback
            
            if (historicalPrices && historicalPrices.length > 1) {
              // Find the price closest to prediction time
              const predictionPriceData = historicalPrices.find(p => 
                Math.abs(new Date(p.timestamp).getTime() - predictionTime.getTime()) < 24 * 60 * 60 * 1000
              );
              if (predictionPriceData) {
                predictionPrice = parseFloat(predictionPriceData.price);
              } else {
                // Use the oldest available price as prediction price
                predictionPrice = parseFloat(historicalPrices[historicalPrices.length - 1].price);
              }
            }
            
            // Determine actual direction based on price change since prediction
            const actualDirection = currentPrice > predictionPrice ? 'BULLISH' : 'BEARISH';
            
            // Calculate accuracy
            const accuracy = predictedDirection === actualDirection ? 100 : 0;
            
            // Calculate correlation score
            const priceChange = ((currentPrice - predictionPrice) / predictionPrice) * 100;
            const correlationScore = this.calculateCorrelationScore(predictedDirection, priceChange);
          
            const result = {
              prediction_date: latestAnalysis.timestamp,
              actual_date: new Date().toISOString(),
              predicted_direction: predictedDirection,
              actual_direction: actualDirection,
              accuracy: accuracy,
              crypto_symbol: symbol,
              price_at_prediction: predictionPrice,
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
            
            console.log(`✅ Backtest for ${symbol}: ${predictedDirection} → ${actualDirection} (${accuracy}% accuracy, ${correlationScore}% correlation)`);
          } else {
            console.log(`⏳ Skipping backtest for ${symbol}: prediction too recent (${Math.round(timeDiff / (60 * 1000))} minutes ago)`);
          }
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
    } else if (priceChange === 0) {
      // If price didn't change, give partial credit based on prediction accuracy
      // This handles the case where prediction is correct but price is stable
      score = 25; // Base score for correct direction with no price movement
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

      // Return the multi-timeframe format with providers data
      if (analysisData && (analysisData.short_term || analysisData.medium_term || analysisData.long_term)) {
        return {
          timestamp: latestAnalysis.timestamp,
          overall_direction: analysisData.overall_direction,
          overall_confidence: analysisData.overall_confidence,
          short_term: analysisData.short_term,
          medium_term: analysisData.medium_term,
          long_term: analysisData.long_term,
          providers: analysisData.providers // Include providers data for multi-model display
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
      const correctPredictions = results.filter(r => parseInt(r.accuracy) === 100).length;
      const overallAccuracy = (correctPredictions / totalPredictions) * 100;

      // Calculate average correlation score
      const avgCorrelation = results.reduce((sum, r) => sum + parseInt(r.correlation_score), 0) / totalPredictions;

      // Group by crypto symbol
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
      const bySymbol = {};
      cryptoSymbols.forEach(symbol => {
        const symbolResults = results.filter(r => r.crypto_symbol === symbol);
        if (symbolResults.length > 0) {
          bySymbol[symbol] = {
            accuracy: (symbolResults.filter(r => parseInt(r.accuracy) === 100).length / symbolResults.length) * 100,
            avgCorrelation: symbolResults.reduce((sum, r) => sum + parseInt(r.correlation_score), 0) / symbolResults.length,
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