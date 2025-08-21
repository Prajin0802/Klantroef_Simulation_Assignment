# Setup Guide for Media Platform Backend

This guide will help you set up and run the media platform backend on your local machine.

## Prerequisites

Before you start, make sure you have the following installed:
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

To check if you have them installed, run:
```bash
node --version
npm --version
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/)

## Step 1: Clone or Download the Project

If you have the project files, navigate to the project directory in your terminal:
```bash
cd path/to/media-platform-backend
```

## Step 2: Install Dependencies

Install all the required packages:
```bash
npm install
```

This will create a `node_modules` folder with all the dependencies.

## Step 3: Set Up Environment Variables

1. Create a `.env` file in the root directory of the project
2. Add the following content to the `.env` file:

```
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
PORT=3000
```

**Important:** Replace `your_super_secret_jwt_key_here_change_this_in_production` with a secure random string. You can generate one by running this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Start the Server

Run the development server:
```bash
npm run dev
```

You should see output like:
```
Database setup completed
Server is running on port 3000
Visit http://localhost:3000 to test the API
```

## Step 5: Test the API

### Option 1: Use the Test Script
Run the included test script:
```bash
node test-api.js
```

### Option 2: Use curl Commands

1. **Test the server:**
```bash
curl http://localhost:3000
```

2. **Create an admin account:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

3. **Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

### Option 3: Use Postman or Similar Tools

1. Import the API endpoints into Postman
2. Set the base URL to `http://localhost:3000`
3. Test each endpoint

## Step 6: Upload and Test Media

1. **Get a JWT token** by logging in (use the token from the login response)

2. **Upload a media file:**
```bash
curl -X POST http://localhost:3000/media \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "media=@path/to/your/video.mp4" \
  -F "title=My Test Video"
```

3. **Get a streaming URL:**
```bash
curl http://localhost:3000/media/1/stream-url
```

4. **Test the streaming URL** by opening it in a browser

## Project Structure Explained

```
media-platform-backend/
├── server.js              # Main server file
├── package.json           # Project dependencies and scripts
├── .env                   # Environment variables (create this!)
├── .gitignore            # Files to ignore in git
├── README.md             # Project overview
├── API_DOCUMENTATION.md  # Detailed API docs
├── SETUP_GUIDE.md        # This file
├── test-api.js           # Test script
├── config/
│   └── database.js       # Database setup and helpers
├── routes/
│   ├── auth.js          # Authentication routes
│   └── media.js         # Media routes
├── middleware/
│   ├── auth.js          # JWT authentication
│   └── upload.js        # File upload handling
└── uploads/             # Uploaded files (created automatically)
    └── .gitkeep         # Placeholder file
```

## Troubleshooting

### Common Issues:

1. **"Port 3000 is already in use"**
   - Change the PORT in your `.env` file to another number (e.g., 3001)
   - Or kill the process using port 3000

2. **"Module not found" errors**
   - Run `npm install` again
   - Make sure you're in the correct directory

3. **"JWT_SECRET is not defined"**
   - Make sure your `.env` file exists and has the JWT_SECRET variable
   - Restart the server after creating the `.env` file

4. **Database errors**
   - The database file (`media_platform.db`) will be created automatically
   - If you get permission errors, check your file permissions

5. **File upload errors**
   - Make sure the `uploads` directory exists
   - Check file size (max 100MB)
   - Verify file type (only video/audio files allowed)

## Next Steps

Once you have the basic setup working:

1. **Read the API documentation** in `API_DOCUMENTATION.md`
2. **Test all endpoints** using the test script or curl
3. **Try uploading different file types** (MP4, MP3, etc.)
4. **Experiment with the streaming functionality**
5. **Look at the code** to understand how everything works

## Learning Resources

This project uses these technologies:
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **bcrypt** - Password hashing

Good resources to learn more:
- [Express.js documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [SQLite documentation](https://www.sqlite.org/docs.html)

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify all setup steps were completed
3. Make sure all dependencies are installed
4. Check that your `.env` file is properly configured

Remember: This is a learning project, so feel free to experiment and modify the code! 