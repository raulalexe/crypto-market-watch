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
      // Try Alpha Vantage first
      let yield2Y = null;
      let yield10Y = null;
      
      try {
        // 2Y Treasury Yield
        const response2Y = await axios.get(
          `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=daily&maturity=2year&apikey=${this.alphaVantageKey}`
        );
        
        if (response2Y.data.data && response2Y.data.data.length > 0) {
          yield2Y = parseFloat(response2Y.data.data[0].value);
          await insertMarketData('TREASURY_YIELD', '2Y', yield2Y, {}, 'Alpha Vantage');
        }
      } catch (error) {
        console.log('Alpha Vantage 2Y failed, trying FRED fallback...');
      }

      try {
        // 10Y Treasury Yield
        const response10Y = await axios.get(
          `https://www.alphavantage.co/query?function=TREASURY_YIELD&interval=daily&maturity=10year&apikey=${this.alphaVantageKey}`
        );
        
        if (response10Y.data.data && response10Y.data.data.length > 0) {
          yield10Y = parseFloat(response10Y.data.data[0].value);
          await insertMarketData('TREASURY_YIELD', '10Y', yield10Y, {}, 'Alpha Vantage');
        }
      } catch (error) {
        console.log('Alpha Vantage 10Y failed, trying FRED fallback...');
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
        
        if (sp500Response.data['Time Series (Daily)']) {
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
        console.log('Alpha Vantage SP500 failed, trying Yahoo Finance fallback...');
      }

      try {
        // NASDAQ
        const nasdaqResponse = await axios.get(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=QQQ&apikey=${this.alphaVantageKey}`
        );
        
        if (nasdaqResponse.data['Time Series (Daily)']) {
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
        console.log('Alpha Vantage NASDAQ failed, trying Yahoo Finance fallback...');
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
          await this.errorLogger.logApiFailure('Alpha Vantage', 'VIX', new Error('No VIX data available from Alpha Vantage'), response.data);
          return null;
        }
      }
    } catch (error) {
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

  // Collect Crypto Prices using CoinGecko
  // CoinGecko provides free API with 10,000 calls/month limit
  // No API key required for basic usage
  // Single API call gets all crypto data for efficiency
  async collectCryptoPrices() {
    const cryptoIds = ['bitcoin', 'ethereum', 'solana', 'sui', 'ripple'];
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
    
    try {
      // Get all crypto data in a single API call for efficiency
      const ids = cryptoIds.join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );
      
      if (response.data) {
        for (let i = 0; i < cryptoIds.length; i++) {
          const id = cryptoIds[i];
          const symbol = cryptoSymbols[i];
          
          if (response.data[id]) {
            const data = response.data[id];
            const price = data.usd || 0;
            const volume = data.usd_24h_vol || 0;
            const marketCap = data.usd_market_cap || 0;
            const change24h = data.usd_24h_change || 0;
            
            await insertCryptoPrice(symbol, price, volume, marketCap, change24h);
            console.log(`Collected ${symbol} data: $${price.toFixed(2)}, 24h change: ${change24h.toFixed(2)}%`);
          }
        }
      }
    } catch (error) {
      console.error('Error collecting crypto prices from CoinGecko:', error.message);
      
      // Fallback to Alpha Vantage if CoinGecko fails
      console.log('Falling back to Alpha Vantage for crypto data...');
      await this.collectCryptoPricesFallback();
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
          const change24h = parseFloat(latestData['9a. close (USD)']) - parseFloat(latestData['1a. open (USD)']);
          
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

  // Collect trending narratives with money flow analysis
  async collectTrendingNarratives() {
    try {
      // Get trending coins from CoinGecko
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/search/trending'
      );
      
      if (response.data && response.data.coins) {
        const narratives = [];
        
        for (const coin of response.data.coins.slice(0, 10)) {
          const item = coin.item;
          
          // Analyze the coin's category and determine narrative
          const narrative = this.categorizeNarrative(item.name, item.symbol);
          
          narratives.push({
            narrative: narrative,
            coin_name: item.name,
            coin_symbol: item.symbol,
            market_cap_rank: item.market_cap_rank,
            price_btc: item.price_btc,
            score: item.score,
            sentiment: this.analyzeSentiment(item.score),
            relevance_score: item.score / 100
          });
        }
        
        // Get detailed data for trending coins to analyze money flow
        const trendingCoins = response.data.coins.slice(0, 10).map(coin => coin.item.id);
        const detailedResponse = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${trendingCoins.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
        );
        
        // Add money flow data to narratives
        for (const narrative of narratives) {
          const coinId = response.data.coins.find(coin => coin.item.symbol.toLowerCase() === narrative.coin_symbol.toLowerCase())?.item.id;
          if (coinId && detailedResponse.data[coinId]) {
            const data = detailedResponse.data[coinId];
            narrative.price_usd = data.usd;
            narrative.change_24h = data.usd_24h_change;
            narrative.volume_24h = data.usd_24h_vol;
            narrative.market_cap = data.usd_market_cap;
          }
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
        const topNarratives = Object.values(narrativeGroups)
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
        
        // Save to database with money flow data
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
    } catch (error) {
      console.error('Error collecting trending narratives:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Trending Narratives', error);
    }
  }

  // Categorize coin into narrative based on name and symbol
  categorizeNarrative(name, symbol) {
    const lowerName = name.toLowerCase();
    const lowerSymbol = symbol.toLowerCase();
    
    // RWA (Real World Assets)
    if (lowerName.includes('real') || lowerName.includes('asset') || lowerName.includes('tokenized') || 
        lowerSymbol.includes('rwa') || lowerName.includes('property') || lowerName.includes('real estate')) {
      return 'RWA (Real World Assets)';
    }
    
    // Meme coins
    if (lowerName.includes('dog') || lowerName.includes('cat') || lowerName.includes('moon') || 
        lowerName.includes('inu') || lowerName.includes('shib') || lowerName.includes('pepe') ||
        lowerName.includes('floki') || lowerName.includes('wojak') || lowerName.includes('doge')) {
      return 'Meme Coins';
    }
    
    // Layer 1 blockchains
    if (lowerName.includes('chain') || lowerName.includes('protocol') || lowerName.includes('network') ||
        lowerSymbol.includes('chain') || lowerName.includes('blockchain') || lowerName.includes('platform')) {
      return 'Layer 1 Blockchains';
    }
    
    // DeFi
    if (lowerName.includes('swap') || lowerName.includes('dex') || lowerName.includes('yield') ||
        lowerName.includes('lending') || lowerName.includes('borrow') || lowerName.includes('farm') ||
        lowerName.includes('finance') || lowerName.includes('defi') || lowerName.includes('protocol')) {
      return 'DeFi Protocols';
    }
    
    // Gaming/Metaverse
    if (lowerName.includes('game') || lowerName.includes('gaming') || lowerName.includes('play') ||
        lowerName.includes('metaverse') || lowerName.includes('virtual') || lowerName.includes('nft') ||
        lowerName.includes('gaming') || lowerName.includes('arena') || lowerName.includes('battle')) {
      return 'Gaming & Metaverse';
    }
    
    // AI/ML
    if (lowerName.includes('ai') || lowerName.includes('artificial') || lowerName.includes('intelligence') ||
        lowerName.includes('machine') || lowerName.includes('learning') || lowerName.includes('neural') ||
        lowerName.includes('bot') || lowerName.includes('automation')) {
      return 'AI & Machine Learning';
    }
    
    // Privacy
    if (lowerName.includes('privacy') || lowerName.includes('private') || lowerName.includes('anon') ||
        lowerName.includes('zero') || lowerName.includes('zk') || lowerName.includes('mixer') ||
        lowerName.includes('shield') || lowerName.includes('cloak')) {
      return 'Privacy & Anonymity';
    }
    
    // Infrastructure
    if (lowerName.includes('infra') || lowerName.includes('oracle') || lowerName.includes('index') ||
        lowerName.includes('data') || lowerName.includes('storage') || lowerName.includes('compute') ||
        lowerName.includes('cloud') || lowerName.includes('api')) {
      return 'Infrastructure & Data';
    }
    
    // Social/Community
    if (lowerName.includes('social') || lowerName.includes('community') || lowerName.includes('dao') ||
        lowerName.includes('governance') || lowerName.includes('vote') || lowerName.includes('forum') ||
        lowerName.includes('chat') || lowerName.includes('social')) {
      return 'Social & Community';
    }
    
    // Default category
    return 'Emerging Trends';
  }

  // Analyze sentiment based on score
  analyzeSentiment(score) {
    if (score >= 80) return 'very_positive';
    if (score >= 60) return 'positive';
    if (score >= 40) return 'neutral';
    if (score >= 20) return 'negative';
    return 'very_negative';
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
        this.collectBitcoinDominance(),
        this.collectStablecoinMetrics(),
        this.collectExchangeFlows(),
        this.collectAltcoinSeasonIndicator(),
        this.collectDerivativesData(),
        this.collectOnchainData()
      ]);
      
      console.log(`Data collection completed at ${timestamp}`);
      
      // Check for alerts after data collection
      try {
        const advancedMetrics = await this.getAdvancedMetricsSummary();
        const alerts = await this.alertService.checkAllAlerts(advancedMetrics);
        if (alerts.length > 0) {
          console.log(`Generated ${alerts.length} alerts`);
        }
      } catch (error) {
        console.error('Error checking alerts:', error.message);
      }
      
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

  // Get advanced metrics summary for alerts
  async getAdvancedMetricsSummary() {
    try {
      const { getLatestBitcoinDominance, getLatestStablecoinMetrics, getLatestExchangeFlows } = require('../database');
      
      const bitcoinDominance = await getLatestBitcoinDominance();
      const stablecoinMetrics = await getLatestStablecoinMetrics();
      const btcFlows = await getLatestExchangeFlows('BTC');
      const ethFlows = await getLatestExchangeFlows('ETH');
      
      // Process stablecoin metrics
      const totalMarketCap = stablecoinMetrics.find(m => m.metric_type === 'total_market_cap');
      const ssr = stablecoinMetrics.find(m => m.metric_type === 'ssr');
      
      // Process exchange flows
      const processFlows = (flows) => {
        const inflows = flows.filter(f => f.flow_type === 'inflow').reduce((sum, f) => sum + f.value, 0);
        const outflows = flows.filter(f => f.flow_type === 'outflow').reduce((sum, f) => sum + f.value, 0);
        return {
          inflow: inflows,
          outflow: outflows,
          netFlow: inflows - outflows
        };
      };
      
      return {
        bitcoinDominance: bitcoinDominance ? {
          value: bitcoinDominance.value
        } : null,
        stablecoinMetrics: {
          totalMarketCap: totalMarketCap ? totalMarketCap.value : null,
          ssr: ssr ? ssr.value : null,
          change_24h: 0 // TODO: Calculate 24h change
        },
        exchangeFlows: {
          btc: btcFlows.length > 0 ? processFlows(btcFlows) : null,
          eth: ethFlows.length > 0 ? processFlows(ethFlows) : null
        }
      };
    } catch (error) {
      console.error('Error getting advanced metrics summary:', error.message);
      return null;
    }
  }

  // Collect Bitcoin Dominance and Total Market Cap
  async collectBitcoinDominance() {
    try {
      // Get total crypto market cap and BTC market cap from CoinGecko
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/global'
      );
      
      if (response.data && response.data.data) {
        const globalData = response.data.data;
        const totalMarketCap = globalData.total_market_cap.usd;
        const btcMarketCapPercentage = globalData.market_cap_percentage.btc;
        const totalMarketCapChange24h = globalData.market_cap_change_percentage_24h_usd;
        
        // Calculate Bitcoin Dominance (already in percentage)
        const btcDominance = btcMarketCapPercentage;
        
        await insertBitcoinDominance(btcDominance, 'CoinGecko');
        await insertMarketData('TOTAL_MARKET_CAP', 'CRYPTO', totalMarketCap, {
          change_24h: totalMarketCapChange24h
        }, 'CoinGecko');
        
        console.log(`Collected Bitcoin Dominance: ${btcDominance.toFixed(2)}%`);
        console.log(`Collected Total Market Cap: $${(totalMarketCap / 1e12).toFixed(2)}T (${totalMarketCapChange24h > 0 ? '+' : ''}${totalMarketCapChange24h.toFixed(2)}% 24h)`);
        
        return { btcDominance, totalMarketCap, totalMarketCapChange24h };
      }
    } catch (error) {
      console.error('Error collecting Bitcoin Dominance:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Bitcoin Dominance', error);
    }
  }

  // Collect Altcoin Season Indicator
  async collectAltcoinSeasonIndicator() {
    try {
      // Get top 100 coins by market cap to calculate altcoin season indicator
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
      );
      
      if (response.data && response.data.length > 0) {
        let btcOutperformingCount = 0;
        let totalCoins = 0;
        
        // Get BTC 24h change
        const btcData = response.data.find(coin => coin.symbol.toLowerCase() === 'btc');
        const btcChange24h = btcData ? btcData.price_change_percentage_24h : 0;
        
        // Count how many altcoins are outperforming BTC
        for (const coin of response.data) {
          if (coin.symbol.toLowerCase() !== 'btc' && coin.price_change_percentage_24h !== null) {
            totalCoins++;
            if (coin.price_change_percentage_24h > btcChange24h) {
              btcOutperformingCount++;
            }
          }
        }
        
        // Calculate altcoin season indicator (percentage of altcoins outperforming BTC)
        const altcoinSeasonIndicator = totalCoins > 0 ? (btcOutperformingCount / totalCoins) * 100 : 0;
        
        // Determine season
        let season = 'Bitcoin Season';
        if (altcoinSeasonIndicator >= 75) {
          season = 'Altcoin Season';
        } else if (altcoinSeasonIndicator >= 50) {
          season = 'Transition Period';
        }
        
        await insertMarketData('ALTCOIN_SEASON', 'INDICATOR', altcoinSeasonIndicator, {
          season: season,
          btc_change_24h: btcChange24h,
          altcoins_outperforming: btcOutperformingCount,
          total_altcoins: totalCoins
        }, 'CoinGecko');
        
        console.log(`Altcoin Season Indicator: ${altcoinSeasonIndicator.toFixed(1)}% (${season})`);
        console.log(`BTC 24h: ${btcChange24h.toFixed(2)}%, ${btcOutperformingCount}/${totalCoins} altcoins outperforming`);
        
        return { indicator: altcoinSeasonIndicator, season, btcChange24h, altcoinsOutperforming: btcOutperformingCount, totalAltcoins: totalCoins };
      }
    } catch (error) {
      console.error('Error collecting Altcoin Season Indicator:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Altcoin Season Indicator', error);
    }
  }

  // Collect Stablecoin Metrics
  async collectStablecoinMetrics() {
    try {
      const stablecoins = ['tether', 'usd-coin', 'dai', 'binance-usd', 'true-usd'];
      const stablecoinIds = stablecoins.join(',');
      
      // Get stablecoin data
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${stablecoinIds}&vs_currencies=usd&include_market_cap=true`
      );
      
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
        
        // Get BTC market cap for SSR calculation
        const btcResponse = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true'
        );
        
        if (btcResponse.data && btcResponse.data.bitcoin) {
          const btcMarketCap = btcResponse.data.bitcoin.usd_market_cap;
          
          // Calculate Stablecoin Supply Ratio (SSR)
          const ssr = btcMarketCap / totalStablecoinMarketCap;
          
          // Store metrics
          await insertStablecoinMetric('total_market_cap', totalStablecoinMarketCap, stablecoinData, 'CoinGecko');
          await insertStablecoinMetric('ssr', ssr, { btc_market_cap: btcMarketCap }, 'CoinGecko');
          
          console.log(`Collected Stablecoin Metrics: Total MC $${(totalStablecoinMarketCap / 1e9).toFixed(2)}B, SSR: ${ssr.toFixed(2)}`);
          
          return { totalMarketCap: totalStablecoinMarketCap, ssr };
        }
      }
    } catch (error) {
      console.error('Error collecting stablecoin metrics:', error.message);
      await this.errorLogger.logApiFailure('CoinGecko', 'Stablecoin Metrics', error);
    }
  }

  // Collect Exchange Flows (simulated data for now)
  async collectExchangeFlows() {
    try {
      // Note: Real exchange flow data requires premium APIs like Glassnode, Santiment, etc.
      // For now, we'll simulate some data based on market conditions
      
      // Simulate BTC flows based on price movement
      const btcData = await this.getLatestCryptoPrice('BTC');
      if (btcData) {
        // Simple simulation: if price is up, assume some inflows; if down, assume outflows
        const priceChange = btcData.change_24h;
        const simulatedFlow = priceChange > 0 ? Math.abs(priceChange) * 1000 : -Math.abs(priceChange) * 1000;
        
        await insertExchangeFlow('inflow', Math.max(0, simulatedFlow), 'BTC', 'simulated', 'Simulated');
        await insertExchangeFlow('outflow', Math.max(0, -simulatedFlow), 'BTC', 'simulated', 'Simulated');
        
        console.log(`Simulated BTC Exchange Flows: ${simulatedFlow > 0 ? 'Inflow' : 'Outflow'} $${Math.abs(simulatedFlow).toFixed(0)}`);
      }
      
      // Simulate ETH flows
      const ethData = await this.getLatestCryptoPrice('ETH');
      if (ethData) {
        const priceChange = ethData.change_24h;
        const simulatedFlow = priceChange > 0 ? Math.abs(priceChange) * 500 : -Math.abs(priceChange) * 500;
        
        await insertExchangeFlow('inflow', Math.max(0, simulatedFlow), 'ETH', 'simulated', 'Simulated');
        await insertExchangeFlow('outflow', Math.max(0, -simulatedFlow), 'ETH', 'simulated', 'Simulated');
        
        console.log(`Simulated ETH Exchange Flows: ${simulatedFlow > 0 ? 'Inflow' : 'Outflow'} $${Math.abs(simulatedFlow).toFixed(0)}`);
      }
      
    } catch (error) {
      console.error('Error collecting exchange flows:', error.message);
      await this.errorLogger.logApiFailure('Simulated', 'Exchange Flows', error);
    }
  }

  // Collect Derivatives Data (simulated for now)
  async collectDerivativesData() {
    try {
      // Simulate derivatives data
      const btcPrice = await this.getLatestCryptoPrice('BTC');
      
      if (btcPrice) {
        // Open Interest (simulated)
        const openInterest = Math.random() * 50000 + 20000; // $20B-$70B
        await insertMarketData('DERIVATIVES', 'OPEN_INTEREST', openInterest, {
          btc_percentage: 65,
          eth_percentage: 25,
          others_percentage: 10
        }, 'Simulated');
        
        // Funding Rate (simulated)
        const fundingRate = (Math.random() - 0.5) * 0.002; // -0.1% to +0.1%
        await insertMarketData('DERIVATIVES', 'FUNDING_RATE', fundingRate * 100, {
          btc_funding: fundingRate * 100,
          eth_funding: (Math.random() - 0.5) * 0.0015 * 100
        }, 'Simulated');
        
        // Liquidations (simulated)
        const liquidations = Math.random() * 200 + 50; // $50M-$250M
        await insertMarketData('DERIVATIVES', 'LIQUIDATIONS', liquidations, {
          long_liquidations: liquidations * 0.6,
          short_liquidations: liquidations * 0.4
        }, 'Simulated');
        
        console.log(`Collected Derivatives Data: OI $${(openInterest / 1e9).toFixed(1)}B, Funding ${(fundingRate * 100).toFixed(3)}%, Liquidations $${(liquidations / 1e6).toFixed(1)}M`);
      }
    } catch (error) {
      console.error('Error collecting derivatives data:', error.message);
      await this.errorLogger.logApiFailure('Simulated', 'Derivatives Data', error);
    }
  }

  // Collect On-chain Data (simulated for now)
  async collectOnchainData() {
    try {
      // Simulate on-chain metrics
      const btcPrice = await this.getLatestCryptoPrice('BTC');
      
      if (btcPrice) {
        // Whale Transactions (>$1M)
        const whaleTransactions = Math.random() * 50 + 20; // 20-70 transactions
        await insertMarketData('ONCHAIN', 'WHALE_TRANSACTIONS', whaleTransactions, {
          total_value: whaleTransactions * (Math.random() * 10 + 5), // $5M-$15M per transaction
          btc_whales: whaleTransactions * 0.7,
          eth_whales: whaleTransactions * 0.3
        }, 'Simulated');
        
        // Network Hash Rate (simulated)
        const hashRate = Math.random() * 200 + 400; // 400-600 EH/s
        await insertMarketData('ONCHAIN', 'HASH_RATE', hashRate, {
          btc_hashrate: hashRate,
          difficulty: hashRate * 0.8
        }, 'Simulated');
        
        // Active Addresses (simulated)
        const activeAddresses = Math.random() * 500000 + 1000000; // 1M-1.5M
        await insertMarketData('ONCHAIN', 'ACTIVE_ADDRESSES', activeAddresses, {
          btc_addresses: activeAddresses * 0.6,
          eth_addresses: activeAddresses * 0.4
        }, 'Simulated');
        
        console.log(`Collected On-chain Data: ${Math.round(whaleTransactions)} whale tx, ${hashRate.toFixed(0)} EH/s hash rate, ${(activeAddresses / 1e6).toFixed(1)}M active addresses`);
      }
    } catch (error) {
      console.error('Error collecting on-chain data:', error.message);
      await this.errorLogger.logApiFailure('Simulated', 'On-chain Data', error);
    }
  }
}

module.exports = DataCollector;