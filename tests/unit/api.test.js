const request = require('supertest');
const app = require('../../server/index');
const { initDatabase } = require('../../server/database');

describe('API Endpoints Tests', () => {
  let authToken;
  let adminToken;

  beforeAll(async () => {
    await initDatabase();
    // Setup test tokens
    // authToken = await createTestUserToken();
    // adminToken = await createTestAdminToken();
  });

  describe('Market Data Endpoints', () => {
    describe('GET /api/market-data', () => {
      it('should return market data', async () => {
        const response = await request(app)
          .get('/api/market-data')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should filter by symbol', async () => {
        const response = await request(app)
          .get('/api/market-data?symbol=BTC')
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
        response.body.forEach(item => {
          expect(item.symbol).toBe('BTC');
        });
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

    describe('GET /api/predictions', () => {
      it('should return predictions', async () => {
        const response = await request(app)
          .get('/api/predictions')
          .expect(200);

        expect(response.body).toHaveProperty('direction');
        expect(response.body).toHaveProperty('confidence');
        expect(response.body).toHaveProperty('factors_analyzed');
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

    describe('GET /api/admin/ai-analysis', () => {
      it('should return AI analysis for admin', async () => {
        const response = await request(app)
          .get('/api/admin/ai-analysis')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toBeInstanceOf(Array);
      });
    });
  });

  describe('Advanced Features Endpoints', () => {
    describe('GET /api/correlation', () => {
      it('should return correlation matrix', async () => {
        const response = await request(app)
          .get('/api/correlation')
          .expect(200);

        expect(response.body).toHaveProperty('correlations');
        expect(response.body).toHaveProperty('assets');
      });
    });

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
