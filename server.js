const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import our custom modules
const setupDatabase = require('./config/database');
const { initializeRedis } = require('./config/redis');
const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');
const { setupSecurityMiddleware, validateRequest } = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup security middleware
setupSecurityMiddleware(app);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// General rate limiting
app.use(generalLimiter);

// Request validation
app.use(validateRequest);

// Middleware setup
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Media Platform Backend is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/auth',
      media: '/media',
      health: '/health'
    }
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/media', mediaRoutes);

// Error handling middleware (enhanced)
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Don't leak error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({ 
    error: isProduction ? 'Something went wrong!' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
async function startServer() {
  try {
    // Setup database tables
    await setupDatabase();
    console.log('✅ Database setup completed');
    
    // Initialize Redis (optional - will work without it)
    await initializeRedis();
    
    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Visit http://localhost:${PORT} to test the API`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 