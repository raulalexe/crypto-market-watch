// Stripe key selection based on NODE_ENV
// Production: STRIPE_SECRET_KEY (live keys)
// Development: STRIPE_TEST_SECRET_KEY (test keys)
const stripeKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY 
  : process.env.STRIPE_TEST_SECRET_KEY;
const stripe = require('stripe')(stripeKey);
// NOWPayments API client using axios
const axios = require('axios');

require('dotenv').config({ path: '.env.local' });

const {
  insertUser,
  insertSubscription,
  updateSubscription,
  updateUser,
  getUserById,
  getUserByEmail,
  getActiveSubscription
} = require('../database');

class PaymentService {
  constructor() {
    this.stripe = stripe;
    this.nowPaymentsApiKey = process.env.NOWPAYMENTS_API_KEY;
    this.nowPaymentsBaseUrl = 'https://api.nowpayments.io/v1';
    // Remove ETH provider and wallet initialization
    
    this.subscriptionPlans = {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        priceId: null,
        cryptoPrice: 0,
        features: ['basic_dashboard', 'limited_data', 'community_support'],
        duration: null,
        isAdmin: false
      },
      admin: {
        id: 'admin',
        name: 'Admin',
        price: 0,
        priceId: null, // Admin plans cannot be purchased
        cryptoPrice: 0,
        features: ['all_features', 'admin_access', 'error_logs', 'unlimited_api', 'data_export', 'custom_integrations'],
        duration: null, // Admin plans don't expire
        isAdmin: true
      },
      pro: {
        id: 'pro',
        name: 'Pro Plan',
        price: 29.99,
        priceId: null, // Will be created dynamically
        cryptoPrice: 0.001, // ETH
        features: [
          'all_data', 
          'ai_analysis', 
          'market_alerts', 
          'email_notifications',
          'push_notifications', 
          'telegram_notifications',
          'advanced_metrics',
          'exchange_flows',
          'stablecoin_metrics',
          'api_access', 
          'data_export',
          'upcoming_events',
          'community_support'
        ],
        duration: 30 // days
      },
      premium: {
        id: 'premium',
        name: 'Premium Plan',
        price: 99,
        priceId: null, // Will be created dynamically
        cryptoPrice: 0.003, // ETH
        features: [
          'all_pro_features',
          'unlimited_api_calls',
          'white_label_options',
          'dedicated_support',
          'priority_notifications',
          'custom_alert_thresholds',
          'advanced_data_exports',
          'webhook_integrations',
          'error_logs'
        ],
        duration: 30 // days
      }
    };
  }

  // ===== STRIPE PAYMENTS =====

  async createDiscountCoupon(discountAmount, originalAmount) {
    try {
      // Create a one-time discount coupon for the first month
      const coupon = await this.stripe.coupons.create({
        amount_off: Math.round(discountAmount),
        currency: 'usd',
        duration: 'once', // Only applies to the first billing cycle
        name: 'First Month Discount',
        metadata: {
          type: 'first_month_discount'
        }
      });
      return coupon.id;
    } catch (error) {
      console.error('Error creating discount coupon:', error);
      throw error;
    }
  }

  async createStripeSubscription(userId, planId) {
    try {
      const plan = this.subscriptionPlans[planId];
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // Get user
      const user = await getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create or get Stripe customer
      let customer;
      if (user.stripe_customer_id) {
        customer = await this.stripe.customers.retrieve(user.stripe_customer_id);
      } else {
        customer = await this.stripe.customers.create({
          email: user.email,
        });
        
        // Update user with Stripe customer ID
        await updateUser(userId, { stripe_customer_id: customer.id });
      }

      // Create or get price for the plan
      let price;
      if (plan.priceId) {
        // Use existing price ID
        price = plan.priceId;
      } else {
        // Create price dynamically
        const priceData = await this.stripe.prices.create({
          unit_amount: plan.price * 100, // Convert to cents
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          product_data: {
            name: plan.name,
          },
        });
        price = priceData.id;
      }

      // Check if there's a discount offer for first month
      const discountOffer = process.env.DISCOUNT_OFFER;
      const hasDiscount = !!discountOffer && planId === 'pro';
      
      let sessionConfig = {
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: price,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/subscription?success=true`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/app/subscription?canceled=true`,
        metadata: {
          userId: userId.toString(),
          planId: planId,
        },
      };

      // Add discount for first month if available
      if (hasDiscount) {
        const discountAmount = (plan.price - parseFloat(discountOffer)) * 100; // Convert to cents
        sessionConfig.discounts = [{
          coupon: await this.createDiscountCoupon(discountAmount, plan.price * 100)
        }];
      }

      // Create Stripe Checkout session
      const session = await this.stripe.checkout.sessions.create(sessionConfig);

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      throw error;
    }
  }

  async handleStripeWebhook(event) {
    try {
      console.log(`Processing Stripe webhook: ${event.type}`);
      
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'invoice.payment_action_required':
          await this.handlePaymentActionRequired(event.data.object);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Stripe webhook error:', error);
      // Don't throw the error to prevent 400 responses
      // Just log it and continue
    }
  }

  async handleCheckoutSessionCompleted(session) {
    console.log(`Checkout session completed: ${session.id}`);

    
    try {
      // Check if metadata exists
      if (!session.metadata || !session.metadata.userId || !session.metadata.planId) {
        console.log('Session missing required metadata (userId or planId) - this might be a test event');
        return;
      }
      
      const userId = parseInt(session.metadata.userId);
      const planId = session.metadata.planId;
      
      // Check if session has a subscription
      if (!session.subscription) {
        console.log('Session does not have a subscription - this might be a test event');
        return;
      }
      
      // Get the subscription from the session
      const subscription = await this.stripe.subscriptions.retrieve(session.subscription);
      
      // Save subscription to database
      await insertSubscription({
        user_id: userId,
        plan_type: planId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      });
      
      console.log(`Subscription ${subscription.id} saved to database for user ${userId}`);
    } catch (error) {
      console.error('Error handling checkout session completed:', error);
    }
  }

  async handlePaymentSucceeded(invoice) {
    console.log(`Payment succeeded for invoice: ${invoice.id}`);

    
    // Check if this invoice is associated with a subscription
    if (!invoice.subscription) {
      console.log(`Invoice ${invoice.id} is not associated with a subscription - this is normal for one-time payments`);
      return;
    }

    console.log(`Invoice subscription ID: ${invoice.subscription}`);

    // Validate subscription ID format
    if (typeof invoice.subscription !== 'string' || !invoice.subscription.startsWith('sub_')) {
      console.log(`Invalid subscription ID format: ${invoice.subscription}`);
      return;
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
      console.log(`Retrieved subscription: ${subscription.id}`);
      
      await updateSubscription(subscription.id, {
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      });
      
      console.log(`Updated subscription ${subscription.id} status to ${subscription.status}`);
    } catch (error) {
      console.error(`Error handling payment succeeded for subscription ${invoice.subscription}:`, error);
      // Don't throw the error, just log it
    }
  }

  async handlePaymentFailed(invoice) {
    console.log(`Payment failed for invoice: ${invoice.id}`);
    
    if (!invoice.subscription) {
      console.log(`Invoice ${invoice.id} is not associated with a subscription`);
      return;
    }

    try {
      await updateSubscription(invoice.subscription, { status: 'past_due' });
      console.log(`Updated subscription ${invoice.subscription} status to past_due`);
    } catch (error) {
      console.error(`Error handling payment failed for subscription ${invoice.subscription}:`, error);
    }
  }

  async handleSubscriptionCancelled(subscription) {
    console.log(`Subscription cancelled: ${subscription.id}`);
    await updateSubscription(subscription.id, { status: 'cancelled' });
  }

  async handleSubscriptionUpdated(subscription) {
    console.log(`Subscription updated: ${subscription.id}`);
    await updateSubscription(subscription.id, {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000)
    });
  }

  async handleSubscriptionCreated(subscription) {
    console.log(`Subscription created: ${subscription.id}`);
    await updateSubscription(subscription.id, {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000)
    });
  }

  async handlePaymentActionRequired(invoice) {
    console.log(`Payment action required for invoice: ${invoice.id}`);
    
    if (!invoice.subscription) {
      console.log(`Invoice ${invoice.id} is not associated with a subscription`);
      return;
    }

    try {
      await updateSubscription(invoice.subscription, { status: 'incomplete' });
      console.log(`Updated subscription ${invoice.subscription} status to incomplete`);
    } catch (error) {
      console.error(`Error handling payment action required for subscription ${invoice.subscription}:`, error);
    }
  }

  // ===== NOWPAYMENTS (CRYPTO) =====

  async createNowPaymentsCharge(userId, planId, isSubscription = false) {
    try {
      const plan = this.subscriptionPlans[planId];
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // Create payment request
      const paymentData = {
        price_amount: plan.price,
        price_currency: 'usd',
        pay_currency: 'btc', // Default, user can change
        order_id: `sub_${Date.now()}_${userId}_${planId}`,
        order_description: `${plan.name} ${isSubscription ? 'Subscription' : 'Payment'}`,
        ipn_callback_url: `${process.env.BASE_URL}/api/webhooks/nowpayments`,
        case: isSubscription ? 'subscription' : 'payment',
        is_subscription: isSubscription,
        subscription_period: plan.duration, // days
        metadata: {
          user_id: userId,
          plan_type: planId,
          is_subscription: isSubscription
        }
      };

      const response = await axios.post(`${this.nowPaymentsBaseUrl}/payment`, paymentData, {
        headers: {
          'x-api-key': this.nowPaymentsApiKey,
          'Content-Type': 'application/json'
        }
      });
      const payment = response.data;

      return {
        paymentId: payment.payment_id,
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency,
        hostedUrl: payment.invoice_url,
        expiresAt: payment.expires_at,
        isSubscription: isSubscription
      };
    } catch (error) {
      console.error('NOWPayments charge creation error:', error);
      throw error;
    }
  }

  async createNowPaymentsSubscription(userId, planId) {
    try {
      const plan = this.subscriptionPlans[planId];
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // Create subscription
      const subscriptionData = {
        price_amount: plan.price,
        price_currency: 'usd',
        pay_currency: 'btc', // Default, user can change
        order_id: `sub_${Date.now()}_${userId}_${planId}`,
        order_description: `${plan.name} Subscription`,
        ipn_callback_url: `${process.env.BASE_URL}/api/webhooks/nowpayments`,
        case: 'subscription',
        is_subscription: true,
        subscription_period: plan.duration, // days
        metadata: {
          user_id: userId,
          plan_type: planId,
          subscription_type: 'recurring'
        }
      };

      const response = await axios.post(`${this.nowPaymentsBaseUrl}/payment`, subscriptionData, {
        headers: {
          'x-api-key': this.nowPaymentsApiKey,
          'Content-Type': 'application/json'
        }
      });
      const subscription = response.data;

      return {
        subscriptionId: subscription.payment_id,
        payAddress: subscription.pay_address,
        payAmount: subscription.pay_amount,
        payCurrency: subscription.pay_currency,
        hostedUrl: subscription.invoice_url,
        expiresAt: subscription.expires_at,
        isSubscription: true
      };
    } catch (error) {
      console.error('NOWPayments subscription creation error:', error);
      throw error;
    }
  }

  async handleNowPaymentsWebhook(event) {
    try {
      console.log('NOWPayments webhook received:', event);

      // Handle payment confirmation
      if (event.payment_status === 'confirmed' || event.payment_status === 'finished') {
        const paymentId = event.payment_id;
        const metadata = event.metadata || {};
        const userId = metadata.user_id;
        const planId = metadata.plan_type;
        const isSubscription = metadata.is_subscription || metadata.subscription_type === 'recurring';

        if (userId && planId) {
          if (isSubscription) {
            await this.activateSubscription(userId, planId, 'nowpayments_subscription', paymentId);
          } else {
            await this.activateSubscription(userId, planId, 'nowpayments', paymentId);
          }
        }
      }

      // Handle subscription renewal
      if (event.payment_status === 'renewal_confirmed') {
        const paymentId = event.payment_id;
        const metadata = event.metadata || {};
        const userId = metadata.user_id;
        const planId = metadata.plan_id;

        if (userId && planId) {
          await this.renewSubscription(userId, planId, paymentId);
        }
      }
    } catch (error) {
      console.error('NOWPayments webhook error:', error);
      throw error;
    }
  }



  // ===== SUBSCRIPTION MANAGEMENT =====

  async activateSubscription(userId, planId, paymentMethod, paymentId) {
    try {
      const plan = this.subscriptionPlans[planId];
      const now = new Date();
      const endDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);

      await insertSubscription({
        user_id: userId,
        plan_type: planId,
        status: 'active',
        current_period_start: now,
        current_period_end: endDate,
        payment_method: paymentMethod,
        payment_id: paymentId
      });

      console.log(`Subscription activated for user ${userId}, plan ${planId}`);
    } catch (error) {
      console.error('Subscription activation error:', error);
      throw error;
    }
  }

  async renewSubscription(userId, planId, paymentId) {
    try {
      const plan = this.subscriptionPlans[planId];
      const now = new Date();
      const endDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);

      // Update existing subscription
      await updateSubscription(userId, {
        current_period_start: now,
        current_period_end: endDate,
        payment_method: 'nowpayments_subscription',
        payment_id: paymentId,
        updated_at: now
      });

      console.log(`Subscription renewed for user ${userId}, plan ${planId}`);
    } catch (error) {
      console.error('Subscription renewal error:', error);
      throw error;
    }
  }

  async cancelSubscription(userId) {
    try {
      const subscription = await getActiveSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      if (subscription.stripe_subscription_id) {
        // Cancel Stripe subscription
        await this.stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      }

      // Update database
      await updateSubscription(subscription.id, { 
        status: 'cancelled',
        cancelled_at: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      throw error;
    }
  }

  async getSubscriptionStatus(userId) {
    try {
      // Check if user is admin first
      const { isUserAdmin } = require('../database');
      const isAdmin = await isUserAdmin(userId);
      
      if (isAdmin) {
        const adminPlan = this.subscriptionPlans.admin;
        return {
          plan: 'admin',
          status: 'active',
          planName: adminPlan.name,
          features: adminPlan.features,
          currentPeriodEnd: null,
          isAdmin: true,
          role: 'admin'
        };
      }

      const subscription = await getActiveSubscription(userId);
      if (!subscription) {
        const freePlan = this.subscriptionPlans.free;
        return { 
          plan: 'free', 
          status: 'inactive',
          planName: freePlan.name,
          features: freePlan.features
        };
      }

      const plan = this.subscriptionPlans[subscription.plan_type];
      return {
        plan: subscription.plan_type,
        status: subscription.status,
        planName: plan.name,
        features: plan.features,
        currentPeriodEnd: subscription.current_period_end
      };
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  async getPaymentMethods() {
    return {
      stripe: {
        name: 'Credit Card',
        icon: '💳',
        description: 'Pay with Visa, Mastercard, or other cards'
      },
      nowpayments: {
        name: 'Crypto',
        icon: '₿',
        description: 'Pay with 200+ cryptocurrencies worldwide'
      }
      // Remove ethereum payment method
    };
  }

  async getPlanPricing() {
    return Object.entries(this.subscriptionPlans)
      .filter(([id, plan]) => !plan.isAdmin) // Exclude admin plans from public listing
      .map(([id, plan]) => ({
        id,
        name: plan.name,
        price: plan.price,
        cryptoPrice: plan.cryptoPrice,
        features: plan.features
      }));
  }
}

module.exports = PaymentService;