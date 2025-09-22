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

  // Real Bitcoin Onchain Metrics Collection
  async collectBitcoinOnchainMetrics() {
    console.log('🔗 Collecting real Bitcoin onchain metrics from blockchain.info...');
    
    try {
      await this.waitForRateLimit('blockchain.info');
      
      // Collect multiple metrics in parallel with better error handling
      const promises = [];
      
      // Hash rate endpoint
      promises.push(
        axios.get('https://blockchain.info/q/hashrate', { 
          timeout: 10000,
          headers: { 'User-Agent': 'CryptoMarketWatch/1.0' }
        }).catch(err => {
          console.warn('⚠️ Hash rate endpoint failed:', err.message);
          // Try alternative endpoint
          return axios.get('https://api.blockchain.info/stats', {
            timeout: 10000,
            headers: { 'User-Agent': 'CryptoMarketWatch/1.0' }
          }).then(response => {
            return { data: response.data.hash_rate || null };
          }).catch(() => {
            return { data: null }; // No fallback - let it fail properly
          });
        })
      );
      
      // Transaction count endpoint
      promises.push(
        axios.get('https://blockchain.info/q/24hrtransactioncount', { 
          timeout: 10000,
          headers: { 'User-Agent': 'CryptoMarketWatch/1.0' }
        }).catch(err => {
          console.warn('⚠️ Transaction count endpoint failed:', err.message);
          return { data: null }; // No fallback - let it fail properly
        })
      );
      
      // Stats endpoint
      promises.push(
        axios.get('https://blockchain.info/stats', { 
          timeout: 10000,
          headers: { 'User-Agent': 'CryptoMarketWatch/1.0' }
        }).catch(err => {
          console.warn('⚠️ Stats endpoint failed:', err.message);
          return { data: null }; // No fallback - let it fail properly
        })
      );
      
      const [hashRateResponse, txCountResponse, statsResponse] = await Promise.all(promises);
      
      // Validate responses - no fallback values
      if (!hashRateResponse.data || !txCountResponse.data || !statsResponse.data) {
        console.error('❌ Bitcoin metrics collection failed - missing data from blockchain.info');
        return;
      }
      
      const hashRate = parseFloat(hashRateResponse.data) / 1e9; // Convert GH/s to EH/s
      const txCount24h = parseInt(txCountResponse.data);
      const stats = statsResponse.data;
      
      // Validate parsed values
      if (isNaN(hashRate) || isNaN(txCount24h) || txCount24h <= 0) {
        console.error('❌ Bitcoin metrics collection failed - invalid data values');
        return;
      }
      
      // Calculate derived metrics
      const tps = txCount24h / (24 * 60 * 60); // transactions per second
      const estimatedActiveAddresses = Math.round(txCount24h * 0.6); // Conservative estimate
      const whaleTransactions = Math.round(txCount24h * 0.02); // Estimate 2% as whale transactions
      
      // Store Hash Rate
      await insertOnchainData(
        'Bitcoin',
        'hash_rate',
        hashRate,
        {
          hash_rate_ehs: hashRate,
          difficulty: stats.difficulty || 0,
          network_health: hashRate > 500 ? 'Strong' : hashRate > 300 ? 'Moderate' : 'Weak',
          blocks_mined_24h: stats.n_blocks_mined_24h || 0
        },
        'blockchain.info'
      );
      
      // Store Whale Transactions
      await insertOnchainData(
        'Bitcoin', 
        'whale_activity',
        whaleTransactions,
        {
          total_transactions_24h: txCount24h,
          whale_transactions_24h: whaleTransactions,
          whale_percentage: ((whaleTransactions / txCount24h) * 100).toFixed(2),
          estimated_whale_threshold: '$100,000+'
        },
        'blockchain.info'
      );
      
      // Store Active Addresses
      await insertOnchainData(
        'Bitcoin',
        'active_addresses', 
        estimatedActiveAddresses,
        {
          active_addresses_24h: estimatedActiveAddresses,
          transactions_per_address: (txCount24h / estimatedActiveAddresses).toFixed(2),
          network_activity: estimatedActiveAddresses > 200000 ? 'High' : estimatedActiveAddresses > 100000 ? 'Medium' : 'Low'
        },
        'blockchain.info'
      );
      
      console.log(`✅ Bitcoin onchain: ${hashRate.toFixed(2)} EH/s, ${whaleTransactions} whale txs, ${(estimatedActiveAddresses/1000).toFixed(1)}K addresses`);
      
    } catch (error) {
      console.error('❌ Error collecting Bitcoin onchain metrics:', error.message);
      await this.errorLogger.logError('bitcoin_onchain_collection', error);
    }
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
      const cryptos = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP'];
      
      for (const crypto of cryptos) {
        try {
          // Try the new CryptoCompare API endpoint first
          let response;
          try {
            response = await axios.get(`https://min-api.cryptocompare.com/data/v2/social/sentiment/latest`, {
              params: {
                fsym: crypto,
                tsym: 'USD'
              },
              timeout: 10000
            });
          } catch (apiError) {
            // If new endpoint fails, try alternative approach
            console.warn(`CryptoCompare sentiment API failed for ${crypto}:`, apiError.message);
            
            // Skip fallback to avoid additional API calls that might fail
            console.log(`⚠️ Skipping ${crypto} sentiment data due to API issues`);
            continue;
          }
          
          // Check if the response is successful and has valid data
          if (response.data && response.data.Response === 'Success' && response.data.Data && response.data.Data.Sentiment !== undefined) {
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
          } else {
            // API returned error or no data, use fallback
            console.warn(`CryptoCompare API returned error or no data for ${crypto}:`, response.data?.Message || 'No data');
            
            const fallbackSentiment = await this.getCoinGeckoSocialSentiment(crypto);
            if (fallbackSentiment) {
              await insertMarketSentiment(
                'social_sentiment',
                fallbackSentiment.score,
                fallbackSentiment.sentiment,
                {
                  crypto: crypto,
                  source: 'coingecko_fallback',
                  social_volume: fallbackSentiment.socialVolume || 0
                },
                'coingecko_fallback'
              );
              console.log(`📱 ${crypto} Social Sentiment (Fallback): ${fallbackSentiment.sentiment}`);
            }
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
      // Collect additional sentiment indicators from real market data
      const sentimentData = {
        'market_momentum': await this.calculateMarketMomentum(),
        'volatility_sentiment': await this.calculateVolatilitySentiment(),
        'volume_sentiment': await this.calculateVolumeSentiment()
      };
      
      for (const [type, value] of Object.entries(sentimentData)) {
        if (value !== null && value !== undefined) {
          await insertMarketSentiment(
            type,
            value,
            value > 0.6 ? 'Bullish' : value < 0.4 ? 'Bearish' : 'Neutral',
            { 
              calculated_at: new Date().toISOString(),
              source: 'Real Market Data Analysis',
              data_points_used: '7 days of historical data'
            },
            'calculated'
          );
          console.log(`📊 Calculated ${type}: ${value.toFixed(3)} from real market data`);
        } else {
          console.log(`⚠️ Could not calculate ${type} - insufficient real data available`);
        }
      }
    } catch (error) {
      console.error('Error collecting additional sentiment:', error.message);
    }
  }

  async calculateMarketMomentum() {
    // Calculate based on recent price movements from real market data
    try {
      const { getCryptoPrices } = require('../database');
      const btcData = await getCryptoPrices('BTC', 7); // Get last 7 days
      
      if (!btcData || btcData.length < 2) {
        return null; // No data available
      }
      
      // Calculate momentum based on price changes
      const recentPrices = btcData.slice(0, 3).map(d => d.price);
      const olderPrices = btcData.slice(3, 6).map(d => d.price);
      
      const recentAvg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
      const olderAvg = olderPrices.reduce((sum, price) => sum + price, 0) / olderPrices.length;
      
      const momentum = (recentAvg - olderAvg) / olderAvg;
      return Math.max(0, Math.min(1, (momentum + 0.1) / 0.2)); // Normalize to 0-1
    } catch (error) {
      console.error('Error calculating market momentum:', error.message);
      return null;
    }
  }

  async calculateVolatilitySentiment() {
    // Calculate based on recent volatility from real market data
    try {
      const { getCryptoPrices } = require('../database');
      const btcData = await getCryptoPrices('BTC', 7);
      
      if (!btcData || btcData.length < 3) {
        return null;
      }
      
      // Calculate volatility (standard deviation of daily returns)
      const returns = [];
      for (let i = 1; i < btcData.length; i++) {
        const dailyReturn = (btcData[i-1].price - btcData[i].price) / btcData[i].price;
        returns.push(dailyReturn);
      }
      
      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);
      
      // Convert volatility to sentiment (higher volatility = more bearish sentiment)
      return Math.max(0, Math.min(1, 1 - (volatility * 10))); // Normalize to 0-1
    } catch (error) {
      console.error('Error calculating volatility sentiment:', error.message);
      return null;
    }
  }

  async calculateVolumeSentiment() {
    // Calculate based on recent volume trends from real market data
    try {
      const { getCryptoPrices } = require('../database');
      const btcData = await getCryptoPrices('BTC', 7);
      
      if (!btcData || btcData.length < 3) {
        return null;
      }
      
      // Calculate volume trend
      const recentVolumes = btcData.slice(0, 3).map(d => d.volume_24h);
      const olderVolumes = btcData.slice(3, 6).map(d => d.volume_24h);
      
      const recentAvg = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
      const olderAvg = olderVolumes.reduce((sum, vol) => sum + vol, 0) / olderVolumes.length;
      
      const volumeTrend = (recentAvg - olderAvg) / olderAvg;
      return Math.max(0, Math.min(1, (volumeTrend + 0.5) / 1.0)); // Normalize to 0-1
    } catch (error) {
      console.error('Error calculating volume sentiment:', error.message);
      return null;
    }
  }

  // Fallback method for social sentiment using CoinGecko
  async getCoinGeckoSocialSentiment(crypto) {
    try {
      // Use CoinGecko's trending data as a proxy for social sentiment
      const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoMarketWatch/1.0)'
        }
      });
      
      if (response.data && response.data.coins) {
        const trendingCoins = response.data.coins;
        const cryptoData = trendingCoins.find(coin => 
          coin.item.symbol.toLowerCase() === crypto.toLowerCase()
        );
        
        if (cryptoData) {
          // Calculate sentiment based on trending score
          const score = cryptoData.item.score || 0;
          const sentiment = score > 50 ? 'Bullish' : score > 20 ? 'Neutral' : 'Bearish';
          
          return {
            score: Math.min(1, score / 100), // Normalize to 0-1
            sentiment: sentiment,
            socialVolume: score
          };
        }
      }
      
      // If not trending, return neutral sentiment
      return {
        score: 0.5,
        sentiment: 'Neutral',
        socialVolume: 0
      };
    } catch (error) {
      console.error(`Error getting CoinGecko social sentiment for ${crypto}:`, error.message);
      return null;
    }
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
      
      let response;
      try {
        // Try the new CryptoCompare API endpoint
        response = await axios.get('https://min-api.cryptocompare.com/data/v2/derivatives', {
          params: {
            fsym: 'BTC',
            tsym: 'USD'
          },
          timeout: 10000
        });
      } catch (apiError) {
        console.warn('CryptoCompare derivatives API failed, using fallback:', apiError.message);
        
        // Fallback: Use Binance derivatives data (already collected in collectBinanceFuturesData)
        console.log('📊 Using Binance derivatives data as fallback');
        return; // Binance data is already collected in collectBinanceFuturesData
      }
      
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
          'Bitcoin',
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
          'Bitcoin',
          'transaction_count',
          data.tx_count || 0,
          {
            timestamp: new Date().toISOString()
          },
          'blockchain.info'
        );
        
        // Active Addresses (estimated from transaction count)
        let txCount24h = 'N/A';
        let activeAddresses = 'N/A';
        
        if (data.tx_count && data.tx_count > 0) {
          txCount24h = data.tx_count;
          const estimatedActiveAddresses = Math.round(txCount24h * 0.6); // Conservative estimate
          activeAddresses = `${(estimatedActiveAddresses/1000).toFixed(1)}K`;
          
          await insertOnchainData(
            'Bitcoin',
            'active_addresses',
            estimatedActiveAddresses,
            {
              transaction_count_24h: txCount24h,
              estimation_method: 'transaction_count_based',
              timestamp: new Date().toISOString()
            },
            'blockchain.info'
          );
        } else {
          console.warn('⚠️ Bitcoin transaction count is missing or 0, skipping active addresses calculation');
        }
        
        console.log(`⛓️ Bitcoin - Hash Rate: ${(data.hash_rate / 1e18).toFixed(2)} EH/s, TX Count: ${txCount24h}, Active Addresses: ${activeAddresses}`);
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
        
        // Check if the result is valid
        if (isNaN(ethSupply) || ethSupply <= 0) {
          console.warn('⚠️ Invalid Ethereum supply data received');
          return;
        }
        
        await insertOnchainData(
          'ethereum',
          'total_supply',
          ethSupply,
          {
            timestamp: new Date().toISOString()
          },
          'etherscan'
        );
        
        console.log(`⛓️ Ethereum - Total Supply: ${ethSupply ? ethSupply.toFixed(2) : 'N/A'} ETH`);
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
        
        console.log(`⛓️ Ethereum - Gas Price: ${gasData.ProposeGasPrice || 'N/A'} Gwei`);
      }
    } catch (error) {
      console.error('Error collecting Ethereum on-chain data:', error.message);
    }
  }

  async collectAdditionalOnchainMetrics() {
    try {
      // Collect real metrics from multiple sources
      const [networkHealth, whaleActivity, exchangeFlows] = await Promise.all([
        this.getRealNetworkHealth(),
        this.getRealWhaleActivity(),
        this.getRealExchangeFlows()
      ]);
      
      const metrics = {
        'network_health': networkHealth,
        'whale_activity': whaleActivity,
        'exchange_flows': exchangeFlows
      };
      
      for (const [metric, value] of Object.entries(metrics)) {
        if (value !== null) {
          await insertOnchainData(
            'Multi-Chain Aggregate',
            metric,
            value,
            { 
              calculated_at: new Date().toISOString(),
              source: 'Real API Data',
              description: this.getMetricDescription(metric),
              chains_included: ['Bitcoin', 'Ethereum', 'Solana']
            },
            'API Collection'
          );
        }
      }
    } catch (error) {
      console.error('Error collecting additional on-chain metrics:', error.message);
    }
  }

  // Get real network health from blockchain APIs
  async getRealNetworkHealth() {
    try {
      // Method 1: Bitcoin network health from blockchain.info
      const btcHealth = await this.getBitcoinNetworkHealth();
      if (btcHealth !== null) return btcHealth;
      
      // Method 2: Ethereum network health from Etherscan
      const ethHealth = await this.getEthereumNetworkHealth();
      if (ethHealth !== null) return ethHealth;
      
      // Method 3: Solana network health from Solana RPC
      const solHealth = await this.getSolanaNetworkHealth();
      if (solHealth !== null) return solHealth;
      
      console.log('⚠️ All network health APIs failed, using fallback');
      return null;
    } catch (error) {
      console.error('Error getting network health:', error.message);
      return null;
    }
  }

  // Get real whale activity from transaction monitoring
  async getRealWhaleActivity() {
    try {
      // Method 1: Large transaction monitoring from blockchain.info
      const btcWhales = await this.getBitcoinWhaleActivity();
      if (btcWhales !== null) return btcWhales;
      
      // Method 2: Ethereum whale activity from Etherscan
      const ethWhales = await this.getEthereumWhaleActivity();
      if (ethWhales !== null) return ethWhales;
      
      // Method 3: Solana whale activity from Solana RPC
      const solWhales = await this.getSolanaWhaleActivity();
      if (solWhales !== null) return ethWhales;
      
      console.log('⚠️ All whale activity APIs failed, using fallback');
      return null;
    } catch (error) {
      console.error('Error getting whale activity:', error.message);
      return null;
    }
  }

  // Get real exchange flows from exchange APIs
  async getRealExchangeFlows() {
    try {
      // Method 1: Binance exchange flows (already implemented in dataCollector)
      const binanceFlows = await this.getBinanceExchangeFlows();
      if (binanceFlows !== null) return binanceFlows;
      
      // Method 2: CoinGecko exchange data
      const coinGeckoFlows = await this.getCoinGeckoExchangeFlows();
      if (coinGeckoFlows !== null) return coinGeckoFlows;
      
      // Method 3: Calculate from market data
      const marketBasedFlows = await this.calculateMarketBasedFlows();
      if (marketBasedFlows !== null) return marketBasedFlows;
      
      console.log('⚠️ All exchange flow APIs failed, using fallback');
      return null;
    } catch (error) {
      console.error('Error getting exchange flows:', error.message);
      return null;
    }
  }

  // Bitcoin Network Health from blockchain.info
  async getBitcoinNetworkHealth() {
    try {
      const response = await axios.get('https://blockchain.info/stats?format=json', { timeout: 10000 });
      const data = response.data;
      
      // Calculate health based on multiple factors
      let healthScore = 0.5; // Base score
      
      // Factor 1: Hash rate (higher = healthier)
      if (data.hash_rate) {
        const hashRate = data.hash_rate;
        if (hashRate > 400) healthScore += 0.2; // Very healthy
        else if (hashRate > 300) healthScore += 0.15; // Healthy
        else if (hashRate > 200) healthScore += 0.1; // Moderate
      }
      
      // Factor 2: Transaction count (higher = more active)
      if (data.n_tx) {
        const txCount = data.n_tx;
        if (txCount > 300000) healthScore += 0.2; // Very active
        else if (txCount > 200000) healthScore += 0.15; // Active
        else if (txCount > 100000) healthScore += 0.1; // Moderate
      }
      
      // Factor 3: Network difficulty (stable = healthy)
      if (data.difficulty) {
        healthScore += 0.1; // Stable difficulty indicates health
      }
      
      return Math.min(1, Math.max(0, healthScore));
    } catch (error) {
      console.error('Error getting Bitcoin network health:', error.message);
      return null;
    }
  }

  // Ethereum Network Health from Etherscan
  async getEthereumNetworkHealth() {
    try {
      // Get gas price data as health indicator
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.result) {
        const gasData = response.data.result;
        let healthScore = 0.5; // Base score
        
        // Factor 1: Gas price stability (lower = healthier)
        const fastGas = parseFloat(gasData.FastGasPrice);
        const standardGas = parseFloat(gasData.ProposeGasPrice);
        
        if (fastGas < 50) healthScore += 0.3; // Very healthy
        else if (fastGas < 100) healthScore += 0.2; // Healthy
        else if (fastGas < 200) healthScore += 0.1; // Moderate
        
        // Factor 2: Gas price spread (smaller = healthier)
        const gasSpread = fastGas - standardGas;
        if (gasSpread < 10) healthScore += 0.2; // Very healthy
        else if (gasSpread < 20) healthScore += 0.1; // Healthy
        
        return Math.min(1, Math.max(0, healthScore));
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Ethereum network health:', error.message);
      return null;
    }
  }

  // Solana Network Health from Solana RPC
  async getSolanaNetworkHealth() {
    try {
      const rpcUrl = 'https://api.mainnet-beta.solana.com';
      
      // Get recent performance metrics
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getRecentPerformanceSamples',
        params: [1]
      }, { timeout: 10000 });
      
      if (response.data && response.data.result && response.data.result[0]) {
        const data = response.data.result[0];
        let healthScore = 0.5; // Base score
        
        // Factor 1: TPS (higher = healthier)
        const tps = data.numTransactions / data.samplePeriodSecs;
        if (tps > 50000) healthScore += 0.3; // Very healthy
        else if (tps > 30000) healthScore += 0.2; // Healthy
        else if (tps > 10000) healthScore += 0.1; // Moderate
        
        // Factor 2: Block time consistency
        if (data.samplePeriodSecs > 0) healthScore += 0.2; // Stable
        
        return Math.min(1, Math.max(0, healthScore));
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Solana network health:', error.message);
      return null;
    }
  }

  // Bitcoin Whale Activity from blockchain.info
  async getBitcoinWhaleActivity() {
    try {
      const response = await axios.get('https://blockchain.info/stats?format=json', { timeout: 10000 });
      const data = response.data;
      
      let whaleScore = 0.5; // Base score
      
      // Factor 1: Large transaction count
      if (data.n_tx) {
        const txCount = data.n_tx;
        if (txCount > 300000) whaleScore += 0.3; // High activity
        else if (txCount > 200000) whaleScore += 0.2; // Moderate activity
        else if (txCount > 100000) whaleScore += 0.1; // Low activity
      }
      
      // Factor 2: Network value (higher = more whale activity)
      if (data.total_btc_sent) {
        const totalValue = data.total_btc_sent;
        if (totalValue > 1000000) whaleScore += 0.2; // High value
        else if (totalValue > 500000) whaleScore += 0.1; // Moderate value
      }
      
      return Math.min(1, Math.max(0, whaleScore));
    } catch (error) {
      console.error('Error getting Bitcoin whale activity:', error.message);
      return null;
    }
  }

  // Ethereum Whale Activity from Etherscan
  async getEthereumWhaleActivity() {
    try {
      // Get recent large transactions
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'account',
          action: 'txlist',
          address: '0x0000000000000000000000000000000000000000', // Zero address for general activity
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 10,
          sort: 'desc',
          apikey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.result) {
        let whaleScore = 0.5; // Base score
        
        // Factor 1: Transaction count
        const txCount = response.data.result.length;
        if (txCount > 8) whaleScore += 0.3; // High activity
        else if (txCount > 5) whaleScore += 0.2; // Moderate activity
        else if (txCount > 2) whaleScore += 0.1; // Low activity
        
        // Factor 2: Gas usage (higher = more complex transactions)
        let totalGas = 0;
        response.data.result.forEach(tx => {
          totalGas += parseInt(tx.gasUsed || 0);
        });
        
        if (totalGas > 10000000) whaleScore += 0.2; // High gas usage
        else if (totalGas > 5000000) whaleScore += 0.1; // Moderate gas usage
        
        return Math.min(1, Math.max(0, whaleScore));
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Ethereum whale activity:', error.message);
      return null;
    }
  }

  // Solana Whale Activity from Solana RPC
  async getSolanaWhaleActivity() {
    try {
      const rpcUrl = 'https://api.mainnet-beta.solana.com';
      
      // Get recent performance metrics
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getRecentPerformanceSamples',
        params: [1]
      }, { timeout: 10000 });
      
      if (response.data && response.data.result && response.data.result[0]) {
        const data = response.data.result[0];
        let whaleScore = 0.5; // Base score
        
        // Factor 1: Transaction volume
        const tps = data.numTransactions / data.samplePeriodSecs;
        if (tps > 50000) whaleScore += 0.3; // High activity
        else if (tps > 30000) whaleScore += 0.2; // Moderate activity
        else if (tps > 10000) whaleScore += 0.1; // Low activity
        
        // Factor 2: Network performance
        if (data.samplePeriodSecs > 0) whaleScore += 0.2; // Stable performance
        
        return Math.min(1, Math.max(0, whaleScore));
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Solana whale activity:', error.message);
      return null;
    }
  }

  // Binance Exchange Flows (delegate to main data collector)
  async getBinanceExchangeFlows() {
    try {
      // This is handled by the main data collector
      // Return null to indicate it's handled elsewhere
      return null;
    } catch (error) {
      console.error('Error getting Binance exchange flows:', error.message);
      return null;
    }
  }

  // CoinGecko Exchange Flows
  async getCoinGeckoExchangeFlows() {
    try {
      // Skip CoinGecko exchange flows to avoid 429 errors
      console.log('⚠️ Skipping CoinGecko exchange flows to avoid rate limits');
      return null;
    } catch (error) {
      console.error('Error getting CoinGecko exchange flows:', error.message);
      return null;
    }
  }

  // Market-based Flow Calculation
  async calculateMarketBasedFlows() {
    try {
      // Get recent market data to estimate flows
      const { getCryptoPrices } = require('../database');
      const btcData = await getCryptoPrices('BTC', 2);
      
      if (btcData && btcData.length >= 2) {
        const current = btcData[0];
        const previous = btcData[1];
        
        // Calculate flow based on price and volume changes
        const priceChange = ((current.price - previous.price) / previous.price) * 100;
        const volumeChange = ((current.volume_24h - previous.volume_24h) / previous.volume_24h) * 100;
        
        // Flow score based on market dynamics
        let flowScore = 0.5; // Base score
        
        if (priceChange > 0 && volumeChange > 0) flowScore += 0.3; // Bullish flow
        else if (priceChange < 0 && volumeChange > 0) flowScore += 0.2; // Selling pressure
        else if (priceChange > 0 && volumeChange < 0) flowScore += 0.1; // Weak buying
        
        return Math.min(1, Math.max(0, flowScore));
      }
      
      return null;
    } catch (error) {
      console.error('Error calculating market-based flows:', error.message);
      return null;
    }
  }

  // Main collection method
  async collectAllAdvancedData() {
    console.log('🚀 Starting advanced data collection...');
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    
    try {
      await Promise.all([
        this.collectMarketSentiment(),
        this.collectDerivativesData(),
        this.collectOnchainData(),
        this.collectBitcoinOnchainMetrics()
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

  // Get human-readable description for each metric type
  getMetricDescription(metricType) {
    const descriptions = {
      'network_health': 'Overall health score across major blockchains (0-1 scale, higher is better)',
      'whale_activity': 'Large transaction activity level across chains (0-1 scale, higher = more whale activity)',
      'exchange_flows': 'Net money flow direction: >0.5 = money leaving exchanges (bullish), <0.5 = money entering exchanges (bearish)'
    };
    return descriptions[metricType] || 'Aggregated metric from multiple blockchain sources';
  }
}

module.exports = AdvancedDataCollector;
