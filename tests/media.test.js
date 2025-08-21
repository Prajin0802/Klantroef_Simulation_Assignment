const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Import our modules
const mediaRoutes = require('../routes/media');
const { setupDatabase, runQuery, getRow } = require('../config/database');

// Create test app
const app = express();
app.use(express.json());
app.use('/media', mediaRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';

describe('Media Endpoints', () => {
  let testUser;
  let testToken;
  let testMedia;

  beforeAll(async () => {
    // Setup test database
    await setupDatabase();
    
    // Create test user and get token
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const userResult = await runQuery(
      'INSERT INTO AdminUser (email, hashed_password) VALUES (?, ?)',
      ['test@example.com', hashedPassword]
    );
    testUser = { id: userResult.id, email: 'test@example.com' };
    
    // Generate test token
    testToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create test media
    const mediaResult = await runQuery(
      'INSERT INTO MediaAsset (title, type, file_url) VALUES (?, ?, ?)',
      ['Test Video', 'video', '/uploads/test-video.mp4']
    );
    testMedia = { id: mediaResult.id, title: 'Test Video' };
  });

  afterAll(async () => {
    // Clean up test data
    await runQuery('DELETE FROM MediaViewLog WHERE media_id = ?', [testMedia.id]);
    await runQuery('DELETE FROM MediaAsset WHERE id = ?', [testMedia.id]);
    await runQuery('DELETE FROM AdminUser WHERE email = ?', ['test@example.com']);
  });

  describe('POST /media/:id/view', () => {
    it('should log a view successfully', async () => {
      const response = await request(app)
        .post(`/media/${testMedia.id}/view`);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'View logged successfully');
      expect(response.body).toHaveProperty('media');
      expect(response.body).toHaveProperty('view');
      expect(response.body.media.id).toBe(testMedia.id);
      expect(response.body.view).toHaveProperty('ip');
      expect(response.body.view).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent media', async () => {
      const response = await request(app)
        .post('/media/99999/view');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Media not found');
    });
  });

  describe('GET /media/:id/analytics', () => {
    it('should return analytics data with authentication', async () => {
      // First log some views
      await request(app).post(`/media/${testMedia.id}/view`);
      await request(app).post(`/media/${testMedia.id}/view`);

      const response = await request(app)
        .get(`/media/${testMedia.id}/analytics`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Analytics retrieved successfully');
      expect(response.body).toHaveProperty('media');
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('total_views');
      expect(response.body.analytics).toHaveProperty('unique_ips');
      expect(response.body.analytics).toHaveProperty('views_per_day');
      expect(response.body.analytics).toHaveProperty('recent_views');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/media/${testMedia.id}/analytics`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    it('should return 404 for non-existent media', async () => {
      const response = await request(app)
        .get('/media/99999/analytics')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Media not found');
    });
  });

  describe('GET /media/:id/stream-url', () => {
    it('should generate streaming URL successfully', async () => {
      const response = await request(app)
        .get(`/media/${testMedia.id}/stream-url`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Secure streaming URL generated');
      expect(response.body).toHaveProperty('stream_url');
      expect(response.body).toHaveProperty('expires_at');
      expect(response.body).toHaveProperty('media');
      expect(response.body.media.id).toBe(testMedia.id);
      expect(response.body.stream_url).toContain('token=');
    });

    it('should return 404 for non-existent media', async () => {
      const response = await request(app)
        .get('/media/99999/stream-url');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Media not found');
    });
  });

  describe('GET /media', () => {
    it('should return media list with authentication', async () => {
      const response = await request(app)
        .get('/media')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Media list retrieved successfully');
      expect(response.body).toHaveProperty('media');
      expect(Array.isArray(response.body.media)).toBe(true);
      expect(response.body.media.length).toBeGreaterThan(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/media');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit view logging requests', async () => {
      // Make multiple rapid requests
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app).post(`/media/${testMedia.id}/view`)
        );
      }

      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);
      
      // Should have some rate limited responses
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics Data Structure', () => {
    it('should return correct analytics structure', async () => {
      const response = await request(app)
        .get(`/media/${testMedia.id}/analytics`)
        .set('Authorization', `Bearer ${testToken}`);

      const analytics = response.body.analytics;
      
      expect(typeof analytics.total_views).toBe('number');
      expect(typeof analytics.unique_ips).toBe('number');
      expect(typeof analytics.views_per_day).toBe('object');
      expect(Array.isArray(analytics.recent_views)).toBe(true);
      
      // Check recent views structure
      if (analytics.recent_views.length > 0) {
        const view = analytics.recent_views[0];
        expect(view).toHaveProperty('ip');
        expect(view).toHaveProperty('timestamp');
      }
    });
  });
}); 