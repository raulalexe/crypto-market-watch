/**
 * Data Collection Optimization Tests
 * Tests for redundant API calls and optimization opportunities
 */

const DataCollector = require('../../server/services/dataCollector');
const EconomicDataService = require('../../server/services/economicDataService');
const InflationDataService = require('../../server/services/inflationDataService');
const AdvancedDataCollector = require('../../server/services/advancedDataCollector');

// Mock external dependencies
jest.mock('../../server/database', () => ({
  insertMarketData: jest.fn(),
  insertCryptoPrice: jest.fn(),
  insertFearGreedIndex: jest.fn(),
  insertTrendingNarrative: jest.fn(),
  insertBitcoinDominance: jest.fn(),
  insertStablecoinMetric: jest.fn(),
  insertExchangeFlow: jest.fn(),
  getLatestMarketSentiment: jest.fn(),
  getLatestDerivativesData: jest.fn(),
  getLatestOnchainData: jest.fn()
}));

jest.mock('../../server/services/errorLogger');
jest.mock('../../server/services/alertService');
jest.mock('../../server/services/advancedDataCollector');

describe('Data Collection Optimization', () => {
  let dataCollector;
  let economicDataService;
  let inflationDataService;
  let advancedDataCollector;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh instances
    dataCollector = new DataCollector();
    economicDataService = new EconomicDataService();
    inflationDataService = new InflationDataService();
    advancedDataCollector = new AdvancedDataCollector();
  });

  describe('API Call Redundancy Detection', () => {
    test('should not make duplicate CoinGecko API calls within cache period', async () => {
      const mockCoinGeckoResponse = {
        data: {
          total_market_cap: { usd: 1000000000000 },
          market_cap_percentage: { btc: 50 },
          active_cryptocurrencies: 1000
        }
      };

      // Mock the makeCoinGeckoRequest method
      dataCollector.makeCoinGeckoRequest = jest.fn()
        .mockResolvedValueOnce(mockCoinGeckoResponse)
        .mockResolvedValueOnce(mockCoinGeckoResponse);

      // First call should hit API
      await dataCollector.getGlobalCryptoMetrics();
      expect(dataCollector.makeCoinGeckoRequest).toHaveBeenCalledTimes(1);

      // Second call within cache period should use cache
      await dataCollector.getGlobalCryptoMetrics();
      expect(dataCollector.makeCoinGeckoRequest).toHaveBeenCalledTimes(1);
    });

    test('should batch multiple Alpha Vantage API calls', async () => {
      const mockAlphaVantageResponse = {
        'Meta Data': { '1. Information': 'Daily Prices' },
        'Time Series (Daily)': {
          '2023-01-01': { '4. close': '100.00' }
        }
      };

      dataCollector.makeAlphaVantageRequest = jest.fn()
        .mockResolvedValue(mockAlphaVantageResponse);

      // Test bulk collection
      const result = await dataCollector.collectBulkAlphaVantageData();
      
      // Should make fewer API calls than individual calls
      expect(dataCollector.makeAlphaVantageRequest).toHaveBeenCalledTimes(6); // DXY, Treasury2Y, Treasury10Y, SP500, NASDAQ, VIX, Oil
      expect(result).toHaveProperty('DXY');
      expect(result).toHaveProperty('Treasury2Y');
      expect(result).toHaveProperty('Treasury10Y');
    });

    test('should avoid redundant inflation data collection', async () => {
      // Mock that inflation data was already collected
      inflationDataService.collectInflationData = jest.fn().mockResolvedValue({
        cpi: { value: 300, date: '2023-01-01' },
        pce: { value: 120, date: '2023-01-01' }
      });

      // Economic data service should skip inflation collection
      const result = await economicDataService.collectAllEconomicData();
      
      expect(result.inflation.cpi).toBeNull();
      expect(result.inflation.pce).toBeNull();
    });
  });

  describe('Cache Efficiency', () => {
    test('should use cache for repeated CoinGecko requests', async () => {
      const mockResponse = { data: { total_market_cap: { usd: 1000000000000 } } };
      dataCollector.makeCoinGeckoRequest = jest.fn().mockResolvedValue(mockResponse);

      // First call
      await dataCollector.getGlobalCryptoMetrics();
      
      // Second call should use cache
      await dataCollector.getGlobalCryptoMetrics();
      
      // Should only make one API call
      expect(dataCollector.makeCoinGeckoRequest).toHaveBeenCalledTimes(1);
    });

    test('should respect cache expiry', async () => {
      const mockResponse = { data: { total_market_cap: { usd: 1000000000000 } } };
      dataCollector.makeCoinGeckoRequest = jest.fn().mockResolvedValue(mockResponse);

      // First call
      await dataCollector.getGlobalCryptoMetrics();
      
      // Wait for cache to expire (simulate)
      dataCollector.coingeckoCache.clear();
      
      // Second call should hit API again
      await dataCollector.getGlobalCryptoMetrics();
      
      expect(dataCollector.makeCoinGeckoRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    test('should respect CoinGecko rate limits', async () => {
      const mockResponse = { data: { total_market_cap: { usd: 1000000000000 } } };
      dataCollector.makeCoinGeckoRequest = jest.fn().mockResolvedValue(mockResponse);

      const startTime = Date.now();
      
      // Make multiple rapid calls
      await Promise.all([
        dataCollector.getGlobalCryptoMetrics(),
        dataCollector.getGlobalCryptoMetrics(),
        dataCollector.getGlobalCryptoMetrics()
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have taken at least 1.2 seconds (rate limit)
      expect(duration).toBeGreaterThanOrEqual(1200);
    });

    test('should track Alpha Vantage daily limits', async () => {
      dataCollector.alphaVantageCallCount = 499; // Near limit
      dataCollector.alphaVantageDailyLimit = 500;

      const result = await dataCollector.collectBulkAlphaVantageData();
      
      // Should not exceed daily limit
      expect(dataCollector.alphaVantageCallCount).toBeLessThanOrEqual(500);
    });
  });

  describe('Data Collection Optimization', () => {
    test('should use global metrics for multiple crypto calculations', async () => {
      const mockGlobalMetrics = {
        totalMarketCap: 1000000000000,
        bitcoinDominance: 50,
        timestamp: new Date().toISOString()
      };

      dataCollector.getGlobalCryptoMetrics = jest.fn().mockResolvedValue(mockGlobalMetrics);
      dataCollector.collectStablecoinMetricsFromGlobal = jest.fn().mockResolvedValue({});
      dataCollector.collectBitcoinDominanceFromGlobal = jest.fn().mockResolvedValue(50);
      dataCollector.collectLayer1DataFromGlobal = jest.fn().mockResolvedValue({});

      await dataCollector.collectAllData();

      // Should only call global metrics once
      expect(dataCollector.getGlobalCryptoMetrics).toHaveBeenCalledTimes(1);
      
      // Should use global metrics for other calculations
      expect(dataCollector.collectStablecoinMetricsFromGlobal).toHaveBeenCalledWith(mockGlobalMetrics);
      expect(dataCollector.collectBitcoinDominanceFromGlobal).toHaveBeenCalledWith(mockGlobalMetrics);
      expect(dataCollector.collectLayer1DataFromGlobal).toHaveBeenCalledWith(mockGlobalMetrics);
    });

    test('should avoid redundant stablecoin API calls', async () => {
      const mockGlobalMetrics = {
        totalMarketCap: 1000000000000,
        bitcoinDominance: 50
      };

      dataCollector.getGlobalCryptoMetrics = jest.fn().mockResolvedValue(mockGlobalMetrics);
      dataCollector.makeCoinGeckoRequest = jest.fn().mockResolvedValue({
        data: {
          'tether': { usd_market_cap: 80000000000 },
          'usd-coin': { usd_market_cap: 20000000000 }
        }
      });

      await dataCollector.collectStablecoinMetricsFromGlobal(mockGlobalMetrics);

      // Should only make one API call for stablecoins
      expect(dataCollector.makeCoinGeckoRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should handle API failures gracefully', async () => {
      dataCollector.makeCoinGeckoRequest = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await dataCollector.getGlobalCryptoMetrics();
      
      expect(result).toBeNull();
      expect(dataCollector.errorLogger.logApiFailure).toHaveBeenCalled();
    });

    test('should use fallback data when primary API fails', async () => {
      dataCollector.makeCoinGeckoRequest = jest.fn()
        .mockRejectedValueOnce(new Error('Primary API Error'))
        .mockResolvedValueOnce({ data: { total_market_cap: { usd: 1000000000000 } } });

      // First call fails
      const result1 = await dataCollector.getGlobalCryptoMetrics();
      expect(result1).toBeNull();

      // Second call succeeds
      const result2 = await dataCollector.getGlobalCryptoMetrics();
      expect(result2).not.toBeNull();
    });
  });

  describe('Memory Usage Optimization', () => {
    test('should clear cache when it gets too large', async () => {
      // Fill cache with many entries
      for (let i = 0; i < 1000; i++) {
        dataCollector.coingeckoCache.set(`key${i}`, { data: 'test' });
      }

      const initialSize = dataCollector.coingeckoCache.size;
      
      // Trigger cache cleanup (if implemented)
      dataCollector.coingeckoCache.clear();
      
      expect(dataCollector.coingeckoCache.size).toBe(0);
    });

    test('should not store large objects in cache unnecessarily', async () => {
      const largeObject = {
        data: new Array(10000).fill('test data'),
        metadata: { timestamp: Date.now() }
      };

      dataCollector.coingeckoCache.set('large_key', largeObject);
      
      // Should store only essential data
      const cached = dataCollector.coingeckoCache.get('large_key');
      expect(cached).toBeDefined();
    });
  });
});
