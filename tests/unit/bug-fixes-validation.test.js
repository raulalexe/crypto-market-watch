/**
 * Bug Fixes Validation Tests
 * Tests all the critical bug fixes we implemented
 */

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { validateRequestBody, VALIDATION_RULES } = require('../../server/middleware/validation');
const { createError, globalErrorHandler } = require('../../server/utils/errorHandler');

// Create test app
const app = express();
app.use(express.json());

// Test CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'https://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
}));

// Test validation endpoints
app.post('/test/register', validateRequestBody(VALIDATION_RULES.userRegistration), (req, res) => {
  res.json({ success: true, user: req.body });
});

app.post('/test/login', validateRequestBody(VALIDATION_RULES.userLogin), (req, res) => {
  res.json({ success: true, user: req.body });
});

app.post('/test/contact', validateRequestBody(VALIDATION_RULES.contactForm), (req, res) => {
  res.json({ success: true, message: req.body });
});

// Test error handling
app.get('/test/error', (req, res, next) => {
  const error = createError.validation('Test validation error', { field: 'test' });
  next(error);
});

app.get('/test/auth-error', (req, res, next) => {
  const error = createError.authentication('Test auth error');
  next(error);
});

app.get('/test/db-error', (req, res, next) => {
  const error = createError.database('Test database error', 'Test operation');
  next(error);
});

// Add global error handler
app.use(globalErrorHandler);

describe('Bug Fixes Validation Tests', () => {
  
  describe('1. Input Validation Fixes', () => {
    
    test('should validate user registration with valid data', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
    });
    
    test('should reject user registration with invalid email', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Invalid email format');
    });
    
    test('should reject user registration with weak password', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({
          email: 'test@example.com',
          password: 'weak'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Password must be at least 8 characters long');
    });
    
    test('should reject user registration with missing fields', async () => {
      const response = await request(app)
        .post('/test/register')
        .send({
          email: 'test@example.com'
          // missing password
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('password is required');
    });
    
    test('should validate contact form with valid data', async () => {
      const response = await request(app)
        .post('/test/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message that is long enough',
          captchaAnswer: 'test'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should reject contact form with invalid data', async () => {
      const response = await request(app)
        .post('/test/contact')
        .send({
          name: '',
          email: 'invalid',
          subject: '',
          message: 'short'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.length).toBeGreaterThan(0);
    });
  });
  
  describe('2. CORS Security Fixes', () => {
    
    test('should allow requests from localhost:3000', async () => {
      const response = await request(app)
        .get('/test/register')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.status).not.toBe(403);
    });
    
    test('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/test/register')
        .set('Origin', 'http://malicious-site.com');
      
      expect(response.status).toBe(500); // CORS errors are handled by global error handler
      expect(response.body.error).toBeDefined();
    });
  });
  
  describe('3. Error Handling Fixes', () => {
    
    test('should return standardized validation error', async () => {
      const response = await request(app)
        .get('/test/error');
      
      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Test validation error');
      expect(response.body.error.details).toEqual({ field: 'test' });
      expect(response.body.error.timestamp).toBeDefined();
    });
    
    test('should return standardized authentication error', async () => {
      const response = await request(app)
        .get('/test/auth-error');
      
      expect(response.status).toBe(401);
      expect(response.body.error.type).toBe('AUTHENTICATION_ERROR');
      expect(response.body.error.message).toBe('Test auth error');
      expect(response.body.error.timestamp).toBeDefined();
    });
    
    test('should return standardized database error', async () => {
      const response = await request(app)
        .get('/test/db-error');
      
      expect(response.status).toBe(500);
      expect(response.body.error.type).toBe('DATABASE_ERROR');
      expect(response.body.error.message).toBe('Test operation: Test database error');
      expect(response.body.error.operation).toBe('Test operation');
      expect(response.body.error.timestamp).toBeDefined();
    });
  });
  
  describe('4. Input Sanitization', () => {
    
    test('should sanitize HTML in input fields', async () => {
      const response = await request(app)
        .post('/test/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Test Subject',
          message: 'This is a test message with <script>alert("xss")</script> HTML',
          captchaAnswer: 'test'
        });
      
      expect(response.status).toBe(200);
      // The sanitized message should not contain script tags
      expect(response.body.message.message).not.toContain('<script>');
      expect(response.body.message.message).toContain('&lt;script&gt;');
    });
  });
  
  describe('5. Rate Limiting and Performance', () => {
    
    test('should handle multiple requests without errors', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/test/register')
            .send({
              email: `test${i}@example.com`,
              password: 'ValidPass123'
            })
        );
      }
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

describe('Integration Tests for Bug Fixes', () => {
  
  describe('End-to-End Validation Flow', () => {
    
    test('should handle complete user registration flow', async () => {
      // Step 1: Try invalid registration
      const invalidResponse = await request(app)
        .post('/test/register')
        .send({
          email: 'invalid-email',
          password: 'weak'
        });
      
      expect(invalidResponse.status).toBe(400);
      
      // Step 2: Try valid registration
      const validResponse = await request(app)
        .post('/test/register')
        .send({
          email: 'valid@example.com',
          password: 'ValidPass123'
        });
      
      expect(validResponse.status).toBe(200);
      expect(validResponse.body.success).toBe(true);
    });
  });
});