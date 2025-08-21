const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import our modules
const authRoutes = require('../routes/auth');
const { setupDatabase, runQuery, getRow } = require('../config/database');

// Create test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';

describe('Authentication Endpoints', () => {
  let testUser;

  beforeAll(async () => {
    // Setup test database
    await setupDatabase();
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const result = await runQuery(
      'INSERT INTO AdminUser (email, hashed_password) VALUES (?, ?)',
      ['test@example.com', hashedPassword]
    );
    testUser = { id: result.id, email: 'test@example.com' };
  });

  afterAll(async () => {
    // Clean up test data
    await runQuery('DELETE FROM AdminUser WHERE email = ?', ['test@example.com']);
    await runQuery('DELETE FROM AdminUser WHERE email = ?', ['newuser@example.com']);
  });

  describe('POST /auth/signup', () => {
    it('should create a new admin account with valid data', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'newpassword123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Admin account created successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Please provide a valid email address');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Password must be at least 6 characters long');
    });

    it('should return 409 for existing email', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'User with this email already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid email or password');
    });
  });

  describe('JWT Token Validation', () => {
    it('should generate valid JWT token', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpassword123'
        });

      const token = response.body.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email', 'test@example.com');
    });
  });
}); 