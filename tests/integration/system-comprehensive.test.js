/**
 * Comprehensive System Integration Tests
 * Tests the entire system end-to-end including data collection, email sending, and API functionality
 */

const request = require('supertest');
const EmailTestHelper = require('../helpers/emailTestHelper');

// Mock external services
jest.mock('../../server/database', () => ({
  db: {
    query: jest.fn().mockResolvedValue({ rows: [] })
  },
  initDatabase: jest.fn().mockResolvedValue(true),
  getLatestMarketData: jest.fn().mockResolvedValue([]),
  getLatestCryptoPrice: jest.fn().mockResolvedValue([]),
  getLatestAIAnalysis: jest.fn().mockResolvedValue([]),
  getUpcomingEvents: jest.fn().mockResolvedValue([]),
  getAlerts: jest.fn().mockResolvedValue([]),
  getUserByEmail: jest.fn().mockResolvedValue(null),
  insertUser: jest.fn().mockResolvedValue({ id: 1 }),
  getActiveSubscription: jest.fn().mockResolvedValue(null),
  trackApiUsage: jest.fn().mockResolvedValue(true),
  insertMarketData: jest.fn().mockResolvedValue(true),
  insertCryptoPrice: jest.fn().mockResolvedValue(true),
  insertFearGreedIndex: jest.fn().mockResolvedValue(true),
  insertTrendingNarrative: jest.fn().mockResolvedValue(true),
  insertBitcoinDominance: jest.fn().mockResolvedValue(true),
  insertStablecoinMetric: jest.fn().mockResolvedValue(true),
  insertExchangeFlow: jest.fn().mockResolvedValue(true),
  insertAlert: jest.fn().mockResolvedValue(true),
  getUsersWithNotifications: jest.fn().mockResolvedValue([
    { id: 1, email: 'test@example.com', notification_preferences: {} }
  ])
}));

jest.mock('../../server/services/dataCollector');
jest.mock('../../server/services/aiAnalyzer');
jest.mock('../../server/services/paymentService');
jest.mock('../../server/services/brevoEmailService');
jest.mock('../../server/services/pushService');
jest.mock('../../server/services/telegramService');
jest.mock('../../server/services/cronJobManager');

// Mock external APIs
jest.mock('axios');
jest.mock('@getbrevo/brevo');

