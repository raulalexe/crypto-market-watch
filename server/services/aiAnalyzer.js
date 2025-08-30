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
    // Local analysis only
  }

  // Analyze market data using local analysis
  async analyzeMarketDirection(marketData) {
    try {
      return await this.fallbackAnalysis(marketData);
    } catch (error) {
      console.error('Error in local analysis:', error.message);
      return null;
    }
  }



  // Calculate overall direction based on all timeframes
  calculateOverallDirection(timeframes) {
    const directions = timeframes.map(t => t.market_direction);
    const bullish = directions.filter(d => d === 'BULLISH').length;
    const bearish = directions.filter(d => d === 'BEARISH').length;
    const neutral = directions.filter(d => d === 'NEUTRAL').length;

    if (bullish > bearish && bullish > neutral) return 'BULLISH';
    if (bearish > bullish && bearish > neutral) return 'BEARISH';
    return 'NEUTRAL';
  }

  // Calculate overall confidence based on all timeframes
  calculateOverallConfidence(timeframes) {
    const avgConfidence = timeframes.reduce((sum, t) => sum + t.confidence, 0) / timeframes.length;
    return Math.round(avgConfidence);
  }



  // Fallback analysis when Venice AI is not available
  async fallbackAnalysis(marketData) {
    try {
      // Generate predictions for different timeframes
      const shortTerm = this.analyzeShortTerm(marketData);
      const mediumTerm = this.analyzeMediumTerm(marketData);
      const longTerm = this.analyzeLongTerm(marketData);

      const analysis = {
        short_term: shortTerm,
        medium_term: mediumTerm,
        long_term: longTerm,
        timestamp: new Date().toISOString(),
        overall_direction: this.calculateOverallDirection([shortTerm, mediumTerm, longTerm]),
        overall_confidence: this.calculateOverallConfidence([shortTerm, mediumTerm, longTerm])
      };

      await this.saveAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error('Error in fallback analysis:', error.message);
      return null;
    }
  }

  // Short-term analysis (1-7 days)
  analyzeShortTerm(marketData) {
    let direction = 'NEUTRAL';
    let confidence = 50;
    let factors = [];

    // Analyze VIX (Volatility) - most important for short-term
    if (marketData.vix && typeof marketData.vix === 'number') {
      // Dynamic VIX analysis based on current market conditions
      if (marketData.vix > 35) {
        factors.push(`Very high volatility (VIX: ${marketData.vix}) - extreme risk-off sentiment`);
        direction = 'BEARISH';
        confidence += 25;
      } else if (marketData.vix > 25) {
        factors.push(`Elevated volatility (VIX: ${marketData.vix}) - risk-off sentiment`);
        direction = 'BEARISH';
        confidence += 15;
      } else if (marketData.vix < 15) {
        factors.push(`Low volatility (VIX: ${marketData.vix}) - risk-on sentiment`);
        direction = 'BULLISH';
        confidence += 10;
      } else {
        factors.push(`Normal volatility (VIX: ${marketData.vix}) - balanced market sentiment`);
        confidence += 5;
      }
    }

    // Analyze crypto price action with dynamic support/resistance
    if (marketData.crypto_prices && marketData.crypto_prices.BTC) {
      const btcPrice = marketData.crypto_prices.BTC.price || marketData.crypto_prices.BTC;
      const btcChange = marketData.crypto_prices.BTC.change_24h || 0;
      
      // Calculate dynamic support/resistance based on current price levels
      const currentPrice = btcPrice;
      const priceChange = btcChange;
      
      // Dynamic analysis based on price action
      if (priceChange > 5) {
        factors.push(`Strong Bitcoin rally (+${priceChange.toFixed(2)}%) - bullish momentum`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 15;
      } else if (priceChange > 2) {
        factors.push(`Positive Bitcoin momentum (+${priceChange.toFixed(2)}%)`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 8;
      } else if (priceChange < -5) {
        factors.push(`Sharp Bitcoin decline (${priceChange.toFixed(2)}%) - bearish pressure`);
        direction = 'BEARISH';
        confidence += 15;
      } else if (priceChange < -2) {
        factors.push(`Negative Bitcoin momentum (${priceChange.toFixed(2)}%)`);
        direction = 'BEARISH';
        confidence += 8;
      } else {
        factors.push(`Bitcoin price stable (${priceChange.toFixed(2)}%) - consolidation phase`);
        confidence += 3;
      }
      
      // Add current price context
      factors.push(`Bitcoin trading at $${currentPrice.toLocaleString()}`);
    }

    // Analyze exchange flows with context
    if (marketData.exchange_flows && Array.isArray(marketData.exchange_flows)) {
      const btcFlow = marketData.exchange_flows.find(flow => flow.asset === 'BTC');
      if (btcFlow && typeof btcFlow.value === 'number') {
        const flowValue = btcFlow.value;
        if (flowValue > 1000000) { // $1M+ outflow
          factors.push(`Strong institutional accumulation ($${(flowValue/1000000).toFixed(1)}M outflow)`);
          if (direction === 'NEUTRAL') direction = 'BULLISH';
          confidence += 12;
        } else if (flowValue > 0) {
          factors.push(`Positive exchange flows ($${(flowValue/1000000).toFixed(1)}M outflow)`);
          if (direction === 'NEUTRAL') direction = 'BULLISH';
          confidence += 6;
        } else if (flowValue < -1000000) { // $1M+ inflow
          factors.push(`Significant selling pressure ($${Math.abs(flowValue/1000000).toFixed(1)}M inflow)`);
          direction = 'BEARISH';
          confidence += 12;
        } else if (flowValue < 0) {
          factors.push(`Negative exchange flows ($${Math.abs(flowValue/1000000).toFixed(1)}M inflow)`);
          direction = 'BEARISH';
          confidence += 6;
        }
      }
    }

    // Analyze Fear & Greed Index with context
    if (marketData.fear_greed && typeof marketData.fear_greed.value === 'number') {
      const fearGreedValue = marketData.fear_greed.value;
      if (fearGreedValue < 20) {
        factors.push(`Extreme fear (${fearGreedValue}) - potential buying opportunity`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 20;
      } else if (fearGreedValue < 35) {
        factors.push(`Fear sentiment (${fearGreedValue}) - contrarian bullish signal`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 10;
      } else if (fearGreedValue > 80) {
        factors.push(`Extreme greed (${fearGreedValue}) - potential selling pressure`);
        direction = 'BEARISH';
        confidence += 20;
      } else if (fearGreedValue > 65) {
        factors.push(`Greed sentiment (${fearGreedValue}) - caution warranted`);
        direction = 'BEARISH';
        confidence += 10;
      } else {
        factors.push(`Neutral sentiment (${fearGreedValue}) - balanced market psychology`);
        confidence += 5;
      }
    }

    // Analyze market momentum across major cryptos
    if (marketData.crypto_prices) {
      const btcChange = marketData.crypto_prices.BTC?.change_24h || 0;
      const ethChange = marketData.crypto_prices.ETH?.change_24h || 0;
      const solChange = marketData.crypto_prices.SOL?.change_24h || 0;
      
      // Count positive vs negative performers
      const positiveChanges = [btcChange, ethChange, solChange].filter(change => change > 0).length;
      const negativeChanges = [btcChange, ethChange, solChange].filter(change => change < 0).length;
      
      if (positiveChanges >= 2 && Math.min(btcChange, ethChange, solChange) > 1) {
        factors.push(`Broad crypto rally - BTC: ${btcChange.toFixed(2)}%, ETH: ${ethChange.toFixed(2)}%, SOL: ${solChange.toFixed(2)}%`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 12;
      } else if (negativeChanges >= 2 && Math.max(btcChange, ethChange, solChange) < -1) {
        factors.push(`Broad crypto decline - BTC: ${btcChange.toFixed(2)}%, ETH: ${ethChange.toFixed(2)}%, SOL: ${solChange.toFixed(2)}%`);
        direction = 'BEARISH';
        confidence += 12;
      } else if (positiveChanges > negativeChanges) {
        factors.push(`Mixed but positive crypto performance`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 5;
      }
    }

    // Analyze stablecoin metrics with context
    if (marketData.stablecoin_metrics && Array.isArray(marketData.stablecoin_metrics)) {
      const totalMarketCapMetric = marketData.stablecoin_metrics.find(metric => metric.metric_type === 'total_market_cap');
      const ssrMetric = marketData.stablecoin_metrics.find(metric => metric.metric_type === 'ssr');
      
      if (totalMarketCapMetric && totalMarketCapMetric.value > 200000000000) { // $200B+
        factors.push(`Very high stablecoin market cap ($${(totalMarketCapMetric.value/1000000000).toFixed(1)}B) - significant buying power`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 10;
      } else if (totalMarketCapMetric && totalMarketCapMetric.value > 150000000000) { // $150B+
        factors.push(`High stablecoin market cap ($${(totalMarketCapMetric.value/1000000000).toFixed(1)}B) - potential buying power`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 6;
      }
      
      if (ssrMetric && ssrMetric.value < 10) {
        factors.push(`Low SSR (${ssrMetric.value.toFixed(2)}) - weak Bitcoin fundamentals`);
        direction = 'BEARISH';
        confidence += 8;
      } else if (ssrMetric && ssrMetric.value > 20) {
        factors.push(`High SSR (${ssrMetric.value.toFixed(2)}) - strong Bitcoin fundamentals`);
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 8;
      }
    }

    // Analyze upcoming events with impact assessment
    if (marketData.upcoming_events && marketData.upcoming_events.length > 0) {
      const eventsInNextWeek = marketData.upcoming_events.filter(event => 
        event.days_until <= 7
      );
      
      if (eventsInNextWeek.length > 0) {
        const highImpactCount = eventsInNextWeek.filter(e => e.impact === 'high').length;
        const mediumImpactCount = eventsInNextWeek.filter(e => e.impact === 'medium').length;
        const fedEvents = eventsInNextWeek.filter(e => e.category === 'fed').length;
        
        if (highImpactCount > 0) {
          factors.push(`${highImpactCount} high-impact events in next 7 days - potential volatility`);
          confidence += 8;
        }
        
        if (fedEvents > 0) {
          factors.push(`${fedEvents} Federal Reserve events in next 7 days - macro uncertainty`);
          confidence += 6;
        }
        
        if (mediumImpactCount > 0) {
          factors.push(`${mediumImpactCount} medium-impact events in next 7 days`);
          confidence += 3;
        }
      }
    }

    return {
      market_direction: direction,
      confidence: Math.min(confidence, 100),
      reasoning: `Short-term analysis (1-7 days): ${factors.join(', ')}`,
      factors_analyzed: factors,
      time_horizon: '1-7 days',
      risk_factors: ['High volatility', 'News catalysts', 'Technical breakouts']
    };
  }

  // Medium-term analysis (1-4 weeks)
  analyzeMediumTerm(marketData) {
    let direction = 'NEUTRAL';
    let confidence = 50;
    let factors = [];

    // Analyze DXY (US Dollar Index)
    if (marketData.dxy) {
      if (marketData.dxy > 105) {
        factors.push('Strong dollar - risk-off environment');
        direction = 'BEARISH';
        confidence += 15;
      } else if (marketData.dxy < 100) {
        factors.push('Weak dollar - risk-on environment');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 10;
      }
    }

    // Analyze Treasury yields
    if (marketData.treasury_2y && marketData.treasury_10y) {
      const yieldCurve = marketData.treasury_10y - marketData.treasury_2y;
      if (yieldCurve < 0) {
        factors.push('Inverted yield curve - recession risk');
        direction = 'BEARISH';
        confidence += 20;
      } else if (yieldCurve > 1) {
        factors.push('Steep yield curve - growth environment');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 10;
      }
    }

    // Analyze Bitcoin dominance
    if (marketData.bitcoin_dominance) {
      if (marketData.bitcoin_dominance > 55) {
        factors.push('High Bitcoin dominance - risk-off');
        direction = 'BEARISH';
        confidence += 10;
      } else if (marketData.bitcoin_dominance < 45) {
        factors.push('Low Bitcoin dominance - altcoin season');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 15;
      }
    }

    // Analyze institutional flows
    if (marketData.exchange_flows) {
      const totalInstitutionalFlow = Object.values(marketData.exchange_flows)
        .reduce((sum, flow) => sum + (flow.net_flow || 0), 0);
      
      if (totalInstitutionalFlow > 10000000) { // $10M+ net outflow
        factors.push('Strong institutional accumulation');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 12;
      } else if (totalInstitutionalFlow < -10000000) { // $10M+ net inflow
        factors.push('Institutional selling pressure');
        direction = 'BEARISH';
        confidence += 12;
      }
    }

    // Analyze derivatives market sentiment
    if (marketData.derivatives) {
      const fundingRate = marketData.derivatives.funding_rate;
      const openInterest = marketData.derivatives.open_interest;
      
      if (fundingRate > 0.01) { // 1%+ positive funding
        factors.push('High positive funding rate - bullish sentiment');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 8;
      } else if (fundingRate < -0.01) { // 1%+ negative funding
        factors.push('High negative funding rate - bearish sentiment');
        direction = 'BEARISH';
        confidence += 8;
      }
    }

    // Analyze on-chain metrics
    if (marketData.onchain) {
      const activeAddresses = marketData.onchain.active_addresses;
      const transactionVolume = marketData.onchain.transaction_volume;
      
      if (activeAddresses > 1000000 && transactionVolume > 50000000000) { // 1M+ addresses, $50B+ volume
        factors.push('High on-chain activity - strong network usage');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 10;
      }
    }

    // Analyze regulatory environment
    if (marketData.regulatory_news) {
      const positiveNews = marketData.regulatory_news.filter(news => news.sentiment === 'positive').length;
      const negativeNews = marketData.regulatory_news.filter(news => news.sentiment === 'negative').length;
      
      if (positiveNews > negativeNews) {
        factors.push('Positive regulatory developments');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 8;
      } else if (negativeNews > positiveNews) {
        factors.push('Negative regulatory developments');
        direction = 'BEARISH';
        confidence += 8;
      }
    }

    // Analyze upcoming events for medium-term
    if (marketData.upcoming_events && marketData.upcoming_events.length > 0) {
      const eventsInNextMonth = marketData.upcoming_events.filter(event => 
        event.days_until <= 30
      );
      
      if (eventsInNextMonth.length > 0) {
        const highImpactCount = eventsInNextMonth.filter(e => e.impact === 'high').length;
        const fedEvents = eventsInNextMonth.filter(e => e.category === 'Fed').length;
        
        if (highImpactCount > 2) {
          factors.push(`${highImpactCount} high-impact events in next 30 days`);
          confidence += 6;
        }
        
        if (fedEvents > 0) {
          factors.push(`${fedEvents} Federal Reserve events in next 30 days`);
          confidence += 4;
        }
      }
    }

    return {
      market_direction: direction,
      confidence: Math.min(confidence, 100),
      reasoning: `Medium-term analysis (1-4 weeks): ${factors.join(', ')}`,
      factors_analyzed: factors,
      time_horizon: '1-4 weeks',
      risk_factors: ['Macro policy changes', 'Institutional flows', 'Market structure breaks']
    };
  }

  // Long-term analysis (1-6 months)
  analyzeLongTerm(marketData) {
    let direction = 'NEUTRAL';
    let confidence = 50;
    let factors = [];

    // Analyze stablecoin metrics
    if (marketData.stablecoin_metrics) {
      if (marketData.stablecoin_metrics.ssr > 20) {
        factors.push('High SSR - strong Bitcoin fundamentals');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 15;
      } else if (marketData.stablecoin_metrics.ssr < 10) {
        factors.push('Low SSR - weak Bitcoin fundamentals');
        direction = 'BEARISH';
        confidence += 10;
      }
    }

    // Analyze adoption trends (simplified)
    if (marketData.crypto_prices && marketData.crypto_prices.BTC) {
      const btcPrice = marketData.crypto_prices.BTC;
      if (btcPrice > 60000) {
        factors.push('Bitcoin in strong uptrend');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 20;
      } else if (btcPrice < 30000) {
        factors.push('Bitcoin in bear market');
        direction = 'BEARISH';
        confidence += 25;
      }
    }

    // Analyze institutional sentiment
    if (marketData.exchange_flows && marketData.exchange_flows.btc) {
      const netFlow = marketData.exchange_flows.btc.net_flow;
      if (netFlow > 1000000) { // $1M+ net outflow
        factors.push('Strong institutional accumulation');
        if (direction === 'NEUTRAL') direction = 'BULLISH';
        confidence += 15;
      } else if (netFlow < -1000000) { // $1M+ net inflow
        factors.push('Institutional selling pressure');
        direction = 'BEARISH';
        confidence += 15;
      }
    }

    // Analyze upcoming events for long-term
    if (marketData.upcoming_events && marketData.upcoming_events.length > 0) {
      const eventsInNext6Months = marketData.upcoming_events.filter(event => 
        event.days_until <= 180
      );
      
      if (eventsInNext6Months.length > 0) {
        const halvingEvents = eventsInNext6Months.filter(e => e.category === 'Crypto' && e.title.includes('Halving')).length;
        const regulatoryEvents = eventsInNext6Months.filter(e => e.category === 'Regulation').length;
        
        if (halvingEvents > 0) {
          factors.push('Bitcoin halving event in next 6 months');
          if (direction === 'NEUTRAL') direction = 'BULLISH';
          confidence += 12;
        }
        
        if (regulatoryEvents > 3) {
          factors.push(`${regulatoryEvents} regulatory events in next 6 months`);
          confidence += 5;
        }
      }
    }

    return {
      market_direction: direction,
      confidence: Math.min(confidence, 100),
      reasoning: `Long-term analysis (1-6 months): ${factors.join(', ')}`,
      factors_analyzed: factors,
      time_horizon: '1-6 months',
      risk_factors: ['Regulatory changes', 'Macroeconomic cycles', 'Adoption slowdown']
    };
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

  // Analyze market data with release context for post-release analysis
  async analyzeMarketDataWithReleaseContext(release) {
    try {
      console.log(`Starting post-release analysis for ${release.type}`);
      
      // Get latest market data
      const { getLatestMarketData, getLatestCryptoPrices, getLatestExchangeFlows } = require('../database');
      
      const [marketData, cryptoPrices, exchangeFlows] = await Promise.all([
        getLatestMarketData(),
        getLatestCryptoPrices(),
        getLatestExchangeFlows()
      ]);

      if (!marketData || !cryptoPrices) {
        throw new Error('No market data available for post-release analysis');
      }

      // Get previous data for comparison (before release)
      const { getMarketDataBeforeTime } = require('../database');
      const releaseTime = moment(`${release.date} ${release.time}`, 'YYYY-MM-DD HH:mm');
      const beforeReleaseData = await getMarketDataBeforeTime(releaseTime.toDate());

      // Analyze market reaction to the release
      const analysisResult = await this.analyzeReleaseImpact(release, marketData, cryptoPrices, exchangeFlows, beforeReleaseData);

      // Store the post-release analysis
      await this.storePostReleaseAnalysis(release, analysisResult);

      return analysisResult;
    } catch (error) {
      console.error('Error in post-release analysis:', error);
      return {
        marketDirection: 'UNKNOWN',
        volatilityLevel: 'UNKNOWN',
        keyLevels: 'Unable to determine',
        shortTermOutlook: 'Analysis failed',
        mediumTermOutlook: 'Analysis failed',
        riskAssessment: 'High - analysis unavailable',
        recommendedActions: 'Monitor market closely',
        riskLevels: 'Unknown',
        entryExitPoints: 'Wait for clearer signals'
      };
    }
  }

  async analyzeReleaseImpact(release, currentData, cryptoPrices, exchangeFlows, beforeData) {
    try {
      // Calculate price changes since release
      const btcCurrent = cryptoPrices.find(p => p.symbol === 'BTC')?.price || 0;
      const btcBefore = beforeData?.find(p => p.symbol === 'BTC')?.price || btcCurrent;
      const btcChange = btcBefore > 0 ? ((btcCurrent - btcBefore) / btcBefore) * 100 : 0;

      const ethCurrent = cryptoPrices.find(p => p.symbol === 'ETH')?.price || 0;
      const ethBefore = beforeData?.find(p => p.symbol === 'ETH')?.price || ethCurrent;
      const ethChange = ethBefore > 0 ? ((ethCurrent - ethBefore) / ethBefore) * 100 : 0;

      // Analyze market direction
      let marketDirection = 'NEUTRAL';
      if (btcChange > 2 || ethChange > 2) marketDirection = 'BULLISH';
      else if (btcChange < -2 || ethChange < -2) marketDirection = 'BEARISH';

      // Analyze volatility
      const volatilityLevel = Math.abs(btcChange) > 5 || Math.abs(ethChange) > 5 ? 'HIGH' : 
                             Math.abs(btcChange) > 2 || Math.abs(ethChange) > 2 ? 'MEDIUM' : 'LOW';

      // Determine key levels
      const keyLevels = this.determineKeyLevels(btcCurrent, ethCurrent, btcChange, ethChange);

      // Generate outlooks
      const shortTermOutlook = this.generateShortTermOutlook(release, marketDirection, volatilityLevel);
      const mediumTermOutlook = this.generateMediumTermOutlook(release, marketDirection, btcChange, ethChange);

      // Risk assessment
      const riskAssessment = this.assessRiskLevel(release, volatilityLevel, marketDirection);

      // Recommended actions
      const recommendedActions = this.generateRecommendedActions(release, marketDirection, volatilityLevel);

      return {
        marketDirection,
        volatilityLevel,
        keyLevels,
        shortTermOutlook,
        mediumTermOutlook,
        riskAssessment,
        recommendedActions,
        riskLevels: this.determineRiskLevels(volatilityLevel),
        entryExitPoints: this.generateEntryExitPoints(marketDirection, btcCurrent, ethCurrent),
        priceChanges: {
          btc: btcChange,
          eth: ethChange
        },
        releaseType: release.type,
        analysisTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing release impact:', error);
      throw error;
    }
  }

  determineKeyLevels(btcPrice, ethPrice, btcChange, ethChange) {
    const levels = [];
    
    if (btcPrice > 0) {
      levels.push(`BTC: $${btcPrice.toLocaleString()} (${btcChange > 0 ? '+' : ''}${btcChange.toFixed(2)}%)`);
    }
    if (ethPrice > 0) {
      levels.push(`ETH: $${ethPrice.toLocaleString()} (${ethChange > 0 ? '+' : ''}${ethChange.toFixed(2)}%)`);
    }
    
    return levels.join(', ') || 'Unable to determine';
  }

  generateShortTermOutlook(release, marketDirection, volatilityLevel) {
    const outlooks = {
      CPI: {
        BULLISH: 'Inflation data may be cooling, supporting risk assets',
        BEARISH: 'Higher inflation could pressure risk assets and crypto',
        NEUTRAL: 'Inflation data in line with expectations'
      },
      PCE: {
        BULLISH: 'Fed\'s preferred measure shows controlled inflation',
        BEARISH: 'PCE data suggests persistent inflation pressure',
        NEUTRAL: 'PCE data aligns with Fed\'s inflation targets'
      }
    };

    const baseOutlook = outlooks[release.type]?.[marketDirection] || 'Market reaction unclear';
    const volatilityNote = volatilityLevel === 'HIGH' ? ' High volatility expected to continue.' : '';
    
    return baseOutlook + volatilityNote;
  }

  generateMediumTermOutlook(release, marketDirection, btcChange, ethChange) {
    const avgChange = (btcChange + ethChange) / 2;
    
    if (Math.abs(avgChange) > 5) {
      return `Strong ${marketDirection.toLowerCase()} momentum likely to continue for 1-2 weeks`;
    } else if (Math.abs(avgChange) > 2) {
      return `Moderate ${marketDirection.toLowerCase()} bias expected in coming days`;
    } else {
      return 'Sideways consolidation likely as market digests data';
    }
  }

  assessRiskLevel(release, volatilityLevel, marketDirection) {
    if (volatilityLevel === 'HIGH') {
      return 'HIGH - Extreme volatility requires careful position management';
    } else if (volatilityLevel === 'MEDIUM') {
      return 'MEDIUM - Moderate risk with potential for significant moves';
    } else {
      return 'LOW - Stable conditions, normal trading can resume';
    }
  }

  generateRecommendedActions(release, marketDirection, volatilityLevel) {
    const actions = [];
    
    if (volatilityLevel === 'HIGH') {
      actions.push('Reduce position sizes', 'Use wider stop-losses', 'Consider hedging');
    }
    
    if (marketDirection === 'BULLISH') {
      actions.push('Look for pullback entries', 'Add to long positions gradually');
    } else if (marketDirection === 'BEARISH') {
      actions.push('Wait for stabilization', 'Consider short positions on rallies');
    } else {
      actions.push('Monitor for breakout signals', 'Maintain current positions');
    }
    
    return actions.join(', ');
  }

  determineRiskLevels(volatilityLevel) {
    const levels = {
      HIGH: 'Extreme - 5-10% position sizing recommended',
      MEDIUM: 'Moderate - 10-20% position sizing recommended',
      LOW: 'Normal - Standard position sizing acceptable'
    };
    return levels[volatilityLevel] || 'Unknown';
  }

  generateEntryExitPoints(marketDirection, btcPrice, ethPrice) {
    if (marketDirection === 'BULLISH') {
      return `BTC: $${(btcPrice * 0.98).toLocaleString()} support, $${(btcPrice * 1.05).toLocaleString()} resistance | ETH: $${(ethPrice * 0.98).toLocaleString()} support, $${(ethPrice * 1.05).toLocaleString()} resistance`;
    } else if (marketDirection === 'BEARISH') {
      return `BTC: $${(btcPrice * 0.95).toLocaleString()} support, $${(btcPrice * 1.02).toLocaleString()} resistance | ETH: $${(ethPrice * 0.95).toLocaleString()} support, $${(ethPrice * 1.02).toLocaleString()} resistance`;
    } else {
      return `BTC: $${(btcPrice * 0.97).toLocaleString()} - $${(btcPrice * 1.03).toLocaleString()} | ETH: $${(ethPrice * 0.97).toLocaleString()} - $${(ethPrice * 1.03).toLocaleString()}`;
    }
  }

  async storePostReleaseAnalysis(release, analysisResult) {
    try {
      const { insertPostReleaseAnalysis } = require('../database');
      await insertPostReleaseAnalysis({
        release_id: release.id,
        release_type: release.type,
        release_date: release.date,
        analysis_data: JSON.stringify(analysisResult),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error storing post-release analysis:', error);
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