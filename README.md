# Media Platform Backend

A production-ready media platform backend built with Node.js and Express. Features authentication, file uploads, secure streaming, analytics, caching, rate limiting, and comprehensive testing.

## Features

### Core Functionality
- **Admin Authentication** - JWT-based signup/login system
- **Media Upload** - Support for video/audio files (up to 100MB)
- **Secure Streaming** - Time-limited streaming URLs
- **Analytics Dashboard** - View tracking with IP and timestamp
- **User Activity Logging** - Comprehensive view analytics

### Production Features
- **Redis Caching** - Analytics data caching for performance
- **Rate Limiting** - Protection against abuse and DDoS
- **Security Headers** - Helmet.js for enhanced security
- **Request Validation** - Input sanitization and validation
- **Compression** - Gzip compression for faster responses
- **Logging** - Structured logging with Morgan
- **Health Checks** - Application health monitoring
- **Docker Support** - Containerized deployment
- **Automated Testing** - Comprehensive test suite with Jest

## Project Structure

```
media-platform-backend/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── Dockerfile               # Production container
├── docker-compose.yml       # Multi-service deployment
├── nginx.conf              # Reverse proxy configuration
├── .env                    # Environment variables (create this!)
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── API_DOCUMENTATION.md   # Detailed API docs
├── SETUP_GUIDE.md         # Step-by-step setup
├── test-api.js            # Manual API testing
├── config/
│   ├── database.js        # Database setup and helpers
│   └── redis.js           # Redis caching configuration
├── routes/
│   ├── auth.js           # Authentication routes
│   └── media.js          # Media and analytics routes
├── middleware/
│   ├── auth.js           # JWT authentication
│   ├── upload.js         # File upload handling
│   ├── rateLimit.js      # Rate limiting configuration
│   └── security.js       # Security middleware
├── tests/
│   ├── auth.test.js      # Authentication tests
│   └── media.test.js     # Media endpoints tests
└── uploads/              # Uploaded files storage
    └── .gitkeep          # Placeholder file
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Redis (optional, for caching)

### Local Development

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd media-platform-backend
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   npm run test:coverage
   ```

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Production deployment:**
   ```bash
   docker-compose --profile production up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

## 📊 API Endpoints

### Authentication
- `POST /auth/signup` - Create admin account
- `POST /auth/login` - Login and get JWT token

### Media Management
- `POST /media` - Upload media file (authenticated)
- `GET /media` - List all media (authenticated)
- `GET /media/:id/stream-url` - Get secure streaming link
- `GET /media/:id/stream` - Stream media with token

### Analytics
- `POST /media/:id/view` - Log a view (IP + timestamp)
- `GET /media/:id/analytics` - Get analytics data (authenticated)

### Health Check
- `GET /health` - Application health status

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `REDIS_URL` | Redis connection URL | redis://localhost:6379 |
| `ALLOWED_ORIGINS` | CORS allowed origins | * |

### Rate Limiting

- **General API**: 100 requests per 15 minutes
- **View Logging**: 10 requests per minute per media
- **Authentication**: 5 attempts per 15 minutes
- **File Uploads**: 10 uploads per hour

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Manual API Testing
```bash
node test-api.js
```

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run
docker-compose up -d

# Production with Nginx
docker-compose --profile production up -d
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure `JWT_SECRET` with a strong secret
3. Set up Redis for caching
4. Configure `ALLOWED_ORIGINS` for your domain
5. Set up SSL certificates for HTTPS

### Performance Optimization
- **Redis Caching**: Analytics data cached for 5 minutes
- **Compression**: Gzip compression enabled
- **Rate Limiting**: Protection against abuse
- **Security Headers**: Enhanced security with Helmet.js

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Protection against abuse
- **Input Validation** - Request sanitization
- **Security Headers** - XSS, CSRF protection
- **File Upload Security** - Type and size validation
- **SQL Injection Prevention** - Parameterized queries

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
- **Development**: Colored console output
- **Production**: Structured logging with error filtering

### Metrics
- Request/response logging
- Error tracking
- Performance monitoring
- Rate limit tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Check the [API Documentation](API_DOCUMENTATION.md)
- Review the [Setup Guide](SETUP_GUIDE.md)
- Run tests to verify functionality
- Check logs for error details

## Learning Outcomes

This project demonstrates:
- **Backend Development** - Express.js, Node.js
- **Database Design** - SQLite with proper schemas
- **Authentication** - JWT implementation
- **File Handling** - Upload and streaming
- **Caching** - Redis integration
- **Security** - Rate limiting, validation, headers
- **Testing** - Automated test suites
- **Deployment** - Docker containerization
- **Monitoring** - Health checks and logging
- **Performance** - Optimization techniques 