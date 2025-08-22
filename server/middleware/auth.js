const jwt = require('jsonwebtoken');
const { getUserById } = require('../database');

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

    req.user = user;
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
        req.user = user;
      }
    } catch (error) {
      // Token invalid, but continue without user
    }
  }

  next();
};

// Check subscription status
const requireSubscription = (minPlan = 'free') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { getActiveSubscription } = require('../database');
      const subscription = await getActiveSubscription(req.user.id);
      
      const planHierarchy = { free: 0, pro: 1, premium: 2 };
      const userPlan = subscription ? subscription.plan_type : 'free';
      
      if (planHierarchy[userPlan] < planHierarchy[minPlan]) {
        return res.status(403).json({ 
          error: 'Subscription required',
          requiredPlan: minPlan,
          currentPlan: userPlan
        });
      }

      req.subscription = subscription;
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
      const { trackApiUsage, getApiUsage } = require('../database');
      const { getActiveSubscription } = require('../database');
      
      // Track this API call
      await trackApiUsage(req.user.id, endpoint, req.ip, req.get('User-Agent'));
      
      // Get user's subscription
      const subscription = await getActiveSubscription(req.user.id);
      const plan = subscription ? subscription.plan_type : 'free';
      
      // Define rate limits
      const rateLimits = {
        free: { requests: 100, window: 'day' },
        pro: { requests: 1000, window: 'day' },
        premium: { requests: 10000, window: 'day' }
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

module.exports = {
  authenticateToken,
  optionalAuth,
  requireSubscription,
  rateLimit
};