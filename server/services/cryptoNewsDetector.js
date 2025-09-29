const axios = require('axios');
const moment = require('moment');
require('dotenv').config({ path: '.env.local' });

const HuggingFaceService = require('./huggingFaceService');
const GroqService = require('./groqService');

class CryptoNewsDetector {
  constructor() {
    this.newsApiKey = process.env.NEWSAPI_API_KEY;
    this.coinTelegraphApiKey = process.env.COINTELEGRAPH_API_KEY;
    this.cryptoPanicApiKey = process.env.CRYPTO_PANIC_API_KEY;
    
    // Egress optimization: Cache news articles to reduce API calls
    this.newsCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
    
    // Egress optimization: Limit detection frequency
    this.lastDetectionTime = 0;
    this.minDetectionInterval = 15 * 60 * 1000; // 15 minutes minimum between detections
    
    // Initialize AI services
    this.huggingFaceService = new HuggingFaceService();
    this.groqService = new GroqService();
    
    // News sources configuration
    this.newsSources = [
      {
        name: 'NewsAPI',
        url: 'https://newsapi.org/v2/everything',
        params: {
          q: 'cryptocurrency OR bitcoin OR ethereum OR crypto',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 50
        }
      },
      {
        name: 'CryptoPanic',
        url: 'https://cryptopanic.com/api/developer/v2/posts/',
        params: {
          auth_token: this.cryptoPanicApiKey,
          kind: 'news',
          currencies: 'BTC,ETH,SOL',
          filter: 'hot'
        }
      }
    ];
    
    // Event detection keywords
    this.eventKeywords = {
      hack: ['hack', 'breach', 'exploit', 'vulnerability', 'security', 'stolen', 'compromised'],
      regulation: ['regulation', 'regulatory', 'sec', 'cftc', 'ban', 'legal', 'compliance', 'lawsuit'],
      market: ['crash', 'rally', 'pump', 'dump', 'volatility', 'flash', 'liquidation', 'margin'],
      institutional: ['institutional', 'adoption', 'partnership', 'integration', 'corporate', 'enterprise'],
      technical: ['upgrade', 'fork', 'hardfork', 'softfork', 'mainnet', 'testnet', 'protocol'],
      exchange: ['exchange', 'listing', 'delisting', 'trading', 'halt', 'suspension', 'maintenance']
    };
    
    console.log('📰 Crypto News Detector Configuration:');
    console.log('  NewsAPI Key (NEWSAPI_API_KEY):', this.newsApiKey ? '✅ Configured' : '❌ Missing');
    console.log('  CoinTelegraph:', '🚫 Disabled (no public API)');
    console.log('  CryptoPanic Key:', this.cryptoPanicApiKey ? '✅ Configured' : '❌ Missing');
    if (this.cryptoPanicApiKey) {
      console.log('  CryptoPanic Key Length:', this.cryptoPanicApiKey.length);
      console.log('  CryptoPanic Key Preview:', this.cryptoPanicApiKey.substring(0, 8) + '...');
    }
  }

  // Main method to detect and analyze crypto news events
  async detectCryptoEvents() {
    try {
      // Egress optimization: Check if enough time has passed since last detection
      const now = Date.now();
      if (now - this.lastDetectionTime < this.minDetectionInterval) {
        console.log('📰 Skipping news detection to reduce egress (too soon since last detection)');
        return [];
      }
      
      console.log('📰 Starting crypto news event detection...');
      this.lastDetectionTime = now;
      
      // Fetch news from multiple sources
      const newsArticles = await this.fetchNewsFromSources();
      
      if (!newsArticles || newsArticles.length === 0) {
        console.log('⚠️ No news articles found');
        return [];
      }
      
      console.log(`📰 Found ${newsArticles.length} news articles`);
      
      // Analyze articles for market impact
      const analyzedEvents = await this.analyzeNewsForEvents(newsArticles);
      
      // Filter for significant events
      const significantEvents = this.filterSignificantEvents(analyzedEvents);
      
      console.log(`🎯 Detected ${significantEvents.length} significant crypto events`);
      
      // Store events in database to avoid repeated AI calls
      if (significantEvents.length > 0) {
        await this.storeEventsInDatabase(significantEvents);
      }
      
      return significantEvents;
    } catch (error) {
      console.error('❌ Crypto news detection failed:', error.message);
      return [];
    }
  }

