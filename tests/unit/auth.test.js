const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../server/index');
const { initDatabase, getUserByEmail, insertUser } = require('../../server/database');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    // Clear test data
    // This would be implemented based on your database setup
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with email confirmation', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty('requiresConfirmation', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('check your email');
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    it('should reject registration without email or password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });

  describe('GET /api/auth/confirm-email', () => {
    it('should confirm email with valid token', async () => {
      // This test would require setting up a test user with a confirmation token
      // Implementation depends on your test database setup
    });

    it('should reject confirmation with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/confirm-email?token=invalid-token')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject confirmation without token', async () => {
      const response = await request(app)
        .get('/api/auth/confirm-email')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Confirmation token is required');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // This test would require a confirmed user in the database
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update profile for authenticated user', async () => {
      // This test would require a valid JWT token
    });

    it('should reject profile update without authentication', async () => {
      const response = await request(app)
        .put('/api/profile')
        .send({
          email: 'newemail@example.com',
          notifications: { email: true, push: false }
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
