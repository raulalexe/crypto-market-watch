const axios = require('axios');

/**
 * Free Market Data Service - Alternative to Alpha Vantage
 * Uses free APIs to replace Alpha Vantage data sources
 */
class FreeMarketDataService {
  constructor() {
    // Free APIs don't need keys but have rate limits
    this.cache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes cache
    
    // Yahoo Finance unofficial API endpoints
    this.yahooFinanceBase = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.yahooQuoteBase = 'https://query1.finance.yahoo.com/v7/finance/quote';
    
    // FRED API for economic data (free but requires API key)
    this.fredApiKey = process.env.FRED_API_KEY;
    this.fredBase = 'https://api.stlouisfed.org/fred/series/observations';
  }

  // Get cached data or fetch new data
  async getCachedData(cacheKey, fetchFunction) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`📊 Using cached data for: ${cacheKey}`);
      return cached.data;
    }
    
    try {
      const data = await fetchFunction();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      console.error(`Error fetching ${cacheKey}:`, error.message);
      return cached?.data || null;
    }
  }

  // Get S&P 500 data from Yahoo Finance (free)
  async getSP500Data() {
    return this.getCachedData('SP500_YAHOO', async () => {
      console.log('📈 Fetching S&P 500 data from Yahoo Finance...');
      
      const response = await axios.get(`${this.yahooFinanceBase}/SPY`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoMarketWatch/1.0)'
        },
        timeout: 10000
      });
      
      const chart = response.data.chart.result[0];
      const meta = chart.meta;
      const quote = chart.indicators.quote[0];
      
      return {
        symbol: 'SPY',
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: quote.volume[quote.volume.length - 1],
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
      };
    });
  }

  // Get NASDAQ data from Yahoo Finance (free)
  async getNASDAQData() {
    return this.getCachedData('NASDAQ_YAHOO', async () => {
      console.log('📈 Fetching NASDAQ data from Yahoo Finance...');
      
      const response = await axios.get(`${this.yahooFinanceBase}/QQQ`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoMarketWatch/1.0)'
        },
        timeout: 10000
      });
      
      const chart = response.data.chart.result[0];
      const meta = chart.meta;
      const quote = chart.indicators.quote[0];
      
      return {
        symbol: 'QQQ',
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: quote.volume[quote.volume.length - 1],
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
      };
    });
  }

  // Get VIX data from Yahoo Finance (free)
  async getVIXData() {
    return this.getCachedData('VIX_YAHOO', async () => {
      console.log('📊 Fetching VIX data from Yahoo Finance...');
      
      const response = await axios.get(`${this.yahooFinanceBase}/^VIX`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoMarketWatch/1.0)'
        },
        timeout: 10000
      });
      
      const chart = response.data.chart.result[0];
      const meta = chart.meta;
      
      return {
        symbol: '^VIX',
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
      };
    });
  }

  // Get Oil prices from Yahoo Finance (free)
  async getOilData() {
    return this.getCachedData('OIL_YAHOO', async () => {
      console.log('🛢️ Fetching Oil data from Yahoo Finance...');
      
      const response = await axios.get(`${this.yahooFinanceBase}/CL=F`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoMarketWatch/1.0)'
        },
        timeout: 10000
      });
      
      const chart = response.data.chart.result[0];
      const meta = chart.meta;
      
      return {
        symbol: 'CL=F',
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
      };
    });
  }

  // Get Treasury yields from FRED API (free but requires API key)
  async getTreasuryYields() {
    if (!this.fredApiKey) {
      console.log('⚠️ FRED API key not configured, skipping treasury yields');
      return null;
    }

    return this.getCachedData('TREASURY_YIELDS_FRED', async () => {
      console.log('🏛️ Fetching Treasury yields from FRED...');
      
      // Get both 2Y and 10Y yields in parallel
      const [yield2Y, yield10Y] = await Promise.all([
        this.getFredSeries('GS2'), // 2-Year Treasury Constant Maturity Rate
        this.getFredSeries('GS10') // 10-Year Treasury Constant Maturity Rate
      ]);
      
      return {
        yield2Y: yield2Y?.value || null,
        yield10Y: yield10Y?.value || null,
        timestamp: new Date().toISOString()
      };
    });
  }

  // Get DXY (US Dollar Index) from Yahoo Finance
  async getDXYData() {
    return this.getCachedData('DXY_YAHOO', async () => {
      console.log('💵 Fetching DXY data from Yahoo Finance...');
      
      const response = await axios.get(`${this.yahooFinanceBase}/DX-Y.NYB`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoMarketWatch/1.0)'
        },
        timeout: 10000
      });
      
      const chart = response.data.chart.result[0];
      const meta = chart.meta;
      
      return {
        symbol: 'DX-Y.NYB',
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
      };
    });
  }

  // Helper method to get FRED series data
  async getFredSeries(seriesId) {
    try {
      const response = await axios.get(`${this.fredBase}`, {
        params: {
          series_id: seriesId,
          api_key: this.fredApiKey,
          file_type: 'json',
          sort_order: 'desc',
          limit: 1
        },
        timeout: 10000
      });
      
      const observations = response.data.observations;
      if (observations && observations.length > 0) {
        const latest = observations[0];
        return {
          value: parseFloat(latest.value),
          date: latest.date
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching FRED series ${seriesId}:`, error.message);
      return null;
    }
  }

  // Collect all market data in one method
  async collectAllMarketData() {
    console.log('🚀 Collecting market data from free sources...');
    
    try {
      // Collect all data in parallel to be efficient
      const [sp500, nasdaq, vix, oil, dxy, treasuryYields] = await Promise.all([
        this.getSP500Data(),
        this.getNASDAQData(), 
        this.getVIXData(),
        this.getOilData(),
        this.getDXYData(),
        this.getTreasuryYields()
      ]);
      
      const results = {
        sp500,
        nasdaq,
        vix,
        oil,
        dxy,
        treasuryYields,
        timestamp: new Date().toISOString(),
        source: 'Free APIs (Yahoo Finance + FRED)'
      };
      
      console.log('✅ Free market data collection completed');
      return results;
      
    } catch (error) {
      console.error('❌ Error collecting free market data:', error.message);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Free market data cache cleared');
  }
}

module.exports = FreeMarketDataService;
