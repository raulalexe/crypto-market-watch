const axios = require('axios');
const moment = require('moment');
require('dotenv').config({ path: '.env.local' });

const HuggingFaceService = require('./huggingFaceService');
const GroqService = require('./groqService');

class CryptoNewsDetector {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
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
        name: 'CoinTelegraph',
        url: 'https://cointelegraph.com/api/v1/content',
        params: {
          type: 'post',
          limit: 20
        }
      },
      {
        name: 'CryptoPanic',
        url: 'https://cryptopanic.com/api/v1/posts/',
        params: {
          auth_token: this.cryptoPanicApiKey,
          currencies: 'BTC,ETH',
          filter: 'hot',
          public: true
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
    console.log('  NewsAPI Key:', this.newsApiKey ? '✅ Configured' : '❌ Missing');
    console.log('  CoinTelegraph Key:', this.coinTelegraphApiKey ? '✅ Configured' : '❌ Missing');
    console.log('  CryptoPanic Key:', this.cryptoPanicApiKey ? '✅ Configured' : '❌ Missing');
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
      
      return significantEvents;
    } catch (error) {
      console.error('❌ Crypto news detection failed:', error.message);
      return [];
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
        response = await axios.get(source.url, {
          params: source.params
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

  // Analyze news articles for market impact using AI
  async analyzeNewsForEvents(articles) {
    const analyzedEvents = [];
    
    // Process articles in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.all(
          batch.map(article => this.analyzeArticleWithAI(article))
        );
        
        analyzedEvents.push(...batchResults.filter(result => result !== null));
        
        // Add delay between batches to respect rate limits
        if (i + batchSize < articles.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error analyzing batch:', error.message);
      }
    }
    
    return analyzedEvents;
  }

  // Analyze individual article with AI
  async analyzeArticleWithAI(article) {
    try {
      // Use Groq for fast analysis
      const analysis = await this.groqService.analyzeNewsEvent(article);
      
      if (analysis && analysis.significance > 0.6) {
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

  // Filter for significant events
  filterSignificantEvents(events) {
    return events.filter(event => {
      const analysis = event.analysis;
      
      // Must have high significance
      if (analysis.significance < 0.7) return false;
      
      // Must have market impact
      if (analysis.marketImpact < 0.6) return false;
      
      // Must be recent (within last 2 hours)
      const eventTime = moment(event.publishedAt);
      const now = moment();
      if (now.diff(eventTime, 'hours') > 2) return false;
      
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

  // Get event summary for dashboard
  async getEventSummary() {
    try {
      const events = await this.detectCryptoEvents();
      
      if (events.length === 0) {
        return {
          hasEvents: false,
          eventCount: 0,
          events: [],
          lastUpdate: new Date().toISOString()
        };
      }
      
      return {
        hasEvents: true,
        eventCount: events.length,
        events: events.slice(0, 5), // Return top 5 events
        lastUpdate: new Date().toISOString(),
        categories: this.categorizeEvents(events)
      };
    } catch (error) {
      console.error('Error getting event summary:', error.message);
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
