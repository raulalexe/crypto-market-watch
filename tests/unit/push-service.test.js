const PushService = require('../../server/services/pushService');

// Mock web-push
jest.mock('web-push', () => ({
  generateVAPIDKeys: jest.fn(() => ({
    publicKey: 'test-public-key',
    privateKey: 'test-private-key'
  })),
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn()
}));

const webpush = require('web-push');

describe('Push Service Tests', () => {
  let pushService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.VAPID_PUBLIC_KEY = 'test-vapid-public';
    process.env.VAPID_PRIVATE_KEY = 'test-vapid-private';
    
    pushService = new PushService();
  });

  afterEach(() => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
  });

  describe('Service Initialization', () => {
    it('should initialize with provided VAPID keys', () => {
      expect(pushService.isConfigured).toBe(true);
      expect(pushService.vapidPublicKey).toBe('test-vapid-public');
      expect(pushService.vapidPrivateKey).toBe('test-vapid-private');
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:crypto-market-monitor@example.com',
        'test-vapid-public',
        'test-vapid-private'
      );
    });

    it('should generate VAPID keys when not provided', () => {
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;
      
      const service = new PushService();
      
      expect(webpush.generateVAPIDKeys).toHaveBeenCalled();
      expect(service.vapidPublicKey).toBe('test-public-key');
      expect(service.vapidPrivateKey).toBe('test-private-key');
    });

    it('should return VAPID public key', () => {
      const publicKey = pushService.getVapidPublicKey();
      expect(publicKey).toBe('test-vapid-public');
    });
  });

  describe('Push Notification Sending', () => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      }
    };

    const mockAlert = {
      id: 1,
      type: 'price_alert',
      message: 'Bitcoin price has reached $50,000',
      severity: 'high',
      timestamp: new Date().toISOString(),
      value: '50000',
      metric: 'BTC'
    };

    beforeEach(() => {
      webpush.sendNotification.mockResolvedValue({ statusCode: 200 });
    });

    it('should send push notification successfully', async () => {
      const result = await pushService.sendPushNotification(mockSubscription, mockAlert);

      expect(result).toBe(true);
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        mockSubscription,
        expect.stringContaining('"title":"🔴 Market Alert"')
      );
    });

    it('should not send notification when service is not configured', async () => {
      pushService.isConfigured = false;

      const result = await pushService.sendPushNotification(mockSubscription, mockAlert);

      expect(result).toBe(false);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('should format notification payload correctly', async () => {
      await pushService.sendPushNotification(mockSubscription, mockAlert);

      const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      
      expect(payload).toEqual({
        title: '🔴 Market Alert',
        body: 'Bitcoin price has reached $50,000',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'alert-1',
        data: {
          alertId: 1,
          alertType: 'price_alert',
          severity: 'high',
          timestamp: mockAlert.timestamp,
          url: '/app/alerts'
        },
        actions: [
          {
            action: 'view',
            title: 'View Alert',
            icon: '/favicon.ico'
          },
          {
            action: 'acknowledge',
            title: 'Acknowledge',
            icon: '/favicon.ico'
          }
        ],
        requireInteraction: true,
        silent: false
      });
    });

    it('should use correct severity emoji in title', async () => {
      const testCases = [
        { severity: 'high', expectedEmoji: '🔴' },
        { severity: 'medium', expectedEmoji: '🟡' },
        { severity: 'low', expectedEmoji: '🟢' }
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const alert = { ...mockAlert, severity: testCase.severity };
        await pushService.sendPushNotification(mockSubscription, alert);

        const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
        expect(payload.title).toBe(`${testCase.expectedEmoji} Market Alert`);
      }
    });

    it('should require interaction for high severity alerts', async () => {
      const highSeverityAlert = { ...mockAlert, severity: 'high' };
      await pushService.sendPushNotification(mockSubscription, highSeverityAlert);

      const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      expect(payload.requireInteraction).toBe(true);
    });

    it('should not require interaction for low severity alerts', async () => {
      const lowSeverityAlert = { ...mockAlert, severity: 'low' };
      await pushService.sendPushNotification(mockSubscription, lowSeverityAlert);

      const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      expect(payload.requireInteraction).toBe(false);
    });

    it('should handle expired subscriptions', async () => {
      const expiredError = new Error('Subscription expired');
      expiredError.statusCode = 410;
      webpush.sendNotification.mockRejectedValue(expiredError);

      const result = await pushService.sendPushNotification(mockSubscription, mockAlert);

      expect(result).toEqual({ expired: true });
    });

    it('should handle other notification errors', async () => {
      const error = new Error('Notification failed');
      error.statusCode = 400;
      webpush.sendNotification.mockRejectedValue(error);

      const result = await pushService.sendPushNotification(mockSubscription, mockAlert);

      expect(result).toBe(false);
    });
  });

  describe('Bulk Push Notifications', () => {
    const mockSubscriptions = [
      {
        pushNotifications: true,
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint1',
          keys: { p256dh: 'key1', auth: 'auth1' }
        }
      },
      {
        pushNotifications: true,
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/endpoint2',
          keys: { p256dh: 'key2', auth: 'auth2' }
        }
      }
    ];

    const mockAlert = {
      id: 1,
      type: 'market_alert',
      message: 'Market conditions have changed',
      severity: 'medium',
      timestamp: new Date().toISOString()
    };

    beforeEach(() => {
      webpush.sendNotification.mockResolvedValue({ statusCode: 200 });
    });

    it('should send bulk push notifications successfully', async () => {
      const result = await pushService.sendBulkPushNotifications(mockSubscriptions, mockAlert);

      expect(result).toBe(true);
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk sending', async () => {
      webpush.sendNotification
        .mockResolvedValueOnce({ statusCode: 200 })
        .mockRejectedValueOnce(new Error('Failed to send'));

      const result = await pushService.sendBulkPushNotifications(mockSubscriptions, mockAlert);

      expect(result).toBe(true); // Should still return true for partial success
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should not send notifications when service is not configured', async () => {
      pushService.isConfigured = false;

      const result = await pushService.sendBulkPushNotifications(mockSubscriptions, mockAlert);

      expect(result).toBe(false);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('should handle empty subscriptions array', async () => {
      const result = await pushService.sendBulkPushNotifications([], mockAlert);

      expect(result).toBe(true);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('Notification Payload Validation', () => {
    it('should include all required notification fields', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' }
      };

      const mockAlert = {
        id: 123,
        type: 'test_alert',
        message: 'Test message',
        severity: 'medium',
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      await pushService.sendPushNotification(mockSubscription, mockAlert);

      const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      
      expect(payload).toHaveProperty('title');
      expect(payload).toHaveProperty('body');
      expect(payload).toHaveProperty('icon');
      expect(payload).toHaveProperty('badge');
      expect(payload).toHaveProperty('tag');
      expect(payload).toHaveProperty('data');
      expect(payload).toHaveProperty('actions');
      expect(payload).toHaveProperty('requireInteraction');
      expect(payload).toHaveProperty('silent');
    });

    it('should include correct data fields', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' }
      };

      const mockAlert = {
        id: 456,
        type: 'price_alert',
        message: 'Price alert message',
        severity: 'high',
        timestamp: '2023-01-01T12:00:00.000Z'
      };

      await pushService.sendPushNotification(mockSubscription, mockAlert);

      const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      
      expect(payload.data).toEqual({
        alertId: 456,
        alertType: 'price_alert',
        severity: 'high',
        timestamp: '2023-01-01T12:00:00.000Z',
        url: '/app/alerts'
      });
    });

    it('should include correct action buttons', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test', auth: 'test' }
      };

      const mockAlert = {
        id: 789,
        type: 'market_alert',
        message: 'Market alert message',
        severity: 'low',
        timestamp: new Date().toISOString()
      };

      await pushService.sendPushNotification(mockSubscription, mockAlert);

      const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      
      expect(payload.actions).toEqual([
        {
          action: 'view',
          title: 'View Alert',
          icon: '/favicon.ico'
        },
        {
          action: 'acknowledge',
          title: 'Acknowledge',
          icon: '/favicon.ico'
        }
      ]);
    });
  });
});
