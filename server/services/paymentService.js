const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// NOWPayments API client using axios
const axios = require('axios');

require('dotenv').config();

const {
  insertUser,
  insertSubscription,
  updateSubscription,
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
        id: 'pro_monthly',
        name: 'Pro Plan',
        price: 29,
        priceId: 'price_pro_monthly', // Stripe Price ID
        cryptoPrice: 0.001, // ETH
        features: ['all_data', 'ai_analysis', 'alerts', 'api_access', 'data_export'],
        duration: 30 // days
      },
      premium: {
        id: 'premium_monthly',
        name: 'Premium Plan',
        price: 99,
        priceId: 'price_premium_monthly',
        cryptoPrice: 0.003, // ETH
        features: ['all_features', 'custom_models', 'priority_support', 'white_label', 'error_logs'],
        duration: 30 // days
      },
      api: {
        id: 'api_monthly',
        name: 'API Plan',
        price: 299,
        priceId: 'price_api_monthly',
        cryptoPrice: 0.01, // ETH
        features: ['all_premium_features', 'high_volume_api', 'webhooks', 'dedicated_support', 'sla'],
        duration: 30 // days
      }
    };
  }

  // ===== STRIPE PAYMENTS =====

  async createStripeSubscription(userId, planId, paymentMethodId) {
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
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        
        // Update user with Stripe customer ID
        await updateUser(userId, { stripe_customer_id: customer.id });
      }

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Save subscription to database
      await insertSubscription({
        user_id: userId,
        plan_type: planId,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      });

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      };
    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      throw error;
    }
  }

  async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;
      }
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw error;
    }
  }

  async handlePaymentSucceeded(invoice) {
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
    await updateSubscription(subscription.id, {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000)
    });
  }

  async handlePaymentFailed(invoice) {
    await updateSubscription(invoice.subscription, { status: 'past_due' });
  }

  async handleSubscriptionCancelled(subscription) {
    await updateSubscription(subscription.id, { status: 'cancelled' });
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
          plan_id: planId,
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
          plan_id: planId,
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
        const planId = metadata.plan_id;
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
        return { plan: 'free', status: 'inactive' };
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