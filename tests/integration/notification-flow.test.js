const { setupTestDatabase, createTestToken, createMockUser } = require('../helpers/testHelpers');

// Mock the notification services
jest.mock('../../server/services/brevoEmailService', () => {
  return jest.fn().mockImplementation(() => ({
    sendBulkAlertEmails: jest.fn().mockResolvedValue(true)
  }));
});

jest.mock('../../server/services/pushService', () => {
  return jest.fn().mockImplementation(() => ({
    sendBulkPushNotifications: jest.fn().mockResolvedValue(true)
  }));
});

jest.mock('../../server/services/telegramService', () => {
  return jest.fn().mockImplementation(() => ({
    sendAlertMessage: jest.fn().mockResolvedValue(true)
  }));
});

jest.mock('../../server/database');

const BrevoEmailService = require('../../server/services/brevoEmailService');
const PushService = require('../../server/services/pushService');
const TelegramService = require('../../server/services/telegramService');
const { getUsersWithNotifications } = require('../../server/database');

describe('Notification Flow Integration Tests', () => {
  let authToken;
  let mockEmailService;
  let mockPushService;
  let mockTelegramService;

  beforeAll(async () => {
    await setupTestDatabase();
    authToken = await createTestToken(1);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh service instances
    mockEmailService = new BrevoEmailService();
    mockPushService = new PushService();
    mockTelegramService = new TelegramService();
    
    // Reset all mocks
    mockEmailService.sendBulkAlertEmails.mockClear();
    mockPushService.sendBulkPushNotifications.mockClear();
    mockTelegramService.sendAlertMessage.mockClear();
  });

  describe('Complete Notification Flow', () => {
    it('should send notifications through all channels when alert is generated', async () => {
      // Mock users with notification preferences
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'test@example.com',
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          telegramChatId: '123456789',
          telegramVerified: true,
          pushSubscriptions: [{
            endpoint: 'https://fcm.googleapis.com/fcm/send/test',
            keys: { p256dh: 'test', auth: 'test' }
          }],
          plan: 'pro'
        }
      ]);

      // Mock the alert service to generate an alert
      const mockAlert = {
        id: 1,
        type: 'SSR_VERY_BULLISH',
        message: 'SSR at 1.5 - Very bullish signal!',
        severity: 'high',
        timestamp: new Date().toISOString(),
        value: 1.5,
        metric: 'ssr'
      };

      // Test the notification flow directly
      const AlertService = require('../../server/services/alertService');
      const alertService = new AlertService();
      
      // Mock the notification services
      alertService.emailService = mockEmailService;
      alertService.pushService = mockPushService;
      alertService.telegramService = mockTelegramService;

      // Send notifications
      await alertService.sendNotifications(mockAlert);

      // Wait for async operations to complete (including setTimeout calls)
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Verify that notification services were called
      expect(mockEmailService.sendBulkAlertEmails).toHaveBeenCalled();
      expect(mockPushService.sendBulkPushNotifications).toHaveBeenCalled();
      expect(mockTelegramService.sendAlertMessage).toHaveBeenCalled();
    });

    it('should respect user notification preferences', async () => {
      // Mock users with only email notifications enabled
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 2,
          email: 'email-only@example.com',
          emailNotifications: true,
          pushNotifications: false,
          telegramNotifications: false,
          plan: 'pro'
        }
      ]);

      // Mock the alert service
      const mockAlert = {
        id: 2,
        type: 'BTC_DOMINANCE_HIGH',
        message: 'Bitcoin dominance at 60% - BTC outperforming altcoins',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      // Test the notification flow directly
      const AlertService = require('../../server/services/alertService');
      const alertService = new AlertService();
      
      // Mock the notification services
      alertService.emailService = mockEmailService;
      alertService.pushService = mockPushService;
      alertService.telegramService = mockTelegramService;

      // Send notifications
      await alertService.sendNotifications(mockAlert);

      // Wait for async operations to complete (including setTimeout calls)
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Verify only email notifications are sent
      expect(mockEmailService.sendBulkAlertEmails).toHaveBeenCalled();
      expect(mockPushService.sendBulkPushNotifications).not.toHaveBeenCalled();
      expect(mockTelegramService.sendAlertMessage).not.toHaveBeenCalled();
    });

    it('should handle notification service failures gracefully', async () => {
      // Mock service failures
      mockEmailService.sendBulkAlertEmails.mockRejectedValue(new Error('Email service error'));
      mockPushService.sendBulkPushNotifications.mockRejectedValue(new Error('Push service error'));
      mockTelegramService.sendAlertMessage.mockRejectedValue(new Error('Telegram service error'));

      // Mock users
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 3,
          email: 'test@example.com',
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          telegramChatId: '123456789',
          telegramVerified: true,
          pushSubscriptions: [{
            endpoint: 'https://fcm.googleapis.com/fcm/send/test',
            keys: { p256dh: 'test', auth: 'test' }
          }],
          plan: 'pro'
        }
      ]);

      // Test the notification flow directly
      const AlertService = require('../../server/services/alertService');
      const alertService = new AlertService();
      
      // Mock the notification services
      alertService.emailService = mockEmailService;
      alertService.pushService = mockPushService;
      alertService.telegramService = mockTelegramService;

      const mockAlert = {
        id: 3,
        type: 'BTC_EXTREME_INFLOW',
        message: 'BTC extreme inflow: $2M - Money moving to exchanges',
        severity: 'high',
        timestamp: new Date().toISOString()
      };

      // Should not throw errors even if notification services fail
      await expect(alertService.sendNotifications(mockAlert)).resolves.not.toThrow();
    });
  });

  describe('Notification Error Handling', () => {
    it('should handle database errors during notification sending', async () => {
      // Mock database error
      getUsersWithNotifications.mockRejectedValue(new Error('Database connection failed'));

      // Test the notification flow directly
      const AlertService = require('../../server/services/alertService');
      const alertService = new AlertService();
      
      // Mock the notification services
      alertService.emailService = mockEmailService;
      alertService.pushService = mockPushService;
      alertService.telegramService = mockTelegramService;

      const mockAlert = {
        id: 4,
        type: 'SSR_BEARISH',
        message: 'SSR at 7.0 - Bearish signal',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      // Should not throw errors even if database fails
      await expect(alertService.sendNotifications(mockAlert)).resolves.not.toThrow();
    });

    it('should handle partial notification failures', async () => {
      // Mock partial service failures
      mockEmailService.sendBulkAlertEmails.mockResolvedValue(true);
      mockPushService.sendBulkPushNotifications.mockRejectedValue(new Error('Push failed'));
      mockTelegramService.sendAlertMessage.mockResolvedValue(true);

      // Mock users
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 5,
          email: 'test@example.com',
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          telegramChatId: '123456789',
          telegramVerified: true,
          pushSubscriptions: [{
            endpoint: 'https://fcm.googleapis.com/fcm/send/test',
            keys: { p256dh: 'test', auth: 'test' }
          }],
          plan: 'pro'
        }
      ]);

      // Test the notification flow directly
      const AlertService = require('../../server/services/alertService');
      const alertService = new AlertService();
      
      // Mock the notification services
      alertService.emailService = mockEmailService;
      alertService.pushService = mockPushService;
      alertService.telegramService = mockTelegramService;

      const mockAlert = {
        id: 5,
        type: 'ETH_EXTREME_OUTFLOW',
        message: 'ETH extreme outflow: $1.5M - Money leaving exchanges',
        severity: 'high',
        timestamp: new Date().toISOString()
      };

      // Should not throw errors even with partial failures
      await expect(alertService.sendNotifications(mockAlert)).resolves.not.toThrow();
    });
  });
});
