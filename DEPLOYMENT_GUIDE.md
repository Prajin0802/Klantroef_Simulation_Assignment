# Production Deployment Guide

This guide covers deploying the Media Platform Backend to production environments.

## 🚀 Deployment Options

### 1. Docker Compose (Recommended)

**Best for**: Small to medium deployments, single server setups

```bash
# Clone the repository
git clone <repository-url>
cd media-platform-backend

# Set up environment variables
cp env.example .env
# Edit .env with production values

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 2. Docker with Nginx (Production)

**Best for**: Production environments with load balancing

```bash
# Start with Nginx reverse proxy
docker-compose --profile production up -d

# This includes:
# - App container
# - Redis container
# - Nginx reverse proxy
# - SSL termination (if configured)
```

### 3. Manual Deployment

**Best for**: Custom server configurations

```bash
# Install dependencies
npm ci --only=production

# Set environment variables
export NODE_ENV=production
export JWT_SECRET=your-secure-secret
export REDIS_URL=redis://your-redis-server:6379

# Start the application
npm start
```

## 🔧 Production Configuration

### Environment Variables

Create a `.env` file with these production settings:

```bash
# Required
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=production

# Server
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Redis (for caching)
REDIS_URL=redis://your-redis-server:6379

# Security
TRUST_PROXY=true
```

### Generate Secure JWT Secret

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🐳 Docker Deployment

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available

### Basic Deployment

```bash
# 1. Clone repository
git clone <repository-url>
cd media-platform-backend

# 2. Configure environment
cp env.example .env
# Edit .env with your production values

# 3. Build and start
docker-compose up -d --build

# 4. Check logs
docker-compose logs -f app
```

### Production Deployment with Nginx

```bash
# 1. Configure SSL certificates
mkdir ssl
# Place your SSL certificates in ssl/ directory

# 2. Update nginx.conf with your domain
# Edit nginx.conf and replace 'localhost' with your domain

# 3. Start production stack
docker-compose --profile production up -d

# 4. Verify deployment
curl https://yourdomain.com/health
```

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f app
docker-compose logs -f redis
docker-compose logs -f nginx

# Restart services
docker-compose restart app

# Update application
git pull
docker-compose up -d --build

# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

## ☁️ Cloud Deployment

### AWS EC2

```bash
# 1. Launch EC2 instance (Ubuntu 20.04+)
# 2. Install Docker
sudo apt update
sudo apt install docker.io docker-compose

# 3. Clone and deploy
git clone <repository-url>
cd media-platform-backend
cp env.example .env
# Edit .env

# 4. Start services
sudo docker-compose up -d

# 5. Configure security groups
# - Port 80 (HTTP)
# - Port 443 (HTTPS)
# - Port 3000 (App, optional)
```

### Google Cloud Platform

```bash
# 1. Create Compute Engine instance
# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Deploy application
git clone <repository-url>
cd media-platform-backend
docker-compose up -d
```

### DigitalOcean

```bash
# 1. Create Droplet with Docker image
# 2. SSH into droplet
# 3. Clone and deploy
git clone <repository-url>
cd media-platform-backend
docker-compose up -d
```

## 🔒 Security Hardening

### SSL/HTTPS Setup

1. **Obtain SSL Certificate** (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to ssl directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
```

2. **Update Nginx Configuration**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # ... rest of configuration
}
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable

# iptables (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### Database Security

```bash
# For production, consider migrating to PostgreSQL or MySQL
# Update database configuration in config/database.js
```

## 📊 Monitoring & Logging

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Log Monitoring

```bash
# View application logs
docker-compose logs -f app

# View Nginx logs
docker-compose logs -f nginx

# Set up log rotation
sudo logrotate /etc/logrotate.d/media-platform
```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# Check Redis memory usage
docker-compose exec redis redis-cli info memory

# Monitor disk usage
df -h
du -sh uploads/
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
docker-compose down
docker-compose up -d --build

# 3. Verify deployment
curl http://localhost:3000/health
```

### Database Backups

```bash
# Backup SQLite database
cp media_platform.db backup/media_platform_$(date +%Y%m%d_%H%M%S).db

# Backup Redis data
docker-compose exec redis redis-cli BGSAVE
```

### Log Rotation

Create `/etc/logrotate.d/media-platform`:

```
/var/log/media-platform/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000

# Kill the process
sudo kill -9 <PID>
```

2. **Redis Connection Issues**
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

3. **Permission Issues**
```bash
# Fix uploads directory permissions
sudo chown -R 1001:1001 uploads/
sudo chmod -R 755 uploads/
```

4. **Memory Issues**
```bash
# Check memory usage
free -h

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Performance Optimization

1. **Enable Gzip Compression** (already configured)
2. **Optimize Redis Memory**
```bash
# In redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

3. **Monitor Rate Limits**
```bash
# Check rate limit headers in responses
curl -I http://localhost:3000/media/1/analytics
```

## 📞 Support

- Check application logs: `docker-compose logs -f app`
- Verify health endpoint: `curl http://localhost:3000/health`
- Review error responses for specific issues
- Check system resources: `docker stats`

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /path/to/media-platform-backend
            git pull origin main
            docker-compose down
            docker-compose up -d --build
```

This deployment guide covers the essential steps for getting your media platform running in production with proper security, monitoring, and maintenance procedures. 