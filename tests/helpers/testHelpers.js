const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Test database setup
const setupTestDatabase = async () => {
  // This would set up a test database
  // For now, we'll mock the database functions
  return {
    initDatabase: jest.fn(),
    getUserByEmail: jest.fn(),
    insertUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  };
};

// Create test JWT tokens
const createTestToken = (userId = 1, role = 'user', plan = 'free') => {
  return jwt.sign(
    { 
      userId, 
      role, 
      plan,
      email: `test${userId}@example.com`
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

const createAdminToken = () => {
  return jwt.sign(
    { 
      userId: 1, 
      role: 'admin', 
      plan: 'admin',
      email: 'admin@example.com'
    },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Mock user data
const createMockUser = (overrides = {}) => {
  return {
    id: 1,
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'user',
    plan: 'free',
    email_confirmed: true,
    created_at: new Date().toISOString(),
    ...overrides
  };
};

// Mock API responses
const mockApiResponses = {
  marketData: [
    {
      id: 1,
      symbol: 'BTC',
      price: 50000,
      change_24h: 2.5,
      market_cap: 1000000000000,
      volume_24h: 50000000000,
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      symbol: 'ETH',
      price: 3000,
      change_24h: -1.2,
      market_cap: 400000000000,
      volume_24h: 20000000000,
      timestamp: new Date().toISOString()
    }
  ],
  
  fearGreedIndex: {
    value: 65,
    classification: 'Greed',
    timestamp: new Date().toISOString()
  },
  
  aiAnalysis: {
    short_term: {
      direction: 'BULLISH',
      confidence: 0.8,
      factors: ['Positive market sentiment', 'Strong volume']
    },
    medium_term: {
      direction: 'NEUTRAL',
      confidence: 0.6,
      factors: ['Mixed signals', 'Regulatory uncertainty']
    },
    long_term: {
      direction: 'BULLISH',
      confidence: 0.7,
      factors: ['Institutional adoption', 'Technology advancement']
    },
    timestamp: new Date().toISOString()
  },
  
  alerts: [
    {
      id: 1,
      alert_type: 'price_alert',
      message: 'Bitcoin price alert',
      severity: 'medium',
      created_at: new Date().toISOString(),
      acknowledged: false
    }
  ],
  
  subscription: {
    plan: 'pro',
    status: 'active',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  
  subscriptionPlans: [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['Basic market data', 'Limited alerts']
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      features: ['Advanced analytics', 'Unlimited alerts', 'Email notifications']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 99,
      features: ['All Pro features', 'API access', 'Priority support']
    }
  ]
};

// Mock axios responses
const mockAxiosResponses = {
  get: {
    '/api/market-data': { data: mockApiResponses.marketData },
    '/api/crypto-prices': { data: mockApiResponses.marketData },
    '/api/fear-greed': { data: mockApiResponses.fearGreedIndex },
    '/api/analysis': { data: mockApiResponses.aiAnalysis },
    '/api/alerts': { data: mockApiResponses.alerts },
    '/api/subscription': { data: mockApiResponses.subscription },
    '/api/subscription/plans': { data: mockApiResponses.subscriptionPlans },
    '/api/subscription/pricing': { 
      data: {
        success: true,
        pricing: {
          pro: { originalPrice: 29, currentPrice: 29, hasDiscount: false, discountPercentage: 0 },
          premium: { originalPrice: 99, currentPrice: 99, hasDiscount: false, discountPercentage: 0 }
        },
        discountActive: false
      }
    }
  },
  
  post: {
    '/api/auth/login': { 
      data: { 
        token: createTestToken(),
        user: createMockUser()
      }
    },
    '/api/auth/register': { 
      data: { 
        requiresConfirmation: true,
        message: 'Please check your email to confirm your account'
      }
    }
  }
};

// Setup axios mocks
const setupAxiosMocks = () => {
  const axios = require('axios');
  
  axios.get = jest.fn((url) => {
    const response = mockAxiosResponses.get[url];
    if (response) {
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`No mock for GET ${url}`));
  });
  
  axios.post = jest.fn((url, data) => {
    const response = mockAxiosResponses.post[url];
    if (response) {
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`No mock for POST ${url}`));
  });
  
  return axios;
};

// Mock localStorage
const mockLocalStorage = () => {
  const storage = {};
  return {
    getItem: jest.fn((key) => storage[key] || null),
    setItem: jest.fn((key, value) => { storage[key] = value; }),
    removeItem: jest.fn((key) => { delete storage[key]; }),
    clear: jest.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); })
  };
};

// Mock window.location
const mockWindowLocation = (href = 'http://localhost:3000') => {
  delete window.location;
  window.location = { href };
};

// Wait for async operations
const waitFor = (callback, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    
    check();
  });
};

module.exports = {
  setupTestDatabase,
  createTestToken,
  createAdminToken,
  createMockUser,
  mockApiResponses,
  setupAxiosMocks,
  mockLocalStorage,
  mockWindowLocation,
  waitFor
};
