const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

class EconomicDataPredictor {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.fredApiKey = process.env.FRED_API_KEY;
    
    // Prediction confidence thresholds
    this.confidenceThresholds = {
      high: 70,
      medium: 60,
      low: 50
    };
    
    // Historical accuracy tracking
    this.predictionAccuracy = {
      CPI: { correct: 0, total: 0, accuracy: 0 },
      PCE: { correct: 0, total: 0, accuracy: 0 }
    };
  }

  async predictCPIRelease(releaseDate) {
    try {
      console.log(`Predicting CPI data for ${releaseDate}`);
      
      // Get leading indicators
      const indicators = await this.getCPILeadingIndicators();
      
      // Analyze trends and patterns
      const analysis = this.analyzeCPIIndicators(indicators);
      
      // Generate prediction with confidence
      const prediction = this.generateCPIPrediction(analysis);
      
      // Store prediction for accuracy tracking
      await this.storePrediction('CPI', releaseDate, prediction);
      
      return prediction;
    } catch (error) {
      console.error('Error predicting CPI:', error);
      return this.getDefaultPrediction('CPI');
    }
  }

  async predictPCERelease(releaseDate) {
    try {
      console.log(`Predicting PCE data for ${releaseDate}`);
      
      // Get leading indicators
      const indicators = await this.getPCELeadingIndicators();
      
      // Analyze trends and patterns
      const analysis = this.analyzePCEIndicators(indicators);
      
      // Generate prediction with confidence
      const prediction = this.generatePCEPrediction(analysis);
      
      // Store prediction for accuracy tracking
      await this.storePrediction('PCE', releaseDate, prediction);
      
      return prediction;
    } catch (error) {
      console.error('Error predicting PCE:', error);
      return this.getDefaultPrediction('PCE');
    }
  }

  async getCPILeadingIndicators() {
    try {
      const indicators = {};
      
      // Get PPI (Producer Price Index) - leading indicator for CPI
      if (this.fredApiKey) {
        const ppiResponse = await axios.get(
          `https://api.stlouisfed.org/fred/series/observations?series_id=PPIACO&api_key=${this.fredApiKey}&limit=12&sort_order=desc`
        );
        if (ppiResponse.data.observations) {
          indicators.ppi = ppiResponse.data.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }));
        }
      }
      
      // Get ISM Manufacturing Prices - leading indicator
      if (this.fredApiKey) {
        const ismResponse = await axios.get(
          `https://api.stlouisfed.org/fred/series/observations?series_id=NAPM_PMI&api_key=${this.fredApiKey}&limit=6&sort_order=desc`
        );
        if (ismResponse.data.observations) {
          indicators.ism = ismResponse.data.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }));
        }
      }
      
      // Get Import/Export prices
      if (this.fredApiKey) {
        const importResponse = await axios.get(
          `https://api.stlouisfed.org/fred/series/observations?series_id=IR&api_key=${this.fredApiKey}&limit=6&sort_order=desc`
        );
        if (importResponse.data.observations) {
          indicators.importPrices = importResponse.data.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }));
        }
      }
      
      // Get commodity prices (oil, metals)
      const commodityPrices = await this.getCommodityPrices();
      indicators.commodities = commodityPrices;
      
      return indicators;
    } catch (error) {
      console.error('Error fetching CPI leading indicators:', error);
      return {};
    }
  }

  async getPCELeadingIndicators() {
    try {
      const indicators = {};
      
      // Get personal income and spending data
      if (this.fredApiKey) {
        const incomeResponse = await axios.get(
          `https://api.stlouisfed.org/fred/series/observations?series_id=PI&api_key=${this.fredApiKey}&limit=6&sort_order=desc`
        );
        if (incomeResponse.data.observations) {
          indicators.personalIncome = incomeResponse.data.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }));
        }
      }
      
      // Get retail sales data
      if (this.fredApiKey) {
        const retailResponse = await axios.get(
          `https://api.stlouisfed.org/fred/series/observations?series_id=RSXFS&api_key=${this.fredApiKey}&limit=6&sort_order=desc`
        );
        if (retailResponse.data.observations) {
          indicators.retailSales = retailResponse.data.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }));
        }
      }
      
      // Get consumer sentiment
      if (this.fredApiKey) {
        const sentimentResponse = await axios.get(
          `https://api.stlouisfed.org/fred/series/observations?series_id=UMCSENT&api_key=${this.fredApiKey}&limit=6&sort_order=desc`
        );
        if (sentimentResponse.data.observations) {
          indicators.consumerSentiment = sentimentResponse.data.observations.map(obs => ({
            date: obs.date,
            value: parseFloat(obs.value)
          }));
        }
      }
      
      return indicators;
    } catch (error) {
      console.error('Error fetching PCE leading indicators:', error);
      return {};
    }
  }

  async getCommodityPrices() {
    try {
      const commodities = {};
      
      // Get oil prices
      if (this.alphaVantageKey) {
        const oilResponse = await axios.get(
          `https://www.alphavantage.co/query?function=WTI&interval=daily&apikey=${this.alphaVantageKey}`
        );
        if (oilResponse.data.data) {
          commodities.oil = oilResponse.data.data.slice(0, 30).map(item => ({
            date: item.timestamp,
            value: parseFloat(item.value)
          }));
        }
      }
      
      // Get gold prices
      if (this.alphaVantageKey) {
        const goldResponse = await axios.get(
          `https://www.alphavantage.co/query?function=GOLD&interval=daily&apikey=${this.alphaVantageKey}`
        );
        if (goldResponse.data.data) {
          commodities.gold = goldResponse.data.data.slice(0, 30).map(item => ({
            date: item.timestamp,
            value: parseFloat(item.value)
          }));
        }
      }
      
      return commodities;
    } catch (error) {
      console.error('Error fetching commodity prices:', error);
      return {};
    }
  }

  analyzeCPIIndicators(indicators) {
    const analysis = {
      ppiTrend: 'neutral',
      ismTrend: 'neutral',
      commodityTrend: 'neutral',
      overallSentiment: 'neutral',
      confidence: 50
    };
    
    // Analyze PPI trend
    if (indicators.ppi && indicators.ppi.length >= 2) {
      const recentPPI = indicators.ppi[0].value;
      const previousPPI = indicators.ppi[1].value;
      const ppiChange = ((recentPPI - previousPPI) / previousPPI) * 100;
      
      if (ppiChange > 0.5) {
        analysis.ppiTrend = 'inflationary';
        analysis.confidence += 15;
      } else if (ppiChange < -0.5) {
        analysis.ppiTrend = 'deflationary';
        analysis.confidence += 10;
      }
    }
    
    // Analyze ISM Manufacturing
    if (indicators.ism && indicators.ism.length >= 2) {
      const recentISM = indicators.ism[0].value;
      const previousISM = indicators.ism[1].value;
      
      if (recentISM > 50 && recentISM > previousISM) {
        analysis.ismTrend = 'expansionary';
        analysis.confidence += 10;
      } else if (recentISM < 50 && recentISM < previousISM) {
        analysis.ismTrend = 'contractionary';
        analysis.confidence += 10;
      }
    }
    
    // Analyze commodity prices
    if (indicators.commodities) {
      const oilTrend = this.calculateTrend(indicators.commodities.oil);
      const goldTrend = this.calculateTrend(indicators.commodities.gold);
      
      if (oilTrend > 5 || goldTrend > 5) {
        analysis.commodityTrend = 'inflationary';
        analysis.confidence += 10;
      } else if (oilTrend < -5 || goldTrend < -5) {
        analysis.commodityTrend = 'deflationary';
        analysis.confidence += 5;
      }
    }
    
    // Determine overall sentiment
    const inflationarySignals = [analysis.ppiTrend, analysis.ismTrend, analysis.commodityTrend]
      .filter(trend => trend === 'inflationary').length;
    const deflationarySignals = [analysis.ppiTrend, analysis.ismTrend, analysis.commodityTrend]
      .filter(trend => trend === 'deflationary').length;
    
    if (inflationarySignals > deflationarySignals) {
      analysis.overallSentiment = 'inflationary';
    } else if (deflationarySignals > inflationarySignals) {
      analysis.overallSentiment = 'deflationary';
    }
    
    return analysis;
  }

  analyzePCEIndicators(indicators) {
    const analysis = {
      incomeTrend: 'neutral',
      spendingTrend: 'neutral',
      sentimentTrend: 'neutral',
      overallSentiment: 'neutral',
      confidence: 50
    };
    
    // Analyze personal income trend
    if (indicators.personalIncome && indicators.personalIncome.length >= 2) {
      const recentIncome = indicators.personalIncome[0].value;
      const previousIncome = indicators.personalIncome[1].value;
      const incomeChange = ((recentIncome - previousIncome) / previousIncome) * 100;
      
      if (incomeChange > 0.3) {
        analysis.incomeTrend = 'increasing';
        analysis.confidence += 15;
      } else if (incomeChange < -0.3) {
        analysis.incomeTrend = 'decreasing';
        analysis.confidence += 10;
      }
    }
    
    // Analyze retail sales trend
    if (indicators.retailSales && indicators.retailSales.length >= 2) {
      const recentSales = indicators.retailSales[0].value;
      const previousSales = indicators.retailSales[1].value;
      const salesChange = ((recentSales - previousSales) / previousSales) * 100;
      
      if (salesChange > 0.5) {
        analysis.spendingTrend = 'increasing';
        analysis.confidence += 15;
      } else if (salesChange < -0.5) {
        analysis.spendingTrend = 'decreasing';
        analysis.confidence += 10;
      }
    }
    
    // Analyze consumer sentiment
    if (indicators.consumerSentiment && indicators.consumerSentiment.length >= 2) {
      const recentSentiment = indicators.consumerSentiment[0].value;
      const previousSentiment = indicators.consumerSentiment[1].value;
      
      if (recentSentiment > 80 && recentSentiment > previousSentiment) {
        analysis.sentimentTrend = 'positive';
        analysis.confidence += 10;
      } else if (recentSentiment < 60 && recentSentiment < previousSentiment) {
        analysis.sentimentTrend = 'negative';
        analysis.confidence += 10;
      }
    }
    
    // Determine overall sentiment
    const positiveSignals = [analysis.incomeTrend, analysis.spendingTrend, analysis.sentimentTrend]
      .filter(trend => trend === 'increasing' || trend === 'positive').length;
    const negativeSignals = [analysis.incomeTrend, analysis.spendingTrend, analysis.sentimentTrend]
      .filter(trend => trend === 'decreasing' || trend === 'negative').length;
    
    if (positiveSignals > negativeSignals) {
      analysis.overallSentiment = 'inflationary';
    } else if (negativeSignals > positiveSignals) {
      analysis.overallSentiment = 'deflationary';
    }
    
    return analysis;
  }

  calculateTrend(data) {
    if (!data || data.length < 2) return 0;
    
    const recent = data[0].value;
    const previous = data[data.length - 1].value;
    return ((recent - previous) / previous) * 100;
  }

  generateCPIPrediction(analysis) {
    const prediction = {
      type: 'CPI',
      direction: 'neutral',
      confidence: Math.min(analysis.confidence, 95),
      reasoning: [],
      tradingRecommendation: 'neutral',
      expectedImpact: 'moderate'
    };
    
    // Determine direction based on sentiment
    if (analysis.overallSentiment === 'inflationary') {
      prediction.direction = 'higher';
      prediction.tradingRecommendation = 'bearish';
      prediction.expectedImpact = 'high';
      prediction.reasoning.push('Leading indicators suggest inflationary pressure');
    } else if (analysis.overallSentiment === 'deflationary') {
      prediction.direction = 'lower';
      prediction.tradingRecommendation = 'bullish';
      prediction.expectedImpact = 'high';
      prediction.reasoning.push('Leading indicators suggest cooling inflation');
    }
    
    // Add specific reasoning
    if (analysis.ppiTrend === 'inflationary') {
      prediction.reasoning.push('PPI showing upward pressure');
    }
    if (analysis.ismTrend === 'expansionary') {
      prediction.reasoning.push('ISM manufacturing indicates economic expansion');
    }
    if (analysis.commodityTrend === 'inflationary') {
      prediction.reasoning.push('Commodity prices rising');
    }
    
    // Adjust confidence based on signal strength
    if (prediction.reasoning.length >= 2) {
      prediction.confidence = Math.min(prediction.confidence + 10, 95);
    }
    
    return prediction;
  }

  generatePCEPrediction(analysis) {
    const prediction = {
      type: 'PCE',
      direction: 'neutral',
      confidence: Math.min(analysis.confidence, 95),
      reasoning: [],
      tradingRecommendation: 'neutral',
      expectedImpact: 'moderate'
    };
    
    // Determine direction based on sentiment
    if (analysis.overallSentiment === 'inflationary') {
      prediction.direction = 'higher';
      prediction.tradingRecommendation = 'bearish';
      prediction.expectedImpact = 'high';
      prediction.reasoning.push('Consumer spending and sentiment suggest inflationary pressure');
    } else if (analysis.overallSentiment === 'deflationary') {
      prediction.direction = 'lower';
      prediction.tradingRecommendation = 'bullish';
      prediction.expectedImpact = 'high';
      prediction.reasoning.push('Consumer indicators suggest cooling inflation');
    }
    
    // Add specific reasoning
    if (analysis.incomeTrend === 'increasing') {
      prediction.reasoning.push('Personal income rising');
    }
    if (analysis.spendingTrend === 'increasing') {
      prediction.reasoning.push('Retail sales showing strength');
    }
    if (analysis.sentimentTrend === 'positive') {
      prediction.reasoning.push('Consumer sentiment positive');
    }
    
    // Adjust confidence based on signal strength
    if (prediction.reasoning.length >= 2) {
      prediction.confidence = Math.min(prediction.confidence + 10, 95);
    }
    
    return prediction;
  }

  getDefaultPrediction(type) {
    return {
      type,
      direction: 'neutral',
      confidence: 50,
      reasoning: ['Insufficient data for prediction'],
      tradingRecommendation: 'neutral',
      expectedImpact: 'moderate'
    };
  }

  async storePrediction(type, releaseDate, prediction) {
    try {
      const { insertEconomicPrediction } = require('../database');
      await insertEconomicPrediction({
        type,
        release_date: releaseDate,
        prediction_data: JSON.stringify(prediction),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error storing prediction:', error);
    }
  }

  async getPredictionAccuracy(type) {
    try {
      const { getPredictionAccuracy } = require('../database');
      const accuracy = await getPredictionAccuracy(type);
      return accuracy;
    } catch (error) {
      console.error('Error getting prediction accuracy:', error);
      return { correct: 0, total: 0, accuracy: 0 };
    }
  }

  formatPredictionMessage(prediction, releaseDate) {
    const confidenceLevel = prediction.confidence >= 70 ? 'HIGH' : 
                           prediction.confidence >= 60 ? 'MEDIUM' : 'LOW';
    
    const tradingAction = prediction.tradingRecommendation === 'bearish' ? 'SHORT' :
                         prediction.tradingRecommendation === 'bullish' ? 'LONG' : 'NEUTRAL';
    
    return `🔮 ECONOMIC DATA PREDICTION 🔮

📊 ${prediction.type} Release - ${releaseDate}
🎯 Direction: ${prediction.direction.toUpperCase()}
📈 Confidence: ${prediction.confidence}% (${confidenceLevel})
💼 Trading Recommendation: ${tradingAction}

📝 Reasoning:
${prediction.reasoning.map(reason => `• ${reason}`).join('\n')}

⚠️ Expected Market Impact: ${prediction.expectedImpact.toUpperCase()}

💡 Strategy:
${this.getStrategyFromPrediction(prediction)}

🔔 Remember: Predictions are probabilistic, always use proper risk management!`;
  }

  getStrategyFromPrediction(prediction) {
    if (prediction.tradingRecommendation === 'bearish') {
      return `• Consider short positions on BTC/ETH
• Hedge long positions with inverse ETFs
• Increase cash allocation
• Set tighter stop-losses on long positions`;
    } else if (prediction.tradingRecommendation === 'bullish') {
      return `• Look for long entry opportunities
• Reduce hedge positions
• Consider adding to long positions
• Monitor for breakout signals`;
    } else {
      return `• Maintain current positions
• Monitor for post-release moves
• Be prepared for volatility
• Keep stop-losses active`;
    }
  }
}

module.exports = EconomicDataPredictor;