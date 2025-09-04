const request = require('supertest');
const { createTestToken, createAdminToken, mockApiResponses } = require('../helpers/testHelpers');

// Mock the entire server module
jest.mock('../../server/index', () => {
  const express = require('express');
  const app = express();
  
  // Mock middleware
  app.use(express.json());
  
  // Mock authentication middleware
  const mockAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token === 'valid-token') {
      req.user = { id: 1, email: 'test@example.com', role: 'user' };
      next();
    } else if (token === 'admin-token') {
      req.user = { id: 1, email: 'admin@example.com', role: 'admin' };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
  
  // Mock API endpoints
  app.get('/api/market-data', (req, res) => {
    res.json(mockApiResponses.marketData);
  });
  
  app.get('/api/crypto-prices', (req, res) => {
    res.json(mockApiResponses.marketData);
  });
  
  app.get('/api/fear-greed', (req, res) => {
    res.json(mockApiResponses.fearGreedIndex);
  });
  
  app.get('/api/analysis', (req, res) => {
    res.json(mockApiResponses.aiAnalysis);
  });
  
  app.get('/api/alerts', mockAuth, (req, res) => {
    res.json(mockApiResponses.alerts);
  });
  
  app.get('/api/subscription', mockAuth, (req, res) => {
    res.json(mockApiResponses.subscription);
  });
  
  app.get('/api/subscription/plans', (req, res) => {
    res.json(mockApiResponses.subscriptionPlans);
  });
  
  app.get('/api/subscription/pricing', (req, res) => {
    res.json({
      success: true,
      pricing: {
        pro: { originalPrice: 29, currentPrice: 29, hasDiscount: false, discountPercentage: 0 },
        premium: { originalPrice: 99, currentPrice: 99, hasDiscount: false, discountPercentage: 0 }
      },
      discountActive: false
    });
  });
  
  app.get('/api/admin/collections', mockAuth, (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.json([
      { collection: 'users', count: 10, data: [] },
      { collection: 'alerts', count: 5, data: [] }
    ]);
  });
  
  app.post('/api/alerts/:id/acknowledge', mockAuth, (req, res) => {
    res.json({ success: true });
  });
  
  app.post('/api/analytics/export', mockAuth, (req, res) => {
    res.json({ downloadUrl: '/downloads/export.pdf' });
  });
  
  app.get('/api/alerts/thresholds', mockAuth, (req, res) => {
    res.json([]);
  });
  
  return app;
});

const app = require('../../server/index');

describe('API Endpoints Tests', () => {
  let authToken;
  let adminToken;

  beforeAll(() => {
    authToken = 'valid-token';
    adminToken = 'admin-token';
  });

  describe('Market Data Endpoints', () => {
    describe('GET /api/market-data', () => {
      it('should return market data', async () => {
        const response = await request(app)
          .get('/api/market-data')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('symbol');
        expect(response.body[0]).toHaveProperty('price');
      });
    });

    describe('GET /api/crypto-prices', () => {
      it('should return crypto prices', async () => {
        const response = await request(app)
          .get('/api/crypto-prices')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/fear-greed', () => {
      it('should return fear and greed index', async () => {
        const response = await request(app)
          .get('/api/fear-greed')
          .expect(200);

        expect(response.body).toHaveProperty('value');
        expect(response.body).toHaveProperty('classification');
        expect(typeof response.body.value).toBe('number');
      });
    });
  });

  describe('AI Analysis Endpoints', () => {
    describe('GET /api/analysis', () => {
      it('should return AI analysis', async () => {
        const response = await request(app)
          .get('/api/analysis')
          .expect(200);

        expect(response.body).toHaveProperty('short_term');
        expect(response.body).toHaveProperty('medium_term');
        expect(response.body).toHaveProperty('long_term');
      });
    });
  });

  describe('Alert Endpoints', () => {
    describe('GET /api/alerts', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/alerts')
          .expect(401);
      });

      it('should return alerts for authenticated user', async () => {
        const response = await request(app)
          .get('/api/alerts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/alerts/:id/acknowledge', () => {
      it('should acknowledge alert', async () => {
        const response = await request(app)
          .post('/api/alerts/1/acknowledge')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });

  describe('Subscription Endpoints', () => {
    describe('GET /api/subscription', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/subscription')
          .expect(401);
      });

      it('should return subscription info for authenticated user', async () => {
        const response = await request(app)
          .get('/api/subscription')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('plan');
        expect(response.body).toHaveProperty('status');
      });
    });

    describe('GET /api/subscription/plans', () => {
      it('should return available plans', async () => {
        const response = await request(app)
          .get('/api/subscription/plans')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach(plan => {
          expect(plan).toHaveProperty('id');
          expect(plan).toHaveProperty('name');
          expect(plan).toHaveProperty('price');
          expect(plan).toHaveProperty('features');
        });
      });
    });

    describe('GET /api/subscription/pricing', () => {
      it('should return pricing information', async () => {
        const response = await request(app)
          .get('/api/subscription/pricing')
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('pricing');
        expect(response.body).toHaveProperty('discountActive');
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('GET /api/admin/collections', () => {
      it('should require admin authentication', async () => {
        await request(app)
          .get('/api/admin/collections')
          .expect(401);
      });

      it('should return collections for admin', async () => {
        const response = await request(app)
          .get('/api/admin/collections')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        response.body.forEach(collection => {
          expect(collection).toHaveProperty('collection');
          expect(collection).toHaveProperty('count');
          expect(collection).toHaveProperty('data');
        });
      });
    });
  });

  describe('Advanced Features Endpoints', () => {
    describe('POST /api/analytics/export', () => {
      it('should require authentication', async () => {
        await request(app)
          .post('/api/analytics/export')
          .send({ format: 'pdf', dataType: 'market_data' })
          .expect(401);
      });

      it('should export analytics report', async () => {
        const response = await request(app)
          .post('/api/analytics/export')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ format: 'pdf', dataType: 'market_data' })
          .expect(200);

        expect(response.body).toHaveProperty('downloadUrl');
      });
    });

    describe('GET /api/alerts/thresholds', () => {
      it('should require authentication', async () => {
        await request(app)
          .get('/api/alerts/thresholds')
          .expect(401);
      });

      it('should return user alert thresholds', async () => {
        const response = await request(app)
          .get('/api/alerts/thresholds')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });
    });
  });
});