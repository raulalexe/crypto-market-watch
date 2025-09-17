/**
 * Comprehensive Email Service Tests
 * Tests for all email functionality including templates, sending, and error handling
 */

const EmailTestHelper = require('../helpers/emailTestHelper');
const BrevoEmailService = require('../../server/services/brevoEmailService');
const EmailService = require('../../server/services/emailService');

// Mock external dependencies
jest.mock('../../server/database', () => ({
  getUserByEmail: jest.fn(),
  getUsersWithNotifications: jest.fn()
}));

jest.mock('@getbrevo/brevo', () => ({
  TransactionalEmailsApi: jest.fn().mockImplementation(() => ({
    sendTransacEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    setApiKey: jest.fn()
  })),
  TransactionalEmailsApiApiKeys: {
    apiKey: 'apiKey'
  }
}));

describe('Comprehensive Email Service Tests', () => {
  let emailTestHelper;
  let brevoEmailService;
  let emailService;

  beforeEach(() => {
    // Set up environment for testing
    process.env.BREVO_API_KEY = 'test-api-key';
    process.env.BREVO_SENDER_EMAIL = 'test@example.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    
    emailTestHelper = new EmailTestHelper();
    brevoEmailService = new BrevoEmailService();
    emailService = new EmailService();
    
    // Setup email mocks
    emailTestHelper.setupEmailMocks();
  });

  afterEach(() => {
    emailTestHelper.reset();
  });

  describe('Email Template Generation', () => {
    test('should generate alert email template with proper styling', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Bitcoin price exceeded $50,000',
        severity: 'high',
        metric: 'btc_price',
        value: 50000,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('₿ Crypto Market Watch');
      expect(template).toContain('Real-time market intelligence & alerts');
      expect(template).toContain('Bitcoin price exceeded $50,000');
      expect(template).toContain('HIGH');
      expect(template).toContain('btc_price');
      expect(template).toContain('50000');
      expect(template).toContain('background-color: #0f172a');
      expect(template).toContain('color: #f8fafc');
    });

    test('should generate event reminder email template', () => {
      const event = {
        id: 1,
        title: 'FOMC Meeting',
        description: 'Federal Reserve meeting',
        date: '2023-12-15T14:00:00Z',
        impact: 'high',
        category: 'monetary_policy'
      };

      const template = brevoEmailService.generateEventReminderEmailHTML(event, 'test@example.com', 3);
      
      expect(template).toContain('₿ Crypto Market Watch');
      expect(template).toContain('FOMC Meeting');
      expect(template).toContain('Federal Reserve meeting');
      expect(template).toContain('3 days');
      expect(template).toContain('HIGH');
    });

    test('should generate inflation update email template', () => {
      const inflationData = {
        cpi: { value: 3.2, momChange: 0.1, date: '2023-11-01' },
        pce: { value: 2.8, momChange: 0.2, date: '2023-11-01' },
        ppi: { value: 1.5, momChange: 0.3, date: '2023-11-01' }
      };

      const template = brevoEmailService.generateInflationUpdateEmailHTML(inflationData, 'test@example.com');
      
      expect(template).toContain('₿ Crypto Market Watch');
      expect(template).toContain('Inflation Data Update');
      expect(template).toContain('3.2%');
      expect(template).toContain('2.8%');
      expect(template).toContain('1.5%');
    });

    test('should handle invalid timestamps gracefully', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: 'invalid-date'
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('Time unavailable');
    });

    test('should format event time remaining correctly', () => {
      const alert = {
        type: 'UPCOMING_EVENT',
        message: 'FOMC Meeting is likely to impact the market',
        severity: 'high',
        metric: 'event',
        value: 'high',
        eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('Event in 3 days');
    });
  });

  describe('Email Sending Functionality', () => {
    test('should generate alert email template correctly', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Bitcoin price alert',
        severity: 'high',
        metric: 'btc_price',
        value: 50000,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('Market Alert');
      expect(template).toContain('Bitcoin price alert');
      expect(template).toContain('Crypto Market Watch');
    });

    test('should generate event reminder email template correctly', () => {
      const event = {
        id: 1,
        title: 'FOMC Meeting',
        description: 'Federal Reserve meeting',
        date: '2023-12-15T14:00:00Z',
        impact: 'high'
      };

      const template = brevoEmailService.generateEventReminderEmailHTML(event, 'test@example.com', 3);
      
      expect(template).toContain('Upcoming Economic Events');
      expect(template).toContain('FOMC Meeting');
      expect(template).toContain('3 days');
    });

    test('should generate inflation update email template correctly', () => {
      const inflationData = {
        cpi: { value: 3.2, momChange: 0.1 },
        pce: { value: 2.8, momChange: 0.2 },
        ppi: { value: 1.5, momChange: 0.3 }
      };

      const template = brevoEmailService.generateInflationUpdateEmailHTML(inflationData, 'test@example.com');
      
      expect(template).toContain('Inflation Data Update');
      expect(template).toContain('3.2%');
      expect(template).toContain('2.8%');
    });

    test('should handle email sending errors gracefully', async () => {
      // Mock API failure
      brevoEmailService.apiInstance.sendTransacEmail = jest.fn().mockRejectedValue(new Error('API Error'));

      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const result = await brevoEmailService.sendAlertEmail(alert, 'test@example.com');
      
      expect(result).toBe(false);
    });
  });

  describe('Email Content Validation', () => {
    test('should include proper branding in email templates', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('Market Alert');
      expect(template).toContain('Test alert');
      expect(template).toContain('Crypto Market Watch');
    });

    test('should format severity levels correctly in templates', () => {
      const severities = ['low', 'medium', 'high'];
      const expectedEmojis = ['ℹ️', '⚠️', '🚨'];

      severities.forEach((severity, index) => {
        const alert = {
          type: 'PRICE_ALERT',
          message: 'Test alert',
          severity: severity,
          metric: 'test',
          value: 100,
          timestamp: new Date().toISOString()
        };

        const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
        expect(template).toContain(expectedEmojis[index]);
      });
    });

    test('should include unsubscribe links in emails', async () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('unsubscribe');
    });
  });

  describe('Email Template Styling', () => {
    test('should use dark theme colors', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('background-color: #0f172a');
      expect(template).toContain('background-color: #1e293b');
      expect(template).toContain('color: #f8fafc');
      expect(template).toContain('color: #3b82f6');
    });

    test('should be responsive for mobile devices', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('viewport');
      expect(template).toContain('max-width: 600px');
    });

    test('should include proper font families', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('font-family: -apple-system, BlinkMacSystemFont');
    });
  });

  describe('Email Error Handling', () => {
    test('should handle missing email addresses', async () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const result = await brevoEmailService.sendAlertEmail(alert, null);
      
      expect(result).toBe(false);
    });

    test('should handle invalid email addresses', async () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const result = await brevoEmailService.sendAlertEmail(alert, 'invalid-email');
      
      expect(result).toBe(false);
    });

    test('should handle template generation errors', () => {
      const invalidAlert = null;
      
      expect(() => {
        brevoEmailService.generateAlertEmailHTML(invalidAlert, 'test@example.com');
      }).toThrow();
    });
  });

  describe('Email Rate Limiting', () => {
    test('should handle multiple template generations efficiently', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      // Generate multiple templates rapidly
      const templates = Array(10).fill().map(() => 
        brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com')
      );
      
      // All should succeed
      expect(templates).toHaveLength(10);
      templates.forEach(template => {
        expect(template).toContain('Market Alert');
      });
    });
  });

  describe('Email Analytics and Tracking', () => {
    test('should generate templates with proper structure', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('<!DOCTYPE html>');
      expect(template).toContain('<html>');
      expect(template).toContain('</html>');
      expect(template).toContain('Market Alert');
    });

    test('should include proper email structure in templates', () => {
      const alert = {
        type: 'PRICE_ALERT',
        message: 'Test alert',
        severity: 'high',
        metric: 'test',
        value: 100,
        timestamp: new Date().toISOString()
      };

      const template = brevoEmailService.generateAlertEmailHTML(alert, 'test@example.com');
      
      expect(template).toContain('Crypto Market Watch');
      expect(template).toContain('Test alert');
      expect(template).toContain('unsubscribe');
    });
  });
});
