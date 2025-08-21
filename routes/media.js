const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { runQuery, getRow, getAll } = require('../config/database');
const { 
  getCachedData, 
  setCachedData, 
  generateAnalyticsCacheKey, 
  invalidateAnalyticsCache 
} = require('../config/redis');
const authenticateToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const { viewLoggingLimiter, uploadLimiter } = require('../middleware/rateLimit');
const { validateFileUpload } = require('../middleware/security');

const router = express.Router();

// Store temporary streaming tokens (in production, use Redis or database)
const streamingTokens = new Map();

// POST /media - Upload media file (requires authentication)
router.post('/', authenticateToken, uploadLimiter, upload.single('media'), validateFileUpload, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    const { title } = req.body;
    const uploadedBy = req.user.userId;

    // Basic validation
    if (!title) {
      return res.status(400).json({ 
        error: 'Title is required' 
      });
    }

    // Determine media type based on file mimetype
    let mediaType = 'video';
    if (req.file.mimetype.startsWith('audio/')) {
      mediaType = 'audio';
    }

    // Create file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    // Save media metadata to database
    const result = await runQuery(
      'INSERT INTO MediaAsset (title, type, file_url) VALUES (?, ?, ?)',
      [title, mediaType, fileUrl]
    );

    res.status(201).json({
      message: 'Media uploaded successfully',
      media: {
        id: result.id,
        title: title,
        type: mediaType,
        file_url: fileUrl,
        filename: req.file.filename
      }
    });

  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload media' 
    });
  }
});

// POST /media/:id/view - Log a view (IP + timestamp) with rate limiting
router.post('/:id/view', viewLoggingLimiter, async (req, res) => {
  try {
    const mediaId = req.params.id;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Check if media exists
    const media = await getRow(
      'SELECT id, title FROM MediaAsset WHERE id = ?',
      [mediaId]
    );

    if (!media) {
      return res.status(404).json({ 
        error: 'Media not found' 
      });
    }

    // Log the view
    await runQuery(
      'INSERT INTO MediaViewLog (media_id, viewed_by_ip) VALUES (?, ?)',
      [mediaId, clientIP]
    );

    // Invalidate analytics cache for this media
    await invalidateAnalyticsCache(mediaId);

    res.status(201).json({
      message: 'View logged successfully',
      media: {
        id: media.id,
        title: media.title
      },
      view: {
        ip: clientIP,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('View logging error:', error);
    res.status(500).json({ 
      error: 'Failed to log view' 
    });
  }
});

// GET /media/:id/analytics - Get analytics data with Redis caching
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const mediaId = req.params.id;

    // Check if media exists
    const media = await getRow(
      'SELECT id, title FROM MediaAsset WHERE id = ?',
      [mediaId]
    );

    if (!media) {
      return res.status(404).json({ 
        error: 'Media not found' 
      });
    }

    // Try to get cached analytics data
    const cacheKey = generateAnalyticsCacheKey(mediaId);
    const cachedData = await getCachedData(cacheKey);
    
    if (cachedData) {
      console.log(`📊 Analytics served from cache for media ${mediaId}`);
      return res.json({
        message: 'Analytics retrieved successfully (cached)',
        media: {
          id: media.id,
          title: media.title
        },
        analytics: cachedData,
        cached: true
      });
    }

    // If not cached, fetch from database
    console.log(`📊 Fetching analytics from database for media ${mediaId}`);

    // Get total views
    const totalViewsResult = await getRow(
      'SELECT COUNT(*) as total_views FROM MediaViewLog WHERE media_id = ?',
      [mediaId]
    );

    // Get unique IPs
    const uniqueIPsResult = await getRow(
      'SELECT COUNT(DISTINCT viewed_by_ip) as unique_ips FROM MediaViewLog WHERE media_id = ?',
      [mediaId]
    );

    // Get views per day (last 30 days)
    const viewsPerDay = await getAll(`
      SELECT 
        DATE(timestamp) as view_date,
        COUNT(*) as daily_views
      FROM MediaViewLog 
      WHERE media_id = ? 
        AND timestamp >= DATE('now', '-30 days')
      GROUP BY DATE(timestamp)
      ORDER BY view_date DESC
    `, [mediaId]);

    // Format views per day as object
    const viewsPerDayObject = {};
    viewsPerDay.forEach(day => {
      viewsPerDayObject[day.view_date] = day.daily_views;
    });

    // Get recent views (last 10)
    const recentViews = await getAll(`
      SELECT viewed_by_ip, timestamp
      FROM MediaViewLog 
      WHERE media_id = ?
      ORDER BY timestamp DESC
      LIMIT 10
    `, [mediaId]);

    const analyticsData = {
      total_views: totalViewsResult.total_views || 0,
      unique_ips: uniqueIPsResult.unique_ips || 0,
      views_per_day: viewsPerDayObject,
      recent_views: recentViews.map(view => ({
        ip: view.viewed_by_ip,
        timestamp: view.timestamp
      }))
    };

    // Cache the analytics data for 5 minutes
    await setCachedData(cacheKey, analyticsData, 300);

    res.json({
      message: 'Analytics retrieved successfully',
      media: {
        id: media.id,
        title: media.title
      },
      analytics: analyticsData,
      cached: false
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve analytics' 
    });
  }
});

