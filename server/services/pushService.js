const webpush = require('web-push');

class PushService {
  constructor() {
    this.isConfigured = false;
    this.initPushService();
  }

  initPushService() {
    try {
      // Generate VAPID keys if not provided
      if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        const vapidKeys = webpush.generateVAPIDKeys();
        console.log('⚠️ VAPID keys not found in environment, generated new ones:');
        console.log('VAPID_PUBLIC_KEY:', vapidKeys.publicKey);
        console.log('VAPID_PRIVATE_KEY:', vapidKeys.privateKey);
        console.log('Please add these to your .env file for production use');
        
        // Use generated keys for development
        this.vapidPublicKey = vapidKeys.publicKey;
        this.vapidPrivateKey = vapidKeys.privateKey;
      } else {
        this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
        this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      }

      webpush.setVapidDetails(
        'mailto:crypto-market-monitor@example.com',
        this.vapidPublicKey,
        this.vapidPrivateKey
      );

      this.isConfigured = true;
      console.log('✅ Push notification service configured successfully');
    } catch (error) {
      console.error('❌ Error configuring push service:', error);
      this.isConfigured = false;
    }
  }

  getVapidPublicKey() {
    return this.vapidPublicKey;
  }

  async sendPushNotification(subscription, alert) {
    if (!this.isConfigured) {
      console.log('⚠️ Push service not configured, skipping push notification');
      return false;
    }

    try {
      const severityEmoji = this.getSeverityEmoji(alert.severity);
      const alertType = alert.type.replace(/_/g, ' ');
      
      const payload = {
        title: `${severityEmoji} Market Alert`,
        body: alert.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `alert-${alert.id}`,
        data: {
          alertId: alert.id,
          alertType: alert.type,
          severity: alert.severity,
          timestamp: alert.timestamp,
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
        requireInteraction: alert.severity === 'high',
        silent: false
      };

      const result = await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );

      console.log(`✅ Push notification sent: ${result.statusCode}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      
      // Handle subscription expiration
      if (error.statusCode === 410) {
        console.log('📱 Subscription expired, should be removed');
        return { expired: true };
      }
      
      return false;
    }
  }

  async sendBulkPushNotifications(subscriptions, alert) {
    if (!this.isConfigured) {
      console.log('⚠️ Push service not configured, skipping bulk push notifications');
      return { sent: 0, failed: 0, expired: 0 };
    }

    const results = { sent: 0, failed: 0, expired: 0 };

    for (const subscription of subscriptions) {
      if (subscription.pushNotifications && subscription.subscription) {
        const result = await this.sendPushNotification(subscription.subscription, alert);
        
        if (result === true) {
          results.sent++;
        } else if (result && result.expired) {
          results.expired++;
        } else {
          results.failed++;
        }
      }
    }

    console.log(`📱 Bulk push results: ${results.sent} sent, ${results.failed} failed, ${results.expired} expired`);
    return results;
  }

  getSeverityEmoji(severity) {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  async testConnection() {
    if (!this.isConfigured) {
      return { success: false, error: 'Push service not configured' };
    }

    try {
      // Test with a dummy subscription
      const testSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test',
          auth: 'test'
        }
      };

      // This will fail, but we can check if the service is properly initialized
      await webpush.sendNotification(testSubscription, 'test');
      return { success: true };
    } catch (error) {
      // Expected to fail with test data, but service is working
      if (error.statusCode) {
        return { success: true, note: 'Service initialized (test failed as expected)' };
      }
      return { success: false, error: error.message };
    }
  }
}

module.exports = PushService;
