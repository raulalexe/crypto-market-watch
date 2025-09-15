// Test helper for validation middleware testing

const { validateRequestBody, VALIDATION_RULES } = require('../../server/middleware/validation');

// Mock validator for testing
jest.mock('validator', () => ({
  isEmail: jest.fn((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }),
  escape: jest.fn((str) => str.replace(/[<>]/g, '')),
  isNumeric: jest.fn((str) => !isNaN(parseFloat(str)) && isFinite(str))
}));

// Test validation middleware
const testValidation = (rules, body) => {
  return new Promise((resolve, reject) => {
    const req = { body };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();
    
    const middleware = validateRequestBody(rules);
    middleware(req, res, next);
    
    if (res.status.mock.calls.length > 0) {
      resolve({ error: res.json.mock.calls[0][0], status: res.status.mock.calls[0][0] });
    } else {
      resolve({ success: true, sanitizedBody: req.body });
    }
  });
};

// Test cases for validation
const validationTestCases = {
  validUserRegistration: {
    email: 'test@example.com',
    password: 'ValidPass123'
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'ValidPass123'
  },
  weakPassword: {
    email: 'test@example.com',
    password: 'weak'
  },
  missingFields: {
    email: 'test@example.com'
    // missing password
  },
  validContactForm: {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Test Subject',
    message: 'This is a test message'
  },
  invalidContactForm: {
    name: '',
    email: 'invalid',
    subject: '',
    message: 'Too short'
  }
};

module.exports = {
  testValidation,
  validationTestCases,
  VALIDATION_RULES
};