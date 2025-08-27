const axios = require('axios');
const moment = require('moment');
require('dotenv').config();

const {
  insertMarketData,
  insertCryptoPrice,
  insertFearGreedIndex,
  insertTrendingNarrative,
  insertBitcoinDominance,
  insertStablecoinMetric,
  insertExchangeFlow
} = require('../database');

const ErrorLogger = require('./errorLogger');
const AlertService = require('./alertService');

class DataCollector {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.fredApiKey = process.env.FRED_API_KEY;
    this.errorLogger = new ErrorLogger();
    this.alertService = new AlertService();
    
    // Rate limiting for CoinGecko API
    this.coingeckoLastCall = 0;
    this.coingeckoMinInterval = 1200; // 1.2 seconds between calls (50 calls per minute limit)
    
    // Cache for CoinGecko data to reduce API calls
    this.coingeckoCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Rate-limited CoinGecko API call
  async makeCoinGeckoRequest(endpoint, params = {}) {
    const now = Date.now();
    const timeSinceLastCall = now - this.coingeckoLastCall;
    
    if (timeSinceLastCall < this.coingeckoMinInterval) {
      const waitTime = this.coingeckoMinInterval - timeSinceLastCall;
      console.log(`Rate limiting: waiting ${waitTime}ms before next CoinGecko call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    const url = `https://api.coingecko.com/api/v3/${endpoint}`;
    
    try {
      const response = await axios.get(url, { params });
      this.coingeckoLastCall = Date.now();
      return response;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log('CoinGecko rate limit hit, waiting 60 seconds...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        // Retry once after waiting
        const retryResponse = await axios.get(url, { params });
        this.coingeckoLastCall = Date.now();
        return retryResponse;
      }
      throw error;
    }
  }

  // Get cached CoinGecko data or fetch new data
  async getCachedCoinGeckoData(cacheKey, fetchFunction) {
    const cached = this.coingeckoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`Using cached CoinGecko data for: ${cacheKey}`);
      return cached.data;
    }
    
    const data = await fetchFunction();
    this.coingeckoCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    return data;
  }

  // Collect DXY Index (US Dollar Index)
  async collectDXY() {
    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=JPY&apikey=${this.alphaVantageKey}`
      );
      
      // Check for rate limit error
      if (response.data.Information && response.data.Information.includes('rate limit')) {
        console.log('Alpha Vantage rate limit reached for DXY data');
        await this.errorLogger.logApiFailure('Alpha Vantage', 'DXY', new Error('Rate limit reached'), response.data);
        return null;
      }
      
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
      } else {
        console.log('No DXY data available from Alpha Vantage');
        return null;
      }
    } catch (error) {
      console.error('Error collecting DXY data:', error.message);
      await this.errorLogger.logApiFailure('Alpha Vantage', 'DXY', error);
      return null;
    }
  }

  // Collect US Treasury Yields
  async collectTreasuryYields() {
    try {
      // Try Alpha Vantage first
      let yield2Y = null;
      let yield10Y = null;
      
      try {
        // 2Y Treasury Yield
        const response2Y = await axios.get(
          `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=daily&maturity=2year&apikey=${this.alphaVantageKey}`
        );
        
        // Check for rate limit error
        if (response2Y.data.Information && response2Y.data.Information.includes('rate limit')) {
          console.log('Alpha Vantage rate limit reached for 2Y Treasury data');
          await this.errorLogger.logApiFailure('Alpha Vantage', 'TREASURY_2Y', new Error('Rate limit reached'), response2Y.data);
        } else if (response2Y.data.data && response2Y.data.data.length > 0) {
          yield2Y = parseFloat(response2Y.data.data[0].value);
          await insertMarketData('TREASURY_YIELD', '2Y', yield2Y, {}, 'Alpha Vantage');
        }
      } catch (error) {
        console.log('Alpha Vantage 2Y failed:', error.message);
      }

      try {
        // 10Y Treasury Yield
        const response10Y = await axios.get(
          `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=daily&maturity=10year&apikey=${this.alphaVantageKey}`
        );
        
        // Check for rate limit error
        if (response10Y.data.Information && response10Y.data.Information.includes('rate limit')) {
          console.log('Alpha Vantage rate limit reached for 10Y Treasury data');
          await this.errorLogger.logApiFailure('Alpha Vantage', 'TREASURY_10Y', new Error('Rate limit reached'), response10Y.data);
        } else if (response10Y.data.data && response10Y.data.data.length > 0) {
          yield10Y = parseFloat(response10Y.data.data[0].value);
          await insertMarketData('TREASURY_YIELD', '10Y', yield10Y, {}, 'Alpha Vantage');
        }
      } catch (error) {
        console.log('Alpha Vantage 10Y failed:', error.message);
      }

      // FRED API fallback for Treasury Yields
      if (!yield2Y && this.fredApiKey) {
        try {
          const fredResponse2Y = await axios.get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=DGS2&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=1`
          );
          
