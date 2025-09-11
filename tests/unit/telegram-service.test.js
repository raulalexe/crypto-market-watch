const TelegramService = require('../../server/services/telegramService');

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('Telegram Service Tests', () => {
  let telegramService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    process.env.TELEGRAM_WEBHOOK_URL = 'https://example.com/webhook';
    
    telegramService = new TelegramService();
  });

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_WEBHOOK_URL;
  });

  describe('Service Initialization', () => {
    it('should initialize with valid bot token', () => {
      expect(telegramService.isConfigured).toBe(true);
      expect(telegramService.botToken).toBe('test-bot-token');
      expect(telegramService.webhookUrl).toBe('https://example.com/webhook');
    });

    it('should not initialize without bot token', () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      const service = new TelegramService();
      expect(service.isConfigured).toBe(false);
    });

    it('should set up webhook on initialization', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });
      
      await telegramService.setupWebhook();
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/setWebhook',
        {
          url: 'https://example.com/webhook/api/telegram/webhook',
          allowed_updates: ['message', 'callback_query']
        },
        { timeout: 10000 }
      );
    });
  });

  describe('Alert Message Sending', () => {
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
      axios.post.mockResolvedValue({ 
        data: { 
          ok: true, 
          result: { message_id: 123 } 
        } 
      });
    });

    it('should send alert message successfully', async () => {
      const result = await telegramService.sendAlertMessage('123456789', mockAlert);

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/sendMessage',
        {
          chat_id: '123456789',
          text: expect.stringContaining('Bitcoin price has reached $50,000'),
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      );
    });

    it('should not send message when service is not configured', async () => {
      telegramService.isConfigured = false;

      const result = await telegramService.sendAlertMessage('123456789', mockAlert);

      expect(result).toBe(false);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should format message with severity emoji', async () => {
      const testCases = [
        { severity: 'high', expectedEmoji: '🚨' },
        { severity: 'medium', expectedEmoji: '⚠️' },
        { severity: 'low', expectedEmoji: 'ℹ️' }
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const alert = { ...mockAlert, severity: testCase.severity };
        await telegramService.sendAlertMessage('123456789', alert);

        expect(axios.post).toHaveBeenCalledWith(
          'https://api.telegram.org/bottest-bot-token/sendMessage',
          expect.objectContaining({
            text: expect.stringContaining(testCase.expectedEmoji)
          })
        );
      }
    });

    it('should format message with alert type', async () => {
      const testCases = [
        { type: 'price_alert', expected: 'price alert' },
        { type: 'market_alert', expected: 'market alert' },
        { type: 'fear_greed_alert', expected: 'fear greed alert' }
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        const alert = { ...mockAlert, type: testCase.type };
        await telegramService.sendAlertMessage('123456789', alert);

        expect(axios.post).toHaveBeenCalledWith(
          'https://api.telegram.org/bottest-bot-token/sendMessage',
          expect.objectContaining({
            text: expect.stringContaining(testCase.expected)
          })
        );
      }
    });

    it('should include alert details in message', async () => {
      await telegramService.sendAlertMessage('123456789', mockAlert);

      const callArgs = axios.post.mock.calls[0][1];
      expect(callArgs.text).toContain('Bitcoin price has reached $50,000');
      expect(callArgs.text).toContain('50000');
      expect(callArgs.text).toContain('BTC');
    });

    it('should handle API errors gracefully', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));

      const result = await telegramService.sendAlertMessage('123456789', mockAlert);

      expect(result).toBe(false);
    });

    it('should handle invalid chat ID errors', async () => {
      const error = new Error('Chat not found');
      error.response = { status: 400 };
      axios.post.mockRejectedValue(error);

      const result = await telegramService.sendAlertMessage('invalid-chat-id', mockAlert);

      expect(result).toBe(false);
    });

    it('should handle rate limiting errors', async () => {
      const error = new Error('Too Many Requests');
      error.response = { status: 429 };
      axios.post.mockRejectedValue(error);

      const result = await telegramService.sendAlertMessage('123456789', mockAlert);

      expect(result).toBe(false);
    });
  });

  describe('Bulk Alert Messages', () => {
    const mockAlert = {
      id: 1,
      type: 'market_alert',
      message: 'Market conditions have changed',
      severity: 'medium',
      timestamp: new Date().toISOString()
    };

    beforeEach(() => {
      telegramService.chatIds = ['123456789', '987654321'];
      axios.post.mockResolvedValue({ 
        data: { 
          ok: true, 
          result: { message_id: 123 } 
        } 
      });
    });

    it('should send bulk alert messages successfully', async () => {
      const result = await telegramService.sendBulkAlertMessages(mockAlert);

      expect(result).toEqual({
        sent: 2,
        failed: 0
      });
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in bulk sending', async () => {
      axios.post
        .mockResolvedValueOnce({ data: { ok: true, result: { message_id: 123 } } })
        .mockRejectedValueOnce(new Error('Failed to send'));

      const result = await telegramService.sendBulkAlertMessages(mockAlert);

      expect(result).toEqual({
        sent: 1,
        failed: 1
      });
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    it('should not send messages when service is not configured', async () => {
      telegramService.isConfigured = false;

      const result = await telegramService.sendBulkAlertMessages(mockAlert);

      expect(result).toEqual({
        sent: 0,
        failed: 0
      });
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should handle empty chat IDs list', async () => {
      telegramService.chatIds = [];

      const result = await telegramService.sendBulkAlertMessages(mockAlert);

      expect(result).toEqual({
        sent: 0,
        failed: 0
      });
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('Message Formatting', () => {
    it('should format HTML message correctly', async () => {
      const mockAlert = {
        id: 1,
        type: 'price_alert',
        message: 'Bitcoin price alert',
        severity: 'high',
        timestamp: new Date().toISOString(),
        value: '50000',
        metric: 'BTC'
      };

      await telegramService.sendAlertMessage('123456789', mockAlert);

      const callArgs = axios.post.mock.calls[0][1];
      expect(callArgs.parse_mode).toBe('HTML');
      expect(callArgs.text).toContain('<b>');
      expect(callArgs.text).toContain('</b>');
    });

    it('should escape HTML special characters', async () => {
      const mockAlert = {
        id: 1,
        type: 'test_alert',
        message: 'Test message with <script>alert("xss")</script>',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      await telegramService.sendAlertMessage('123456789', mockAlert);

      const callArgs = axios.post.mock.calls[0][1];
      expect(callArgs.text).not.toContain('<script>');
      expect(callArgs.text).toContain('&lt;script&gt;');
    });

    it('should include timestamp in message', async () => {
      const timestamp = '2023-01-01T12:00:00.000Z';
      const mockAlert = {
        id: 1,
        type: 'test_alert',
        message: 'Test message',
        severity: 'low',
        timestamp: timestamp
      };

      await telegramService.sendAlertMessage('123456789', mockAlert);

      const callArgs = axios.post.mock.calls[0][1];
      expect(callArgs.text).toContain('2023-01-01');
    });

    it('should include alert ID in message', async () => {
      const mockAlert = {
        id: 12345,
        type: 'test_alert',
        message: 'Test message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      await telegramService.sendAlertMessage('123456789', mockAlert);

      const callArgs = axios.post.mock.calls[0][1];
      expect(callArgs.text).toContain('12345');
    });
  });

  describe('Webhook Management', () => {
    it('should set webhook successfully', async () => {
      axios.post.mockResolvedValue({ data: { ok: true } });

      const result = await telegramService.setupWebhook();

      expect(result).toBeUndefined(); // setupWebhook doesn't return a value
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/setWebhook',
        {
          url: 'https://example.com/webhook/api/telegram/webhook',
          allowed_updates: ['message', 'callback_query']
        },
        { timeout: 10000 }
      );
    });

    it('should handle webhook setup errors', async () => {
      axios.post.mockRejectedValue(new Error('Webhook setup failed'));

      const result = await telegramService.setupWebhook();

      expect(result).toBeUndefined(); // setupWebhook doesn't return a value
    });

    it('should not set webhook when service is not configured', async () => {
      telegramService.isConfigured = false;

      const result = await telegramService.setupWebhook();

      expect(result).toBeUndefined(); // setupWebhook doesn't return a value
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ETIMEDOUT';
      axios.post.mockRejectedValue(timeoutError);

      const result = await telegramService.sendAlertMessage('123456789', {
        id: 1,
        type: 'test_alert',
        message: 'Test message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });

      expect(result).toBe(false);
    });

    it('should handle invalid bot token errors', async () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      axios.post.mockRejectedValue(error);

      const result = await telegramService.sendAlertMessage('123456789', {
        id: 1,
        type: 'test_alert',
        message: 'Test message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });

      expect(result).toBe(false);
    });

    it('should handle blocked bot errors', async () => {
      const error = new Error('Bot was blocked by the user');
      error.response = { status: 403 };
      axios.post.mockRejectedValue(error);

      const result = await telegramService.sendAlertMessage('123456789', {
        id: 1,
        type: 'test_alert',
        message: 'Test message',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });

      expect(result).toBe(false);
    });
  });
});
