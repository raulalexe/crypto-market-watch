const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_TOKEN;
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.model = 'llama-3.3-70b-versatile'; // Using Llama 3.3 70B model
    
    console.log('🚀 Groq Configuration:');
    console.log('  API Key:', this.apiKey ? '✅ Configured' : '❌ Missing');
    console.log('  Base URL:', this.baseUrl);
    console.log('  Model:', this.model);
  }

  // Generate market analysis using Groq
  async generateMarketAnalysis(marketData, inflationData = null, upcomingEvents = null) {
    try {
      if (!this.apiKey) {
        throw new Error('Groq API key not configured');
      }

      console.log('🚀 Generating Groq market analysis...');
      
      // Prepare comprehensive market context
      const marketContext = this.prepareMarketContext(marketData, inflationData, upcomingEvents);
      
      // Create analysis prompt
      const prompt = this.createAnalysisPrompt(marketContext);
      
      // Call Groq API
      const response = await this.callGroqAPI(prompt);
      
      // Parse and structure the response
      return this.parseAnalysisResponse(response, marketData);
    } catch (error) {
      console.error('Groq market analysis failed:', error.message);
      throw error;
    }
  }

  // Call Groq API with improved error handling and retry logic
  async callGroqAPI(prompt, retryCount = 0) {
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds
    
    try {
      // Log request details for debugging large requests
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional cryptocurrency market analyst with deep expertise in financial markets, technical analysis, and macroeconomic factors. Provide detailed, data-driven analysis with specific confidence levels and reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
      };
      
      const requestSize = JSON.stringify(requestBody).length;
      if (requestSize > 50000) { // Log if request is larger than 50KB
        console.log(`⚠️ Large Groq request: ${requestSize} bytes (${Math.round(requestSize/1024)}KB)`);
      }
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      const status = error.response?.status;
      const shouldRetry = retryCount < maxRetries && (status === 429 || status === 500 || status === 502 || status === 503);
      
      if (shouldRetry) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`⚠️ Groq API error ${status}, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callGroqAPI(prompt, retryCount + 1);
      }
      
      // Log detailed error information for debugging
      const errorDetails = {
        status: status,
        statusText: error.response?.statusText,
        message: error.message,
        responseData: error.response?.data,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        requestHeaders: error.config?.headers ? Object.keys(error.config.headers) : null
      };
      
      if (status === 500) {
        console.error('🔥 Groq server error (500) - API service temporarily unavailable');
        console.error('📋 Error details:', JSON.stringify(errorDetails, null, 2));
      } else if (status === 401) {
        console.error('🔑 Groq authentication error (401) - check API key configuration');
        console.error('📋 Error details:', JSON.stringify(errorDetails, null, 2));
      } else if (status === 403) {
        console.error('🚫 Groq access forbidden (403) - check API key permissions or quota');
        console.error('📋 Error details:', JSON.stringify(errorDetails, null, 2));
      } else if (status === 429) {
        console.error('🚦 Groq rate limit exceeded (429) - all retries exhausted');
        console.error('📋 Error details:', JSON.stringify(errorDetails, null, 2));
      } else {
        console.error(`❌ Groq API error ${status}:`, error.message);
        console.error('📋 Full error details:', JSON.stringify(errorDetails, null, 2));
      }
      
      // Log to database for persistent debugging
      try {
        const ErrorLogger = require('./errorLogger');
        const errorLogger = new ErrorLogger();
        await errorLogger.logApiFailure('Groq', 'chat/completions', error, errorDetails);
      } catch (logError) {
        console.error('Failed to log Groq error to database:', logError.message);
      }
      
      throw error;
    }
  }

  // Analyze crypto news event for market impact
  async analyzeNewsEvent(article) {
    try {
      if (!this.apiKey) {
        throw new Error('Groq API key not configured');
      }

      const prompt = this.createNewsAnalysisPrompt(article);
      const response = await this.callGroqAPI(prompt);
      
      return this.parseNewsAnalysisResponse(response);
    } catch (error) {
      console.error('Groq news analysis failed:', error.message);
      throw error;
    }
  }

  // Batch analyze multiple articles in a single API call
  async batchAnalyzeNewsEvents(articles) {
    try {
      if (!this.apiKey) {
        throw new Error('Groq API key not configured');
      }

      if (!articles || articles.length === 0) {
        return [];
      }

      const prompt = this.createBatchNewsAnalysisPrompt(articles);
      const response = await this.callGroqAPI(prompt);
      
      return this.parseBatchNewsAnalysisResponse(response, articles.length);
    } catch (error) {
      const errorInfo = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        articlesCount: articles.length,
        promptLength: this.createBatchNewsAnalysisPrompt(articles)?.length
      };
      
      console.error('Groq batch news analysis error:', error.message);
      console.error('📋 Batch analysis error details:', JSON.stringify(errorInfo, null, 2));
      
      // Log to database for debugging
      try {
        const ErrorLogger = require('./errorLogger');
        const errorLogger = new ErrorLogger();
        await errorLogger.logApiFailure('Groq', 'batch-news-analysis', error, errorInfo);
      } catch (logError) {
        console.error('Failed to log batch analysis error:', logError.message);
      }
      
      throw error;
    }
  }

  // Create news analysis prompt
  createNewsAnalysisPrompt(article) {
    return `You are a cryptocurrency market analyst. Analyze this news article and respond with ONLY valid JSON.

Article Title: ${article.title}
Article Description: ${article.description}
Source: ${article.source}
Published: ${article.publishedAt}

IMPORTANT: Respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown formatting.

Required JSON format:
{
  "significance": 0.8,
  "marketImpact": 0.7,
  "category": "regulation",
  "affectedCryptos": ["BTC", "ETH"],
  "priceImpact": "bearish",
  "confidence": 0.75,
  "keyPoints": [
    "Regulatory uncertainty may cause short-term volatility",
    "Long-term impact depends on final regulations"
  ]
}

Guidelines:
- significance: 0-1 (how important this news is)
- marketImpact: 0-1 (how much it will affect markets)
- category: one of: hack, regulation, market, institutional, technical, exchange, general
- affectedCryptos: array of cryptocurrency symbols (e.g., ["BTC", "ETH", "SOL"])
- priceImpact: bullish, bearish, or neutral
- confidence: 0-1 (how confident you are in this analysis)
- keyPoints: array of strings describing main implications

Respond with valid JSON only:`;
  }

  // Parse news analysis response
  parseNewsAnalysisResponse(response) {
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON from response - try multiple patterns
      let jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Try to find JSON-like structure
        const lines = cleanResponse.split('\n');
        const jsonStart = lines.findIndex(line => line.trim().startsWith('{'));
        const jsonEnd = lines.findIndex(line => line.trim().endsWith('}'));
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
          jsonMatch = [lines.slice(jsonStart, jsonEnd + 1).join('\n')];
        }
      }
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      const normalizedAnalysis = {
        significance: typeof analysis.significance === 'number' ? analysis.significance : 0.5,
        marketImpact: typeof analysis.marketImpact === 'number' ? analysis.marketImpact : 0.5,
        category: analysis.category || 'general',
        affectedCryptos: Array.isArray(analysis.affectedCryptos) ? analysis.affectedCryptos : [],
        priceImpact: analysis.priceImpact || 'neutral',
        confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
        keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : ['Analysis completed']
      };
      
      return normalizedAnalysis;
    } catch (error) {
      console.error('Error parsing news analysis response:', error.message);
      console.error('Raw response:', response);
      
      // Return default analysis if parsing fails
      return {
        significance: 0.5,
        marketImpact: 0.5,
        category: 'general',
        affectedCryptos: [],
        priceImpact: 'neutral',
        confidence: 0.3,
        keyPoints: ['Analysis failed - manual review required']
      };
    }
  }

  // Prepare market context for analysis
  prepareMarketContext(marketData, inflationData, upcomingEvents) {
    const context = {
      cryptoPrices: marketData.cryptoPrices || [],
      fearGreedIndex: marketData.fearGreedIndex,
      bitcoinDominance: marketData.bitcoin_dominance,
      stablecoinMetrics: marketData.stablecoin_metrics,
      exchangeFlows: marketData.exchange_flows,
      marketSentiment: marketData.market_sentiment,
      derivatives: marketData.derivatives,
      onchain: marketData.onchain,
      inflationData: inflationData,
      upcomingEvents: upcomingEvents || []
    };

    return context;
  }

  // Create analysis prompt
  createAnalysisPrompt(marketContext) {
    let prompt = `Analyze the current cryptocurrency market conditions and provide a comprehensive market analysis. Here's the current market data:

## Current Market Data:
`;

    // Add crypto prices
    if (marketContext.cryptoPrices && marketContext.cryptoPrices.length > 0) {
      prompt += `\n### Cryptocurrency Prices:\n`;
      marketContext.cryptoPrices.slice(0, 10).forEach(crypto => {
        prompt += `- ${crypto.symbol}: $${crypto.price} (${crypto.change_24h > 0 ? '+' : ''}${crypto.change_24h}%)\n`;
      });
    }

    // Add Fear & Greed Index
    if (marketContext.fearGreedIndex) {
      prompt += `\n### Market Sentiment:\n`;
      prompt += `- Fear & Greed Index: ${marketContext.fearGreedIndex.value} (${marketContext.fearGreedIndex.classification})\n`;
    }

    // Add Bitcoin dominance
    if (marketContext.bitcoinDominance) {
      prompt += `- Bitcoin Dominance: ${marketContext.bitcoinDominance}%\n`;
    }

    // Add upcoming events
    if (marketContext.upcomingEvents && marketContext.upcomingEvents.length > 0) {
      prompt += `\n### Upcoming Events:\n`;
      marketContext.upcomingEvents.slice(0, 5).forEach(event => {
        prompt += `- ${event.title} (${event.date})\n`;
      });
    }

    // Add inflation data
    if (marketContext.inflationData) {
      prompt += `\n### Inflation Data:\n`;
      if (marketContext.inflationData.cpi) {
        prompt += `- CPI: ${marketContext.inflationData.cpi.value}%\n`;
      }
      if (marketContext.inflationData.pce) {
        prompt += `- PCE: ${marketContext.inflationData.pce.value}%\n`;
      }
      if (marketContext.inflationData.ppi) {
        prompt += `- PPI: ${marketContext.inflationData.ppi.value}% (MoM: ${marketContext.inflationData.ppi.ppiMoM}%, Core MoM: ${marketContext.inflationData.ppi.corePPIMoM}%)\n`;
      }
    }

    prompt += `\n## Analysis Request:
Please provide a CLEAR, USER-FRIENDLY market analysis that regular investors can easily understand. Use simple language and avoid technical jargon.

Structure your response as follows:

1. **Overall Market Direction**: BULLISH, BEARISH, or NEUTRAL with confidence level (0-100%)
2. **Overall Reasoning**: Simple explanation in everyday language - what this means for investors, whether it's a good time to buy/sell/hold, and what to watch out for
3. **Short-term Outlook** (1-7 days): Direction, confidence, key factors (in simple terms), risk factors (in simple terms), reasoning (practical advice for the next few days)
4. **Medium-term Outlook** (1-4 weeks): Direction, confidence, key factors (in simple terms), risk factors (in simple terms), reasoning (what to expect over the next few weeks)
5. **Long-term Outlook** (1-6 months): Direction, confidence, key factors (in simple terms), risk factors (in simple terms), reasoning (long-term investment perspective)

Focus on practical insights that help regular people make informed decisions about their crypto investments.`;

    return prompt;
  }

  // Parse analysis response
  parseAnalysisResponse(response, marketData) {
    try {
      // Clean up the response first
      const cleanedResponse = this.cleanResponse(response);
      
      // Extract structured data from the cleaned response
      const analysis = {
        overall_direction: this.extractDirection(cleanedResponse),
        overall_confidence: this.extractConfidence(cleanedResponse),
        overall_reasoning: this.extractReasoning(cleanedResponse),
        short_term: this.extractTimeframe(cleanedResponse, 'short'),
        medium_term: this.extractTimeframe(cleanedResponse, 'medium'),
        long_term: this.extractTimeframe(cleanedResponse, 'long'),
        provider: 'Groq'
      };

      return analysis;
    } catch (error) {
      console.error('Error parsing Groq response:', error);
      // Return a fallback analysis
      return {
        overall_direction: 'NEUTRAL',
        overall_confidence: 50,
        overall_reasoning: 'Groq analysis completed but parsing failed. Raw response: ' + response.substring(0, 200),
        short_term: {
          market_direction: 'NEUTRAL',
          confidence: 50,
          time_horizon: '1-7 days',
          key_factors: ['Market volatility', 'Technical indicators'],
          risk_factors: ['Analysis parsing error'],
          reasoning: 'Short-term analysis based on available data.'
        },
        medium_term: {
          market_direction: 'NEUTRAL',
          confidence: 50,
          time_horizon: '1-4 weeks',
          key_factors: ['Market trends', 'Fundamental analysis'],
          risk_factors: ['Analysis parsing error'],
          reasoning: 'Medium-term analysis based on available data.'
        },
        long_term: {
          market_direction: 'NEUTRAL',
          confidence: 50,
          time_horizon: '1-6 months',
          key_factors: ['Long-term trends', 'Market fundamentals'],
          risk_factors: ['Analysis parsing error'],
          reasoning: 'Long-term analysis based on available data.'
        },
        provider: 'Groq (Parsing Error)'
      };
    }
  }

  // Clean up response formatting issues
  cleanResponse(response) {
    return response
      .replace(/^\*\*:\s*/gm, '') // Remove "**: " at start of lines
      .replace(/^\*\*/gm, '') // Remove "**" at start of lines
      .replace(/^\*\s*/gm, '') // Remove "* " at start of lines
      .replace(/^:\s*/gm, '') // Remove ": " at start of lines
      .replace(/\*\*:\s*/g, '') // Remove "**: " anywhere
      .replace(/\*\*/g, '') // Remove "**" anywhere
      .trim();
  }

  // Extract direction from response
  extractDirection(response) {
    const upperResponse = response.toUpperCase();
    
    // Look for explicit direction statements first
    const directionPatterns = [
      /MARKET OUTLOOK[:\s]*BULLISH/i,
      /MARKET OUTLOOK[:\s]*BEARISH/i,
      /MARKET OUTLOOK[:\s]*NEUTRAL/i,
      /OVERALL DIRECTION[:\s]*BULLISH/i,
      /OVERALL DIRECTION[:\s]*BEARISH/i,
      /OVERALL DIRECTION[:\s]*NEUTRAL/i,
      /MARKET DIRECTION[:\s]*BULLISH/i,
      /MARKET DIRECTION[:\s]*BEARISH/i,
      /MARKET DIRECTION[:\s]*NEUTRAL/i
    ];
    
    for (const pattern of directionPatterns) {
      const match = response.match(pattern);
      if (match) {
        const direction = match[0].toUpperCase();
        if (direction.includes('BULLISH')) return 'BULLISH';
        if (direction.includes('BEARISH')) return 'BEARISH';
        if (direction.includes('NEUTRAL')) return 'NEUTRAL';
      }
    }
    
    // Fallback to simple search but with more context
    const bullishContext = /(bullish|positive|upward|gaining|rising)/i;
    const bearishContext = /(bearish|negative|downward|declining|falling)/i;
    
    if (bullishContext.test(response) && !bearishContext.test(response)) return 'BULLISH';
    if (bearishContext.test(response) && !bullishContext.test(response)) return 'BEARISH';
    
    return 'NEUTRAL';
  }

  // Extract confidence from response
  extractConfidence(response) {
    // Look for confidence patterns
    const confidencePatterns = [
      /confidence[:\s]*(\d+)%/i,
      /confidence[:\s]*(\d+)/i,
      /(\d+)%\s*confidence/i,
      /(\d+)%\s*confident/i
    ];
    
    for (const pattern of confidencePatterns) {
      const match = response.match(pattern);
      if (match) {
        const confidence = parseInt(match[1]);
        if (confidence >= 0 && confidence <= 100) {
          return confidence;
        }
      }
    }
    
    // Fallback to any percentage found
    const confidenceMatch = response.match(/(\d+)%/);
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
  }

  // Extract reasoning from response
  extractReasoning(response) {
    const reasoningMatch = response.match(/Overall Reasoning[:\s]*(.*?)(?=\n\n|\nShort-term|$)/s);
    let reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'Groq analysis completed successfully.';
    
    // Clean up formatting issues
    reasoning = reasoning
      .replace(/^\*\*:\s*/, '') // Remove leading "**: "
      .replace(/^\*\*/, '') // Remove leading "**"
      .replace(/^\*/, '') // Remove leading "*"
      .replace(/^:\s*/, '') // Remove leading ": "
      .trim();
    
    return reasoning;
  }

  // Extract timeframe analysis
  extractTimeframe(response, timeframe) {
    const timeframeMap = {
      short: 'Short-term Outlook',
      medium: 'Medium-term Outlook', 
      long: 'Long-term Outlook'
    };
    
    const timeframeName = timeframeMap[timeframe];
    const timeframeRegex = new RegExp(`${timeframeName}[^]*?(?=Medium-term Outlook|Long-term Outlook|$)`, 'i');
    const timeframeMatch = response.match(timeframeRegex);
    
    if (!timeframeMatch) {
      return {
        market_direction: 'NEUTRAL',
        confidence: 50,
        time_horizon: timeframe === 'short' ? '1-7 days' : timeframe === 'medium' ? '1-4 weeks' : '1-6 months',
        key_factors: ['Market analysis'],
        risk_factors: ['Market volatility'],
        reasoning: `${timeframeName} analysis based on current market conditions.`
      };
    }

    const timeframeText = timeframeMatch[0];
    const direction = this.extractDirection(timeframeText);
    const confidence = this.extractConfidence(timeframeText);
    
    return {
      market_direction: direction,
      confidence: confidence,
      time_horizon: timeframe === 'short' ? '1-7 days' : timeframe === 'medium' ? '1-4 weeks' : '1-6 months',
      key_factors: this.extractKeyFactors(timeframeText),
      risk_factors: this.extractRiskFactors(timeframeText),
      reasoning: this.extractTimeframeReasoning(timeframeText)
    };
  }

  // Extract reasoning from timeframe text
  extractTimeframeReasoning(timeframeText) {
    // Look for "reasoning" (case insensitive) followed by the actual reasoning text
    const reasoningMatch = timeframeText.match(/reasoning[:\s]*(.*?)(?=\n\n|\n\d+\.|\n-|$)/is);
    if (reasoningMatch) {
      let reasoning = reasoningMatch[1].trim();
      
      // Clean up formatting artifacts
      reasoning = reasoning
        .replace(/^\*\*:\s*/, '') // Remove leading **: and space
        .replace(/^\s+/, '') // Remove any leading whitespace
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      return reasoning;
    }
    
    // Fallback: if no "reasoning:" found, try to extract text after the last bullet point
    const lines = timeframeText.split('\n');
    let reasoningStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('reasoning')) {
        reasoningStart = i;
        break;
      }
    }
    
    if (reasoningStart >= 0) {
      const reasoningLines = lines.slice(reasoningStart + 1);
      let reasoning = reasoningLines.join(' ').trim();
      
      // Clean up formatting artifacts
      reasoning = reasoning
        .replace(/^\*\*:\s*/, '') // Remove leading **: and space
        .replace(/^\s+/, '') // Remove any leading whitespace
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      return reasoning;
    }
    
    // Final fallback: return a generic message
    return 'Analysis completed based on current market conditions.';
  }

  // Extract key factors from text
  extractKeyFactors(text) {
    const factors = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('bitcoin') || lowerText.includes('btc')) factors.push('Bitcoin price movements');
    if (lowerText.includes('dominance')) factors.push('Bitcoin dominance');
    if (lowerText.includes('fear') || lowerText.includes('greed')) factors.push('Fear & Greed Index');
    if (lowerText.includes('volume')) factors.push('Trading volume');
    if (lowerText.includes('institutional')) factors.push('Institutional investment');
    if (lowerText.includes('adoption')) factors.push('Market adoption');
    if (lowerText.includes('technical')) factors.push('Technical indicators');
    if (lowerText.includes('macro')) factors.push('Macroeconomic factors');
    
    return factors.length > 0 ? factors : ['Market momentum', 'Technical indicators', 'Sentiment analysis'];
  }

  // Extract risk factors from text
  extractRiskFactors(text) {
    const risks = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('volatility')) risks.push('High market volatility');
    if (lowerText.includes('uncertainty')) risks.push('Market uncertainty');
    if (lowerText.includes('regulation')) risks.push('Regulatory risks');
    if (lowerText.includes('macro')) risks.push('Macroeconomic factors');
    if (lowerText.includes('correction')) risks.push('Market correction risk');
    
    return risks.length > 0 ? risks : ['Market volatility', 'Regulatory uncertainty'];
  }

  // Create batch news analysis prompt for multiple articles
  createBatchNewsAnalysisPrompt(articles) {
    const articlesText = articles.map((article, index) => {
      return `Article ${index + 1}:
Title: ${article.title}
Content: ${article.description || article.content || 'No content available'}
Source: ${article.source}`;
    }).join('\n\n');

    return `You are a cryptocurrency market analyst. Analyze these ${articles.length} news articles and respond with ONLY a valid JSON array.

${articlesText}

IMPORTANT: Respond with ONLY a valid JSON array. Do not include any text before or after the JSON. Do not use markdown formatting.

Required JSON array format (one object per article):
[
  {
    "significance": 0.8,
    "marketImpact": 0.7,
    "category": "regulation",
    "affectedCryptos": ["BTC", "ETH"],
    "priceImpact": "bearish",
    "confidence": 0.75,
    "keyPoints": [
      "Regulatory uncertainty may cause short-term volatility",
      "Long-term impact depends on final regulations"
    ]
  }
]

Guidelines for each analysis:
- significance: 0-1 (how important this news is)
- marketImpact: 0-1 (how much it will affect markets)
- category: one of: hack, regulation, market, institutional, technical, exchange, general
- affectedCryptos: array of cryptocurrency symbols (e.g., ["BTC", "ETH", "SOL"])
- priceImpact: bullish, bearish, or neutral
- confidence: 0-1 (how confident you are in this analysis)
- keyPoints: array of strings describing main implications

Respond with valid JSON array only:`;
  }

  // Parse batch news analysis response
  parseBatchNewsAnalysisResponse(response, expectedCount) {
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Extract JSON array from response - try multiple patterns
      let jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        // Try to find JSON-like structure
        const lines = cleanResponse.split('\n');
        const jsonStart = lines.findIndex(line => line.trim().startsWith('['));
        const jsonEnd = lines.findIndex(line => line.trim().endsWith(']'));
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
          jsonMatch = [lines.slice(jsonStart, jsonEnd + 1).join('\n')];
        }
      }
      
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const analyses = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(analyses)) {
        throw new Error('Response is not an array');
      }
      
      // Validate and normalize analyses
      const validAnalyses = analyses.slice(0, expectedCount).map((analysis, index) => {
        try {
          return {
            significance: typeof analysis.significance === 'number' ? analysis.significance : 0.5,
            marketImpact: typeof analysis.marketImpact === 'number' ? analysis.marketImpact : 0.5,
            category: analysis.category || 'general',
            affectedCryptos: Array.isArray(analysis.affectedCryptos) ? analysis.affectedCryptos : [],
            priceImpact: analysis.priceImpact || 'neutral',
            confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
            keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : ['Analysis completed']
          };
        } catch (error) {
          console.warn(`Error normalizing analysis ${index + 1}:`, error.message);
          return {
            significance: 0.5,
            marketImpact: 0.5,
            category: 'general',
            affectedCryptos: [],
            priceImpact: 'neutral',
            confidence: 0.3,
            keyPoints: ['Analysis failed - manual review required']
          };
        }
      });
      
      return validAnalyses;
    } catch (error) {
      console.error('Error parsing batch news analysis response:', error.message);
      console.error('Raw response:', response);
      
      // Return default analyses if parsing fails
      return Array(expectedCount).fill(null).map(() => ({
        significance: 0.5,
        marketImpact: 0.5,
        category: 'general',
        affectedCryptos: [],
        priceImpact: 'neutral',
        confidence: 0.3,
        keyPoints: ['Analysis failed - manual review required']
      }));
    }
  }
}

module.exports = GroqService;
