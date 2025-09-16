const jwt = require('jsonwebtoken');
const { getUserById } = require('../database');
const { SUBSCRIPTION_TYPES } = require('../constants/subscriptionTypes');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add userId to the user object for consistency
    req.user = { ...user, userId: user.id };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];



  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await getUserById(decoded.userId);
      
      if (user) {
        // Add userId to the user object for consistency
        req.user = { ...user, userId: user.id };
      }
    } catch (error) {

      // Token invalid, but continue without user
    }
  }

  next();
};

// Check subscription status
const requireSubscription = (minPlan = SUBSCRIPTION_TYPES.FREE) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Check if user is admin first
      const { isUserAdmin } = require('../database');
      const isAdmin = await isUserAdmin(req.user.id);
      
      if (isAdmin) {
        // Admin users bypass subscription requirements
        req.subscription = { plan_type: SUBSCRIPTION_TYPES.ADMIN, isAdmin: true };
        return next();
      }

      const { getUserById } = require('../database');
      const user = await getUserById(req.user.id);
      
      const planHierarchy = { 
        [SUBSCRIPTION_TYPES.FREE]: 0, 
        [SUBSCRIPTION_TYPES.PRO]: 1, 
        [SUBSCRIPTION_TYPES.PREMIUM]: 2, 
        [SUBSCRIPTION_TYPES.ADMIN]: 3 
      };
      let userPlan = user?.subscription_plan || SUBSCRIPTION_TYPES.FREE;
      
      // Debug logging for subscription checks
      console.log(`🔍 Subscription check for user ${req.user.id}:`, {
        userPlan,
        minPlan,
        userPlanLevel: planHierarchy[userPlan],
        minPlanLevel: planHierarchy[minPlan],
        hasAccess: planHierarchy[userPlan] >= planHierarchy[minPlan]
      });
      
      if (planHierarchy[userPlan] < planHierarchy[minPlan]) {
        console.log(`❌ Access denied for user ${req.user.id}: ${userPlan} < ${minPlan}`);
        return res.status(403).json({ 
          error: 'Subscription required',
          requiredPlan: minPlan,
          currentPlan: userPlan,
          message: `This feature requires a ${minPlan} subscription or higher. Your current plan is ${userPlan}.`
        });
      }

      req.subscription = { plan_type: userPlan, isAdmin: false };
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// API rate limiting based on subscription
const rateLimit = (endpoint) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { trackApiUsage, getApiUsage, getUserById } = require('../database');
      
      // Track this API call
      await trackApiUsage(req.user.id, endpoint, req.ip, req.get('User-Agent'));
      
      // Get user's subscription
      const user = await getUserById(req.user.id);
      const plan = user?.subscription_plan || 'free';
      
      // Define rate limits
      const rateLimits = {
        free: { requests: 100, window: 'day' },
        pro: { requests: 1000, window: 'day' },
        premium: { requests: 10000, window: 'day' },
        api: { requests: 100000, window: 'day' }
      };
      
      const limit = rateLimits[plan];
      
      // Check usage in the last 24 hours
      const usage = await getApiUsage(req.user.id, 1);
      const endpointUsage = usage.filter(u => u.endpoint === endpoint);
      
      if (endpointUsage.length >= limit.requests) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          limit: limit.requests,
          window: limit.window,
          plan: plan
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };
};

// Admin middleware
const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const { isUserAdmin } = require('../database');
    const isAdmin = await isUserAdmin(req.user.id);
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireSubscription,
  requireAdmin,
  rateLimit
};