  // Store crypto events in database to avoid repeated AI calls
  async storeEventsInDatabase(events) {
    try {
      const { insertCryptoEvent, deleteCryptoEventsBefore } = require('../database');
      
      console.log(`💾 Storing ${events.length} events in database...`);
      
      // Clean up old events (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await deleteCryptoEventsBefore(sevenDaysAgo);
      
      // Store new events
      let storedCount = 0;
      for (const event of events) {
        try {
          await insertCryptoEvent(event);
          storedCount++;
        } catch (error) {
          console.error('Error storing individual event:', error.message);
        }
      }
      
      console.log(`✅ Successfully stored ${storedCount}/${events.length} events in database`);
    } catch (error) {
      console.error('Error storing events in database:', error.message);
    }
  }

  // Fetch news from multiple sources
  async fetchNewsFromSources() {
    const allArticles = [];
    
    for (const source of this.newsSources) {
      try {
        const articles = await this.fetchFromSource(source);
        if (articles && articles.length > 0) {
          allArticles.push(...articles);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch from ${source.name}:`, error.message);
      }
    }
    
    // Remove duplicates and sort by date
    return this.deduplicateAndSortArticles(allArticles);
  }

  // Fetch news from a specific source with caching to reduce egress
  async fetchFromSource(source) {
    try {
      // Check cache first to reduce egress
      const cacheKey = `${source.name}_${moment().format('YYYY-MM-DD-HH')}`;
      const cached = this.newsCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log(`📰 Using cached news from ${source.name} (egress saved)`);
        return cached.data;
      }
      
      let response;
      
      if (source.name === 'NewsAPI') {
        response = await axios.get(source.url, {
          params: {
            ...source.params,
            apiKey: this.newsApiKey,
            from: moment().subtract(1, 'hour').toISOString()
          }
        });
        const data = this.parseNewsAPIResponse(response.data);
        this.newsCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else if (source.name === 'CoinTelegraph') {
        response = await axios.get(source.url, {
          params: source.params
        });
        const data = this.parseCoinTelegraphResponse(response.data);
        this.newsCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else if (source.name === 'CryptoPanic') {
        // Manual URL construction for CryptoPanic to match curl behavior
        const baseUrl = source.url;
        const authToken = encodeURIComponent(this.cryptoPanicApiKey);
        const fullUrl = `${baseUrl}?auth_token=${authToken}`;
        
        console.log('🔍 CryptoPanic Full URL:', fullUrl);
        console.log('🔍 CryptoPanic API Key Length:', this.cryptoPanicApiKey ? this.cryptoPanicApiKey.length : 'undefined');
        
        response = await axios.get(fullUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; crypto-market-watch/1.0)'
          }
        });
        const data = this.parseCryptoPanicResponse(response.data);
        this.newsCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
    } catch (error) {
      console.error(`Error fetching from ${source.name}:`, error.message);
      return [];
    }
  }

  // Parse NewsAPI response
  parseNewsAPIResponse(data) {
    if (!data.articles) return [];
    
    return data.articles.map(article => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source.name,
      category: 'general'
    }));
  }

  // Parse CoinTelegraph response
  parseCoinTelegraphResponse(data) {
    if (!data.posts) return [];
    
    return data.posts.map(post => ({
      title: post.title,
      description: post.leadText,
      content: post.body,
      url: post.url,
      publishedAt: post.publishedAt,
      source: 'CoinTelegraph',
      category: 'crypto'
    }));
  }

  // Parse CryptoPanic response
  parseCryptoPanicResponse(data) {
    if (!data.results) return [];
    
    return data.results.map(post => ({
      title: post.title,
      description: post.metadata?.description || '',
      content: post.title, // CryptoPanic doesn't provide full content
      url: post.url,
      publishedAt: post.published_at,
      source: 'CryptoPanic',
      category: 'crypto',
      votes: post.votes,
      domain: post.domain
    }));
  }

  // Analyze news articles for market impact using AI (BATCHED to reduce API calls)
  async analyzeNewsForEvents(articles) {
    // Limit number of articles to analyze to avoid excessive API calls
    const maxArticles = 15;
    const limitedArticles = articles.slice(0, maxArticles);
    
    console.log(`📰 Limiting analysis to ${limitedArticles.length} articles (max: ${maxArticles})`);
    
    if (limitedArticles.length === 0) {
      return [];
    }
    
    const analyzedEvents = [];
    
    // Process articles in batches to reduce API calls
    const batchSize = 5; // Analyze 5 articles per API call
    const batches = [];
    
    for (let i = 0; i < limitedArticles.length; i += batchSize) {
      batches.push(limitedArticles.slice(i, i + batchSize));
    }
    
    console.log(`🔍 Processing ${batches.length} batches of ${batchSize} articles each`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        console.log(`📦 Analyzing batch ${batchIndex + 1}/${batches.length} (${batch.length} articles)`);
        
        const batchResults = await this.analyzeBatchWithAI(batch);
        
        // Combine batch results with original articles
        for (let i = 0; i < batch.length && i < batchResults.length; i++) {
          if (batchResults[i]) {
            analyzedEvents.push({
              ...batch[i],
              analysis: batchResults[i]
            });
          }
        }
        
        // Add delay between batches to respect rate limits
        if (batchIndex < batches.length - 1) {
          console.log('⏳ Waiting 5 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`Error analyzing batch ${batchIndex + 1}:`, error.message);
        // Continue with next batch even if this one fails
      }
    }
    
    console.log(`🎯 AI Analysis complete: ${analyzedEvents.length} events analyzed from ${limitedArticles.length} articles`);
    return analyzedEvents;
  }

  // Analyze batch of articles with AI (more efficient)
  async analyzeBatchWithAI(articles) {
    try {
      if (!this.groqService || articles.length === 0) {
        return [];
      }
      
      console.log(`🤖 Sending batch of ${articles.length} articles to Groq AI...`);
      
      // Use Groq batch analysis for efficiency
      const batchAnalyses = await this.groqService.batchAnalyzeNewsEvents(articles);
      
      if (!Array.isArray(batchAnalyses)) {
        console.error('Groq batch analysis did not return an array');
        return [];
      }
      
      console.log(`✅ Received ${batchAnalyses.length} analyses from Groq`);
      
      // Filter analyses that meet minimum thresholds
      return batchAnalyses.filter(analysis => 
        analysis && analysis.significance > 0.1
      );
      
    } catch (error) {
      console.error('Error in batch AI analysis:', error.message);
      // Fallback to individual analysis if batch fails
      console.log('🔄 Falling back to individual article analysis...');
      return this.fallbackToIndividualAnalysis(articles);
    }
  }

  // Fallback method for individual analysis if batch fails
  async fallbackToIndividualAnalysis(articles) {
    const results = [];
    
    // First try individual Groq calls (limited to 3 articles)
    for (let i = 0; i < Math.min(articles.length, 3); i++) {
      try {
        const analysis = await this.groqService.analyzeNewsEvent(articles[i]);
        if (analysis && analysis.significance > 0.1) {
          results.push(analysis);
        }
        
        // Add delay between individual calls
        if (i < articles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`Error in individual Groq analysis for article ${i + 1}:`, error.message);
        
        // If Groq fails completely, use keyword-based analysis
        const keywordAnalysis = this.analyzeArticleWithKeywords(articles[i]);
        if (keywordAnalysis && keywordAnalysis.significance > 0.1) {
          results.push(keywordAnalysis);
        }
      }
    }
    
    // If no results from Groq, try keyword analysis on more articles
    if (results.length === 0) {
      console.log('🔄 Groq completely unavailable, falling back to keyword analysis...');
      return this.fallbackToKeywordAnalysis(articles);
    }
    
    return results;
  }

  // Basic keyword-based analysis when AI is unavailable
  analyzeArticleWithKeywords(article) {
    try {
      const text = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
      
      // High-impact keywords and their weights
      const impactKeywords = {
        // Regulatory/Legal (high impact)
        'regulation': 0.8, 'ban': 0.9, 'legal': 0.7, 'sec': 0.8, 'lawsuit': 0.7,
        'approval': 0.8, 'etf': 0.9, 'court': 0.7,
        
        // Market moving events (very high impact)
        'hack': 0.9, 'exploit': 0.8, 'breach': 0.8, 'crash': 0.8, 'dump': 0.7,
        'pump': 0.6, 'rally': 0.6, 'surge': 0.7, 'moon': 0.5,
        
        // Institutional (high impact)
        'institutional': 0.7, 'adoption': 0.6, 'partnership': 0.6, 'integration': 0.5,
        'microstrategy': 0.7, 'tesla': 0.7, 'paypal': 0.6,
        
        // Technical (medium impact)
        'upgrade': 0.5, 'fork': 0.6, 'mainnet': 0.5, 'testnet': 0.3,
        'defi': 0.4, 'nft': 0.3, 'dao': 0.3
      };
      
      // Calculate significance based on keyword matches
      let significance = 0;
      let marketImpact = 0;
      let affectedCryptos = [];
      let category = 'general';
      
      // Check for impact keywords
      for (const [keyword, weight] of Object.entries(impactKeywords)) {
        if (text.includes(keyword)) {
          significance = Math.max(significance, weight);
          marketImpact = Math.max(marketImpact, weight * 0.8);
          
          // Set category based on highest impact keyword
          if (weight === significance) {
            if (['regulation', 'ban', 'legal', 'sec', 'lawsuit', 'approval', 'etf'].includes(keyword)) {
              category = 'regulatory';
            } else if (['hack', 'exploit', 'breach', 'crash'].includes(keyword)) {
              category = 'security';
            } else if (['institutional', 'adoption', 'partnership'].includes(keyword)) {
              category = 'institutional';
            } else if (['upgrade', 'fork', 'mainnet'].includes(keyword)) {
              category = 'technical';
            }
          }
        }
      }
      
      // Check for specific cryptocurrencies
      const cryptoKeywords = {
        'bitcoin': 'BTC', 'btc': 'BTC',
        'ethereum': 'ETH', 'eth': 'ETH', 'ether': 'ETH',
        'solana': 'SOL', 'sol': 'SOL',
        'cardano': 'ADA', 'ada': 'ADA',
        'polkadot': 'DOT', 'dot': 'DOT',
        'avalanche': 'AVAX', 'avax': 'AVAX',
        'polygon': 'MATIC', 'matic': 'MATIC'
      };
      
      for (const [keyword, symbol] of Object.entries(cryptoKeywords)) {
        if (text.includes(keyword) && !affectedCryptos.includes(symbol)) {
          affectedCryptos.push(symbol);
        }
      }
      
      // Minimum threshold for keyword analysis
      if (significance < 0.3) {
        return null;
      }
      
      return {
        significance,
        marketImpact,
        category,
        affectedCryptos,
        priceImpact: significance > 0.7 ? 'high' : significance > 0.5 ? 'medium' : 'low',
        confidence: 0.4, // Lower confidence for keyword-based analysis
        keyPoints: [`Keyword-based analysis - found ${Object.keys(impactKeywords).filter(k => text.includes(k)).length} impact indicators`],
        analysisMethod: 'keyword-based'
      };
      
    } catch (error) {
      console.error('Error in keyword analysis:', error.message);
      return null;
    }
  }

  // Fallback to keyword analysis for multiple articles
  async fallbackToKeywordAnalysis(articles) {
    console.log('📝 Using keyword-based analysis as final fallback...');
    const results = [];
    
    for (const article of articles.slice(0, 10)) { // Analyze up to 10 articles
      const analysis = this.analyzeArticleWithKeywords(article);
      if (analysis && analysis.significance > 0.3) {
        results.push(analysis);
      }
    }
    
    console.log(`✅ Keyword analysis found ${results.length} significant events`);
    return results;
  }

  // Analyze individual article with AI (kept for compatibility)
  async analyzeArticleWithAI(article) {
    try {
      // Use Groq for fast analysis
      const analysis = await this.groqService.analyzeNewsEvent(article);
      
      if (analysis && analysis.significance > 0.1) {
        return {
          ...article,
          analysis,
          detectedAt: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error analyzing article with AI:', error.message);
      return null;
    }
  }

  // Filter for significant crypto market events only
  filterSignificantEvents(events) {
    return events.filter(event => {
      const analysis = event.analysis;
      const title = event.title.toLowerCase();
      const content = (event.content || '').toLowerCase();
      
      // Must have meaningful significance and market impact (lowered thresholds for more inclusive filtering)
      if (analysis.significance < 0.2) return false;
      if (analysis.marketImpact < 0.2) return false;
      
      // Must be recent (within last 24 hours for better coverage)
      const eventTime = moment(event.publishedAt);
      const now = moment();
      if (now.diff(eventTime, 'hours') > 24) return false;
      
      // Must have affected cryptocurrencies specified
      if (!analysis.affectedCryptos || analysis.affectedCryptos.length === 0) return false;
      
      // Exclude traditional banking/finance news without crypto impact
      const traditionalBankingKeywords = [
        'citibank', 'wells fargo', 'jpmorgan', 'bank of america', 'traditional banking',
        'credit card fraud', 'banking scam', 'atm fraud', 'wire transfer fraud'
      ];
      
      const hasTraditionalBankingKeywords = traditionalBankingKeywords.some(keyword => 
        title.includes(keyword) || content.includes(keyword)
      );
      
      if (hasTraditionalBankingKeywords && analysis.category !== 'regulation') {
        return false;
      }
      
      // Must contain crypto-specific keywords for relevance
      const cryptoKeywords = [
        'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'blockchain',
        'defi', 'nft', 'altcoin', 'stablecoin', 'dao', 'yield', 'mining', 'staking',
        'dex', 'exchange listing', 'smart contract', 'layer 1', 'layer 2'
      ];
      
      const hasCryptoKeywords = cryptoKeywords.some(keyword => 
        title.includes(keyword) || content.includes(keyword)
      );
      
      if (!hasCryptoKeywords) return false;
      
      return true;
    });
  }

  // Remove duplicates and sort articles
  deduplicateAndSortArticles(articles) {
    const seen = new Set();
    const unique = articles.filter(article => {
      const key = `${article.title}-${article.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    return unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  // Get event summary for dashboard (top 3 only) - FROM DATABASE
  async getEventSummary() {
    try {
      const { getLatestCryptoEvents } = require('../database');
      const events = await getLatestCryptoEvents(20); // Get last 20 events from DB
      
      if (events.length === 0) {
        return {
          hasEvents: false,
          eventCount: 0,
          events: [],
          lastUpdate: new Date().toISOString(),
          hasMoreEvents: false
        };
      }
      
      // Events are already sorted by impact_score in the database query
      return {
        hasEvents: true,
        eventCount: events.length,
        events: events.slice(0, 3), // Return top 3 events for dashboard
        lastUpdate: new Date().toISOString(),
        categories: this.categorizeEvents(events),
        hasMoreEvents: events.length > 3 // Flag to show "See More" button
      };
    } catch (error) {
      console.error('Error getting event summary:', error.message);
      return {
        hasEvents: false,
        eventCount: 0,
        events: [],
        lastUpdate: new Date().toISOString(),
        error: error.message,
        hasMoreEvents: false
      };
    }
  }

  // Get all crypto events for dedicated news page - FROM DATABASE
  async getAllEvents() {
    try {
      const { getCryptoEvents } = require('../database');
      const events = await getCryptoEvents(100); // Get up to 100 events from DB
      
      if (events.length === 0) {
        return {
          hasEvents: false,
          eventCount: 0,
          events: [],
          lastUpdate: new Date().toISOString()
        };
      }
      
      // Events are already sorted by impact_score in the database query
      return {
        hasEvents: true,
        eventCount: events.length,
        events: events, // Return all events sorted by impact
        lastUpdate: new Date().toISOString(),
        categories: this.categorizeEvents(events)
      };
    } catch (error) {
      console.error('Error getting all events:', error.message);
      return {
        hasEvents: false,
        eventCount: 0,
        events: [],
        lastUpdate: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Categorize events by type
  categorizeEvents(events) {
    const categories = {};
    
    events.forEach(event => {
      const category = event.analysis.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(event);
    });
    
    return categories;
  }
}

module.exports = CryptoNewsDetector;
