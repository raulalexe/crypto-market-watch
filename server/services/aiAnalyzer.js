const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

const {
  insertAIAnalysis,
  insertBacktestResult,
  getLatestAIAnalysis,
  getCryptoPrices
} = require('../database');

class AIAnalyzer {
  constructor() {
    this.veniceAiKey = process.env.VENICE_AI_API_KEY;
    this.baseUrl = 'https://api.venice.ai'; // Replace with actual Venice AI endpoint
  }

  // Analyze market data using Venice AI
  async analyzeMarketDirection(marketData) {
    try {
      if (!this.veniceAiKey) {
        console.log('Venice AI API key not configured, using fallback analysis');
        return this.fallbackAnalysis(marketData);
      }

      const prompt = this.buildAnalysisPrompt(marketData);
      
      const response = await axios.post(`${this.baseUrl}/analyze`, {
        prompt: prompt,
        model: 'market-analysis-v1',
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.veniceAiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.analysis) {
        const analysis = response.data.analysis;
        await this.saveAnalysis(analysis);
        return analysis;
      } else {
        throw new Error('Invalid response from Venice AI');
      }
    } catch (error) {
      console.error('Error in Venice AI analysis:', error.message);
      console.log('Falling back to local analysis');
      return this.fallbackAnalysis(marketData);
    }
  }

  // Build comprehensive analysis prompt
  buildAnalysisPrompt(marketData) {
    return `
    Analyze the following crypto market data and provide a market direction prediction:

    Market Data Summary:
    - DXY (US Dollar Index): ${marketData.dxy || 'N/A'}
    - 2Y Treasury Yield: ${marketData.treasury_2y || 'N/A'}%
    - 10Y Treasury Yield: ${marketData.treasury_10y || 'N/A'}%
    - S&P 500: ${marketData.sp500 || 'N/A'}
    - NASDAQ: ${marketData.nasdaq || 'N/A'}
    - VIX (Volatility): ${marketData.vix || 'N/A'}
    - Oil Price: ${marketData.oil || 'N/A'}
    - Crypto Prices: ${JSON.stringify(marketData.crypto_prices || {})}

    Please provide:
    1. Market Direction: (BULLISH/BEARISH/NEUTRAL)
    2. Confidence Level: (0-100)
    3. Key Factors: List the most important factors influencing this prediction
    4. Reasoning: Detailed explanation of the analysis
    5. Risk Factors: Potential risks to this prediction
    6. Time Horizon: Short-term (1-7 days) or Medium-term (1-4 weeks)

    Consider:
    - Macroeconomic indicators and their impact on crypto
    - Risk-on vs risk-off sentiment
    - Technical analysis patterns
    - Market correlations
    - Liquidity conditions
    - Regulatory environment
    `;
  }

  // Fallback analysis when Venice AI is not available
  async fallbackAnalysis(marketData) {
    try {
      let direction = 'NEUTRAL';
      let confidence = 50;
      let reasoning = '';
      let factors = [];

      // Analyze DXY (Dollar strength)
      if (marketData.dxy) {
        if (marketData.dxy > 105) {
          factors.push('Strong dollar - bearish for crypto');
          direction = 'BEARISH';
          confidence += 10;
        } else if (marketData.dxy < 95) {
          factors.push('Weak dollar - bullish for crypto');
          direction = 'BULLISH';
          confidence += 10;
        }
      }

      // Analyze Treasury yields
      if (marketData.treasury_2y && marketData.treasury_10y) {
        const yieldCurve = marketData.treasury_10y - marketData.treasury_2y;
        if (yieldCurve < 0) {
          factors.push('Inverted yield curve - recession risk');
          direction = 'BEARISH';
          confidence += 15;
        } else if (yieldCurve > 2) {
          factors.push('Steep yield curve - economic growth');
          direction = 'BULLISH';
          confidence += 10;
        }
      }

      // Analyze VIX (Volatility)
      if (marketData.vix) {
        if (marketData.vix > 30) {
          factors.push('High volatility - risk-off sentiment');
          direction = 'BEARISH';
          confidence += 15;
        } else if (marketData.vix < 15) {
          factors.push('Low volatility - risk-on sentiment');
          direction = 'BULLISH';
          confidence += 10;
        }
      }

      // Analyze equity markets
      if (marketData.sp500 && marketData.nasdaq) {
        factors.push('Equity market correlation analysis');
        if (marketData.sp500 > 4500 && marketData.nasdaq > 14000) {
          factors.push('Strong equity markets - positive for crypto');
          if (direction === 'NEUTRAL') direction = 'BULLISH';
          confidence += 10;
        }
      }

      // Analyze crypto prices
      if (marketData.crypto_prices && marketData.crypto_prices.BTC) {
        const btcPrice = marketData.crypto_prices.BTC;
        if (btcPrice > 50000) {
          factors.push('Bitcoin above key resistance');
          if (direction === 'NEUTRAL') direction = 'BULLISH';
          confidence += 5;
        } else if (btcPrice < 40000) {
          factors.push('Bitcoin below key support');
          direction = 'BEARISH';
          confidence += 10;
        }
      }

      // Build reasoning
      reasoning = `Analysis based on ${factors.length} key factors: ${factors.join(', ')}. `;
      reasoning += `Current market conditions suggest a ${direction.toLowerCase()} outlook with ${confidence}% confidence. `;
      reasoning += `Key considerations include macroeconomic indicators, risk sentiment, and technical levels.`;

      const analysis = {
        market_direction: direction,
        confidence: Math.min(confidence, 95),
        reasoning: reasoning,
        factors_analyzed: factors,
        time_horizon: 'Short-term (1-7 days)',
        risk_factors: [
          'Unexpected regulatory news',
          'Macroeconomic data surprises',
          'Technical breakdowns',
          'Liquidity events'
        ]
      };

      await this.saveAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error('Error in fallback analysis:', error.message);
      return null;
    }
  }

  // Save analysis to database
  async saveAnalysis(analysis) {
    try {
      await insertAIAnalysis(
        analysis.market_direction,
        analysis.confidence,
        analysis.reasoning,
        analysis.factors_analyzed
      );
      console.log('AI analysis saved to database');
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
          const predictedDirection = latestAnalysis.market_direction;
          
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

      return {
        timestamp: latestAnalysis.timestamp,
        market_direction: latestAnalysis.market_direction,
        confidence: latestAnalysis.confidence,
        reasoning: latestAnalysis.reasoning,
        factors_analyzed: JSON.parse(latestAnalysis.factors_analyzed || '[]'),
        time_horizon: 'Short-term (1-7 days)'
      };
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