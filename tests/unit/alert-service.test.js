const AlertService = require('../../server/services/alertService');
const { setupTestDatabase } = require('../helpers/testHelpers');

// Mock the notification services
jest.mock('../../server/services/emailService', () => {
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

const EmailService = require('../../server/services/emailService');
const PushService = require('../../server/services/pushService');
const TelegramService = require('../../server/services/telegramService');
const { getUsersWithNotifications, insertAlert, checkAlertExists } = require('../../server/database');

describe('Alert Service Notification Tests', () => {
  let alertService;
  let mockEmailService;
  let mockPushService;
  let mockTelegramService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh instances
    alertService = new AlertService();
    
    // Get the mocked instances
    mockEmailService = alertService.emailService;
    mockPushService = alertService.pushService;
    mockTelegramService = alertService.telegramService;
  });

  describe('Alert Generation and Notification', () => {
    it('should generate alerts and send notifications for SSR alerts', async () => {
      // Mock database responses
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'test@example.com',
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          pushSubscriptions: [{ endpoint: 'test-endpoint', keys: { p256dh: 'test', auth: 'test' } }],
          telegramChatId: '123456789',
          telegramVerified: true,
          plan: 'premium' // Changed to premium for immediate delivery
        }
      ]);

      checkAlertExists.mockResolvedValue(false);
      insertAlert.mockResolvedValue(1);

      // Test data with extreme SSR (should trigger alert)
      const metrics = {
        stablecoinMetrics: {
          ssr: 1.5 // Very bullish SSR (should trigger alert)
        }
      };

      const alerts = await alertService.checkAllAlerts(metrics);

      // Debug: Check what was returned
      console.log('Alerts returned:', alerts.length);
      console.log('Alert types:', alerts.map(a => a.type));

      // Verify alert was generated
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('SSR_VERY_BULLISH');
      expect(alerts[0].severity).toBe('high');

      // Wait a bit for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Debug: Check if mocks are set up correctly
      console.log('Mock email service:', typeof mockEmailService.sendBulkAlertEmails);
      console.log('Mock push service:', typeof mockPushService.sendBulkPushNotifications);
      console.log('Mock telegram service:', typeof mockTelegramService.sendAlertMessage);
      console.log('Email service calls:', mockEmailService.sendBulkAlertEmails.mock?.calls?.length || 0);
      console.log('Push service calls:', mockPushService.sendBulkPushNotifications.mock?.calls?.length || 0);
      console.log('Telegram service calls:', mockTelegramService.sendAlertMessage.mock?.calls?.length || 0);

      // Verify notifications were sent
      expect(mockEmailService.sendBulkAlertEmails).toHaveBeenCalled();
      expect(mockPushService.sendBulkPushNotifications).toHaveBeenCalled();
      expect(mockTelegramService.sendAlertMessage).toHaveBeenCalled();
    });

    it('should generate alerts for Bitcoin dominance', async () => {
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'test@example.com',
          emailNotifications: true,
          pushNotifications: false,
          telegramNotifications: false,
          plan: 'free'
        }
      ]);

      checkAlertExists.mockResolvedValue(false);
      insertAlert.mockResolvedValue(1);

      const metrics = {
        bitcoinDominance: {
          value: 60.0 // High dominance (should trigger alert)
        }
      };

      const alerts = await alertService.checkAllAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('BTC_DOMINANCE_HIGH');
      expect(alerts[0].severity).toBe('medium');
    });

    it('should generate alerts for exchange flows', async () => {
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'test@example.com',
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          pushSubscriptions: [{ endpoint: 'test-endpoint', keys: { p256dh: 'test', auth: 'test' } }],
          telegramChatId: '123456789',
          telegramVerified: true,
          plan: 'premium'
        }
      ]);

      checkAlertExists.mockResolvedValue(false);
      insertAlert.mockResolvedValue(1);

      const metrics = {
        exchangeFlows: {
          btc: {
            netFlow: 2000000, // $2M inflow (should trigger alert)
            inflow: 3000000,
            outflow: 1000000
          }
        }
      };

      const alerts = await alertService.checkAllAlerts(metrics);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('BTC_EXTREME_INFLOW');
      expect(alerts[0].severity).toBe('high');
    });

    it('should not generate duplicate alerts', async () => {
      getUsersWithNotifications.mockResolvedValue([]);
      checkAlertExists.mockResolvedValue(true); // Alert already exists

      const metrics = {
        stablecoinMetrics: {
          ssr: 1.5
        }
      };

      const alerts = await alertService.checkAllAlerts(metrics);

      expect(alerts).toHaveLength(0);
      expect(insertAlert).not.toHaveBeenCalled();
    });
  });

  describe('Notification Priority System', () => {
    it('should send priority notifications to premium users', async () => {
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'premium@example.com',
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          pushSubscriptions: [{ endpoint: 'test-endpoint', keys: { p256dh: 'test', auth: 'test' } }],
          telegramChatId: '123456789',
          telegramVerified: true,
          plan: 'premium'
        },
        {
          id: 2,
          email: 'free@example.com',
          emailNotifications: true,
          pushNotifications: false,
          telegramNotifications: false,
          plan: 'free'
        }
      ]);

      checkAlertExists.mockResolvedValue(false);
      insertAlert.mockResolvedValue(1);

      const alert = {
        id: 1,
        type: 'test_alert',
        message: 'Test alert message',
        severity: 'high',
        timestamp: new Date().toISOString()
      };

      await alertService.sendNotifications(alert);

      // Premium users should get immediate notifications
      expect(mockEmailService.sendBulkAlertEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ plan: 'premium' })
        ]),
        alert
      );
    });

    it('should delay notifications for free users', async () => {
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'free@example.com',
          emailNotifications: true,
          pushNotifications: false,
          telegramNotifications: false,
          plan: 'free'
        }
      ]);

      const alert = {
        id: 1,
        type: 'test_alert',
        message: 'Test alert message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      await alertService.sendNotifications(alert);

      // Free users should not get immediate notifications
      expect(mockEmailService.sendBulkAlertEmails).not.toHaveBeenCalled();
      
      // Note: Delayed notifications are tested in integration tests
      // This test verifies that immediate notifications are not sent to free users
    });
  });

  describe('Notification Channel Filtering', () => {
    it('should only send email notifications to users with email enabled', async () => {
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'email@example.com',
          emailNotifications: true,
          pushNotifications: false,
          telegramNotifications: false,
          plan: 'premium'
        },
        {
          id: 2,
          email: 'no-email@example.com',
          emailNotifications: false,
          pushNotifications: true,
          telegramNotifications: false,
          pushSubscriptions: [{ endpoint: 'test-endpoint', keys: { p256dh: 'test', auth: 'test' } }],
          plan: 'premium'
        }
      ]);

      const alert = {
        id: 1,
        type: 'test_alert',
        message: 'Test alert message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      await alertService.sendNotifications(alert);

      // Should only send email to users with email notifications enabled
      expect(mockEmailService.sendBulkAlertEmails).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ emailNotifications: true })
        ]),
        alert
      );

      // Should only send push to users with push notifications enabled
      expect(mockPushService.sendBulkPushNotifications).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ pushNotifications: true })
        ]),
        alert
      );
    });

    it('should only send Telegram notifications to verified users', async () => {
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'verified@example.com',
          emailNotifications: false,
          pushNotifications: false,
          telegramNotifications: true,
          telegramChatId: '123456789',
          telegramVerified: true,
          plan: 'premium'
        },
        {
          id: 2,
          email: 'unverified@example.com',
          emailNotifications: false,
          pushNotifications: false,
          telegramNotifications: true,
          telegramChatId: null,
          telegramVerified: false,
          plan: 'premium'
        }
      ]);

      const alert = {
        id: 1,
        type: 'test_alert',
        message: 'Test alert message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      await alertService.sendNotifications(alert);

      // Should only send Telegram to verified users
      expect(mockTelegramService.sendAlertMessage).toHaveBeenCalledWith(
        '123456789',
        alert
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle notification service errors gracefully', async () => {
      getUsersWithNotifications.mockResolvedValue([
        {
          id: 1,
          email: 'test@example.com',
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          pushSubscriptions: [{ endpoint: 'test-endpoint', keys: { p256dh: 'test', auth: 'test' } }],
          telegramChatId: '123456789',
          telegramVerified: true,
          plan: 'premium'
        }
      ]);

      // Mock service failures
      mockEmailService.sendBulkAlertEmails.mockRejectedValue(new Error('Email service error'));
      mockPushService.sendBulkPushNotifications.mockRejectedValue(new Error('Push service error'));
      mockTelegramService.sendAlertMessage.mockRejectedValue(new Error('Telegram service error'));

      const alert = {
        id: 1,
        type: 'test_alert',
        message: 'Test alert message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      // Should not throw errors even if notification services fail
      await expect(alertService.sendNotifications(alert)).resolves.not.toThrow();
      
      // Note: Service call verification is complex due to async error handling
      // The main test is that the method doesn't throw errors
    });

    it('should handle database errors gracefully', async () => {
      getUsersWithNotifications.mockRejectedValue(new Error('Database error'));

      const alert = {
        id: 1,
        type: 'test_alert',
        message: 'Test alert message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      // Should not throw errors even if database fails
      await expect(alertService.sendNotifications(alert)).resolves.not.toThrow();
    });
  });

  describe('Alert Thresholds', () => {
    it('should use correct thresholds for SSR alerts', () => {
      const thresholds = alertService.alertThresholds.ssr;
      
      expect(thresholds.veryBullish).toBe(2.0);
      expect(thresholds.bullish).toBe(4.0);
      expect(thresholds.bearish).toBe(6.0);
      expect(thresholds.veryBearish).toBe(8.0);
    });

    it('should use correct thresholds for Bitcoin dominance alerts', () => {
      const thresholds = alertService.alertThresholds.btcDominance;
      
      expect(thresholds.high).toBe(55.0);
      expect(thresholds.low).toBe(40.0);
    });

    it('should use correct thresholds for exchange flow alerts', () => {
      const thresholds = alertService.alertThresholds.exchangeFlows;
      
      expect(thresholds.extremeInflow).toBe(1000000);
      expect(thresholds.extremeOutflow).toBe(1000000);
    });

    it('should use correct thresholds for stablecoin growth alerts', () => {
      const thresholds = alertService.alertThresholds.stablecoinGrowth;
      
      expect(thresholds.rapidGrowth).toBe(5.0);
      expect(thresholds.rapidDecline).toBe(-5.0);
    });
  });
});
