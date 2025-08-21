const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getRow } = require('../config/database');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// POST /auth/signup - Create new admin account
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Check if email is valid format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    // Check if password is at least 6 characters
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = await getRow(
      'SELECT id FROM AdminUser WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user into database
    const result = await runQuery(
      'INSERT INTO AdminUser (email, hashed_password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email: email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin account created successfully',
      token: token,
      user: {
        id: result.id,
        email: email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Failed to create account' 
    });
  }
});

// POST /auth/login - Login and get JWT token
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await getRow(
      'SELECT id, email, hashed_password FROM AdminUser WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to login' 
    });
  }
});

module.exports = router; 