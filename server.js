const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import our custom modules
const setupDatabase = require('./config/database');
const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Media Platform Backend is running!',
    endpoints: {
      auth: '/auth',
      media: '/media'
    }
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/media', mediaRoutes);

// Error handling middleware (basic)
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start the server
async function startServer() {
  try {
    // Setup database tables
    await setupDatabase();
    console.log('Database setup completed');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT} to test the API`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 