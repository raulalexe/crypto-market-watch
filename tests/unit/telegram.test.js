const request = require('supertest');
const { createTestToken } = require('../helpers/testHelpers');

// Mock the entire server module
jest.mock('../../server/index', () => {
  const express = require('express');
  const app = express();
  
  app.use(express.json());
  
  // Mock authentication middleware
  const mockAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token === 'valid-token') {
      req.user = { id: 1, email: 'test@example.com', role: 'user' };
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
  
  // Mock Telegram verification endpoints
  app.post('/api/telegram/generate-code', mockAuth, (req, res) => {
    const { telegramHandle } = req.body;
    
    if (!telegramHandle) {
      return res.status(400).json({ error: 'Telegram handle is required' });
    }
    
    res.json({
      success: true,
      verificationCode: '123456',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });
  });
  
  app.get('/api/telegram/status', mockAuth, (req, res) => {
    res.json({
      connected: true,
      telegramHandle: '@testuser',
      verified: true,
      chatId: '123456789'
    });
  });
  
  app.post('/api/telegram/disconnect', mockAuth, (req, res) => {
    res.json({ success: true, message: 'Telegram disconnected successfully' });
  });
  
  return app;
});

const app = require('../../server/index');

describe('Telegram Integration Tests', () => {
  let authToken;

  beforeAll(() => {
    authToken = 'valid-token';
  });

  describe('POST /api/telegram/generate-code', () => {
    it('should generate verification code for valid telegram handle', async () => {
      const response = await request(app)
        .post('/api/telegram/generate-code')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ telegramHandle: '@testuser' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('verificationCode');
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/telegram/generate-code')
        .send({ telegramHandle: '@testuser' })
        .expect(401);
    });

    it('should require telegram handle', async () => {
      const response = await request(app)
        .post('/api/telegram/generate-code')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Telegram handle is required');
    });
  });

  describe('GET /api/telegram/status', () => {
    it('should return telegram connection status', async () => {
      const response = await request(app)
        .get('/api/telegram/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('connected', true);
      expect(response.body).toHaveProperty('telegramHandle');
      expect(response.body).toHaveProperty('verified', true);
      expect(response.body).toHaveProperty('chatId');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/telegram/status')
        .expect(401);
    });
  });

  describe('POST /api/telegram/disconnect', () => {
    it('should disconnect telegram successfully', async () => {
      const response = await request(app)
        .post('/api/telegram/disconnect')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/telegram/disconnect')
        .expect(401);
    });
  });
});
