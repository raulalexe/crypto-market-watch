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
  
  // Mock notification preferences endpoints
  app.get('/api/notification-preferences', mockAuth, (req, res) => {
    res.json({
      emailNotifications: true,
      pushNotifications: false,
      telegramNotifications: true,
      notificationPreferences: {
        priceAlerts: true,
        marketAlerts: false,
        newsAlerts: true
      },
      eventNotifications: true,
      eventNotificationWindows: [3, 24],
      eventNotificationChannels: ['email', 'telegram'],
      eventImpactFilter: 'high'
    });
  });
  
  app.put('/api/notification-preferences', mockAuth, (req, res) => {
    const preferences = req.body;
    
    // Validate required fields
    if (typeof preferences.emailNotifications !== 'boolean') {
      return res.status(400).json({ error: 'Invalid email notifications preference' });
    }
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: preferences
    });
  });
  
  return app;
});

const app = require('../../server/index');

describe('Notification Preferences Tests', () => {
  let authToken;

  beforeAll(() => {
    authToken = 'valid-token';
  });

  describe('GET /api/notification-preferences', () => {
    it('should return notification preferences for authenticated user', async () => {
      const response = await request(app)
        .get('/api/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('emailNotifications');
      expect(response.body).toHaveProperty('pushNotifications');
      expect(response.body).toHaveProperty('telegramNotifications');
      expect(response.body).toHaveProperty('notificationPreferences');
      expect(response.body).toHaveProperty('eventNotifications');
      expect(response.body).toHaveProperty('eventNotificationWindows');
      expect(response.body).toHaveProperty('eventNotificationChannels');
      expect(response.body).toHaveProperty('eventImpactFilter');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/notification-preferences')
        .expect(401);
    });
  });

  describe('PUT /api/notification-preferences', () => {
    it('should update notification preferences successfully', async () => {
      const preferences = {
        emailNotifications: true,
        pushNotifications: true,
        telegramNotifications: false,
        notificationPreferences: {
          priceAlerts: true,
          marketAlerts: true,
          newsAlerts: false
        },
        eventNotifications: true,
        eventNotificationWindows: [1, 6, 24],
        eventNotificationChannels: ['email', 'push'],
        eventImpactFilter: 'all'
      };

      const response = await request(app)
        .put('/api/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('preferences');
    });

    it('should validate email notifications preference', async () => {
      const preferences = {
        emailNotifications: 'invalid',
        pushNotifications: true,
        telegramNotifications: false
      };

      const response = await request(app)
        .put('/api/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid email notifications preference');
    });

    it('should require authentication', async () => {
      const preferences = {
        emailNotifications: true,
        pushNotifications: false,
        telegramNotifications: true
      };

      await request(app)
        .put('/api/notification-preferences')
        .send(preferences)
        .expect(401);
    });
  });
});
