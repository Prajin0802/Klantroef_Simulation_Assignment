const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Security middleware setup
function setupSecurityMiddleware(app) {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow file uploads
  }));

  // Compression middleware
  app.use(compression({
    level: 6, // Balanced compression
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Logging middleware
  if (process.env.NODE_ENV === 'production') {
    // Production logging - combined format
    app.use(morgan('combined', {
      skip: (req, res) => res.statusCode < 400, // Only log errors in production
      stream: {
        write: (message) => {
          console.log(message.trim());
        }
      }
    }));
  } else {
    // Development logging - colored output
    app.use(morgan('dev'));
  }

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Additional security headers
  app.use((req, res, next) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  });
}

// Request validation middleware
function validateRequest(req, res, next) {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /eval\s*\(/i, // Code injection
  ];

  const requestString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      return res.status(400).json({
        error: 'Invalid request detected',
        message: 'Request contains suspicious content'
      });
    }
  }

  next();
}

// File upload security validation
function validateFileUpload(req, res, next) {
  if (!req.file) {
    return next();
  }

  // Check file size (additional check beyond multer)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (req.file.size > maxSize) {
    return res.status(400).json({
      error: 'File too large',
      message: 'Maximum file size is 100MB'
    });
  }

  // Check file extension
  const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.mp3', '.wav', '.m4a', '.aac'];
  const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only video and audio files are allowed'
    });
  }

  next();
}

module.exports = {
  setupSecurityMiddleware,
  validateRequest,
  validateFileUpload
}; 