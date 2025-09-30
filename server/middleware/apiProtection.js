const { getApiKeyByKey, getUserById } = require('../database');

/**
 * API Protection Middleware
 * 
 * This middleware handles two types of requests:
 * 1. Frontend requests (from the web app) - uses JWT authentication
 * 2. API requests (external) - requires API key authentication
 * 
 * Frontend requests are identified by:
 * - Having an Origin header that matches allowed frontend domains
 * - Having a Referer header that matches allowed frontend domains
 * - Having a User-Agent that indicates a browser
 * 
 * API requests are identified by:
 * - Having an X-API-Key header
 * - Having an Authorization header with Bearer token (API key)
 * - Not having browser-like headers
 */

const isFrontendRequest = (req) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // Check if request has API key headers (indicates API request)
  const hasApiKey = req.headers['x-api-key'] || 
                   (req.headers.authorization && req.headers.authorization.startsWith('Bearer '));
  
  if (hasApiKey) {
    return false; // Has API key, so it's an API request
  }
  
  // Get frontend URL from environment variables
  const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
  
  // Check if request is from the frontend domain
  if (origin && origin.includes(frontendUrl)) {
    return true;
  }
  
  if (referer && referer.includes(frontendUrl)) {
    return true;
  }
  
  // In development, allow localhost requests
  if (process.env.NODE_ENV === 'development' && 
      (origin?.includes('localhost') || referer?.includes('localhost'))) {
    return true;
  }
  
  return false;
};

/**
 * API Protection Middleware
 * Routes requests to appropriate authentication method:
 * - Frontend requests: JWT authentication (existing middleware)
 * - API requests: API key authentication (Pro users only)
 */
const apiProtection = (options = {}) => {
  return async (req, res, next) => {
    try {
      const isFrontend = isFrontendRequest(req);
      
      if (isFrontend) {
        // Frontend request - use JWT authentication
        console.log('🌐 Frontend request detected, using JWT authentication');
        
        // Import JWT authentication middleware
        const { authenticateToken } = require('./auth');
        
        // Create a mock next function to handle the JWT auth result
        const jwtNext = (error) => {
          if (error) {
            return res.status(401).json({ 
              error: 'Authentication required',
              message: 'Please log in to access this resource',
              code: 'AUTH_REQUIRED'
            });
          }
          next();
        };
        
        // Call JWT authentication
        await authenticateToken(req, res, jwtNext);
        return;
        
      } else {
        // API request - use API key authentication
        console.log('🔑 API request detected, using API key authentication');
        
        const apiKey = req.headers['x-api-key'] || 
                      req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey) {
          return res.status(401).json({ 
            error: 'API key required',
            message: 'Please provide an API key in the X-API-Key header or Authorization header',
            code: 'API_KEY_REQUIRED'
          });
        }
        
        // Get API key from database
        const apiKeyData = await getApiKeyByKey(apiKey);
        if (!apiKeyData) {
          return res.status(401).json({ 
            error: 'Invalid API key',
            message: 'The provided API key is invalid or inactive',
            code: 'INVALID_API_KEY'
          });
        }
        
        // Get user data
        const user = await getUserById(apiKeyData.user_id);
        if (!user) {
          return res.status(401).json({ 
            error: 'User not found',
            message: 'The API key is associated with a user that no longer exists',
            code: 'USER_NOT_FOUND'
          });
        }
        
        // Check user subscription status - API access requires Pro or higher
        if (!user.subscription_plan || 
            !['pro', 'premium', 'admin'].includes(user.subscription_plan.toLowerCase())) {
          return res.status(403).json({ 
            error: 'Insufficient subscription',
            message: 'API access requires a Pro, Premium, or Admin subscription',
            code: 'SUBSCRIPTION_REQUIRED',
            required_plan: 'pro'
          });
        }
        
        // Update API key usage
        const { updateApiKeyUsage } = require('../database');
        await updateApiKeyUsage(apiKeyData.id);
        
        // Add user and API key data to request
        req.user = {
          id: user.id,
          userId: user.id,
          email: user.email,
          isAdmin: user.is_admin === 1,
          subscription: user.subscription_plan,
          apiKey: apiKeyData
        };
        
        console.log(`✅ API authentication successful for user: ${user.email} (${user.subscription_plan})`);
        next();
      }
      
    } catch (error) {
      console.error('API protection error:', error);
      res.status(500).json({ 
        error: 'Authentication failed',
        message: 'An error occurred during authentication',
        code: 'AUTH_ERROR'
      });
    }
  };
};

/**
 * Optional API Protection Middleware
 * Similar to apiProtection but allows unauthenticated requests to pass through
 * Useful for endpoints that can work with or without authentication
 */
const optionalApiProtection = (options = {}) => {
  return async (req, res, next) => {
    try {
      const isFrontend = isFrontendRequest(req);
      
      if (isFrontend) {
        // Frontend request - use optional JWT authentication
        console.log('🌐 Frontend request detected, using optional JWT authentication');
        
        const { optionalAuth } = require('./auth');
        
        // Create a mock next function
        const jwtNext = (error) => {
          // Always continue, even if authentication fails
          next();
        };
        
        await optionalAuth(req, res, jwtNext);
        return;
        
      } else {
        // API request - check for API key but don't require it
        const apiKey = req.headers['x-api-key'] || 
                      req.headers['authorization']?.replace('Bearer ', '');
        
        if (apiKey) {
          // API key provided, validate it
          const apiKeyData = await getApiKeyByKey(apiKey);
          if (apiKeyData) {
            const user = await getUserById(apiKeyData.user_id);
            if (user && ['pro', 'premium', 'admin'].includes(user.subscription_plan?.toLowerCase())) {
              // Valid API key with Pro+ subscription
              const { updateApiKeyUsage } = require('../database');
              await updateApiKeyUsage(apiKeyData.id);
              
              req.user = {
                id: user.id,
                userId: user.id,
                email: user.email,
                isAdmin: user.is_admin === 1,
                subscription: user.subscription_plan,
                apiKey: apiKeyData
              };
              
              console.log(`✅ Optional API authentication successful for user: ${user.email}`);
            }
          }
        }
        
        // Continue regardless of authentication status
        next();
      }
      
    } catch (error) {
      console.error('Optional API protection error:', error);
      // Continue on error for optional protection
      next();
    }
  };
};

module.exports = {
  apiProtection,
  optionalApiProtection,
  isFrontendRequest
};
