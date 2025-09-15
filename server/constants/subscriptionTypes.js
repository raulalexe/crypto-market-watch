/**
 * Subscription Types Constants
 * Centralized enum-like structure for subscription types to avoid hardcoded strings
 */

const SUBSCRIPTION_TYPES = {
  FREE: 'free',
  PRO: 'pro', 
  PREMIUM: 'premium',
  ADMIN: 'admin'
};

const SUBSCRIPTION_FEATURES = {
  [SUBSCRIPTION_TYPES.FREE]: ['basic_alerts', 'limited_api'],
  [SUBSCRIPTION_TYPES.PRO]: ['advanced_alerts', 'unlimited_api', 'data_export', 'ai_analysis'],
  [SUBSCRIPTION_TYPES.PREMIUM]: ['all_features', 'priority_support', 'custom_integrations'],
  [SUBSCRIPTION_TYPES.ADMIN]: ['all_features', 'admin_access']
};

const SUBSCRIPTION_PRICES = {
  [SUBSCRIPTION_TYPES.FREE]: 0,
  [SUBSCRIPTION_TYPES.PRO]: 29.99,
  [SUBSCRIPTION_TYPES.PREMIUM]: 99.99,
  [SUBSCRIPTION_TYPES.ADMIN]: 0
};

const SUBSCRIPTION_NAMES = {
  [SUBSCRIPTION_TYPES.FREE]: 'Free Plan',
  [SUBSCRIPTION_TYPES.PRO]: 'Pro Plan',
  [SUBSCRIPTION_TYPES.PREMIUM]: 'Premium Plan',
  [SUBSCRIPTION_TYPES.ADMIN]: 'Admin Plan'
};

// Helper functions
const isFreePlan = (plan) => plan === SUBSCRIPTION_TYPES.FREE;
const isPaidPlan = (plan) => plan !== SUBSCRIPTION_TYPES.FREE && plan !== SUBSCRIPTION_TYPES.ADMIN;
const isAdminPlan = (plan) => plan === SUBSCRIPTION_TYPES.ADMIN;

const getPlanFeatures = (plan) => SUBSCRIPTION_FEATURES[plan] || SUBSCRIPTION_FEATURES[SUBSCRIPTION_TYPES.FREE];
const getPlanPrice = (plan) => SUBSCRIPTION_PRICES[plan] || 0;
const getPlanName = (plan) => SUBSCRIPTION_NAMES[plan] || SUBSCRIPTION_NAMES[SUBSCRIPTION_TYPES.FREE];

module.exports = {
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
};
