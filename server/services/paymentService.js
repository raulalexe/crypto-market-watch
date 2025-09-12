// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// Stripe key selection based on NODE_ENV
// Production: STRIPE_SECRET_KEY (live keys)
// Development: STRIPE_TEST_SECRET_KEY (test keys)
const stripeKey = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_SECRET_KEY 
  : process.env.STRIPE_TEST_SECRET_KEY;
const stripe = require('stripe')(stripeKey);
const axios = require('axios');

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
      console.log(`🚀 Creating Stripe subscription for user ${userId}, plan ${planId}`);
      
      const plan = this.subscriptionPlans[planId];
      if (!plan) {
        throw new Error('Invalid plan');
      }
      console.log(`📋 Plan details: ${plan.name} - $${plan.price}`);

      // Get user
      const user = await getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      console.log(`👤 User: ${user.email}, existing customer ID: ${user.stripe_customer_id || 'None'}`);

      // Create or get Stripe customer
      let customer;
      if (user.stripe_customer_id) {
        try {
          customer = await this.stripe.customers.retrieve(user.stripe_customer_id);
          console.log(`✅ Retrieved existing customer: ${customer.id}`);
        } catch (error) {
          console.log(`❌ Error retrieving customer ${user.stripe_customer_id}:`, error.message);
          
          // If customer doesn't exist in Stripe or has corrupted data, create a new one
          if (error.code === 'resource_missing' || error.message.includes('Invalid time value') || error.message.includes('Invalid')) {
            console.log(`Customer ${user.stripe_customer_id} not found or corrupted in Stripe, creating new customer`);
            customer = await this.stripe.customers.create({
              email: user.email,
            });
            
            // Update user with new Stripe customer ID
            await updateUser(userId, { stripe_customer_id: customer.id });
            console.log(`✅ Created new customer: ${customer.id}`);
          } else {
            throw error;
          }
        }
      } else {
        customer = await this.stripe.customers.create({
          email: user.email,
        });
        
        // Update user with Stripe customer ID
        await updateUser(userId, { stripe_customer_id: customer.id });
        console.log(`✅ Created new customer: ${customer.id}`);
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
      console.log(`💳 Creating Stripe checkout session with customer: ${customer.id}`);
      const session = await this.stripe.checkout.sessions.create(sessionConfig);
      console.log(`✅ Checkout session created: ${session.id}`);

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error('❌ Stripe subscription creation error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        statusCode: error.statusCode
      });
      throw error;
    }
  }

  async handleStripeWebhook(event) {
    try {
      console.log(`🔄 Processing Stripe webhook: ${event.type} (ID: ${event.id})`);
      console.log(`📊 Webhook event data:`, {
        type: event.type,
        id: event.id,
        created: event.created,
        livemode: event.livemode
      });
      
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
        case 'invoice_payment.paid':
          await this.handleInvoicePaymentPaid(event.data.object);
          break;
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`❌ Stripe webhook error: ${event.type} (ID: ${event.id})`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        stack: error.stack,
        eventType: event.type,
        eventId: event.id
      });
      // Don't throw the error to prevent 400 responses
      // Just log it and continue
    }
  }

  async handleCheckoutSessionCompleted(session) {
    console.log(`💳 Checkout session completed: ${session.id}`);
    console.log(`📋 Session details:`, {
      id: session.id,
      customer_email: session.customer_email,
      payment_status: session.payment_status,
      metadata: session.metadata,
      subscription: session.subscription
    });
    
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

      // Send upgrade email if this is a paid plan (not free or admin)
      if (planId !== 'free' && planId !== 'admin') {
        try {
          const user = await getUserById(userId);
          if (user && user.email) {
            const EmailService = require('./emailService');
            const emailService = new EmailService();
            
            const plan = this.subscriptionPlans[planId];
            const subscriptionDetails = {
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              payment_method: 'stripe',
              payment_id: subscription.id
            };

            const emailSent = await emailService.sendUpgradeEmail(
              user.email, 
              user.email.split('@')[0], 
              plan.name, 
              subscriptionDetails
            );

            if (emailSent) {
              console.log(`📧 Upgrade email sent to ${user.email} for ${plan.name} subscription`);
            } else {
              console.log(`⚠️ Failed to send upgrade email to ${user.email}`);
            }
          }
        } catch (emailError) {
          console.error('Error sending upgrade email:', emailError);
          // Don't throw the error - subscription activation should still succeed
        }
      }
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

      // Send upgrade email if this is a paid plan (not free or admin)
      if (planId !== 'free' && planId !== 'admin') {
        try {
          const user = await getUserById(userId);
          if (user && user.email) {
            const EmailService = require('./emailService');
            const emailService = new EmailService();
            
            const subscriptionDetails = {
              current_period_start: now,
              current_period_end: endDate,
              payment_method: paymentMethod,
              payment_id: paymentId
            };

            const emailSent = await emailService.sendUpgradeEmail(
              user.email, 
              user.email.split('@')[0], 
              plan.name, 
              subscriptionDetails
            );

            if (emailSent) {
              console.log(`📧 Upgrade email sent to ${user.email} for ${plan.name} subscription`);
            } else {
              console.log(`⚠️ Failed to send upgrade email to ${user.email}`);
            }
          }
        } catch (emailError) {
          console.error('Error sending upgrade email:', emailError);
          // Don't throw the error - subscription activation should still succeed
        }
      }
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

  async handleInvoicePaymentPaid(invoicePayment) {
    console.log(`💳 Invoice payment paid: ${invoicePayment.id}`);
    console.log(`📋 Invoice payment details:`, {
      id: invoicePayment.id,
      invoice: invoicePayment.invoice,
      amount_paid: invoicePayment.amount_paid,
      currency: invoicePayment.currency,
      status: invoicePayment.status
    });

    try {
      // Get the invoice to find the subscription
      const invoice = await this.stripe.invoices.retrieve(invoicePayment.invoice);
      console.log(`📄 Invoice details:`, {
        id: invoice.id,
        subscription: invoice.subscription,
        customer: invoice.customer,
        status: invoice.status,
        amount_paid: invoice.amount_paid
      });

      if (invoice.subscription) {
        // Get the subscription to find the customer
        const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
        console.log(`📋 Subscription details:`, {
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end
        });

        // Get the customer to find the user
        const customer = await this.stripe.customers.retrieve(subscription.customer);
        console.log(`👤 Customer details:`, {
          id: customer.id,
          email: customer.email,
          metadata: customer.metadata
        });

        if (customer.email) {
          // Find user by email
          const user = await getUserByEmail(customer.email);
          if (user) {
            console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
            
            // Check if subscription already exists in our database
            const existingSub = await getActiveSubscription(user.id);
            if (!existingSub) {
              console.log(`🔄 Creating subscription for user ${user.email}...`);
              
              // Create subscription in our database
              const subscriptionData = {
                user_id: user.id,
                plan_type: 'pro', // Default to pro for now
                stripe_customer_id: customer.id,
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000),
                current_period_end: new Date(subscription.current_period_end * 1000)
              };
              
              const subscriptionId = await insertSubscription(subscriptionData);
              console.log(`✅ Subscription created in database: ${subscriptionId}`);
              
              // Send upgrade email
              try {
                const subscriptionDetails = {
                  current_period_start: subscriptionData.current_period_start,
                  current_period_end: subscriptionData.current_period_end,
                  payment_method: 'stripe',
                  payment_id: subscription.id,
                  plan_name: 'Pro Plan'
                };
                
                const emailSent = await emailService.sendUpgradeEmail(user.email, subscriptionDetails);
                console.log(`📧 Upgrade email sent: ${emailSent}`);
              } catch (emailError) {
                console.error('❌ Error sending upgrade email:', emailError);
              }
            } else {
              console.log(`ℹ️ User ${user.email} already has an active subscription`);
            }
          } else {
            console.log(`❌ User not found for email: ${customer.email}`);
          }
        } else {
          console.log(`❌ No email found for customer: ${customer.id}`);
        }
      } else {
        console.log(`❌ No subscription found in invoice: ${invoice.id}`);
      }
    } catch (error) {
      console.error(`❌ Error handling invoice payment paid:`, error);
    }
  }
}

module.exports = PaymentService;