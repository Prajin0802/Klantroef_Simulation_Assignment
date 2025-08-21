# Media Platform Backend

This is a simple media platform backend built with Node.js and Express. I built this to learn about backend development, authentication, and file handling.

## What this project does:
- Allows admin users to sign up and login
- Admins can upload media files (videos/audio)
- Generates secure streaming links for media
- Tracks who views the media with IP and timestamp
- Provides analytics dashboard with view statistics

## Project Structure:
```
├── server.js              # Main server file
├── config/
│   └── database.js        # Database setup and tables
├── routes/
│   ├── auth.js           # Authentication routes (signup/login)
│   └── media.js          # Media upload and streaming routes
├── middleware/
│   ├── auth.js           # JWT authentication middleware
│   └── upload.js         # File upload handling
├── uploads/              # Where uploaded files are stored
└── .env                  # Environment variables (create this!)
```

## Setup Instructions:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```
   JWT_SECRET=your_secret_key_here
   PORT=3000
   ```

3. Run the server:
   ```bash
   npm run dev
   ```

## API Endpoints:

### Authentication:
- `POST /auth/signup` - Create new admin account
- `POST /auth/login` - Login and get JWT token

### Media:
- `POST /media` - Upload media file (requires authentication)
- `GET /media/:id/stream-url` - Get secure streaming link
- `POST /media/:id/view` - Log a view (IP + timestamp)
- `GET /media/:id/analytics` - Get analytics data (requires authentication)

## Learning Notes:
- I used SQLite for simplicity (no complex database setup needed)
- JWT tokens for authentication (learning about stateless auth)
- Multer for handling file uploads
- Basic error handling and validation

## Things I learned while building this:
- How to structure a Node.js project
- Database schema design
- JWT authentication flow
- File upload handling
- API route organization
- Basic security practices
- User activity logging and analytics
- Data aggregation and formatting
- Error handling for edge cases 