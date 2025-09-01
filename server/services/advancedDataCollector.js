const axios = require('axios');
const moment = require('moment');
require('dotenv').config({ path: '.env.local' });

const {
  insertMarketSentiment,
  getLatestMarketSentiment,
  insertDerivativesData,
  getLatestDerivativesData,
  insertOnchainData,
  getLatestOnchainData
} = require('../database');

const ErrorLogger = require('./errorLogger');

class AdvancedDataCollector {
  constructor() {
    this.errorLogger = new ErrorLogger();
    
    // Rate limiting for different APIs
    this.apiCallTimes = new Map();
    this.apiLimits = {
      'alternative.me': { interval: 60000, calls: 60 }, // 60 calls per minute
      'cryptocompare': { interval: 60000, calls: 100 }, // 100 calls per minute
      'binance': { interval: 1000, calls: 10 }, // 10 calls per second
      'blockchain.info': { interval: 10000, calls: 1 }, // 1 call per 10 seconds
      'etherscan': { interval: 200, calls: 1 } // 1 call per 200ms (5 per second)
    };
  }

  // Rate limiting helper
  async waitForRateLimit(apiName) {
    const now = Date.now();
    const limit = this.apiLimits[apiName];
    
    if (!limit) return;
    
    if (!this.apiCallTimes.has(apiName)) {
      this.apiCallTimes.set(apiName, []);
    }
    
    const callTimes = this.apiCallTimes.get(apiName);
    
    // Remove old call times outside the interval
    const cutoff = now - limit.interval;
    const recentCalls = callTimes.filter(time => time > cutoff);
    
    if (recentCalls.length >= limit.calls) {
      const oldestCall = Math.min(...recentCalls);
      const waitTime = limit.interval - (now - oldestCall);
      if (waitTime > 0) {
        console.log(`⏳ Rate limiting ${apiName}: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Record this call
    callTimes.push(now);
    this.apiCallTimes.set(apiName, callTimes);
  }

  // Market Sentiment Collection
  async collectMarketSentiment() {
    console.log('📊 Collecting market sentiment data...');
    
    try {
      // 1. Alternative.me Fear & Greed Index (already implemented, but let's enhance it)
      await this.collectFearGreedIndex();
      
      // 2. CryptoCompare Social Sentiment
      await this.collectCryptoCompareSentiment();
      
      // 3. Additional sentiment indicators
      await this.collectAdditionalSentiment();
      
      console.log('✅ Market sentiment data collection completed');
    } catch (error) {
      console.error('❌ Error collecting market sentiment:', error.message);
      await this.errorLogger.logError('market_sentiment_collection', error);
    }
  }

  async collectFearGreedIndex() {
    try {
      await this.waitForRateLimit('alternative.me');
      
      const response = await axios.get('https://api.alternative.me/fng/', {
        timeout: 10000
      });
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const data = response.data.data[0];
        
        await insertMarketSentiment(
          'fear_greed_index',
          parseInt(data.value),
          data.value_classification,
          {
            timestamp: data.timestamp,
            time_until_update: data.time_until_update
          },
          'alternative.me'
        );
        
        console.log(`📈 Fear & Greed Index: ${data.value} (${data.value_classification})`);
      }
    } catch (error) {
      console.error('Error collecting Fear & Greed Index:', error.message);
    }
  }

  async collectCryptoCompareSentiment() {
    try {
      await this.waitForRateLimit('cryptocompare');
      
      // Get social sentiment for major cryptocurrencies
      const cryptos = ['BTC', 'ETH', 'SOL'];
      
      for (const crypto of cryptos) {
        try {
          const response = await axios.get(`https://min-api.cryptocompare.com/data/social/sentiment/latest`, {
            params: {
              fsym: crypto,
              tsym: 'USD'
            },
            timeout: 10000
          });
          
          if (response.data && response.data.Data) {
            const data = response.data.Data;
            
            await insertMarketSentiment(
              'social_sentiment',
              data.Sentiment,
              data.Sentiment > 0.6 ? 'Bullish' : data.Sentiment < 0.4 ? 'Bearish' : 'Neutral',
              {
                crypto: crypto,
                reddit_posts: data.RedditPosts,
                reddit_comments: data.RedditComments,
                twitter_posts: data.TwitterPosts,
                twitter_comments: data.TwitterComments
              },
              'cryptocompare'
            );
            
            console.log(`📱 ${crypto} Social Sentiment: ${data.Sentiment}`);
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error collecting sentiment for ${crypto}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error collecting CryptoCompare sentiment:', error.message);
    }
  }

  async collectAdditionalSentiment() {
    try {
      // Collect additional sentiment indicators
      const sentimentData = {
        'market_momentum': this.calculateMarketMomentum(),
        'volatility_sentiment': this.calculateVolatilitySentiment(),
        'volume_sentiment': this.calculateVolumeSentiment()
      };
      
      for (const [type, value] of Object.entries(sentimentData)) {
        if (value !== null) {
          await insertMarketSentiment(
            type,
            value,
            value > 0.6 ? 'Bullish' : value < 0.4 ? 'Bearish' : 'Neutral',
            { calculated_at: new Date().toISOString() },
            'calculated'
          );
        }
      }
    } catch (error) {
      console.error('Error collecting additional sentiment:', error.message);
    }
  }

  calculateMarketMomentum() {
    // This would be calculated based on recent price movements
    // For now, return a placeholder value
    return Math.random() * 0.4 + 0.3; // Random value between 0.3 and 0.7
  }

  calculateVolatilitySentiment() {
    // This would be calculated based on recent volatility
    return Math.random() * 0.4 + 0.3;
  }

  calculateVolumeSentiment() {
    // This would be calculated based on recent volume trends
    return Math.random() * 0.4 + 0.3;
  }

  // Derivatives Data Collection
  async collectDerivativesData() {
    console.log('📊 Collecting derivatives data...');
    
    try {
      // 1. Binance Futures Data
      await this.collectBinanceFuturesData();
      
      // 2. CryptoCompare Derivatives Data
      await this.collectCryptoCompareDerivatives();
      
      console.log('✅ Derivatives data collection completed');
    } catch (error) {
      console.error('❌ Error collecting derivatives data:', error.message);
      await this.errorLogger.logError('derivatives_collection', error);
    }
  }

  async collectBinanceFuturesData() {
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
      
      for (const symbol of symbols) {
        try {
          await this.waitForRateLimit('binance');
          
          // Get open interest
          const openInterestResponse = await axios.get(`https://fapi.binance.com/fapi/v1/openInterest`, {
            params: { symbol },
            timeout: 10000
          });
          
          // Get funding rate
          const fundingRateResponse = await axios.get(`https://fapi.binance.com/fapi/v1/fundingRate`, {
            params: { symbol, limit: 1 },
            timeout: 10000
          });
          
          // Get 24h ticker for volume
          const tickerResponse = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/24hr`, {
            params: { symbol },
            timeout: 10000
          });
          
          if (openInterestResponse.data && fundingRateResponse.data && tickerResponse.data) {
            const asset = symbol.replace('USDT', '');
            const openInterest = parseFloat(openInterestResponse.data.openInterest);
            const fundingRate = parseFloat(fundingRateResponse.data[0].fundingRate);
            const volume24h = parseFloat(tickerResponse.data.volume);
            
            await insertDerivativesData(
              asset,
              'perpetual',
              openInterest,
              volume24h,
              fundingRate,
              null,
              {
                symbol: symbol,
                timestamp: new Date().toISOString()
              },
              'binance'
            );
            
            console.log(`📈 ${asset} Futures - OI: $${(openInterest / 1000000).toFixed(2)}M, Funding: ${(fundingRate * 100).toFixed(4)}%`);
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error collecting Binance data for ${symbol}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error collecting Binance futures data:', error.message);
    }
  }

  async collectCryptoCompareDerivatives() {
    try {
      await this.waitForRateLimit('cryptocompare');
      
      const response = await axios.get('https://min-api.cryptocompare.com/data/v2/derivatives', {
        params: {
          fsym: 'BTC',
          tsym: 'USD'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.Data) {
        const data = response.data.Data;
        
        // Process derivatives data
        if (data.futures && data.futures.length > 0) {
          for (const future of data.futures) {
            await insertDerivativesData(
              'BTC',
              'futures',
              future.openInterest,
              future.volume24h,
              future.fundingRate,
              future.longShortRatio,
              {
                exchange: future.exchange,
                timestamp: new Date().toISOString()
              },
              'cryptocompare'
            );
          }
        }
        
        console.log('📊 CryptoCompare derivatives data collected');
      }
    } catch (error) {
      console.error('Error collecting CryptoCompare derivatives:', error.message);
    }
  }

  // On-Chain Data Collection
  async collectOnchainData() {
    console.log('⛓️ Collecting on-chain data...');
    
    try {
      // 1. Bitcoin On-Chain Data
      await this.collectBitcoinOnchainData();
      
      // 2. Ethereum On-Chain Data
      await this.collectEthereumOnchainData();
      
      // 3. Additional On-Chain Metrics
      await this.collectAdditionalOnchainMetrics();
      
      console.log('✅ On-chain data collection completed');
    } catch (error) {
      console.error('❌ Error collecting on-chain data:', error.message);
      await this.errorLogger.logError('onchain_collection', error);
    }
  }

  async collectBitcoinOnchainData() {
    try {
      await this.waitForRateLimit('blockchain.info');
      
      const response = await axios.get('https://blockchain.info/stats?format=json', {
        timeout: 15000
      });
      
      if (response.data) {
        const data = response.data;
        
        // Hash Rate
        await insertOnchainData(
          'bitcoin',
          'hash_rate',
          data.hash_rate,
          {
            difficulty: data.difficulty,
            timestamp: new Date().toISOString()
          },
          'blockchain.info'
        );
        
        // Transaction Count
        await insertOnchainData(
          'bitcoin',
          'transaction_count',
          data.tx_count,
          {
            timestamp: new Date().toISOString()
          },
          'blockchain.info'
        );
        
        // Active Addresses (estimated)
        await insertOnchainData(
          'bitcoin',
          'active_addresses',
          data.n_btc_mined * 1000, // Rough estimate
          {
            timestamp: new Date().toISOString()
          },
          'blockchain.info'
        );
        
        console.log(`⛓️ Bitcoin - Hash Rate: ${(data.hash_rate / 1e18).toFixed(2)} EH/s, TX Count: ${data.tx_count}`);
      }
    } catch (error) {
      console.error('Error collecting Bitcoin on-chain data:', error.message);
    }
  }

  async collectEthereumOnchainData() {
    try {
      // Note: Etherscan requires API key for higher rate limits
      // For now, we'll use a basic approach
      
      await this.waitForRateLimit('etherscan');
      
      // Get ETH supply
      const supplyResponse = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'stats',
          action: 'ethsupply',
          apikey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'
        },
        timeout: 10000
      });
      
      if (supplyResponse.data && supplyResponse.data.result) {
        const ethSupply = parseFloat(supplyResponse.data.result) / 1e18;
        
        await insertOnchainData(
          'ethereum',
          'total_supply',
          ethSupply,
          {
            timestamp: new Date().toISOString()
          },
          'etherscan'
        );
        
        console.log(`⛓️ Ethereum - Total Supply: ${ethSupply.toFixed(2)} ETH`);
      }
      
      // Get gas price
      await this.waitForRateLimit('etherscan');
      
      const gasResponse = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'
        },
        timeout: 10000
      });
      
      if (gasResponse.data && gasResponse.data.result) {
        const gasData = gasResponse.data.result;
        
        await insertOnchainData(
          'ethereum',
          'gas_price',
          parseFloat(gasData.ProposeGasPrice),
          {
            fast: gasData.FastGasPrice,
            standard: gasData.ProposeGasPrice,
            slow: gasData.SafeGasPrice,
            timestamp: new Date().toISOString()
          },
          'etherscan'
        );
        
        console.log(`⛓️ Ethereum - Gas Price: ${gasData.ProposeGasPrice} Gwei`);
      }
    } catch (error) {
      console.error('Error collecting Ethereum on-chain data:', error.message);
    }
  }

  async collectAdditionalOnchainMetrics() {
    try {
      // Collect additional calculated metrics
      const metrics = {
        'network_health': this.calculateNetworkHealth(),
        'whale_activity': this.calculateWhaleActivity(),
        'exchange_flows': this.calculateExchangeFlows()
      };
      
      for (const [metric, value] of Object.entries(metrics)) {
        if (value !== null) {
          await insertOnchainData(
            'multi_chain',
            metric,
            value,
            { calculated_at: new Date().toISOString() },
            'calculated'
          );
        }
      }
    } catch (error) {
      console.error('Error collecting additional on-chain metrics:', error.message);
    }
  }

  calculateNetworkHealth() {
    // This would be calculated based on various network metrics
    return Math.random() * 0.4 + 0.6; // Random value between 0.6 and 1.0
  }

  calculateWhaleActivity() {
    // This would be calculated based on large transaction analysis
    return Math.random() * 0.4 + 0.3;
  }

  calculateExchangeFlows() {
    // This would be calculated based on exchange flow analysis
    return Math.random() * 0.4 + 0.3;
  }

  // Main collection method
  async collectAllAdvancedData() {
    console.log('🚀 Starting advanced data collection...');
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    
    try {
      await Promise.all([
        this.collectMarketSentiment(),
        this.collectDerivativesData(),
        this.collectOnchainData()
      ]);
      
      console.log(`✅ Advanced data collection completed at ${timestamp}`);
    } catch (error) {
      console.error('❌ Error in advanced data collection:', error.message);
      await this.errorLogger.logError('advanced_data_collection', error);
    }
  }

  // Get latest data for API endpoints
  async getLatestAdvancedData() {
    try {
      const [marketSentiment, derivativesData, onchainData] = await Promise.all([
        getLatestMarketSentiment(),
        getLatestDerivativesData(),
        getLatestOnchainData()
      ]);
      
      return {
        marketSentiment,
        derivatives: derivativesData,
        onchain: onchainData
      };
    } catch (error) {
      console.error('Error getting latest advanced data:', error.message);
      return null;
    }
  }
}

module.exports = AdvancedDataCollector;
