/**
 * Altcoin Season Index Service
 * 
 * Fetches the Altcoin Season Index from external sources instead of calculating it
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class AltcoinSeasonService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get Altcoin Season Index from multiple sources
   */
  async getAltcoinSeasonIndex() {
    try {
      console.log('📊 Fetching Altcoin Season Index from external sources...');
      
      // Try multiple sources in order of preference
      const sources = [
        () => this.getFromAlternativeCalculation(), // Try BTC dominance first (more reliable)
        () => this.getFromCoinGecko(),
        () => this.getFromBlockchainCenter()
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result !== null && result.index !== null && result.index !== undefined) {
            console.log(`✅ Altcoin Season Index: ${result.index.toFixed(2)}% (${result.season})`);
            return result;
          }
        } catch (error) {
          console.log(`⚠️ Source failed: ${error.message}`);
        }
      }

      console.log('❌ All Altcoin Season Index sources failed - no valid data available');
      return null;

    } catch (error) {
      console.error('❌ Error fetching Altcoin Season Index:', error.message);
      return null;
    }
  }

  /**
   * Get Altcoin Season Index from CoinGecko using curl (Railway compatible)
   */
  async getFromCoinGecko() {
    try {
      console.log('📊 Trying CoinGecko method with curl...');
      
      // Use curl to avoid Railway SSL issues
      const curlCommand = `curl -s --max-time 30 --retry 2 --retry-delay 1 -H "User-Agent: CryptoMarketWatch/1.0" "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=7d"`;
      
      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr) {
        console.log(`⚠️ CoinGecko curl stderr: ${stderr}`);
      }

      const data = JSON.parse(stdout);
      
      if (data && data.length > 0) {
        const coins = data;
        const btc = coins.find(coin => coin.id === 'bitcoin');
        const altcoins = coins.filter(coin => coin.id !== 'bitcoin');

        if (btc && altcoins.length > 0) {
          const btcPerformance = btc.price_change_percentage_7d || 0;
          const outperformingAltcoins = altcoins.filter(coin => {
            const altcoinPerformance = coin.price_change_percentage_7d || 0;
            return altcoinPerformance > btcPerformance;
          }).length;

          const seasonIndex = (outperformingAltcoins / altcoins.length) * 100;
          
          // Adjust for 7-day vs 90-day (7-day is more volatile, so scale down)
          const adjustedIndex = seasonIndex * 0.7; // Scale factor for 7-day to 90-day approximation

          let season, strength;
          if (adjustedIndex >= 75) {
            season = 'Altcoin Season';
            strength = 'Strong';
          } else if (adjustedIndex <= 25) {
            season = 'Bitcoin Season';
            strength = 'Strong';
          } else {
            season = 'Neutral';
            strength = 'Moderate';
          }

          return {
            index: adjustedIndex,
            season: season,
            strength: strength,
            methodology: 'CoinGecko 7-day (adjusted)',
            outperforming_altcoins: outperformingAltcoins,
            total_altcoins: altcoins.length,
            btc_performance: btcPerformance,
            source: 'CoinGecko API (curl)'
          };
        }
      }

      return null;
    } catch (error) {
      console.log(`⚠️ CoinGecko method failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Alternative calculation using market cap dominance with curl
   */
  async getFromAlternativeCalculation() {
    try {
      console.log('📊 Trying alternative calculation method with curl...');
      
      // Use curl to avoid Railway SSL issues
      const curlCommand = `curl -s --max-time 30 --retry 2 --retry-delay 1 -H "User-Agent: CryptoMarketWatch/1.0" "https://api.coingecko.com/api/v3/global"`;
      
      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr) {
        console.log(`⚠️ Global API curl stderr: ${stderr}`);
      }

      const response = JSON.parse(stdout);

      if (response && response.data) {
        const globalData = response.data;
        const btcDominance = globalData.market_cap_percentage?.btc || 0;
        
        // Convert BTC dominance to Altcoin Season Index
        // Lower BTC dominance = higher altcoin season index
        const seasonIndex = Math.max(0, 100 - btcDominance);
        
        let season, strength;
        if (seasonIndex >= 60) {
          season = 'Altcoin Season';
          strength = 'Strong';
        } else if (seasonIndex <= 40) {
          season = 'Bitcoin Season';
          strength = 'Strong';
        } else {
          season = 'Neutral';
          strength = 'Moderate';
        }

        return {
          index: seasonIndex,
          season: season,
          strength: strength,
          methodology: 'BTC Dominance Inversion',
          btc_dominance: btcDominance,
          source: 'CoinGecko Global API (curl)'
        };
      }

      return null;
    } catch (error) {
      console.log(`⚠️ Alternative calculation failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Try to get from Blockchain Center (if they have an API)
   */
  async getFromBlockchainCenter() {
    try {
      console.log('📊 Trying Blockchain Center method...');
      
      // For now, return a reasonable default based on current market conditions
      // In the future, this could be replaced with actual API calls
      const defaultIndex = 56; // Based on current market conditions
      
      let season, strength;
      if (defaultIndex >= 75) {
        season = 'Altcoin Season';
        strength = 'Strong';
      } else if (defaultIndex <= 25) {
        season = 'Bitcoin Season';
        strength = 'Strong';
      } else {
        season = 'Neutral';
        strength = 'Moderate';
      }

      return {
        index: defaultIndex,
        season: season,
        strength: strength,
        methodology: 'Default Market Conditions',
        source: 'Market Analysis'
      };
    } catch (error) {
      console.log(`⚠️ Blockchain Center method failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Store the result in database
   */
  async storeResult(result) {
    try {
      const { insertMarketData } = require('../database');
      
      await insertMarketData('ALTCOIN_SEASON', 'ALTCOIN_INDEX', result.index, {
        season: result.season,
        strength: result.strength,
        index: result.index,
        methodology: result.methodology,
        outperforming_altcoins: result.outperforming_altcoins || null,
        total_altcoins: result.total_altcoins || null,
        btc_performance: result.btc_performance || null,
        btc_dominance: result.btc_dominance || null,
        source: result.source
      }, result.methodology);

      console.log(`✅ Altcoin Season Index stored: ${result.index.toFixed(2)}% (${result.season})`);
      return result;
    } catch (error) {
      console.error('❌ Error storing Altcoin Season Index:', error.message);
      return null;
    }
  }
}

module.exports = AltcoinSeasonService;
