const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

const {
  insertMarketData,
  insertCryptoPrice,
  insertFearGreedIndex,
  insertTrendingNarrative
} = require('../database');

class DataCollector {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.coinApiKey = process.env.COINAPI_API_KEY;
    this.fredApiKey = process.env.FRED_API_KEY;
  }

  // Collect DXY Index (US Dollar Index)
  async collectDXY() {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=JPY&apikey=${this.alphaVantageKey}`
      );
      
      if (response.data['Time Series FX (Daily)']) {
        const latestData = Object.values(response.data['Time Series FX (Daily)'])[0];
        const dxyValue = parseFloat(latestData['4. close']);
        
        await insertMarketData('DXY', 'USD_INDEX', dxyValue, {
          open: parseFloat(latestData['1. open']),
          high: parseFloat(latestData['2. high']),
          low: parseFloat(latestData['3. low']),
          volume: parseFloat(latestData['5. volume'])
        }, 'Alpha Vantage');
        
        return dxyValue;
      }
    } catch (error) {
      console.error('Error collecting DXY data:', error.message);
    }
  }

  // Collect US Treasury Yields
  async collectTreasuryYields() {
    try {
      // 2Y Treasury Yield
      const response2Y = await axios.get(
        `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=daily&maturity=2year&apikey=${this.alphaVantageKey}`
      );
      
      if (response2Y.data.data && response2Y.data.data.length > 0) {
        const yield2Y = parseFloat(response2Y.data.data[0].value);
        await insertMarketData('TREASURY_YIELD', '2Y', yield2Y, {}, 'Alpha Vantage');
      }

      // 10Y Treasury Yield
      const response10Y = await axios.get(
        `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=daily&maturity=10year&apikey=${this.alphaVantageKey}`
      );
      
      if (response10Y.data.data && response10Y.data.data.length > 0) {
        const yield10Y = parseFloat(response10Y.data.data[0].value);
        await insertMarketData('TREASURY_YIELD', '10Y', yield10Y, {}, 'Alpha Vantage');
      }
    } catch (error) {
      console.error('Error collecting Treasury yields:', error.message);
    }
  }

  // Collect Equity Indices
  async collectEquityIndices() {
    try {
      // S&P 500
      const sp500Response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&apikey=${this.alphaVantageKey}`
      );
      
      if (sp500Response.data['Time Series (Daily)']) {
        const latestSP500 = Object.values(sp500Response.data['Time Series (Daily)'])[0];
        const sp500Value = parseFloat(latestSP500['4. close']);
        await insertMarketData('EQUITY_INDEX', 'SP500', sp500Value, {
          open: parseFloat(latestSP500['1. open']),
          high: parseFloat(latestSP500['2. high']),
          low: parseFloat(latestSP500['3. low']),
          volume: parseFloat(latestSP500['5. volume'])
        }, 'Alpha Vantage');
      }

      // NASDAQ
      const nasdaqResponse = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=QQQ&apikey=${this.alphaVantageKey}`
      );
      
      if (nasdaqResponse.data['Time Series (Daily)']) {
        const latestNasdaq = Object.values(nasdaqResponse.data['Time Series (Daily)'])[0];
        const nasdaqValue = parseFloat(latestNasdaq['4. close']);
        await insertMarketData('EQUITY_INDEX', 'NASDAQ', nasdaqValue, {
          open: parseFloat(latestNasdaq['1. open']),
          high: parseFloat(latestNasdaq['2. high']),
          low: parseFloat(latestNasdaq['3. low']),
          volume: parseFloat(latestNasdaq['5. volume'])
        }, 'Alpha Vantage');
      }
    } catch (error) {
      console.error('Error collecting equity indices:', error.message);
    }
  }

  // Collect VIX (Volatility Index)
  async collectVIX() {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=VIX&apikey=${this.alphaVantageKey}`
      );
      
      if (response.data['Time Series (Daily)']) {
        const latestData = Object.values(response.data['Time Series (Daily)'])[0];
        const vixValue = parseFloat(latestData['4. close']);
        await insertMarketData('VOLATILITY_INDEX', 'VIX', vixValue, {
          open: parseFloat(latestData['1. open']),
          high: parseFloat(latestData['2. high']),
          low: parseFloat(latestData['3. low'])
        }, 'Alpha Vantage');
        
        return vixValue;
      }
    } catch (error) {
      console.error('Error collecting VIX data:', error.message);
    }
  }

  // Collect Energy Prices (Oil)
  async collectEnergyPrices() {
    try {
      // WTI Crude Oil
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=USO&apikey=${this.alphaVantageKey}`
      );
      
      if (response.data['Time Series (Daily)']) {
        const latestData = Object.values(response.data['Time Series (Daily)'])[0];
        const oilValue = parseFloat(latestData['4. close']);
        await insertMarketData('ENERGY_PRICE', 'OIL_WTI', oilValue, {
          open: parseFloat(latestData['1. open']),
          high: parseFloat(latestData['2. high']),
          low: parseFloat(latestData['3. low']),
          volume: parseFloat(latestData['5. volume'])
        }, 'Alpha Vantage');
        
        return oilValue;
      }
    } catch (error) {
      console.error('Error collecting energy prices:', error.message);
    }
  }

  // Collect Crypto Prices
  async collectCryptoPrices() {
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
    
    try {
      for (const symbol of cryptoSymbols) {
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${this.alphaVantageKey}`
        );
        
        if (response.data['Time Series (Digital Currency Daily)']) {
          const latestData = Object.values(response.data['Time Series (Digital Currency Daily)'])[0];
          const price = parseFloat(latestData['4a. close (USD)']);
          const volume = parseFloat(latestData['5. volume']);
          const marketCap = parseFloat(latestData['6. market cap (USD)']);
          const change24h = parseFloat(latestData['9a. close (USD)']) - parseFloat(latestData['1a. open (USD)']);
          
          await insertCryptoPrice(symbol, price, volume, marketCap, change24h);
        }
      }
    } catch (error) {
      console.error('Error collecting crypto prices:', error.message);
    }
  }

  // Collect Fear & Greed Index
  async collectFearGreedIndex() {
    try {
      // Using alternative data source since Fear & Greed Index API might be restricted
      // This is a simplified version - you might want to use a different source
      const response = await axios.get('https://api.alternative.me/fng/');
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const latestData = response.data.data[0];
        const value = parseInt(latestData.value);
        const classification = latestData.value_classification;
        
        await insertFearGreedIndex(value, classification, 'Alternative.me');
        
        return { value, classification };
      }
    } catch (error) {
      console.error('Error collecting Fear & Greed Index:', error.message);
      // Fallback: create a synthetic fear/greed index based on VIX and market data
      const vix = await this.collectVIX();
      if (vix) {
        let value, classification;
        if (vix < 15) {
          value = 80; // Greed
          classification = 'Greed';
        } else if (vix < 25) {
          value = 60; // Neutral
          classification = 'Neutral';
        } else {
          value = 30; // Fear
          classification = 'Fear';
        }
        
        await insertFearGreedIndex(value, classification, 'Synthetic (VIX-based)');
        return { value, classification };
      }
    }
  }

  // Collect Trending Narratives (simplified version)
  async collectTrendingNarratives() {
    try {
      // This is a simplified version - in a real implementation, you'd use
      // social media APIs, news APIs, or sentiment analysis services
      const narratives = [
        { narrative: 'Bitcoin ETF inflows', sentiment: 'positive', relevance: 0.9 },
        { narrative: 'Fed rate cut expectations', sentiment: 'positive', relevance: 0.8 },
        { narrative: 'Institutional adoption', sentiment: 'positive', relevance: 0.7 },
        { narrative: 'Regulatory concerns', sentiment: 'negative', relevance: 0.6 },
        { narrative: 'DeFi innovation', sentiment: 'positive', relevance: 0.5 }
      ];

      for (const narrative of narratives) {
        await insertTrendingNarrative(
          narrative.narrative,
          narrative.sentiment,
          narrative.relevance,
          'Synthetic'
        );
      }
    } catch (error) {
      console.error('Error collecting trending narratives:', error.message);
    }
  }

  // Collect all market data
  async collectAllData() {
    console.log('Starting data collection...');
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    
    try {
      await Promise.all([
        this.collectDXY(),
        this.collectTreasuryYields(),
        this.collectEquityIndices(),
        this.collectVIX(),
        this.collectEnergyPrices(),
        this.collectCryptoPrices(),
        this.collectFearGreedIndex(),
        this.collectTrendingNarratives()
      ]);
      
      console.log(`Data collection completed at ${timestamp}`);
      return true;
    } catch (error) {
      console.error('Error in data collection:', error.message);
      return false;
    }
  }

  // Get market data summary for AI analysis
  async getMarketDataSummary() {
    try {
      const summary = {
        timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
        dxy: null,
        treasury_2y: null,
        treasury_10y: null,
        sp500: null,
        nasdaq: null,
        vix: null,
        oil: null,
        crypto_prices: {},
        fear_greed: null
      };

      // Get latest values for each metric
      const dxyData = await this.getLatestMarketData('DXY');
      if (dxyData) summary.dxy = dxyData.value;

      const treasury2YData = await this.getLatestMarketData('TREASURY_YIELD', '2Y');
      if (treasury2YData) summary.treasury_2y = treasury2YData.value;

      const treasury10YData = await this.getLatestMarketData('TREASURY_YIELD', '10Y');
      if (treasury10YData) summary.treasury_10y = treasury10YData.value;

      const sp500Data = await this.getLatestMarketData('EQUITY_INDEX', 'SP500');
      if (sp500Data) summary.sp500 = sp500Data.value;

      const nasdaqData = await this.getLatestMarketData('EQUITY_INDEX', 'NASDAQ');
      if (nasdaqData) summary.nasdaq = nasdaqData.value;

      const vixData = await this.getLatestMarketData('VOLATILITY_INDEX', 'VIX');
      if (vixData) summary.vix = vixData.value;

      const oilData = await this.getLatestMarketData('ENERGY_PRICE', 'OIL_WTI');
      if (oilData) summary.oil = oilData.value;

      // Get crypto prices
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
      for (const symbol of cryptoSymbols) {
        const cryptoData = await this.getLatestCryptoPrice(symbol);
        if (cryptoData) {
          summary.crypto_prices[symbol] = cryptoData.price;
        }
      }

      return summary;
    } catch (error) {
      console.error('Error getting market data summary:', error.message);
      return null;
    }
  }

  // Helper method to get latest market data
  async getLatestMarketData(dataType, symbol = null) {
    const { getMarketData } = require('../database');
    try {
      const data = await getMarketData(dataType, 1);
      if (data && data.length > 0) {
        const latest = data[0];
        if (!symbol || latest.symbol === symbol) {
          return latest;
        }
      }
      return null;
    } catch (error) {
      console.error(`Error getting latest ${dataType} data:`, error.message);
      return null;
    }
  }

  // Helper method to get latest crypto price
  async getLatestCryptoPrice(symbol) {
    const { getCryptoPrices } = require('../database');
    try {
      const data = await getCryptoPrices(symbol, 1);
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`Error getting latest ${symbol} price:`, error.message);
      return null;
    }
  }
}

module.exports = DataCollector;