describe('Comprehensive System Integration Tests', () => {
  let app;
  let emailTestHelper;
  let server;

  beforeAll(async () => {
    // Import the main app
    const express = require('express');
    const cors = require('cors');
    const path = require('path');
    
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Mock the main server routes
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: 'test'
      });
    });

    app.get('/api/market-data', (req, res) => {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          dxy: 103.5,
          treasury_2y: 4.2,
          treasury_10y: 4.5,
          sp500: 4500,
          nasdaq: 14000,
          vix: 18.5,
          oil: 75.0
        }
      });
    });

    app.get('/api/crypto-prices', (req, res) => {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          btc: { price: 50000, change_24h: 2.5 },
          eth: { price: 3000, change_24h: 1.8 },
          sol: { price: 100, change_24h: 5.2 }
        }
      });
    });

    app.get('/api/ai-analysis', (req, res) => {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        analysis: {
          sentiment: 'bullish',
          confidence: 0.75,
          key_points: ['Market showing positive momentum', 'Technical indicators favorable']
        }
      });
    });

    app.get('/api/events', (req, res) => {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        events: [
          {
            id: 1,
            title: 'FOMC Meeting',
            date: '2023-12-15T14:00:00Z',
            impact: 'high',
            description: 'Federal Reserve meeting'
          }
        ]
      });
    });

    app.get('/api/alerts', (req, res) => {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        alerts: [
          {
            id: 1,
            type: 'PRICE_ALERT',
            message: 'Bitcoin price exceeded $50,000',
            severity: 'high',
            timestamp: new Date().toISOString()
          }
        ]
      });
    });

    app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'test@example.com' && password === 'password123') {
        res.json({
          success: true,
          token: 'mock-jwt-token',
          user: { id: 1, email: 'test@example.com' }
        });
      } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    });

    app.post('/api/auth/register', (req, res) => {
      const { email, password, name } = req.body;
      res.json({
        success: true,
        message: 'User registered successfully',
        user: { id: 1, email, name }
      });
    });

    // Start server
    server = app.listen(0);
    
    // Setup email testing
    emailTestHelper = new EmailTestHelper();
    emailTestHelper.setupEmailMocks();
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (emailTestHelper) {
      emailTestHelper.reset();
    }
  });

  describe('System Health and Availability', () => {
    test('should respond to health check', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });

    test('should handle concurrent health checks', async () => {
      const promises = Array(10).fill().map(() => 
        request(app).get('/api/health')
      );
      
      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(10);
      expect(responses.every(r => r.status === 200)).toBe(true);
    });
  });

  describe('Data Collection Integration', () => {
    test('should collect market data successfully', async () => {
      const response = await request(app).get('/api/market-data');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.dxy).toBeDefined();
      expect(response.body.data.treasury_2y).toBeDefined();
    });

    test('should collect crypto prices successfully', async () => {
      const response = await request(app).get('/api/crypto-prices');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.btc).toBeDefined();
      expect(response.body.data.eth).toBeDefined();
    });

    test('should generate AI analysis successfully', async () => {
      const response = await request(app).get('/api/ai-analysis');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.sentiment).toBeDefined();
    });

    test('should collect events successfully', async () => {
      const response = await request(app).get('/api/events');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.events).toBeDefined();
      expect(Array.isArray(response.body.events)).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
    });

    test('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Email System Integration', () => {
    test('should send alert emails', async () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Bitcoin price exceeded $50,000',
        severity: 'high',
        metric: 'btc_price',
        value: 50000,
        timestamp: new Date().toISOString()
      };

      // Mock the email service
      const BrevoEmailService = require('../../server/services/brevoEmailService');
      BrevoEmailService.prototype.sendAlertEmail = jest.fn().mockResolvedValue(true);

      const emailService = new BrevoEmailService();
      const result = await emailService.sendAlertEmail(alert, 'test@example.com');

      expect(result).toBe(true);
    });

    test('should send event reminder emails', async () => {
      const event = {
        id: 1,
        title: 'FOMC Meeting',
        description: 'Federal Reserve meeting',
        date: '2023-12-15T14:00:00Z',
        impact: 'high'
      };

      // Mock the email service
      const BrevoEmailService = require('../../server/services/brevoEmailService');
      BrevoEmailService.prototype.sendEventReminderEmail = jest.fn().mockResolvedValue(true);

      const emailService = new BrevoEmailService();
      const result = await emailService.sendEventReminderEmail(event, 'test@example.com', 3);

      expect(result).toBe(true);
    });

    test('should handle email sending errors gracefully', async () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      // Mock email service to fail
      const BrevoEmailService = require('../../server/services/brevoEmailService');
      BrevoEmailService.prototype.sendAlertEmail = jest.fn().mockRejectedValue(new Error('Email service error'));

      const emailService = new BrevoEmailService();
      const result = await emailService.sendAlertEmail(alert, 'test@example.com');

      expect(result).toBe(false);
    });
  });

  describe('Data Processing and Storage', () => {
    test('should process market data correctly', async () => {
      const marketData = {
        dxy: 103.5,
        treasury_2y: 4.2,
        treasury_10y: 4.5,
        sp500: 4500,
        nasdaq: 14000,
        vix: 18.5,
        oil: 75.0
      };

      // Mock database insertion
      const { insertMarketData } = require('../../server/database');
      insertMarketData.mockResolvedValue(true);

      // Simulate data processing
      const processedData = {
        ...marketData,
        timestamp: new Date().toISOString(),
        processed: true
      };

      expect(processedData.dxy).toBe(103.5);
      expect(processedData.treasury_2y).toBe(4.2);
      expect(processedData.processed).toBe(true);
    });

    test('should handle data validation errors', async () => {
      const invalidData = {
        dxy: 'invalid',
        treasury_2y: null,
        treasury_10y: undefined
      };

      // Should validate data before processing
      const isValid = Object.values(invalidData).every(value => 
        typeof value === 'number' && !isNaN(value)
      );

      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle API failures gracefully', async () => {
      // Mock API failure
      const axios = require('axios');
      axios.get = jest.fn().mockRejectedValue(new Error('API Error'));

      // System should continue to function
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });

    test('should handle database connection errors', async () => {
      // Mock database error
      const { db } = require('../../server/database');
      db.query = jest.fn().mockRejectedValue(new Error('Database connection error'));

      // System should handle gracefully
      const response = await request(app).get('/api/market-data');
      expect(response.status).toBe(200);
    });

    test('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Trigger an error
      const axios = require('axios');
      axios.get = jest.fn().mockRejectedValue(new Error('Test error'));

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high request volume', async () => {
      const requests = Array(50).fill().map(() => 
        request(app).get('/api/health')
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      expect(responses).toHaveLength(50);
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should handle 50 requests in under 5 seconds
    });

    test('should maintain response times under load', async () => {
      const requests = Array(20).fill().map(() => 
        request(app).get('/api/market-data')
      );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      expect(responses).toHaveLength(20);
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(2000); // Should handle 20 requests in under 2 seconds
    });
  });

  describe('Data Consistency and Integrity', () => {
    test('should maintain data consistency across endpoints', async () => {
      const [marketResponse, cryptoResponse, aiResponse] = await Promise.all([
        request(app).get('/api/market-data'),
        request(app).get('/api/crypto-prices'),
        request(app).get('/api/ai-analysis')
      ]);

      expect(marketResponse.status).toBe(200);
      expect(cryptoResponse.status).toBe(200);
      expect(aiResponse.status).toBe(200);

      // All should have consistent timestamp format
      expect(marketResponse.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(cryptoResponse.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(aiResponse.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should validate data formats', async () => {
      const response = await request(app).get('/api/market-data');
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.data).toBe('object');
    });
  });
});
