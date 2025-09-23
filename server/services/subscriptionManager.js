const { getUserById, updateUser } = require('../database');
const walletPaymentService = require('./walletPaymentService');
const { 
  SUBSCRIPTION_TYPES, 
  SUBSCRIPTION_FEATURES, 
  SUBSCRIPTION_PRICES, 
  SUBSCRIPTION_NAMES,
  isFreePlan,
  isPaidPlan,
  isAdminPlan,
  getPlanFeatures,
  getPlanPrice,
  getPlanName
} = require('../constants/subscriptionTypes');

class SubscriptionManager {
  constructor() {
    this.discountOffer = parseFloat(process.env.DISCOUNT_OFFER) || 0;
    
    this.subscriptionPlans = {
      [SUBSCRIPTION_TYPES.FREE]: {
        id: SUBSCRIPTION_TYPES.FREE,
        name: getPlanName(SUBSCRIPTION_TYPES.FREE),
        price: getPlanPrice(SUBSCRIPTION_TYPES.FREE),
        features: getPlanFeatures(SUBSCRIPTION_TYPES.FREE)
      },
      [SUBSCRIPTION_TYPES.PRO]: {
        id: SUBSCRIPTION_TYPES.PRO,
        name: getPlanName(SUBSCRIPTION_TYPES.PRO),
        price: getPlanPrice(SUBSCRIPTION_TYPES.PRO),
        features: getPlanFeatures(SUBSCRIPTION_TYPES.PRO)
      },
      [SUBSCRIPTION_TYPES.PREMIUM]: {
        id: SUBSCRIPTION_TYPES.PREMIUM,
        name: getPlanName(SUBSCRIPTION_TYPES.PREMIUM),
        price: getPlanPrice(SUBSCRIPTION_TYPES.PREMIUM),
        features: getPlanFeatures(SUBSCRIPTION_TYPES.PREMIUM)
      }
    };
    
    // Cache for subscription status to reduce database calls
    this.subscriptionCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Check if subscription is expired and handle expiration
  async checkAndHandleExpiration(userId) {
    try {
      const user = await getUserById(userId);
      
      if (!user) {
        console.log(`No user found for user ${userId}`);
        return { status: SUBSCRIPTION_TYPES.FREE, needsRenewal: false };
      }
      
      // Check if user has an active subscription
      if (user.subscription_plan && !isFreePlan(user.subscription_plan)) {
        const now = new Date();
        const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
        
        if (expiresAt && expiresAt < now) {
          console.log(`⏰ Subscription expired for user ${userId} (expired: ${expiresAt})`);
          // Subscription expired - reset to free
          await updateUser(userId, {
            subscription_plan: SUBSCRIPTION_TYPES.FREE,
            subscription_expires_at: null
          });
          
          return {
            status: 'expired',
            needsRenewal: true,
            expiredAt: expiresAt,
            planType: user.subscription_plan
          };
        }
        
        // Check if subscription expires soon (within 7 days)
        if (expiresAt) {
          const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
          const needsRenewal = daysUntilExpiry <= 7;

          return {
            status: 'active',
            needsRenewal,
            daysUntilExpiry,
            currentPeriodEnd: expiresAt,
            planType: user.subscription_plan
          };
        }
      }
      
      return { status: SUBSCRIPTION_TYPES.FREE, needsRenewal: false };
    } catch (error) {
      console.error('Error checking subscription expiration:', error);
      return { status: 'error', needsRenewal: false };
    }
  }

  // Get free plan status
  getFreePlanStatus() {
    return {
      plan: SUBSCRIPTION_TYPES.FREE,
      status: 'inactive',
      planName: getPlanName(SUBSCRIPTION_TYPES.FREE),
      features: getPlanFeatures(SUBSCRIPTION_TYPES.FREE),
      currentPeriodEnd: null,
      needsRenewal: false,
      expiredAt: null,
      expiredPlan: null
    };
  }

  // Get subscription status with expiration check
  async getSubscriptionStatus(userId) {
    try {
      // Check cache first
      const cacheKey = `subscription_${userId}`;
      const cached = this.subscriptionCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }
      
      
      // Check if user is admin first
      const { isUserAdmin, getUserById } = require('../database');
      const isAdmin = await isUserAdmin(userId);
      
      if (isAdmin) {
        console.log(`👑 User ${userId} is admin - granting full access`);
        const adminStatus = {
          plan: SUBSCRIPTION_TYPES.ADMIN,
          status: 'active',
          planName: getPlanName(SUBSCRIPTION_TYPES.ADMIN),
          features: getPlanFeatures(SUBSCRIPTION_TYPES.ADMIN),
          currentPeriodEnd: null,
          isAdmin: true,
          needsRenewal: false
        };
        
        // Cache the result
        this.subscriptionCache.set(cacheKey, {
          data: adminStatus,
          timestamp: Date.now()
        });
        
        return adminStatus;
      }

      // Get user data to check subscription (simplified approach)
      const user = await getUserById(userId);
      if (!user) {
        console.log(`❌ User ${userId} not found`);
        const freeStatus = this.getFreePlanStatus();
        
        // Cache the result
        this.subscriptionCache.set(cacheKey, {
          data: freeStatus,
          timestamp: Date.now()
        });
        
        return freeStatus;
      }
      
      // Check if user has an active subscription
      if (user.subscription_plan && !isFreePlan(user.subscription_plan)) {
        // Check if subscription has expired
        const now = new Date();
        const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
        
        if (expiresAt && expiresAt < now) {
          console.log(`⏰ Subscription expired for user ${userId} (expired: ${expiresAt})`);
          // Subscription expired - reset to free
          const { updateUser } = require('../database');
          await updateUser(userId, {
            subscription_plan: SUBSCRIPTION_TYPES.FREE,
            subscription_expires_at: null
          });
          const freeStatus = this.getFreePlanStatus();
          
          // Cache the result
          this.subscriptionCache.set(cacheKey, {
            data: freeStatus,
            timestamp: Date.now()
          });
          
          return freeStatus;
        }
        
        // Active subscription
        const plan = this.subscriptionPlans[user.subscription_plan];
        if (plan) {
          console.log(`✅ Found active subscription for user ${userId}:`, {
            plan: user.subscription_plan,
            expires: expiresAt
          });
          
          const activeStatus = {
            plan: user.subscription_plan,
            status: 'active',
            planName: getPlanName(user.subscription_plan),
            features: getPlanFeatures(user.subscription_plan),
            currentPeriodEnd: expiresAt,
            needsRenewal: false
          };
          
          // Cache the result
          this.subscriptionCache.set(cacheKey, {
            data: activeStatus,
            timestamp: Date.now()
          });
          
          return activeStatus;
        }
      }
      
      // No active subscription - return free plan
      console.log(`📋 User ${userId} has no active subscription - using free plan`);
      const freeStatus = this.getFreePlanStatus();
      
      // Cache the result
      this.subscriptionCache.set(cacheKey, {
        data: freeStatus,
        timestamp: Date.now()
      });
      
      return freeStatus;
    } catch (error) {
      console.error(`❌ Error getting subscription status for user ${userId}:`, error);
      const freeStatus = this.getFreePlanStatus();
      
      // Cache the result
      this.subscriptionCache.set(cacheKey, {
        data: freeStatus,
        timestamp: Date.now()
      });
      
      return freeStatus;
    }
  }

