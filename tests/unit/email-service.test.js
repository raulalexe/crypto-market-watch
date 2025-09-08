const BrevoEmailService = require('../../server/services/brevoEmailService');

// Mock the Brevo SDK
jest.mock('@getbrevo/brevo', () => {
  const mockApiInstance = {
    setApiKey: jest.fn(),
    sendTransacEmail: jest.fn()
  };

  const mockApi = jest.fn(() => mockApiInstance);
  mockApi.TransactionalEmailsApiApiKeys = {
    apiKey: 'api-key'
  };

  return {
    SibApiV3Sdk: {
      TransactionalEmailsApi: mockApi,
      SendSmtpEmail: jest.fn()
    }
  };
});

const { SibApiV3Sdk } = require('@getbrevo/brevo');

describe('Brevo Email Service Tests', () => {
  let emailService;
  let mockApiInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.BREVO_API_KEY = 'test-api-key';
    process.env.BREVO_SENDER_EMAIL = 'test@example.com';
    
    emailService = new BrevoEmailService();
    mockApiInstance = emailService.apiInstance;
    
    // Mock the API instance methods
    if (mockApiInstance) {
      mockApiInstance.sendTransacEmail = jest.fn();
    }
  });

  afterEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.BREVO_SENDER_EMAIL;
  });

  describe('Service Initialization', () => {
    it('should initialize with valid API key', () => {
      expect(emailService.isConfigured).toBe(true);
      expect(mockApiInstance.setApiKey).toHaveBeenCalledWith(
        SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
        'test-api-key'
      );
    });

    it('should not initialize without API key', () => {
      delete process.env.BREVO_API_KEY;
      const service = new BrevoEmailService();
      expect(service.isConfigured).toBe(false);
    });
  });

  describe('Alert Email Sending', () => {
    const mockAlert = {
      id: 1,
      type: 'price_alert',
      message: 'Bitcoin price has reached $50,000',
      severity: 'high',
      timestamp: new Date().toISOString(),
      value: '50000',
      metric: 'BTC'
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      emailNotifications: true
    };

    beforeEach(() => {
      mockApiInstance.sendTransacEmail.mockResolvedValue({
        messageId: 'test-message-id'
      });
    });

    it('should send alert email successfully', async () => {
      const result = await emailService.sendAlertEmail('test@example.com', mockAlert, mockUser);

      expect(result).toBe(true);
      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('Market Alert'),
          htmlContent: expect.any(String),
          textContent: expect.any(String),
          sender: {
            name: 'Crypto Market Watch',
            email: 'test@example.com'
          },
          to: [{
            email: 'test@example.com',
            name: 'test'
          }]
        })
      );
    });

    it('should not send email when service is not configured', async () => {
      emailService.isConfigured = false;

      const result = await emailService.sendAlertEmail('test@example.com', mockAlert, mockUser);

      expect(result).toBe(false);
      expect(mockApiInstance.sendTransacEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      mockApiInstance.sendTransacEmail.mockRejectedValue(new Error('API Error'));

      const result = await emailService.sendAlertEmail('test@example.com', mockAlert, mockUser);

      expect(result).toBe(false);
    });

    it('should format email subject correctly for different alert types', async () => {
      const testCases = [
        { type: 'price_alert', expected: 'Market Alert: price alert' },
        { type: 'market_alert', expected: 'Market Alert: market alert' },
        { type: 'fear_greed_alert', expected: 'Market Alert: fear greed alert' }
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const alert = { ...mockAlert, type: testCase.type };
        await emailService.sendAlertEmail('test@example.com', alert, mockUser);

        expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.stringContaining(testCase.expected)
          })
        );
      }
    });

    it('should include severity emoji in subject', async () => {
      const testCases = [
        { severity: 'high', expectedEmoji: '🔴' },
        { severity: 'medium', expectedEmoji: '🟡' },
        { severity: 'low', expectedEmoji: '🟢' }
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const alert = { ...mockAlert, severity: testCase.severity };
        await emailService.sendAlertEmail('test@example.com', alert, mockUser);

        expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.stringContaining(testCase.expectedEmoji)
          })
        );
      }
    });
  });

  describe('Bulk Email Sending', () => {
    const mockUsers = [
      {
        id: 1,
        email: 'user1@example.com',
        emailNotifications: true
      },
      {
        id: 2,
        email: 'user2@example.com',
        emailNotifications: true
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
      mockApiInstance.sendTransacEmail.mockResolvedValue({
        messageId: 'test-message-id'
      });
    });

    it('should send bulk emails to multiple users', async () => {
      const result = await emailService.sendBulkAlertEmails(mockUsers, mockAlert);

      expect(result).toBe(true);
      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk sending', async () => {
      mockApiInstance.sendTransacEmail
        .mockResolvedValueOnce({ messageId: 'success-1' })
        .mockRejectedValueOnce(new Error('Failed to send'));

      const result = await emailService.sendBulkAlertEmails(mockUsers, mockAlert);

      expect(result).toBe(true); // Should still return true for partial success
      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(2);
    });

    it('should not send emails to users without email notifications enabled', async () => {
      const usersWithMixedPreferences = [
        {
          id: 1,
          email: 'enabled@example.com',
          emailNotifications: true
        },
        {
          id: 2,
          email: 'disabled@example.com',
          emailNotifications: false
        }
      ];

      await emailService.sendBulkAlertEmails(usersWithMixedPreferences, mockAlert);

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledTimes(1);
      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{
            email: 'enabled@example.com',
            name: 'enabled'
          }]
        })
      );
    });
  });

  describe('Email Content Generation', () => {
    it('should generate HTML content with alert details', async () => {
      const mockAlert = {
        id: 1,
        type: 'price_alert',
        message: 'Bitcoin price alert',
        severity: 'high',
        timestamp: new Date().toISOString(),
        value: '50000',
        metric: 'BTC'
      };

      await emailService.sendAlertEmail('test@example.com', mockAlert, {});

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0];
      expect(callArgs.htmlContent).toContain('Bitcoin price alert');
      expect(callArgs.htmlContent).toContain('50000');
      expect(callArgs.htmlContent).toContain('BTC');
    });

    it('should generate text content as fallback', async () => {
      const mockAlert = {
        id: 1,
        type: 'market_alert',
        message: 'Market alert message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      await emailService.sendAlertEmail('test@example.com', mockAlert, {});

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0];
      expect(callArgs.textContent).toContain('Market alert message');
      expect(callArgs.textContent).toBeTruthy();
    });

    it('should include unsubscribe link in email content', async () => {
      const mockAlert = {
        id: 1,
        type: 'test_alert',
        message: 'Test message',
        severity: 'low',
        timestamp: new Date().toISOString()
      };

      await emailService.sendAlertEmail('test@example.com', mockAlert, {});

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0][0];
      expect(callArgs.htmlContent).toContain('unsubscribe');
      expect(callArgs.textContent).toContain('unsubscribe');
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.statusCode = 429;
      mockApiInstance.sendTransacEmail.mockRejectedValue(rateLimitError);

      const result = await emailService.sendAlertEmail('test@example.com', {
        id: 1,
        type: 'test_alert',
        message: 'Test message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      }, {});

      expect(result).toBe(false);
    });

    it('should handle invalid email addresses', async () => {
      const invalidEmailError = new Error('Invalid email address');
      invalidEmailError.statusCode = 400;
      mockApiInstance.sendTransacEmail.mockRejectedValue(invalidEmailError);

      const result = await emailService.sendAlertEmail('invalid-email', {
        id: 1,
        type: 'test_alert',
        message: 'Test message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      }, {});

      expect(result).toBe(false);
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockApiInstance.sendTransacEmail.mockRejectedValue(timeoutError);

      const result = await emailService.sendAlertEmail('test@example.com', {
        id: 1,
        type: 'test_alert',
        message: 'Test message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      }, {});

      expect(result).toBe(false);
    });
  });
});