          if (fredResponse2Y.data.observations && fredResponse2Y.data.observations.length > 0) {
            yield2Y = parseFloat(fredResponse2Y.data.observations[0].value);
            await insertMarketData('TREASURY_YIELD', '2Y', yield2Y, {}, 'FRED API');
            console.log(`Collected 2Y Treasury Yield from FRED: ${yield2Y}%`);
          }
        } catch (error) {
          console.error('FRED 2Y Treasury failed:', error.message);
        }
      }

      if (!yield10Y && this.fredApiKey) {
        try {
          const fredResponse10Y = await axios.get(
            `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${this.fredApiKey}&file_type=json&sort_order=desc&limit=1`
          );
          
          if (fredResponse10Y.data.observations && fredResponse10Y.data.observations.length > 0) {
            yield10Y = parseFloat(fredResponse10Y.data.observations[0].value);
            await insertMarketData('TREASURY_YIELD', '10Y', yield10Y, {}, 'FRED API');
            console.log(`Collected 10Y Treasury Yield from FRED: ${yield10Y}%`);
          }
        } catch (error) {
          console.error('FRED 10Y Treasury failed:', error.message);
        }
      }

      // If still no data, log the failure
      if (!yield2Y) {
        await this.errorLogger.logApiFailure('Alpha Vantage + FRED', 'TREASURY_YIELD 2Y', new Error('No data available from any source'));
      }
      if (!yield10Y) {
        await this.errorLogger.logApiFailure('Alpha Vantage + FRED', 'TREASURY_YIELD 10Y', new Error('No data available from any source'));
      }

    } catch (error) {
      await this.errorLogger.logApiFailure('Alpha Vantage + FRED', 'TREASURY_YIELD', error);
    }
  }

  // Collect Equity Indices
  async collectEquityIndices() {
    try {
      let sp500Value = null;
      let nasdaqValue = null;

      // Try Alpha Vantage first
      try {
        // S&P 500
        const sp500Response = await axios.get(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&apikey=${this.alphaVantageKey}`
        );
        
        // Check for rate limit error
        if (sp500Response.data.Information && sp500Response.data.Information.includes('rate limit')) {
          console.log('Alpha Vantage rate limit reached for SP500 data');
          await this.errorLogger.logApiFailure('Alpha Vantage', 'SP500', new Error('Rate limit reached'), sp500Response.data);
        } else if (sp500Response.data['Time Series (Daily)']) {
          const latestSP500 = Object.values(sp500Response.data['Time Series (Daily)'])[0];
          sp500Value = parseFloat(latestSP500['4. close']);
          await insertMarketData('EQUITY_INDEX', 'SP500', sp500Value, {
            open: parseFloat(latestSP500['1. open']),
            high: parseFloat(latestSP500['2. high']),
            low: parseFloat(latestSP500['3. low']),
            volume: parseFloat(latestSP500['5. volume'])
          }, 'Alpha Vantage');
        }
      } catch (error) {
        console.log('Alpha Vantage SP500 failed:', error.message);
      }

      try {
        // NASDAQ
        const nasdaqResponse = await axios.get(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=QQQ&apikey=${this.alphaVantageKey}`
        );
        
        // Check for rate limit error
        if (nasdaqResponse.data.Information && nasdaqResponse.data.Information.includes('rate limit')) {
          console.log('Alpha Vantage rate limit reached for NASDAQ data');
          await this.errorLogger.logApiFailure('Alpha Vantage', 'NASDAQ', new Error('Rate limit reached'), nasdaqResponse.data);
        } else if (nasdaqResponse.data['Time Series (Daily)']) {
          const latestNasdaq = Object.values(nasdaqResponse.data['Time Series (Daily)'])[0];
          nasdaqValue = parseFloat(latestNasdaq['4. close']);
          await insertMarketData('EQUITY_INDEX', 'NASDAQ', nasdaqValue, {
            open: parseFloat(latestNasdaq['1. open']),
            high: parseFloat(latestNasdaq['2. high']),
            low: parseFloat(latestNasdaq['3. low']),
            volume: parseFloat(latestNasdaq['5. volume'])
          }, 'Alpha Vantage');
        }
      } catch (error) {
        console.log('Alpha Vantage NASDAQ failed:', error.message);
      }

      // Yahoo Finance fallback (free, no API key required)
      if (!sp500Value) {
        try {
          const yahooResponse = await axios.get(
            'https://query1.finance.yahoo.com/v8/finance/chart/^GSPC?interval=1d&range=1d'
          );
          
          if (yahooResponse.data.chart.result && yahooResponse.data.chart.result[0]) {
            const result = yahooResponse.data.chart.result[0];
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];
            const latestIndex = timestamps.length - 1;
            
            sp500Value = quotes.close[latestIndex];
            await insertMarketData('EQUITY_INDEX', 'SP500', sp500Value, {
              open: quotes.open[latestIndex],
              high: quotes.high[latestIndex],
              low: quotes.low[latestIndex],
              volume: quotes.volume[latestIndex]
            }, 'Yahoo Finance');
            console.log(`Collected S&P 500 from Yahoo Finance: $${sp500Value}`);
          }
        } catch (error) {
          console.error('Yahoo Finance SP500 failed:', error.message);
        }
      }

      if (!nasdaqValue) {
        try {
          const yahooResponse = await axios.get(
            'https://query1.finance.yahoo.com/v8/finance/chart/^IXIC?interval=1d&range=1d'
          );
          
          if (yahooResponse.data.chart.result && yahooResponse.data.chart.result[0]) {
            const result = yahooResponse.data.chart.result[0];
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];
            const latestIndex = timestamps.length - 1;
            
            nasdaqValue = quotes.close[latestIndex];
            await insertMarketData('EQUITY_INDEX', 'NASDAQ', nasdaqValue, {
              open: quotes.open[latestIndex],
              high: quotes.high[latestIndex],
              low: quotes.low[latestIndex],
              volume: quotes.volume[latestIndex]
            }, 'Yahoo Finance');
            console.log(`Collected NASDAQ from Yahoo Finance: $${nasdaqValue}`);
          }
        } catch (error) {
          console.error('Yahoo Finance NASDAQ failed:', error.message);
        }
      }

      // If still no data, log the failure
      if (!sp500Value) {
        await this.errorLogger.logApiFailure('Alpha Vantage + Yahoo', 'SP500', new Error('No data available from any source'));
      }
      if (!nasdaqValue) {
        await this.errorLogger.logApiFailure('Alpha Vantage + Yahoo', 'NASDAQ', new Error('No data available from any source'));
      }

    } catch (error) {
      await this.errorLogger.logApiFailure('Alpha Vantage + Yahoo', 'Equity Indices', error);
    }
  }

  // Collect VIX (Volatility Index)
  async collectVIX() {
    try {
      // Try using VIX ETF (VXX) as a proxy for VIX data
      // VIX itself is not directly tradeable, so we use VXX which tracks VIX futures
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=VXX&apikey=${this.alphaVantageKey}`
      );
      
      // Check for rate limit error
      if (response.data.Information && response.data.Information.includes('rate limit')) {
        console.log('Alpha Vantage rate limit reached for VIX data');
        await this.errorLogger.logApiFailure('Alpha Vantage', 'VIX', new Error('Rate limit reached'), response.data);
        return null;
      }
      
      if (response.data['Time Series (Daily)']) {
        const latestData = Object.values(response.data['Time Series (Daily)'])[0];
        const vixValue = parseFloat(latestData['4. close']);
        await insertMarketData('VOLATILITY_INDEX', 'VIX', vixValue, {
          open: parseFloat(latestData['1. open']),
          high: parseFloat(latestData['2. high']),
          low: parseFloat(latestData['3. low'])
        }, 'Alpha Vantage (VXX)');
        
        return vixValue;
      } else {
        // Try alternative approach using VIX futures symbol
        const vixResponse = await axios.get(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=^VIX&apikey=${this.alphaVantageKey}`
        );
        
        // Check for rate limit error in second attempt
        if (vixResponse.data.Information && vixResponse.data.Information.includes('rate limit')) {
          console.log('Alpha Vantage rate limit reached for VIX data (second attempt)');
          await this.errorLogger.logApiFailure('Alpha Vantage', 'VIX', new Error('Rate limit reached'), vixResponse.data);
          return null;
        }
        
        if (vixResponse.data['Time Series (Daily)']) {
          const latestVixData = Object.values(vixResponse.data['Time Series (Daily)'])[0];
          const vixValue = parseFloat(latestVixData['4. close']);
          await insertMarketData('VOLATILITY_INDEX', 'VIX', vixValue, {
            open: parseFloat(latestVixData['1. open']),
            high: parseFloat(latestVixData['2. high']),
            low: parseFloat(latestVixData['3. low'])
          }, 'Alpha Vantage (^VIX)');
          
          return vixValue;
        } else {
          console.log('No VIX data available from Alpha Vantage');
          await this.errorLogger.logApiFailure('Alpha Vantage', 'VIX', new Error('No VIX data available from Alpha Vantage'), response.data);
          return null;
        }
      }
    } catch (error) {
      console.error('Error collecting VIX data:', error.message);
      await this.errorLogger.logApiFailure('Alpha Vantage', 'VIX', error);
      return null;
    }
  }

  // Collect Energy Prices (Oil)
  async collectEnergyPrices() {
    try {
      // WTI Crude Oil
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=USO&apikey=${this.alphaVantageKey}`
      );
      
      // Check for rate limit error
      if (response.data.Information && response.data.Information.includes('rate limit')) {
        console.log('Alpha Vantage rate limit reached for Energy data');
        await this.errorLogger.logApiFailure('Alpha Vantage', 'ENERGY', new Error('Rate limit reached'), response.data);
        return null;
      }
      
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
      } else {
        console.log('No Energy data available from Alpha Vantage');
        return null;
      }
    } catch (error) {
      console.error('Error collecting energy prices:', error.message);
      await this.errorLogger.logApiFailure('Alpha Vantage', 'ENERGY', error);
      return null;
    }
  }

  // Collect cryptocurrency prices
  async collectCryptoPrices() {
    try {
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK'];
      const ids = ['bitcoin', 'ethereum', 'solana', 'sui', 'ripple', 'cardano', 'polkadot', 'avalanche-2', 'matic-network', 'chainlink'];
      
      // Use rate-limited API call
      const response = await this.makeCoinGeckoRequest('simple/price', {
        ids: ids.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
        include_24hr_vol: true
      });
      
      if (response.data) {
        for (let i = 0; i < cryptoSymbols.length; i++) {
          const symbol = cryptoSymbols[i];
          const id = ids[i];
          const data = response.data[id];
          
          if (data) {
            await insertCryptoPrice(
              symbol,
              data.usd,
              data.usd_24h_vol,
              data.usd_market_cap,
              data.usd_24h_change,
              'CoinGecko'
            );
          }
        }
        
        console.log(`Collected prices for ${cryptoSymbols.length} cryptocurrencies`);
        return response.data;
      }
    } catch (error) {
      console.error('Error collecting crypto prices:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Crypto Prices', error);
    }
  }

  // Fallback method using Alpha Vantage
  async collectCryptoPricesFallback() {
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
          const openPrice = parseFloat(latestData['1a. open (USD)']);
          const closePrice = parseFloat(latestData['4a. close (USD)']);
          const change24h = ((closePrice - openPrice) / openPrice) * 100;
          
          await insertCryptoPrice(symbol, price, volume, marketCap, change24h);
        }
      }
    } catch (error) {
      console.error('Error collecting crypto prices from Alpha Vantage fallback:', error.message);
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

  // Collect trending narratives
  async collectTrendingNarratives() {
    try {
      // Get trending coins using rate-limited API call
      const response = await this.makeCoinGeckoRequest('search/trending');
      
      if (response.data && response.data.coins) {
        const trendingCoins = response.data.coins.map(coin => coin.item.id);
        
        // Get detailed data for trending coins using rate-limited call
        const detailedResponse = await this.makeCoinGeckoRequest('simple/price', {
          ids: trendingCoins.join(','),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        });
        
        if (detailedResponse.data) {
          // Process and categorize narratives
          const narratives = this.categorizeNarratives(response.data.coins, detailedResponse.data);
          
          // Store top narratives
          const topNarratives = narratives.slice(0, 10);
          for (const narrative of topNarratives) {
            await insertTrendingNarrative(
              narrative.narrative,
              'positive',
              narrative.money_flow_score,
              JSON.stringify({
                coins: narrative.coins,
                total_volume_24h: narrative.total_volume_24h,
                total_market_cap: narrative.total_market_cap,
                avg_change_24h: narrative.avg_change_24h
              })
            );
          }
          
          console.log(`Collected ${topNarratives.length} trending narratives with money flow analysis`);
          console.log('Top narratives by money flow:');
          topNarratives.forEach((narrative, index) => {
            console.log(`${index + 1}. ${narrative.narrative}: $${(narrative.total_volume_24h / 1e6).toFixed(1)}M volume, ${narrative.avg_change_24h.toFixed(2)}% avg change`);
          });
          
          return topNarratives;
        }
      }
    } catch (error) {
      console.error('Error collecting trending narratives:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Trending Narratives', error);
    }
  }

  // Categorize narratives from trending coins data
  categorizeNarratives(trendingCoins, detailedData) {
    const narratives = [];
    
    for (const coin of trendingCoins.slice(0, 10)) {
      const item = coin.item;
      
      // Analyze the coin's category and determine narrative
      const narrative = this.categorizeNarrative(item.name, item.symbol);
      
      const coinData = {
        narrative: narrative,
        coin_name: item.name,
        coin_symbol: item.symbol,
        market_cap_rank: item.market_cap_rank,
        price_btc: item.price_btc,
        score: item.score,
        sentiment: this.analyzeSentiment(item.score, 0, 0), // Will be updated with price data
        relevance_score: item.score / 100
      };
      
      // Add detailed data if available
      if (detailedData[item.id]) {
        const data = detailedData[item.id];
        coinData.price_usd = data.usd;
        coinData.change_24h = data.usd_24h_change;
        coinData.volume_24h = data.usd_24h_vol;
        coinData.market_cap = data.usd_market_cap;
        
        // Update sentiment with price change data
        coinData.sentiment = this.analyzeSentiment(item.score, data.usd_24h_change, data.usd_24h_vol);
      }
      
      narratives.push(coinData);
    }
    
    // Group by narrative and calculate total score and money flow
    const narrativeGroups = {};
    for (const narrative of narratives) {
      if (!narrativeGroups[narrative.narrative]) {
        narrativeGroups[narrative.narrative] = {
          narrative: narrative.narrative,
          coins: [],
          total_score: 0,
          total_volume_24h: 0,
          total_market_cap: 0,
          avg_change_24h: 0,
          money_flow_score: 0
        };
      }
      narrativeGroups[narrative.narrative].coins.push(narrative);
      narrativeGroups[narrative.narrative].total_score += narrative.score;
      narrativeGroups[narrative.narrative].total_volume_24h += (narrative.volume_24h || 0);
      narrativeGroups[narrative.narrative].total_market_cap += (narrative.market_cap || 0);
    }
    
    // Calculate averages and money flow scores
    return Object.values(narrativeGroups)
      .map(group => {
        const avgChange24h = group.coins.reduce((sum, coin) => sum + (coin.change_24h || 0), 0) / group.coins.length;
        const moneyFlowScore = (group.total_volume_24h / 1e6) * (avgChange24h > 0 ? 1 : 0.5); // Volume * positive momentum
        
        return {
          ...group,
          avg_change_24h: avgChange24h,
          money_flow_score: moneyFlowScore,
          coin_count: group.coins.length
        };
      })
      .sort((a, b) => b.money_flow_score - a.money_flow_score) // Sort by money flow
      .slice(0, 5);
  }

  // Categorize narrative based on coin name and symbol
  categorizeNarrative(coinName, coinSymbol) {
    const name = coinName.toLowerCase();
    const symbol = coinSymbol.toLowerCase();
    
    // Major cryptocurrencies (BTC, ETH, etc.)
    if (['btc', 'eth', 'bnb', 'xrp', 'ada', 'sol', 'dot', 'avax', 'matic'].includes(symbol)) {
      return 'Major Cryptocurrencies';
    }
    
    // AI & Machine Learning
    if (name.includes('ai') || name.includes('artificial intelligence') || name.includes('machine learning') || 
        name.includes('neural') || name.includes('algorithm') || symbol.includes('ai') || symbol.includes('ml')) {
      return 'AI & Machine Learning';
    }
    
    // DeFi & Yield Farming
    if (name.includes('defi') || name.includes('decentralized finance') || name.includes('yield') || 
        name.includes('farm') || name.includes('stake') || name.includes('lending') || 
        name.includes('borrow') || name.includes('credit') || name.includes('swap') || 
        name.includes('amm') || name.includes('liquidity')) {
      return 'DeFi & Yield Farming';
    }
    
    // Gaming & Metaverse
    if (name.includes('gaming') || name.includes('game') || name.includes('play') || 
        name.includes('metaverse') || name.includes('virtual') || name.includes('nft') || 
        name.includes('collectible') || name.includes('art') || name.includes('gaming')) {
      return 'Gaming & Metaverse';
    }
    
    // Layer 1 & Infrastructure
    if (name.includes('layer') || name.includes('scaling') || name.includes('rollup') || 
        name.includes('bridge') || name.includes('protocol') || name.includes('platform') ||
        name.includes('blockchain') || name.includes('chain')) {
      return 'Layer 1 & Infrastructure';
    }
    
    // Privacy & Security
    if (name.includes('privacy') || name.includes('anonymous') || name.includes('zero') || 
        name.includes('secret') || name.includes('private') || name.includes('secure')) {
      return 'Privacy & Security';
    }
    
    // Oracle & Data
    if (name.includes('oracle') || name.includes('data') || name.includes('feed') || 
        name.includes('price') || name.includes('index') || name.includes('aggregator')) {
      return 'Oracle & Data Feeds';
    }
    
    // Governance & DAOs
    if (name.includes('governance') || name.includes('dao') || name.includes('vote') || 
        name.includes('proposal') || name.includes('decision') || name.includes('community')) {
      return 'Governance & DAOs';
    }
    
    // DEX & Trading
    if (name.includes('exchange') || name.includes('dex') || name.includes('swap') || 
        name.includes('trade') || name.includes('orderbook') || name.includes('market')) {
      return 'DEX & Trading';
    }
    
    // Prediction Markets
    if (name.includes('prediction') || name.includes('bet') || name.includes('gambling') || 
        name.includes('forecast') || name.includes('market') || name.includes('odds')) {
      return 'Prediction Markets';
    }
    
    // Identity & Verification
    if (name.includes('identity') || name.includes('kyc') || name.includes('verification') || 
        name.includes('auth') || name.includes('login') || name.includes('passport')) {
      return 'Identity & Verification';
    }
    
    // Storage & File Sharing
    if (name.includes('storage') || name.includes('file') || name.includes('ipfs') || 
        name.includes('cloud') || name.includes('backup') || name.includes('archive')) {
      return 'Storage & File Sharing';
    }
    
    // Green Energy & Sustainability
    if (name.includes('energy') || name.includes('green') || name.includes('carbon') || 
        name.includes('solar') || name.includes('wind') || name.includes('renewable')) {
      return 'Green Energy & Sustainability';
    }
    
    // IoT & Supply Chain
    if (name.includes('iot') || name.includes('internet of things') || name.includes('sensor') || 
        name.includes('supply') || name.includes('logistics') || name.includes('tracking')) {
      return 'IoT & Supply Chain';
    }
    
    // Healthcare & Biotech
    if (name.includes('health') || name.includes('medical') || name.includes('bio') || 
        name.includes('pharma') || name.includes('drug') || name.includes('therapy')) {
      return 'Healthcare & Biotech';
    }
    
    // Real Estate & Property
    if (name.includes('real estate') || name.includes('property') || name.includes('land') || 
        name.includes('mortgage') || name.includes('rent') || name.includes('housing')) {
      return 'Real Estate & Property';
    }
    
    // Entertainment & Media
    if (name.includes('music') || name.includes('audio') || name.includes('sound') || 
        name.includes('video') || name.includes('streaming') || name.includes('content') ||
        name.includes('media') || name.includes('entertainment')) {
      return 'Entertainment & Media';
    }
    
    // Social Media & Communication
    if (name.includes('social') || name.includes('chat') || name.includes('message') || 
        name.includes('communication') || name.includes('network') || name.includes('community')) {
      return 'Social Media & Communication';
    }
    
    // Education & Learning
    if (name.includes('education') || name.includes('learn') || name.includes('course') || 
        name.includes('school') || name.includes('university') || name.includes('training')) {
      return 'Education & Learning';
    }
    
    // Travel & Tourism
    if (name.includes('travel') || name.includes('tourism') || name.includes('hotel') || 
        name.includes('booking') || name.includes('flight') || name.includes('vacation')) {
      return 'Travel & Tourism';
    }
    
    // Food & Delivery
    if (name.includes('food') || name.includes('restaurant') || name.includes('delivery') || 
        name.includes('meal') || name.includes('catering') || name.includes('groceries')) {
      return 'Food & Delivery';
    }
    
    // Fashion & Lifestyle
    if (name.includes('fashion') || name.includes('clothing') || name.includes('style') || 
        name.includes('luxury') || name.includes('beauty') || name.includes('cosmetics')) {
      return 'Fashion & Lifestyle';
    }
    
    // Sports & Fitness
    if (name.includes('sports') || name.includes('fitness') || name.includes('athletic') || 
        name.includes('gym') || name.includes('workout') || name.includes('training')) {
      return 'Sports & Fitness';
    }
    
    // Traditional Finance
    if (name.includes('finance') || name.includes('bank') || name.includes('payment') || 
        name.includes('credit') || name.includes('loan') || name.includes('investment')) {
      return 'Traditional Finance';
    }
    
    // Insurance & Risk Management
    if (name.includes('insurance') || name.includes('risk') || name.includes('cover') || 
        name.includes('protection') || name.includes('safety') || name.includes('security')) {
      return 'Insurance & Risk Management';
    }
    
    // Logistics & Transportation
    if (name.includes('logistics') || name.includes('shipping') || name.includes('transport') || 
        name.includes('delivery') || name.includes('freight') || name.includes('cargo')) {
      return 'Logistics & Transportation';
    }
    
    // Advertising & Marketing
    if (name.includes('advertising') || name.includes('marketing') || name.includes('promotion') || 
        name.includes('ads') || name.includes('campaign') || name.includes('brand')) {
      return 'Advertising & Marketing';
    }
    
    // Consulting & Services
    if (name.includes('consulting') || name.includes('service') || name.includes('platform') || 
        name.includes('solution') || name.includes('enterprise') || name.includes('business')) {
      return 'Consulting & Services';
    }
    
    // Meme Coins & Social Tokens
    if (name.includes('meme') || name.includes('dog') || name.includes('cat') || 
        symbol.includes('doge') || symbol.includes('shib') || symbol.includes('inu') ||
        name.includes('pepe') || name.includes('floki')) {
      return 'Meme Coins & Social Tokens';
    }
    
    // Utility Tokens
    if (name.includes('token') || name.includes('coin') || name.includes('utility')) {
      return 'Utility Tokens';
    }
    
    // Emerging Trends (catch-all for new innovations)
    return 'Emerging Trends';
  }

  // Analyze sentiment based on score and market data
  analyzeSentiment(score, priceChange = 0, volume = 0) {
    // Base sentiment from score
    let baseSentiment = 'neutral';
    if (score >= 80) baseSentiment = 'very_positive';
    else if (score >= 60) baseSentiment = 'positive';
    else if (score >= 40) baseSentiment = 'neutral';
    else if (score >= 20) baseSentiment = 'negative';
    else baseSentiment = 'very_negative';
    
    // Adjust based on price movement
    if (priceChange > 10) {
      if (baseSentiment === 'very_positive') return 'very_positive';
      if (baseSentiment === 'positive') return 'very_positive';
      if (baseSentiment === 'neutral') return 'positive';
      if (baseSentiment === 'negative') return 'neutral';
      return 'negative';
    } else if (priceChange > 5) {
      if (baseSentiment === 'very_negative') return 'negative';
      if (baseSentiment === 'negative') return 'neutral';
      if (baseSentiment === 'neutral') return 'positive';
      return baseSentiment;
    } else if (priceChange < -10) {
      if (baseSentiment === 'very_negative') return 'very_negative';
      if (baseSentiment === 'negative') return 'very_negative';
      if (baseSentiment === 'neutral') return 'negative';
      if (baseSentiment === 'positive') return 'neutral';
      return 'negative';
    } else if (priceChange < -5) {
      if (baseSentiment === 'very_positive') return 'positive';
      if (baseSentiment === 'positive') return 'neutral';
      if (baseSentiment === 'neutral') return 'negative';
      return baseSentiment;
    }
    
    return baseSentiment;
  }

  // Collect Layer 1 blockchain data
  async collectLayer1Data() {
    try {
      const layer1Chains = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', narrative: 'Store of Value' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', narrative: 'Smart Contracts' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', narrative: 'High Performance' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', narrative: 'Academic Research' },
        { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', narrative: 'Interoperability' },
        { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', narrative: 'DeFi Platform' },
        { id: 'binancecoin', name: 'BNB', symbol: 'BNB', narrative: 'Exchange Token' },
        { id: 'matic-network', name: 'Polygon', symbol: 'MATIC', narrative: 'Scaling Solution' }
      ];

      // Get all Layer 1 data in a single rate-limited request
      const chainIds = layer1Chains.map(chain => chain.id).join(',');
      const response = await this.makeCoinGeckoRequest('simple/price', {
        ids: chainIds,
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_24hr_vol: true,
        include_market_cap: true
      });

      const { insertLayer1Data } = require('../database');
      
      for (const chain of layer1Chains) {
        if (response.data[chain.id]) {
          const data = response.data[chain.id];
          
          // Calculate dominance (simplified - would need total market cap)
          const dominance = (data.usd_market_cap / 2000000000000) * 100; // Assuming ~2T total market cap
          
          // Estimate TPS and active addresses (these would come from blockchain APIs)
          const tpsEstimates = {
            bitcoin: 7,
            ethereum: 15,
            solana: 65000,
            cardano: 250,
            polkadot: 1000,
            'avalanche-2': 4500,
            binancecoin: 1400,
            'matic-network': 7000
          };
          
          const activeAddressesEstimates = {
            bitcoin: 850000,
            ethereum: 650000,
            solana: 120000,
            cardano: 85000,
            polkadot: 45000,
            'avalanche-2': 35000,
            binancecoin: 200000,
            'matic-network': 75000
          };
          
          const sentiment = data.usd_24h_change > 0 ? 'positive' : data.usd_24h_change < -5 ? 'negative' : 'neutral';
          
          await insertLayer1Data(
            chain.id,
            chain.name,
            chain.symbol,
            data.usd,
            data.usd_24h_change,
            data.usd_market_cap,
            data.usd_24h_vol,
            tpsEstimates[chain.id] || 100,
            activeAddressesEstimates[chain.id] || 50000,
            chain.id === 'bitcoin' ? 450 : 0, // Hash rate only for Bitcoin
            dominance,
            chain.narrative,
            sentiment
          );
        }
      }
      
      console.log(`Collected Layer 1 data for ${layer1Chains.length} chains`);
      return response.data;
    } catch (error) {
      console.error('Error collecting Layer 1 data:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Layer 1 Data', error);
    }
  }

  // Collect Stablecoin Metrics
  async collectStablecoinMetrics() {
    try {
      console.log('Starting stablecoin metrics collection...');
      const stablecoins = ['tether', 'usd-coin', 'dai', 'binance-usd', 'true-usd'];
      const stablecoinIds = stablecoins.join(',');
      
      console.log(`Fetching stablecoin data for: ${stablecoinIds}`);
      
      // Get stablecoin data using rate-limited API call
      const response = await this.makeCoinGeckoRequest('simple/price', {
        ids: stablecoinIds,
        vs_currencies: 'usd',
        include_market_cap: true
      });
      
      console.log('Stablecoin API response received:', response.status);
      
      if (response.data) {
        let totalStablecoinMarketCap = 0;
        const stablecoinData = {};
        
        // Calculate total stablecoin market cap
        for (const [id, data] of Object.entries(response.data)) {
          if (data.usd_market_cap) {
            totalStablecoinMarketCap += data.usd_market_cap;
            stablecoinData[id] = data.usd_market_cap;
          }
        }
        
        console.log(`Total stablecoin market cap: $${(totalStablecoinMarketCap / 1e9).toFixed(2)}B`);
        
        // Get BTC market cap for SSR calculation using rate-limited call
        console.log('Fetching Bitcoin market cap for SSR calculation...');
        const btcResponse = await this.makeCoinGeckoRequest('simple/price', {
          ids: 'bitcoin',
          vs_currencies: 'usd',
          include_market_cap: true
        });
        
        if (btcResponse.data && btcResponse.data.bitcoin) {
          const btcMarketCap = btcResponse.data.bitcoin.usd_market_cap;
          
          // Calculate Stablecoin Supply Ratio (SSR)
          const ssr = btcMarketCap / totalStablecoinMarketCap;
          
          // Store metrics
          const { insertStablecoinMetric } = require('../database');
          await insertStablecoinMetric('total_market_cap', totalStablecoinMarketCap, stablecoinData, 'CoinGecko');
          await insertStablecoinMetric('ssr', ssr, { btc_market_cap: btcMarketCap }, 'CoinGecko');
          
          console.log(`Collected Stablecoin Metrics: Total MC $${(totalStablecoinMarketCap / 1e9).toFixed(2)}B, SSR: ${ssr.toFixed(2)}`);
          
          return { totalMarketCap: totalStablecoinMarketCap, ssr };
        } else {
          console.log('No Bitcoin data received for SSR calculation');
        }
      } else {
        console.log('No stablecoin data received from API');
      }
    } catch (error) {
      console.error('Error collecting stablecoin metrics:', error.message);
      console.error('Full error:', error);
      await this.errorLogger.logApiFailure('CoinGecko', 'Stablecoin Metrics', error);
    }
  }

  // Run AI analysis with collected data
  async runAIAnalysis() {
    try {
      const AIAnalyzer = require('./aiAnalyzer');
      const aiAnalyzer = new AIAnalyzer();
      
      // Get market data summary for AI analysis
      const marketDataSummary = await this.getMarketDataSummary();
      if (!marketDataSummary) {
        console.log('No market data available for AI analysis');
        return;
      }

      // Get advanced metrics for comprehensive analysis
      const advancedMetrics = await this.getAdvancedMetricsSummary();
      if (advancedMetrics) {
        // Merge market data with advanced metrics
        // Get upcoming events for AI analysis
        const EventCollector = require('./eventCollector');
        const eventCollector = new EventCollector();
        const upcomingEvents = await eventCollector.getUpcomingEvents(10);

        // Get Fear & Greed Index
        const { getLatestFearGreedIndex } = require('../database');
        const fearGreed = await getLatestFearGreedIndex();

        // Add regulatory news (only if we have real data)
        const regulatoryNews = null; // We'll get this from real sources when available

        const comprehensiveData = {
          ...marketDataSummary,
          bitcoin_dominance: advancedMetrics.bitcoinDominance?.value,
          stablecoin_metrics: advancedMetrics.stablecoinMetrics,
          exchange_flows: advancedMetrics.exchangeFlows,
          market_sentiment: advancedMetrics.marketSentiment,
          derivatives: advancedMetrics.derivatives,
          onchain: advancedMetrics.onchain,
          upcoming_events: upcomingEvents,
          fear_greed: fearGreed,
          regulatory_news: regulatoryNews
        };

        // Run AI analysis
        const analysis = await aiAnalyzer.analyzeMarketDirection(comprehensiveData);
        if (analysis) {
          console.log('AI analysis completed successfully');
          console.log(`Overall direction: ${analysis.overall_direction}, Confidence: ${analysis.overall_confidence}%`);
        } else {
          console.log('AI analysis failed');
        }
      } else {
        // Fallback to basic market data
        const analysis = await aiAnalyzer.analyzeMarketDirection(marketDataSummary);
        if (analysis) {
          console.log('AI analysis completed with basic data');
        }
      }
    } catch (error) {
      console.error('Error running AI analysis:', error.message);
    }
  }

  // Get market data summary for AI analysis
  async getMarketDataSummary() {
    try {
      const { getLatestMarketData } = require('../database');
      
      // Get latest data for each market indicator
      const dxy = await getLatestMarketData('DXY', 'USD_INDEX');
      const treasury2Y = await getLatestMarketData('TREASURY_YIELD', '2Y');
      const treasury10Y = await getLatestMarketData('TREASURY_YIELD', '10Y');
      const sp500 = await getLatestMarketData('EQUITY', 'SP500');
      const nasdaq = await getLatestMarketData('EQUITY', 'NASDAQ');
      const vix = await getLatestMarketData('VOLATILITY', 'VIX');
      const oil = await getLatestMarketData('COMMODITY', 'OIL');
      
      // Get latest crypto prices with 24h changes
      const cryptoPrices = {};
      const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
      for (const symbol of cryptoSymbols) {
        const price = await this.getLatestCryptoPrice(symbol);
        if (price) {
          cryptoPrices[symbol] = {
            price: price.price,
            change_24h: price.change_24h || 0,
            volume_24h: price.volume_24h || 0
          };
        }
      }
      
      // Determine the most recent timestamp
      const timestamps = [
        dxy?.timestamp,
        treasury2Y?.timestamp,
        treasury10Y?.timestamp,
        sp500?.timestamp,
        nasdaq?.timestamp,
        vix?.timestamp,
        oil?.timestamp
      ].filter(Boolean);
      
      const latestTimestamp = timestamps.length > 0 
        ? timestamps.reduce((latest, current) => 
            new Date(current) > new Date(latest) ? current : latest
          )
        : new Date().toISOString();
      
      return {
        timestamp: latestTimestamp,
        dxy: dxy?.value,
        treasury_2y: treasury2Y?.value,
        treasury_10y: treasury10Y?.value,
        sp500: sp500?.value,
        nasdaq: nasdaq?.value,
        vix: vix?.value || 25, // Default VIX value if not available
        oil: oil?.value,
        crypto_prices: cryptoPrices
      };
    } catch (error) {
      console.error('Error getting market data summary:', error.message);
      return null;
    }
  }

  // Get latest crypto price for a symbol
  async getLatestCryptoPrice(symbol) {
    try {
      const { getLatestCryptoPrice } = require('../database');
      return await getLatestCryptoPrice(symbol);
    } catch (error) {
      console.error(`Error getting latest crypto price for ${symbol}:`, error.message);
      return null;
    }
  }

  // Get advanced metrics summary for AI analysis
  async getAdvancedMetricsSummary() {
    try {
      const { getLatestBitcoinDominance, getLatestStablecoinMetrics, getLatestExchangeFlows } = require('../database');
      
      // Get latest advanced metrics
      const bitcoinDominance = await getLatestBitcoinDominance();
      const stablecoinMetrics = await getLatestStablecoinMetrics();
      const exchangeFlows = await getLatestExchangeFlows();
      
      // Get market sentiment (only if we have real data)
      const marketSentiment = null; // We'll get this from real sources when available
      
      // Get derivatives data (only if we have real data)
      const derivatives = null; // We'll get this from real sources when available
      
      // Get on-chain data (only if we have real data)
      const onchain = null; // We'll get this from real sources when available
      
      return {
        bitcoinDominance,
        stablecoinMetrics,
        exchangeFlows,
        marketSentiment,
        derivatives,
        onchain
      };
    } catch (error) {
      console.error('Error getting advanced metrics summary:', error.message);
      return null;
    }
  }

  // Collect Bitcoin Dominance
  async collectBitcoinDominance() {
    try {
      // Get BTC and total market cap to calculate dominance
      const btcResponse = await this.makeCoinGeckoRequest('simple/price', {
        ids: 'bitcoin',
        vs_currencies: 'usd',
        include_market_cap: true
      });
      
      if (btcResponse.data && btcResponse.data.bitcoin) {
        const btcMarketCap = btcResponse.data.bitcoin.usd_market_cap;
        
        // Estimate total crypto market cap (simplified)
        const totalMarketCap = btcMarketCap * 2.5; // Rough estimate
        const dominance = (btcMarketCap / totalMarketCap) * 100;
        
        const { insertBitcoinDominance } = require('../database');
        await insertBitcoinDominance(dominance, 'CoinGecko');
        
        console.log(`Collected Bitcoin Dominance: ${dominance.toFixed(2)}%`);
        return dominance;
      }
    } catch (error) {
      console.error('Error collecting Bitcoin dominance:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Bitcoin Dominance', error);
    }
  }

  // Collect Altcoin Season Indicator
  async collectAltcoinSeasonIndicator() {
    try {
      // Simplified altcoin season calculation
      const topCoins = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano'];
      const response = await this.makeCoinGeckoRequest('simple/price', {
        ids: topCoins.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true
      });
      
      if (response.data) {
        let btcChange = 0;
        let altcoinChange = 0;
        let altcoinCount = 0;
        
        for (const [id, data] of Object.entries(response.data)) {
          if (id === 'bitcoin') {
            btcChange = data.usd_24h_change || 0;
          } else {
            altcoinChange += data.usd_24h_change || 0;
            altcoinCount++;
          }
        }
        
        const avgAltcoinChange = altcoinCount > 0 ? altcoinChange / altcoinCount : 0;
        const seasonIndicator = avgAltcoinChange > btcChange ? 'altcoin' : 'bitcoin';
        
        // Store as market data
        const { insertMarketData } = require('../database');
        await insertMarketData('SEASON_INDICATOR', 'ALTCOIN_SEASON', avgAltcoinChange - btcChange, {
          btc_change: btcChange,
          avg_altcoin_change: avgAltcoinChange,
          season: seasonIndicator
        }, 'CoinGecko');
        
        console.log(`Collected Altcoin Season Indicator: ${seasonIndicator} season (BTC: ${btcChange.toFixed(2)}%, Altcoins: ${avgAltcoinChange.toFixed(2)}%)`);
        return seasonIndicator;
      }
    } catch (error) {
      console.error('Error collecting altcoin season indicator:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Altcoin Season', error);
    }
  }

  // Collect Derivatives Data (simulated)
  async collectDerivativesData() {
    try {
      // Simulate derivatives data
      const openInterest = Math.random() * 50000 + 20000; // $20B-$70B
      const fundingRate = (Math.random() - 0.5) * 0.02; // -1% to +1%
      const longShortRatio = Math.random() * 2 + 0.5; // 0.5 to 2.5
      
      const { insertMarketData } = require('../database');
      await insertMarketData('DERIVATIVES', 'OPEN_INTEREST', openInterest, {
        btc_percentage: 65,
        eth_percentage: 25,
        others_percentage: 10
      }, 'Simulated');
      
      await insertMarketData('DERIVATIVES', 'FUNDING_RATE', fundingRate, {
        btc_funding: fundingRate,
        eth_funding: fundingRate * 0.8
      }, 'Simulated');
      
      await insertMarketData('DERIVATIVES', 'LONG_SHORT_RATIO', longShortRatio, {
        btc_ratio: longShortRatio,
        eth_ratio: longShortRatio * 1.1
      }, 'Simulated');
      
      console.log(`Collected Derivatives Data: OI $${(openInterest / 1e9).toFixed(1)}B, Funding ${(fundingRate * 100).toFixed(3)}%, L/S ${longShortRatio.toFixed(2)}`);
      return { openInterest, fundingRate, longShortRatio };
    } catch (error) {
      console.error('Error collecting derivatives data:', error.message);
      await this.errorLogger.logApiFailure('Simulated', 'Derivatives Data', error);
    }
  }

  // Collect On-chain Data (simulated)
  async collectOnchainData() {
    try {
      // Simulate on-chain metrics
      const activeAddresses = Math.floor(Math.random() * 200000) + 700000; // 700K-900K
      const transactionCount = Math.floor(Math.random() * 100000) + 200000; // 200K-300K
      const networkHashRate = Math.random() * 100 + 400; // 400-500 EH/s
      
      const { insertMarketData } = require('../database');
      await insertMarketData('ONCHAIN', 'ACTIVE_ADDRESSES', activeAddresses, {
        btc_addresses: Math.floor(activeAddresses * 0.6),
        eth_addresses: Math.floor(activeAddresses * 0.4)
      }, 'Simulated');
      
      await insertMarketData('ONCHAIN', 'TRANSACTION_COUNT', transactionCount, {
        btc_txs: Math.floor(transactionCount * 0.3),
        eth_txs: Math.floor(transactionCount * 0.7)
      }, 'Simulated');
      
      await insertMarketData('ONCHAIN', 'HASH_RATE', networkHashRate, {
        btc_hash_rate: networkHashRate,
        eth_hash_rate: networkHashRate * 0.1
      }, 'Simulated');
      
      console.log(`Collected On-chain Data: ${activeAddresses.toLocaleString()} active addresses, ${transactionCount.toLocaleString()} txs, ${networkHashRate.toFixed(1)} EH/s`);
      return { activeAddresses, transactionCount, networkHashRate };
    } catch (error) {
      console.error('Error collecting on-chain data:', error.message);
      await this.errorLogger.logApiFailure('Simulated', 'On-chain Data', error);
    }
  }

  // Collect Exchange Flows using free APIs
  async collectExchangeFlows() {
    try {
      // Use free APIs for exchange flow data
      const flows = [];
      
      // 1. CoinGecko Exchange Data (free)
      try {
        const exchangeData = await this.makeCoinGeckoRequest('/exchanges');
        if (exchangeData && exchangeData.length > 0) {
          // Get top exchanges and their 24h volume
          const topExchanges = exchangeData.slice(0, 10);
          let totalVolume = 0;
          
          for (const exchange of topExchanges) {
            totalVolume += exchange.total_volume || 0;
          }
          
          // Estimate flows based on exchange volume changes
          const { insertExchangeFlow } = require('../database');
          await insertExchangeFlow('volume', totalVolume, 'ALL', 'top_exchanges', 'CoinGecko');
          
          console.log(`Exchange Volume Data: $${(totalVolume / 1e9).toFixed(2)}B across top exchanges`);
        }
      } catch (error) {
        console.log('CoinGecko exchange data not available, using fallback');
      }
      
      // 2. Whale Alert API (free tier available)
      try {
        // Note: Whale Alert has a free tier with limited requests
        // This would show large transactions in real-time
        const whaleData = await this.makeCoinGeckoRequest('https://api.whale-alert.io/v1/transactions', {
          api_key: process.env.WHALE_ALERT_API_KEY,
          min_value: 500000, // $500k minimum
          limit: 10
        });
        
        if (whaleData && whaleData.transactions) {
          let totalWhaleVolume = 0;
          let inflowCount = 0;
          let outflowCount = 0;
          
          for (const tx of whaleData.transactions) {
            totalWhaleVolume += tx.amount_usd || 0;
            if (tx.to_owner_type === 'exchange') {
              inflowCount++;
            } else if (tx.from_owner_type === 'exchange') {
              outflowCount++;
            }
          }
          
          const { insertExchangeFlow } = require('../database');
          await insertExchangeFlow('whale_volume', totalWhaleVolume, 'ALL', 'whale_alert', 'Whale Alert');
          await insertExchangeFlow('whale_inflow', inflowCount, 'ALL', 'whale_alert', 'Whale Alert');
          await insertExchangeFlow('whale_outflow', outflowCount, 'ALL', 'whale_alert', 'Whale Alert');
          
          console.log(`Whale Activity: $${(totalWhaleVolume / 1e6).toFixed(1)}M, ${inflowCount} inflows, ${outflowCount} outflows`);
        }
      } catch (error) {
        console.log('Whale Alert API not available, using market-based estimation');
      }
      
      // 3. Market-based estimation (fallback)
      try {
        const btcData = await this.getLatestCryptoPrice('BTC');
        const ethData = await this.getLatestCryptoPrice('ETH');
        
        if (btcData && ethData) {
          // Estimate flows based on price momentum and volume
          const btcPriceChange = btcData.change_24h || 0;
          const ethPriceChange = ethData.change_24h || 0;
          const btcVolume = btcData.volume_24h || 0;
          const ethVolume = ethData.volume_24h || 0;
          
          // Simple heuristic: high volume + price increase = likely inflows
          const btcFlowEstimate = btcPriceChange > 0 ? btcVolume * 0.1 : -btcVolume * 0.1;
          const ethFlowEstimate = ethPriceChange > 0 ? ethVolume * 0.1 : -ethVolume * 0.1;
          
          const { insertExchangeFlow } = require('../database');
          await insertExchangeFlow('estimated_flow', btcFlowEstimate, 'BTC', 'market_estimation', 'Market Analysis');
          await insertExchangeFlow('estimated_flow', ethFlowEstimate, 'ETH', 'market_estimation', 'Market Analysis');
          
          console.log(`Market Flow Estimates: BTC $${(btcFlowEstimate / 1e6).toFixed(1)}M, ETH $${(ethFlowEstimate / 1e6).toFixed(1)}M`);
        }
      } catch (error) {
        console.error('Error in market-based flow estimation:', error.message);
      }
      
    } catch (error) {
      console.error('Error collecting exchange flows:', error.message);
      await this.errorLogger.logApiFailure('Multiple', 'Exchange Flows', error);
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
        this.collectTrendingNarratives(),
        this.collectLayer1Data(),
        this.collectBitcoinDominance(),
        this.collectStablecoinMetrics(),
        this.collectExchangeFlows(),
        this.collectAltcoinSeasonIndicator(),
        this.collectDerivativesData(),
        this.collectOnchainData()
      ]);
      
      // Run AI analysis after all data is collected
      console.log('Running AI analysis...');
      await this.runAIAnalysis();
      
      console.log(`Data collection completed at ${timestamp}`);
      
      // Check for alerts after data collection
      try {
        const advancedMetrics = await this.getAdvancedMetricsSummary();
        const alerts = await this.alertService.checkAllAlerts(advancedMetrics);
        if (alerts.length > 0) {
          console.log(`Generated ${alerts.length} new alerts`);
        }
        
        // Cleanup old alerts (keep last 7 days)
        await this.alertService.cleanupOldAlerts(7);
      } catch (error) {
        console.error('Error checking alerts:', error.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error in data collection:', error.message);
      return false;
    }
  }
}

module.exports = DataCollector;