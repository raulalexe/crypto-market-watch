// Shared authentication and authorization utilities

/**
 * Check if user is authenticated
 * @param {Object} userData - User data from context or props
 * @returns {boolean}
 */
export const isAuthenticated = (userData) => {
  return userData && userData.id && userData.email;
};

/**
 * Check if user is admin
 * @param {Object} userData - User data from context or props
 * @returns {boolean}
 */
export const isAdmin = (userData) => {
  return isAuthenticated(userData) && (userData.role === 'admin' || userData.isAdmin === true);
};

/**
 * Check if user has premium access (Premium+ or Admin)
 * @param {Object} userData - User data from context or props
 * @returns {boolean}
 */
export const hasPremiumAccess = (userData) => {
  return isAuthenticated(userData) && (userData.plan === 'premium' || userData.role === 'admin');
};

/**
 * Check if user has pro access (Pro, Premium+, or Admin)
 * @param {Object} userData - User data from context or props
 * @returns {boolean}
 */
export const hasProAccess = (userData) => {
  return isAuthenticated(userData) && (userData.plan === 'pro' || userData.plan === 'premium' || userData.role === 'admin' || userData.isAdmin === true);
};

/**
 * Check if user should see upgrade prompts
 * @param {Object} userData - User data from context or props
 * @returns {boolean}
 */
export const shouldShowUpgradePrompt = (userData) => {
  return !isAuthenticated(userData) || !hasProAccess(userData);
};

/**
 * Check if user should see premium upgrade prompts
 * @param {Object} userData - User data from context or props
 * @returns {boolean}
 */
export const shouldShowPremiumUpgradePrompt = (userData) => {
  return !isAuthenticated(userData) || !hasPremiumAccess(userData);
};

/**
 * Get user's effective plan (admin overrides all plans)
 * @param {Object} userData - User data from context or props
 * @returns {string}
 */
export const getEffectivePlan = (userData) => {
  if (isAdmin(userData)) return 'admin';
  return userData?.plan || 'free';
};
