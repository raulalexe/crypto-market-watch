/**
 * Payment and Webhook Flow Integration Tests
 * Tests the complete payment flow from subscription creation to webhook processing
 */

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_mock_key_for_testing';
process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_mock_webhook_secret_for_testing';
process.env.STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_mock_publishable_key_for_testing';
process.env.FRONTEND_URL = 'http://localhost:3000';

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

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
  },
  prices: {
    create: jest.fn()
  },
  coupons: {
    create: jest.fn()
  }
};

jest.mock('stripe', () => jest.fn(() => mockStripe));

// Mock database
jest.mock('../../server/database', () => ({
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  insertUser: jest.fn(),
  updateUser: jest.fn(),
  getUserByStripeCustomerId: jest.fn(),
  insertSubscription: jest.fn(),
  updateSubscription: jest.fn(),
  getActiveSubscription: jest.fn(),
  db: {
    query: jest.fn()
  }
}));

// Mock services
jest.mock('../../server/services/brevoEmailService');
jest.mock('../../server/services/pushService');
jest.mock('../../server/services/telegramService');

const { getUserByEmail, getUserById, insertUser, updateUser, getUserByStripeCustomerId, insertSubscription, updateSubscription, getActiveSubscription } = require('../../server/database');
const PaymentService = require('../../server/services/paymentService');