// GET /media/:id/stream-url - Get secure streaming link
router.get('/:id/stream-url', async (req, res) => {
  try {
    const mediaId = req.params.id;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Check if media exists
    const media = await getRow(
      'SELECT id, title, type, file_url FROM MediaAsset WHERE id = ?',
      [mediaId]
    );

    if (!media) {
      return res.status(404).json({ 
        error: 'Media not found' 
      });
    }

    // Generate secure streaming token (valid for 10 minutes)
    const streamingToken = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store token with expiration
    streamingTokens.set(streamingToken, {
      mediaId: mediaId,
      expiresAt: expiresAt,
      clientIP: clientIP
    });

    // Log the view attempt
    await runQuery(
      'INSERT INTO MediaViewLog (media_id, viewed_by_ip) VALUES (?, ?)',
      [mediaId, clientIP]
    );

    // Invalidate analytics cache
    await invalidateAnalyticsCache(mediaId);

    // Create secure streaming URL
    const secureUrl = `${req.protocol}://${req.get('host')}/media/${mediaId}/stream?token=${streamingToken}`;

    res.json({
      message: 'Secure streaming URL generated',
      stream_url: secureUrl,
      expires_at: expiresAt,
      media: {
        id: media.id,
        title: media.title,
        type: media.type
      }
    });

  } catch (error) {
    console.error('Stream URL generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate streaming URL' 
    });
  }
});

// GET /media/:id/stream - Stream media with token validation
router.get('/:id/stream', async (req, res) => {
  try {
    const mediaId = req.params.id;
    const token = req.query.token;

    // Validate token
    if (!token) {
      return res.status(401).json({ 
        error: 'Streaming token required' 
      });
    }

    const tokenData = streamingTokens.get(token);
    if (!tokenData) {
      return res.status(401).json({ 
        error: 'Invalid streaming token' 
      });
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      streamingTokens.delete(token);
      return res.status(401).json({ 
        error: 'Streaming token expired' 
      });
    }

    // Check if token matches media ID
    if (tokenData.mediaId != mediaId) {
      return res.status(401).json({ 
        error: 'Invalid streaming token for this media' 
      });
    }

    // Get media file path
    const media = await getRow(
      'SELECT file_url FROM MediaAsset WHERE id = ?',
      [mediaId]
    );

    if (!media) {
      return res.status(404).json({ 
        error: 'Media not found' 
      });
    }

    // Extract filename from file_url
    const filename = path.basename(media.file_url);
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Media file not found' 
      });
    }

    // Stream the file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Media streaming error:', error);
    res.status(500).json({ 
      error: 'Failed to stream media' 
    });
  }
});

// GET /media - List all media (for admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const mediaList = await getAll(
      'SELECT id, title, type, file_url, created_at FROM MediaAsset ORDER BY created_at DESC'
    );

    res.json({
      message: 'Media list retrieved successfully',
      media: mediaList
    });

  } catch (error) {
    console.error('Media list error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve media list' 
    });
  }
});

// Clean up expired tokens periodically (every 5 minutes)
setInterval(() => {
  const now = new Date();
  for (const [token, data] of streamingTokens.entries()) {
    if (now > data.expiresAt) {
      streamingTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

module.exports = router; 