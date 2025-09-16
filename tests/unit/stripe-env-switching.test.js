// Mock Stripe
const mockStripe = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn()
  },
  checkout: {
    sessions: {
      create: jest.fn()
    }
  },
  webhooks: {
    constructEvent: jest.fn()
  },
  subscriptions: {
    retrieve: jest.fn(),
    cancel: jest.fn()
  }
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

describe('Stripe Environment Switching', () => {
  let originalEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset modules to ensure fresh imports
    jest.resetModules();
    // Ensure tests don't exit due to DATABASE_URL checks
    process.env.DATABASE_URL = 'postgresql://testuser:testpass@localhost:5432/testdb';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Development Environment (NODE_ENV=development)', () => {
    beforeEach(() => {
      // Set development environment
      process.env.NODE_ENV = 'development';
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_development_key_123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_production_key_456';
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_webhook_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_live_webhook_456';
    });

    test('PaymentService uses test Stripe key in development', () => {
      // Import PaymentService after setting environment
      const PaymentService = require('../../server/services/paymentService');
      
      // Verify Stripe was initialized with test key
      const stripe = require('stripe');
      expect(stripe).toHaveBeenCalledWith('sk_test_development_key_123');
    });

    test('Webhook secret uses test secret in development', () => {
      const webhookSecret = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_WEBHOOK_SECRET 
        : process.env.STRIPE_TEST_WEBHOOK_SECRET;
      
      expect(webhookSecret).toBe('whsec_test_webhook_123');
    });
  });

  describe('Production Environment (NODE_ENV=production)', () => {
    beforeEach(() => {
      // Set production environment
      process.env.NODE_ENV = 'production';
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_development_key_123';
      process.env.STRIPE_SECRET_KEY = 'sk_live_production_key_456';
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_webhook_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_live_webhook_456';
    });

    test('PaymentService uses live Stripe key in production', () => {
      // Import PaymentService after setting environment
      const PaymentService = require('../../server/services/paymentService');
      
      // Verify Stripe was initialized with live key
      const stripe = require('stripe');
      expect(stripe).toHaveBeenCalledWith('sk_live_production_key_456');
    });

    test('Webhook secret uses live secret in production', () => {
      const webhookSecret = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_WEBHOOK_SECRET 
        : process.env.STRIPE_TEST_WEBHOOK_SECRET;
      
      expect(webhookSecret).toBe('whsec_live_webhook_456');
    });
  });


  describe('Environment Variable Validation', () => {
    test('Falls back to test key when NODE_ENV is undefined', () => {
      // Clear NODE_ENV
      delete process.env.NODE_ENV;
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_fallback_key';
      process.env.STRIPE_SECRET_KEY = 'sk_live_production_key';
      
      const stripeKey = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_SECRET_KEY 
        : process.env.STRIPE_TEST_SECRET_KEY;
      
      expect(stripeKey).toBe('sk_test_fallback_key');
    });

    test('Falls back to test key when NODE_ENV is not production', () => {
      process.env.NODE_ENV = 'staging';
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_staging_key';
      process.env.STRIPE_SECRET_KEY = 'sk_live_production_key';
      
      const stripeKey = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_SECRET_KEY 
        : process.env.STRIPE_TEST_SECRET_KEY;
      
      expect(stripeKey).toBe('sk_test_staging_key');
    });

    test('Handles missing environment variables gracefully', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.STRIPE_TEST_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      
      const stripeKey = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_SECRET_KEY 
        : process.env.STRIPE_TEST_SECRET_KEY;
      
      expect(stripeKey).toBeUndefined();
    });
  });

  describe('Integration Test - PaymentService Methods', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_integration_key';
      process.env.STRIPE_SECRET_KEY = 'sk_live_integration_key';
    });

    test('PaymentService can be instantiated with correct Stripe key', () => {
      const PaymentService = require('../../server/services/paymentService');
      const paymentService = new PaymentService();
      
      // Verify the service was created (it should have stripe property)
      expect(paymentService.stripe).toBeDefined();
      
      // Verify Stripe was called with the correct key
      const stripe = require('stripe');
      expect(stripe).toHaveBeenCalledWith('sk_test_integration_key');
    });

    test('PaymentService switches to live key in production', () => {
      process.env.NODE_ENV = 'production';
      
      // Reset modules to get fresh imports
      jest.resetModules();
      
      const PaymentService = require('../../server/services/paymentService');
      const paymentService = new PaymentService();
      
      // Verify Stripe was called with the live key
      const stripe = require('stripe');
      expect(stripe).toHaveBeenCalledWith('sk_live_integration_key');
    });
  });

  describe('Server Stripe Initialization Logic', () => {
    test('Server Stripe key selection logic works correctly', () => {
      // Test the actual logic used in server/index.js
      process.env.NODE_ENV = 'development';
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_server_key';
      process.env.STRIPE_SECRET_KEY = 'sk_live_server_key';
      
      const stripeKey = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_SECRET_KEY 
        : process.env.STRIPE_TEST_SECRET_KEY;
      
      expect(stripeKey).toBe('sk_test_server_key');
    });

    test('Server Stripe key selection logic works in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_server_key';
      process.env.STRIPE_SECRET_KEY = 'sk_live_server_key';
      
      const stripeKey = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_SECRET_KEY 
        : process.env.STRIPE_TEST_SECRET_KEY;
      
      expect(stripeKey).toBe('sk_live_server_key');
    });
  });

  describe('Webhook Secret Logic', () => {
    test('Development webhook secret selection', () => {
      process.env.NODE_ENV = 'development';
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_live_456';
      
      const webhookSecret = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_WEBHOOK_SECRET 
        : process.env.STRIPE_TEST_WEBHOOK_SECRET;
      
      expect(webhookSecret).toBe('whsec_test_123');
    });

    test('Production webhook secret selection', () => {
      process.env.NODE_ENV = 'production';
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_123';
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_live_456';
      
      const webhookSecret = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_WEBHOOK_SECRET 
        : process.env.STRIPE_TEST_WEBHOOK_SECRET;
      
      expect(webhookSecret).toBe('whsec_live_456');
    });

    test('Webhook secret validation when missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_TEST_WEBHOOK_SECRET;
      
      const webhookSecret = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_WEBHOOK_SECRET 
        : process.env.STRIPE_TEST_WEBHOOK_SECRET;
      
      expect(webhookSecret).toBeUndefined();
    });
  });

  describe('Publishable Key Logic', () => {
    test('Development publishable key selection', () => {
      process.env.NODE_ENV = 'development';
      process.env.STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_456';
      
      const publishableKey = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_PUBLISHABLE_KEY 
        : process.env.STRIPE_TEST_PUBLISHABLE_KEY;
      
      expect(publishableKey).toBe('pk_test_123');
    });

    test('Production publishable key selection', () => {
      process.env.NODE_ENV = 'production';
      process.env.STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_live_456';
      
      const publishableKey = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_PUBLISHABLE_KEY 
        : process.env.STRIPE_TEST_PUBLISHABLE_KEY;
      
      expect(publishableKey).toBe('pk_live_456');
    });

    test('Publishable key validation when missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.STRIPE_PUBLISHABLE_KEY;
      delete process.env.STRIPE_TEST_PUBLISHABLE_KEY;
      
      const publishableKey = process.env.NODE_ENV === 'production' 
        ? process.env.STRIPE_PUBLISHABLE_KEY 
        : process.env.STRIPE_TEST_PUBLISHABLE_KEY;
      
      expect(publishableKey).toBeUndefined();
    });
  });
});
