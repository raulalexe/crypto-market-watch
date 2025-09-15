const { getApiKeyByKey, updateApiKeyUsage, getUserById } = require('../database');

// API Key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        message: 'Please provide an API key in the X-API-Key header or Authorization header'
      });
    }

    // Get API key from database
    const apiKeyData = await getApiKeyByKey(apiKey);
    if (!apiKeyData) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is invalid or inactive'
      });
    }

    // Get user data
    const user = await getUserById(apiKeyData.user_id);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'The API key is associated with a user that no longer exists'
      });
    }

    // Check user subscription status
    const { getUserById } = require('../database');
    const userData = await getUserById(user.id);
    
    if (!userData || (userData.subscription_plan !== 'pro' && userData.subscription_plan !== 'premium' && userData.subscription_plan !== 'admin')) {
      return res.status(403).json({ 
        error: 'Insufficient subscription',
        message: 'API access requires a Pro, Premium, or Admin subscription'
      });
    }

    // Update API key usage
    await updateApiKeyUsage(apiKeyData.id);

    // Add user and API key data to request
    req.apiUser = {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin === 1,
      subscription: subscription.plan_type
    };
    req.apiKey = apiKeyData;

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'An error occurred during API key authentication'
    });
  }
};

// Rate limiting middleware for API calls
const apiRateLimit = (maxCallsPerDay) => {
  return async (req, res, next) => {
    try {
      const apiKeyData = req.apiKey;
      const subscription = req.apiUser.subscription;
      
      // Set rate limits based on subscription
      let dailyLimit;
      switch (subscription) {
        case 'admin':
          dailyLimit = 100000; // Unlimited for admin
          break;
        case 'premium':
          dailyLimit = 10000; // 10,000 calls/day for Premium
          break;
        case 'pro':
          dailyLimit = 1000; // 1,000 calls/day for Pro
          break;
        default:
          dailyLimit = 0;
      }

      // Check if user has exceeded their daily limit
      if (apiKeyData.usage_count >= dailyLimit) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Daily API call limit of ${dailyLimit} exceeded. Limit resets daily.`,
          limit: dailyLimit,
          used: apiKeyData.usage_count
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next();
    }
  };
};

module.exports = {
  authenticateApiKey,
  apiRateLimit
};
