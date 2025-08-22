const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Client, resources } = require('coinbase-commerce-node');
const { ethers } = require('ethers');
require('dotenv').config();

const {
  insertUser,
  insertSubscription,
  updateSubscription,
  getUserById,
  getUserByEmail
} = require('../database');

class PaymentService {
  constructor() {
    this.stripe = stripe;
    this.coinbaseClient = new Client({ apiKey: process.env.COINBASE_COMMERCE_API_KEY });
    this.ethProvider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id');
    this.ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, this.ethProvider);
    
    this.subscriptionPlans = {
      pro: {
        id: 'pro_monthly',
        name: 'Pro Plan',
        price: 29,
        priceId: 'price_pro_monthly', // Stripe Price ID
        cryptoPrice: 0.001, // ETH
        features: ['all_data', 'ai_analysis', 'alerts', 'api_access']
      },
      premium: {
        id: 'premium_monthly',
        name: 'Premium Plan',
        price: 99,
        priceId: 'price_premium_monthly',
        cryptoPrice: 0.003, // ETH
        features: ['all_features', 'custom_models', 'priority_support', 'white_label']
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

  // ===== COINBASE COMMERCE (CRYPTO) =====

  async createCoinbaseCharge(userId, planId) {
    try {
      const plan = this.subscriptionPlans[planId];
      if (!plan) {
        throw new Error('Invalid plan');
      }

      const charge = await this.coinbaseClient.charges.create({
        name: plan.name,
        description: `Monthly subscription for ${plan.name}`,
        local_price: {
          amount: plan.price.toString(),
          currency: 'USD'
        },
        pricing_type: 'fixed_price',
        metadata: {
          user_id: userId,
          plan_id: planId
        }
      });

      return {
        chargeId: charge.id,
        hostedUrl: charge.hosted_url,
        expiresAt: charge.expires_at
      };
    } catch (error) {
      console.error('Coinbase charge creation error:', error);
      throw error;
    }
  }

  async handleCoinbaseWebhook(event) {
    try {
      if (event.type === 'charge:confirmed') {
        const charge = event.data;
        const userId = charge.metadata.user_id;
        const planId = charge.metadata.plan_id;
        
        await this.activateSubscription(userId, planId, 'coinbase', charge.id);
      }
    } catch (error) {
      console.error('Coinbase webhook error:', error);
      throw error;
    }
  }

  // ===== DIRECT ETH PAYMENTS =====

  async createEthPayment(userId, planId) {
    try {
      const plan = this.subscriptionPlans[planId];
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // Create a unique payment ID
      const paymentId = `eth_${Date.now()}_${userId}`;
      
      // Get current gas price
      const gasPrice = await this.ethProvider.getFeeData();
      
      // Create payment transaction
      const tx = {
        to: process.env.ETH_WALLET_ADDRESS,
        value: ethers.parseEther(plan.cryptoPrice.toString()),
        gasLimit: 21000,
        gasPrice: gasPrice.gasPrice
      };

      return {
        paymentId,
        toAddress: process.env.ETH_WALLET_ADDRESS,
        amount: plan.cryptoPrice,
        gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei'),
        estimatedGas: '21000'
      };
    } catch (error) {
      console.error('ETH payment creation error:', error);
      throw error;
    }
  }

  async verifyEthPayment(paymentId, txHash) {
    try {
      const tx = await this.ethProvider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      // Verify transaction details
      const expectedAmount = this.getExpectedAmount(paymentId);
      const receivedAmount = ethers.formatEther(tx.value);
      
      if (Math.abs(parseFloat(receivedAmount) - expectedAmount) > 0.0001) {
        throw new Error('Amount mismatch');
      }

      if (tx.to.toLowerCase() !== process.env.ETH_WALLET_ADDRESS.toLowerCase()) {
        throw new Error('Wrong recipient address');
      }

      // Get payment details from database
      const payment = await getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Activate subscription
      await this.activateSubscription(payment.user_id, payment.plan_id, 'ethereum', txHash);
      
      return { success: true, txHash };
    } catch (error) {
      console.error('ETH payment verification error:', error);
      throw error;
    }
  }

  // ===== SUBSCRIPTION MANAGEMENT =====

  async activateSubscription(userId, planId, paymentMethod, paymentId) {
    try {
      const plan = this.subscriptionPlans[planId];
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

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

  getExpectedAmount(paymentId) {
    // Extract plan from payment ID and return expected amount
    const parts = paymentId.split('_');
    const planId = parts[2]; // Assuming format: eth_timestamp_planId
    const plan = this.subscriptionPlans[planId];
    return plan ? plan.cryptoPrice : 0;
  }

  async getPaymentMethods() {
    return {
      stripe: {
        name: 'Credit Card',
        icon: '💳',
        description: 'Pay with Visa, Mastercard, or other cards'
      },
      coinbase: {
        name: 'Crypto (Coinbase)',
        icon: '₿',
        description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies'
      },
      ethereum: {
        name: 'Direct ETH',
        icon: 'Ξ',
        description: 'Send Ethereum directly to our wallet'
      }
    };
  }

  async getPlanPricing() {
    return Object.entries(this.subscriptionPlans).map(([id, plan]) => ({
      id,
      name: plan.name,
      price: plan.price,
      cryptoPrice: plan.cryptoPrice,
      features: plan.features
    }));
  }
}

module.exports = PaymentService;