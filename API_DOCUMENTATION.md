# Media Platform API Documentation

This document explains how to use the Media Platform API that I built for learning backend development.

## Base URL
```
http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the Authorization header.

**Header Format:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### 1. Authentication

#### POST /auth/signup
Create a new admin account.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Admin account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com"
  }
}
```

**Validation Rules:**
- Email must be valid format
- Password must be at least 6 characters
- Email must be unique

#### POST /auth/login
Login with existing admin credentials.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com"
  }
}
```

### 2. Media Management

#### POST /media
Upload a media file (requires authentication).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
- `media`: The file to upload (video or audio)
- `title`: Title for the media

**Supported File Types:**
- Video: MP4, AVI, MOV, WMV
- Audio: MP3, WAV, M4A, AAC
- Maximum file size: 100MB

**Response:**
```json
{
  "message": "Media uploaded successfully",
  "media": {
    "id": 1,
    "title": "My Video",
    "type": "video",
    "file_url": "/uploads/media-1234567890.mp4",
    "filename": "media-1234567890.mp4"
  }
}
```

#### GET /media
Get list of all media (requires authentication).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "message": "Media list retrieved successfully",
  "media": [
    {
      "id": 1,
      "title": "My Video",
      "type": "video",
      "file_url": "/uploads/media-1234567890.mp4",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. Analytics

#### POST /media/:id/view
Log a view for media tracking.

**Parameters:**
- `id`: Media ID

**Response:**
```json
{
  "message": "View logged successfully",
  "media": {
    "id": 1,
    "title": "My Video"
  },
  "view": {
    "ip": "192.168.1.1",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Notes:**
- Automatically captures client IP address
- No authentication required
- Returns 404 if media doesn't exist

#### GET /media/:id/analytics
Get analytics data for media (requires authentication).

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Parameters:**
- `id`: Media ID

**Response:**
```json
{
  "message": "Analytics retrieved successfully",
  "media": {
    "id": 1,
    "title": "My Video"
  },
  "analytics": {
    "total_views": 174,
    "unique_ips": 122,
    "views_per_day": {
      "2024-01-15": 34,
      "2024-01-14": 56,
      "2024-01-13": 23
    },
    "recent_views": [
      {
        "ip": "192.168.1.1",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Notes:**
- Requires admin authentication
- Shows last 30 days of daily views
- Includes recent 10 views with IP and timestamp
- Returns 404 if media doesn't exist

### 4. Streaming

#### GET /media/:id/stream-url
Generate a secure streaming URL for media.

**Parameters:**
- `id`: Media ID

**Response:**
```json
{
  "message": "Secure streaming URL generated",
  "stream_url": "http://localhost:3000/media/1/stream?token=uuid-token-here",
  "expires_at": "2024-01-15T10:40:00.000Z",
  "media": {
    "id": 1,
    "title": "My Video",
    "type": "video"
  }
}
```

**Notes:**
- Streaming URLs are valid for 10 minutes
- Each request logs the viewer's IP address
- No authentication required for this endpoint

#### GET /media/:id/stream
Stream the actual media file (requires valid token).

**Parameters:**
- `id`: Media ID
- `token`: Streaming token from /stream-url endpoint

**Response:**
- The actual media file stream

## Database Schema

### AdminUser Table
```sql
CREATE TABLE AdminUser (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### MediaAsset Table
```sql
CREATE TABLE MediaAsset (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'audio')),
  file_url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### MediaViewLog Table
```sql
CREATE TABLE MediaViewLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  media_id INTEGER NOT NULL,
  viewed_by_ip TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (media_id) REFERENCES MediaAsset (id)
);
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (invalid token)
- `404` - Not Found
- `409` - Conflict (email already exists)
- `500` - Internal Server Error

## Testing Examples

### Using curl

1. **Signup:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

3. **Upload Media:**
```bash
curl -X POST http://localhost:3000/media \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "media=@video.mp4" \
  -F "title=My Video"
```

4. **Log a view:**
```bash
curl -X POST http://localhost:3000/media/1/view
```

5. **Get analytics (requires auth):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/media/1/analytics
```

6. **Get Streaming URL:**
```bash
curl http://localhost:3000/media/1/stream-url
```

## Security Features

1. **Password Hashing:** All passwords are hashed using bcrypt
2. **JWT Authentication:** Secure token-based authentication
3. **File Type Validation:** Only allows video and audio files
4. **File Size Limits:** 100MB maximum file size
5. **Secure Streaming:** Time-limited tokens for media access
6. **SQL Injection Prevention:** Parameterized queries
7. **CORS Enabled:** Allows cross-origin requests

## Learning Notes

This project helped me learn:
- Express.js framework and middleware
- JWT authentication implementation
- File upload handling with Multer
- SQLite database operations
- API design and RESTful principles
- Error handling and validation
- Security best practices
- Async/await patterns
- Promise-based database operations 