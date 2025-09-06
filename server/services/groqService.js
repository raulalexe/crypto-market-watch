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

  // Call Groq API
  async callGroqAPI(prompt) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
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
        },
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
      if (error.response?.status === 429) {
        console.log('Groq rate limit hit, waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        return this.callGroqAPI(prompt);
      }
      throw error;
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
      // Extract structured data from the response
      const analysis = {
        overall_direction: this.extractDirection(response),
        overall_confidence: this.extractConfidence(response),
        overall_reasoning: this.extractReasoning(response),
        short_term: this.extractTimeframe(response, 'short'),
        medium_term: this.extractTimeframe(response, 'medium'),
        long_term: this.extractTimeframe(response, 'long'),
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

  // Extract direction from response
  extractDirection(response) {
    const upperResponse = response.toUpperCase();
    if (upperResponse.includes('BULLISH')) return 'BULLISH';
    if (upperResponse.includes('BEARISH')) return 'BEARISH';
    return 'NEUTRAL';
  }

  // Extract confidence from response
  extractConfidence(response) {
    const confidenceMatch = response.match(/(\d+)%/);
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
  }

  // Extract reasoning from response
  extractReasoning(response) {
    const reasoningMatch = response.match(/Overall Reasoning[:\s]*(.*?)(?=\n\n|\nShort-term|$)/s);
    return reasoningMatch ? reasoningMatch[1].trim() : 'Groq analysis completed successfully.';
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
}

module.exports = GroqService;