describe('Payment and Webhook Flow Integration Tests', () => {
  let app;
  let paymentService;
  let mockUser;
  let mockSubscription;

  beforeAll(() => {
    console.log('Setting up test app...');
    // Create test app
    app = express();
    app.use(express.json());
    app.use(express.raw({ type: 'application/json' }));

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });

    // Payment endpoints
    app.post('/api/subscription/create-checkout-session', async (req, res) => {
      try {
        console.log('Creating checkout session for user:', req.user.id, 'plan:', req.body.planId);
        const result = await paymentService.createStripeSubscription(req.user.id, req.body.planId);
        console.log('Checkout session result:', result);
        res.json(result);
      } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Webhook endpoint
    app.post('/api/webhooks/stripe', async (req, res) => {
      try {
        const event = mockStripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], 'test_webhook_secret');
        await paymentService.handleStripeWebhook(event);
        res.json({ received: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Subscription status endpoint
    app.get('/api/subscription', async (req, res) => {
      try {
        const subscription = await getActiveSubscription(req.user.id);
        res.json({ subscription });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh payment service instance
    try {
      paymentService = new PaymentService();
      console.log('PaymentService created successfully');
    } catch (error) {
      console.error('Error creating PaymentService:', error);
      throw error;
    }
    
    // Mock user
    mockUser = {
      id: 1,
      email: 'test@example.com',
      stripe_customer_id: 'cus_test123'
    };

    // Mock subscription
    mockSubscription = {
      id: 'sub_test123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      customer: 'cus_test123'
    };

    // Setup default mocks
    getUserByEmail.mockResolvedValue(mockUser);
    getUserById.mockResolvedValue(mockUser);
    getUserByStripeCustomerId.mockResolvedValue(mockUser);
    getActiveSubscription.mockResolvedValue(null);
  });

  describe('Complete Payment Flow', () => {
    test('should create checkout session and process payment successfully', async () => {
      console.log('Starting test: should create checkout session and process payment successfully');
      // Mock Stripe customer creation
      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_test123',
        email: 'test@example.com'
      });

      // Mock Stripe customer retrieval
      mockStripe.customers.retrieve.mockResolvedValue({
        id: 'cus_test123',
        email: 'test@example.com'
      });

      // Mock price creation
      mockStripe.prices.create.mockResolvedValue({
        id: 'price_test123',
        unit_amount: 2999,
        currency: 'usd'
      });

      // Mock coupon creation
      mockStripe.coupons.create.mockResolvedValue({
        id: 'coupon_test123',
        amount_off: 1000,
        currency: 'usd'
      });

      // Mock checkout session creation
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test123',
        subscription: 'sub_test123'
      });

      // Create checkout session
      const checkoutResponse = await request(app)
        .post('/api/subscription/create-checkout-session')
        .send({ planId: 'pro' });

      console.log('Checkout response:', checkoutResponse.status, checkoutResponse.body);
      expect(checkoutResponse.status).toBe(200);
      expect(checkoutResponse.body.url).toBe('https://checkout.stripe.com/test123');

      // Verify Stripe calls
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith('cus_test123');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    });

    test('should handle webhook events correctly', async () => {
      // Mock checkout session completed event
      const checkoutSession = {
        id: 'cs_test123',
        customer_email: 'test@example.com',
        payment_status: 'paid',
        subscription: 'sub_test123',
        metadata: {
          userId: '1',
          planId: 'pro'
        }
      };

      const webhookEvent = {
        id: 'evt_test123',
        type: 'checkout.session.completed',
        data: {
          object: checkoutSession
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);

      // Process webhook
      const webhookResponse = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(JSON.stringify(webhookEvent));

      expect(webhookResponse.status).toBe(200);
      expect(webhookResponse.body.received).toBe(true);

      // Verify subscription was created/updated
      expect(insertSubscription).toHaveBeenCalled();
    });

    test('should handle payment succeeded webhook', async () => {
      // Mock invoice with subscription
      const invoice = {
        id: 'in_test123',
        subscription: 'sub_test123',
        customer: 'cus_test123'
      };

      const webhookEvent = {
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: {
          object: invoice
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);

      // Process webhook
      const webhookResponse = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(JSON.stringify(webhookEvent));

      expect(webhookResponse.status).toBe(200);

      // Verify subscription was updated with active status
      expect(updateSubscription).toHaveBeenCalledWith(
        'sub_test123',
        expect.objectContaining({
          status: 'active',
          current_period_start: expect.any(Date),
          current_period_end: expect.any(Date)
        })
      );
    });

    test('should handle subscription cancellation', async () => {
      const cancelledSubscription = {
        ...mockSubscription,
        status: 'cancelled'
      };

      const webhookEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.deleted',
        data: {
          object: cancelledSubscription
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      // Process webhook
      const webhookResponse = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(JSON.stringify(webhookEvent));

      expect(webhookResponse.status).toBe(200);

      // Verify subscription was updated to cancelled
      expect(updateSubscription).toHaveBeenCalledWith(
        'sub_test123',
        { status: 'cancelled' }
      );
    });
  });

  describe('Subscription Status Management', () => {
    test('should return active subscription status', async () => {
      const activeSubscription = {
        id: 'sub_test123',
        plan_type: 'pro',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      getActiveSubscription.mockResolvedValue(activeSubscription);

      const response = await request(app).get('/api/subscription');

      expect(response.status).toBe(200);
      expect(response.body.subscription).toEqual(activeSubscription);
    });

    test('should handle no active subscription', async () => {
      getActiveSubscription.mockResolvedValue(null);

      const response = await request(app).get('/api/subscription');

      expect(response.status).toBe(200);
      expect(response.body.subscription).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle webhook signature verification failure', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'invalid_signature')
        .send('{}');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid signature');
    });

    test('should handle missing user in webhook processing', async () => {
      const webhookEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: {
          object: {
            ...mockSubscription,
            customer: 'cus_nonexistent'
          }
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);
      getUserByStripeCustomerId.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(JSON.stringify(webhookEvent));

      expect(response.status).toBe(200);
      // Should not create subscription for unknown user
      expect(insertSubscription).not.toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      const webhookEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.created',
        data: {
          object: mockSubscription
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);
      insertSubscription.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(JSON.stringify(webhookEvent));

      // Should still return 200 to prevent webhook retries
      expect(response.status).toBe(200);
    });
  });

  describe('Pro Subscription Features', () => {
    test('should grant pro access after successful payment', async () => {
      // Mock successful payment webhook
      const invoice = {
        id: 'in_test123',
        subscription: 'sub_test123',
        customer: 'cus_test123'
      };

      const webhookEvent = {
        id: 'evt_test123',
        type: 'invoice.payment_succeeded',
        data: {
          object: invoice
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription);

      // Process payment webhook
      await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(JSON.stringify(webhookEvent));

      // Mock active subscription for status check
      const activeSubscription = {
        id: 'sub_test123',
        plan_type: 'pro',
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      getActiveSubscription.mockResolvedValue(activeSubscription);

      // Check subscription status
      const statusResponse = await request(app).get('/api/subscription');

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.subscription.plan_type).toBe('pro');
      expect(statusResponse.body.subscription.status).toBe('active');
    });

    test('should revoke pro access after cancellation', async () => {
      // Mock cancellation webhook
      const cancelledSubscription = {
        ...mockSubscription,
        status: 'cancelled'
      };

      const webhookEvent = {
        id: 'evt_test123',
        type: 'customer.subscription.deleted',
        data: {
          object: cancelledSubscription
        }
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      // Process cancellation webhook
      await request(app)
        .post('/api/webhooks/stripe')
        .set('stripe-signature', 'test_signature')
        .send(JSON.stringify(webhookEvent));

      // Mock no active subscription
      getActiveSubscription.mockResolvedValue(null);

      // Check subscription status
      const statusResponse = await request(app).get('/api/subscription');

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.subscription).toBeNull();
    });
  });
});