  // Clear subscription cache for a user (call when subscription changes)
  clearSubscriptionCache(userId) {
    const cacheKey = `subscription_${userId}`;
    this.subscriptionCache.delete(cacheKey);
  }

  // Clear all subscription cache
  clearAllSubscriptionCache() {
    this.subscriptionCache.clear();
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
      
      // DISCOUNT_OFFER contains the final discounted price for first month (e.g., 9.99)
      const firstMonthPrice = this.discountOffer > 0 ? this.discountOffer : plan.price;
      const discountAmount = plan.price - firstMonthPrice;
      const discountPercentage = discountAmount / plan.price;
      
      return {
        expiredPlan,
        planName: plan.name,
        monthlyPrice: plan.price,
        discountOffer: this.discountOffer,
        discountPercentage: discountPercentage,
        renewalOptions: [
          { months: 1, discount: 0, price: plan.price },
          { months: 3, discount: discountPercentage, price: firstMonthPrice + plan.price * 2 },
          { months: 6, discount: discountPercentage, price: firstMonthPrice + plan.price * 5 },
          { months: 12, discount: discountPercentage, price: firstMonthPrice + plan.price * 11 }
        ]
      };
    } catch (error) {
      console.error('Error getting renewal options:', error);
      return null;
    }
  }
}

module.exports = new SubscriptionManager();
