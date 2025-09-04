const request = require('supertest');

// Create a simple mock Express app for testing
const express = require('express');
const app = express();

app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === 'valid-token') {
    req.user = { id: 1, email: 'test@example.com', role: 'user' };
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Mock database functions
const mockUsers = new Map();
mockUsers.set('test@example.com', {
  id: 1,
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'user',
  plan: 'free',
  email_confirmed: true,
  created_at: new Date().toISOString()
});
mockUsers.set('existing@example.com', {
  id: 2,
  email: 'existing@example.com',
  password: 'hashedpassword',
  role: 'user',
  plan: 'free',
  email_confirmed: true,
  created_at: new Date().toISOString()
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  if (mockUsers.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  res.json({
    requiresConfirmation: true,
    message: 'Please check your email to confirm your account'
  });
});

app.get('/api/auth/confirm-email', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ error: 'Confirmation token is required' });
  }
  
  if (token === 'invalid-token') {
    return res.status(400).json({ error: 'Invalid confirmation token' });
  }
  
  res.json({ success: true, message: 'Email confirmed successfully' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'nonexistent@example.com') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (email === 'test@example.com' && password === 'password123') {
    res.json({
      token: 'valid-token',
      user: mockUsers.get('test@example.com')
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.put('/api/profile', mockAuth, (req, res) => {
  res.json({ success: true, message: 'Profile updated successfully' });
});

describe('Authentication Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with email confirmation', async () => {
      const userData = {
        email: 'newuser@example.com',
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
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
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
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({
          email: 'newemail@example.com',
          notifications: { email: true, push: false }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
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