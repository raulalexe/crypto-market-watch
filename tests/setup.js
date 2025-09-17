// Only load jest-dom if we're in a browser-like environment
if (typeof window !== 'undefined') {
  require('@testing-library/jest-dom');
}

// Mock window.matchMedia only if window exists
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.BREVO_API_KEY = 'test-brevo-api-key';
process.env.BREVO_SENDER_EMAIL = 'test@example.com';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SUPPORT_CRYPTO_PAYMENT = 'false';
process.env.DISCOUNT_OFFER = '9.99';

// Mock console methods to reduce noise in tests (commented out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
