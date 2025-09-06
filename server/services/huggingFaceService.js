const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGING_FACE_TOKEN;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    
    // Financial analysis models
    this.models = {
      sentiment: 'ProsusAI/finbert',
      analysis: 'microsoft/DialoGPT-medium',
      financial: 'yiyanghkust/finbert-tone'
    };
    
    console.log('🤗 Hugging Face Configuration:');
    console.log('  API Key:', this.apiKey ? '✅ Configured' : '❌ Missing');
    console.log('  Base URL:', this.baseUrl);
  }

  // Analyze market sentiment using financial models
  async analyzeMarketSentiment(marketData) {
    try {
      if (!this.apiKey) {
        throw new Error('Hugging Face API key not configured');
      }

      // Prepare market data for sentiment analysis
      const marketText = this.prepareMarketText(marketData);
      
      // Use financial sentiment model
      const sentimentResponse = await this.callModel(this.models.financial, {
        inputs: marketText,
        parameters: {
          return_all_scores: true,
          max_length: 512
        }
      });

      return this.parseSentimentResponse(sentimentResponse);
    } catch (error) {
      console.error('Hugging Face sentiment analysis failed:', error.message);
      throw error;
    }
  }

  // Generate market analysis using Hugging Face models
  async generateMarketAnalysis(marketData, inflationData = null, upcomingEvents = null) {
    try {
      if (!this.apiKey) {
        throw new Error('Hugging Face API key not configured');
      }

      // Prepare comprehensive market context
      const marketContext = this.prepareMarketContext(marketData, inflationData, upcomingEvents);
      
      // Use a more capable model for analysis
      const analysisResponse = await this.callModel(this.models.analysis, {
        inputs: marketContext,
        parameters: {
          max_length: 1000,
          temperature: 0.7,
          do_sample: true
        }
      });

      return this.parseAnalysisResponse(analysisResponse, marketData);
    } catch (error) {
      console.error('Hugging Face market analysis failed:', error.message);
      throw error;
    }
  }

  // Call Hugging Face model
  async callModel(modelName, payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${modelName}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 503) {
        // Model is loading, wait and retry
        console.log('Model is loading, waiting 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        return this.callModel(modelName, payload);
      } else if (error.response?.status === 404) {
        // Model not found
        console.error(`Model ${modelName} not found`);
        throw new Error(`Hugging Face model ${modelName} not found`);
      }
      throw error;
    }
  }

  // Prepare market data as text for sentiment analysis
  prepareMarketText(marketData) {
    const texts = [];
    
    if (marketData.cryptoPrices) {
      marketData.cryptoPrices.forEach(crypto => {
        const change = crypto.change_24h > 0 ? 'increased' : 'decreased';
        texts.push(`${crypto.symbol} price ${change} by ${Math.abs(crypto.change_24h).toFixed(2)}% to $${crypto.price}`);
      });
    }

    if (marketData.fearGreedIndex) {
      const sentiment = marketData.fearGreedIndex.value < 25 ? 'extreme fear' : 
                      marketData.fearGreedIndex.value < 45 ? 'fear' :
                      marketData.fearGreedIndex.value < 55 ? 'neutral' :
                      marketData.fearGreedIndex.value < 75 ? 'greed' : 'extreme greed';
      texts.push(`Market sentiment shows ${sentiment} with Fear & Greed Index at ${marketData.fearGreedIndex.value}`);
    }

    if (marketData.bitcoinDominance) {
      texts.push(`Bitcoin dominance is at ${marketData.bitcoinDominance}%`);
    }

    return texts.join('. ') + '.';
  }

  // Prepare comprehensive market context for analysis
  prepareMarketContext(marketData, inflationData, upcomingEvents) {
    const context = [];
    
    // Market data summary
    context.push('CRYPTOCURRENCY MARKET ANALYSIS:');
    
    if (marketData.cryptoPrices) {
      context.push('Current crypto prices:');
      marketData.cryptoPrices.slice(0, 5).forEach(crypto => {
        context.push(`- ${crypto.symbol}: $${crypto.price} (${crypto.change_24h > 0 ? '+' : ''}${crypto.change_24h.toFixed(2)}%)`);
      });
    }

    if (marketData.fearGreedIndex) {
      context.push(`Fear & Greed Index: ${marketData.fearGreedIndex.value} (${marketData.fearGreedIndex.sentiment})`);
    }

    if (marketData.bitcoinDominance) {
      context.push(`Bitcoin Dominance: ${marketData.bitcoinDominance}%`);
    }

    // Inflation data
    if (inflationData) {
      context.push('Inflation Data:');
      if (inflationData.cpi) {
        context.push(`- CPI: ${inflationData.cpi.value}% (${inflationData.cpi.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(inflationData.cpi.change).toFixed(2)}%)`);
      }
      if (inflationData.pce) {
        context.push(`- PCE: ${inflationData.pce.value}% (${inflationData.pce.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(inflationData.pce.change).toFixed(2)}%)`);
      }
    }

    // Upcoming events
    if (upcomingEvents && upcomingEvents.length > 0) {
      context.push('Upcoming Market Events:');
      upcomingEvents.slice(0, 3).forEach(event => {
        context.push(`- ${event.title} (${event.category}, ${event.impact} impact)`);
      });
    }

    return context.join('\n');
  }

  // Parse sentiment analysis response
  parseSentimentResponse(response) {
    if (!response || !Array.isArray(response)) {
      return { sentiment: 'neutral', confidence: 50 };
    }

    // Find the highest scoring sentiment
    const sentiments = response[0] || [];
    const sortedSentiments = sentiments.sort((a, b) => b.score - a.score);
    const topSentiment = sortedSentiments[0];

    return {
      sentiment: topSentiment.label.toLowerCase(),
      confidence: Math.round(topSentiment.score * 100),
      allScores: sentiments
    };
  }

  // Parse analysis response and create structured output
  parseAnalysisResponse(response, marketData) {
    // Extract the generated text
    const generatedText = response.generated_text || response[0]?.generated_text || '';
    
    // Create a structured analysis based on the generated text
    const analysis = {
      overall_direction: this.extractDirection(generatedText),
      overall_confidence: this.extractConfidence(generatedText),
      overall_reasoning: generatedText.substring(0, 500) + '...',
      short_term: {
        market_direction: this.extractDirection(generatedText),
        confidence: this.extractConfidence(generatedText),
        time_horizon: '1-7 days',
        key_factors: this.extractKeyFactors(generatedText),
        risk_factors: this.extractRiskFactors(generatedText),
        reasoning: generatedText.substring(0, 300) + '...'
      },
      medium_term: {
        market_direction: this.extractDirection(generatedText),
        confidence: Math.max(this.extractConfidence(generatedText) - 10, 30),
        time_horizon: '1-4 weeks',
        key_factors: this.extractKeyFactors(generatedText),
        risk_factors: this.extractRiskFactors(generatedText),
        reasoning: generatedText.substring(0, 300) + '...'
      },
      long_term: {
        market_direction: this.extractDirection(generatedText),
        confidence: Math.max(this.extractConfidence(generatedText) - 20, 20),
        time_horizon: '1-6 months',
        key_factors: this.extractKeyFactors(generatedText),
        risk_factors: this.extractRiskFactors(generatedText),
        reasoning: generatedText.substring(0, 300) + '...'
      }
    };

    return analysis;
  }

  // Extract market direction from text
  extractDirection(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('bullish') || lowerText.includes('positive') || lowerText.includes('upward')) {
      return 'BULLISH';
    } else if (lowerText.includes('bearish') || lowerText.includes('negative') || lowerText.includes('downward')) {
      return 'BEARISH';
    }
    return 'NEUTRAL';
  }

  // Extract confidence score from text
  extractConfidence(text) {
    const confidenceMatch = text.match(/(\d+)%/);
    if (confidenceMatch) {
      return Math.min(Math.max(parseInt(confidenceMatch[1]), 0), 100);
    }
    return 65; // Default confidence
  }

  // Extract key factors from text
  extractKeyFactors(text) {
    const factors = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('bitcoin') || lowerText.includes('btc')) factors.push('Bitcoin price movement');
    if (lowerText.includes('dominance')) factors.push('Bitcoin dominance changes');
    if (lowerText.includes('fear') || lowerText.includes('greed')) factors.push('Market sentiment (Fear & Greed)');
    if (lowerText.includes('inflation')) factors.push('Inflation data impact');
    if (lowerText.includes('volume')) factors.push('Trading volume analysis');
    if (lowerText.includes('support') || lowerText.includes('resistance')) factors.push('Technical levels');
    
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
    
    return risks.length > 0 ? risks : ['Market volatility', 'Regulatory uncertainty'];
  }

}

module.exports = HuggingFaceService;
