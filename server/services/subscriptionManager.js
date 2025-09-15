const { getActiveSubscription, updateSubscription, insertSubscription, getUserById } = require('../database');
const walletPaymentService = require('./walletPaymentService');

class SubscriptionManager {
  constructor() {
    this.discountOffer = parseFloat(process.env.DISCOUNT_OFFER) || 0;
    
    this.subscriptionPlans = {
      free: {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        features: ['basic_alerts', 'limited_api']
      },
      pro: {
        id: 'pro',
        name: 'Pro Plan',
        price: 29.99,
        features: ['advanced_alerts', 'unlimited_api', 'data_export', 'ai_analysis']
      },
      premium: {
        id: 'premium',
        name: 'Premium Plan',
        price: 99.99,
        features: ['all_features', 'priority_support', 'custom_integrations']
      }
    };
  }

  // Check if subscription is expired and handle expiration
  async checkAndHandleExpiration(userId) {
    try {
      const subscription = await getActiveSubscription(userId);
      
      if (!subscription) {
        console.log(`No active subscription found for user ${userId}`);
        return { status: 'free', needsRenewal: false };
      }
      
      console.log(`Checking subscription ${subscription.id} for user ${userId}:`, {
        plan_type: subscription.plan_type,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      });

      const now = new Date();
      
      // Check if current_period_end is valid
      if (!subscription.current_period_end) {
        console.log(`Subscription ${subscription.id} has no current_period_end - treating as expired`);
        await updateSubscription(subscription.id, {
          status: 'expired'
        });
        
        return {
          status: 'expired',
          needsRenewal: true,
          expiredAt: new Date(), // Use current date as fallback
          planType: subscription.plan_type
        };
      }
      
      const endDate = new Date(subscription.current_period_end);
      
      // Check if subscription is expired
      if (now > endDate) {
        // Mark subscription as expired
        await updateSubscription(subscription.id, {
          status: 'expired'
        });

        console.log(`✅ Subscription expired for user ${userId}`);
        
        return {
          status: 'expired',
          needsRenewal: true,
          expiredAt: endDate,
          planType: subscription.plan_type
        };
      }

      // Check if subscription expires soon (within 7 days)
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      const needsRenewal = daysUntilExpiry <= 7;

      return {
        status: 'active',
        needsRenewal,
        expiresAt: endDate,
        daysUntilExpiry,
        planType: subscription.plan_type
      };
    } catch (error) {
      console.error('Error checking subscription expiration:', error);
      return { status: 'error', needsRenewal: false };
    }
  }

  // Get subscription status with expiration check
  async getSubscriptionStatus(userId) {
    try {
      console.log(`🔍 Getting subscription status for user ${userId}`);
      
      // Check if user is admin first
      const { isUserAdmin, getUserById } = require('../database');
      const isAdmin = await isUserAdmin(userId);
      
      if (isAdmin) {
        console.log(`👑 User ${userId} is admin - granting full access`);
        return {
          plan: 'admin',
          status: 'active',
          planName: 'Admin',
          features: ['all_features', 'admin_access'],
          currentPeriodEnd: null,
          isAdmin: true,
          needsRenewal: false
        };
      }

      // Get user data to check subscription (simplified approach)
      const user = await getUserById(userId);
      if (!user) {
        console.log(`❌ User ${userId} not found`);
        return this.getFreePlanStatus();
      }
      
      // Check if user has an active subscription
      if (user.subscription_plan && user.subscription_plan !== 'free') {
        // Check if subscription has expired
        const now = new Date();
        const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
        
        if (expiresAt && expiresAt < now) {
          console.log(`⏰ Subscription expired for user ${userId} (expired: ${expiresAt})`);
          // Subscription expired - reset to free
          const { updateUser } = require('../database');
          await updateUser(userId, {
            subscription_plan: 'free',
            subscription_expires_at: null
          });
          return this.getFreePlanStatus();
        }
        
        // Active subscription
        const plan = this.subscriptionPlans[user.subscription_plan];
        if (plan) {
          console.log(`✅ Found active subscription for user ${userId}:`, {
            plan: user.subscription_plan,
            expires: expiresAt
          });
          
          return {
            plan: user.subscription_plan,
            status: 'active',
            planName: plan.name,
            features: plan.features,
            currentPeriodEnd: expiresAt,
            needsRenewal: false
          };
        }
      }
      
      // No active subscription - return free plan
      console.log(`📋 User ${userId} has no active subscription - using free plan`);
      return this.getFreePlanStatus();
    } catch (error) {
      console.error(`❌ Error getting subscription status for user ${userId}:`, error);
      return this.getFreePlanStatus();
    }
  }

  // Create renewal subscription
  async createRenewalSubscription(userId, planId, months = 1, network = 'base') {
    try {
      const user = await getUserById(userId);
      if (!user) throw new Error('User not found');

      // Create wallet payment for renewal
      const paymentDetails = await walletPaymentService.createWalletSubscription(userId, planId, months, network);
      
      return {
        ...paymentDetails,
        isRenewal: true,
        message: 'Renewal payment created successfully'
      };
    } catch (error) {
      console.error('Error creating renewal subscription:', error);
      throw error;
    }
  }

  // Get users who need renewal reminders
  async getUsersNeedingReminders() {
    try {
      // This would query the database for users whose subscriptions expire soon
      // For now, return empty array - this would be implemented with actual database queries
      return [];
    } catch (error) {
      console.error('Error getting users needing reminders:', error);
      return [];
    }
  }

  // Send renewal reminders
  async sendRenewalReminders() {
    try {
      const usersNeedingReminders = await this.getUsersNeedingReminders();
      
      for (const user of usersNeedingReminders) {
        // Send email reminder
        // Send push notification
        // Send Telegram message
        console.log(`📧 Sending renewal reminder to user ${user.id}`);
      }
      
      return usersNeedingReminders.length;
    } catch (error) {
      console.error('Error sending renewal reminders:', error);
      return 0;
    }
  }

  // Check if user should see payment page
  shouldShowPaymentPage(subscriptionStatus) {
    return (
      subscriptionStatus.plan === 'free' && 
      (subscriptionStatus.needsRenewal || subscriptionStatus.expiredAt)
    );
  }

  // Get renewal options for a user
  async getRenewalOptions(userId) {
    try {
      const subscriptionStatus = await this.getSubscriptionStatus(userId);
      
      if (!subscriptionStatus.needsRenewal && !subscriptionStatus.expiredAt) {
        return null; // No renewal needed
      }

      const expiredPlan = subscriptionStatus.expiredPlan || 'pro'; // Default to pro if no expired plan
      const plan = this.subscriptionPlans[expiredPlan];
      
      // Calculate discount percentage from DISCOUNT_OFFER amount
      const discountPercentage = this.discountOffer / plan.price;
      const discount = Math.min(discountPercentage, 1); // Cap at 100%
      
      return {
        expiredPlan,
        planName: plan.name,
        monthlyPrice: plan.price,
        discountOffer: this.discountOffer,
        discountPercentage: discount,
        renewalOptions: [
          { months: 1, discount: 0, price: plan.price },
          { months: 3, discount: discount, price: Math.max(plan.price - this.discountOffer, 0) + plan.price * 2 },
          { months: 6, discount: discount, price: Math.max(plan.price - this.discountOffer, 0) + plan.price * 5 },
          { months: 12, discount: discount, price: Math.max(plan.price - this.discountOffer, 0) + plan.price * 11 }
        ]
      };
    } catch (error) {
      console.error('Error getting renewal options:', error);
      return null;
    }
  }
}

module.exports = new SubscriptionManager();
