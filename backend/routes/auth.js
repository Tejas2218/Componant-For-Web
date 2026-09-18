/* ==========================================================================
   AUTHENTICATION ROUTES (routes/auth.js)
   --------------------------------------------------------------------------
   Simple, Student-Friendly MongoDB Auth with Zero-Dependency Password Hashing
   Collections: users (codeathon_db)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getCollection, ObjectId } = require('../mongodb');

function usersCol() {
  return getCollection('users');
}

// Simple & safe zero-dependency password hash helper
function hashPassword(password) {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

// 1. POST /api/auth/register (and alias /signup for backwards compatibility)
async function handleRegister(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await usersCol().findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const newUser = {
      name: name ? name.trim() : normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password: hashPassword(password),
      role: role || 'user',
      createdAt: new Date()
    };

    const result = await usersCol().insertOne(newUser);
    const token = `token_${Date.now()}_${result.insertedId.toString()}`;

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully in MongoDB!',
      token,
      user: {
        id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

router.post('/register', handleRegister);
router.post('/signup', handleRegister); // Alias for existing components

// 2. POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await usersCol().findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No user found with this email.'
      });
    }

    const passwordHash = hashPassword(password);
    if (user.password !== passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    const token = `token_${Date.now()}_${user._id.toString()}`;

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. GET /api/auth/me - Active User Profile
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer token_')) {
      const parts = authHeader.split('_');
      if (parts.length >= 3) {
        userId = parts[2];
      }
    }

    let user = null;
    if (userId && ObjectId.isValid(userId)) {
      user = await usersCol().findOne({ _id: new ObjectId(userId) });
    }

    // Fallback to the latest registered user if no token provided
    if (!user) {
      user = await usersCol().find({}).sort({ createdAt: -1 }).limit(1).next();
    }

    if (!user) {
      return res.json({
        success: true,
        user: {
          id: 'guest',
          name: 'Guest Developer',
          email: 'guest@codeathon.local',
          role: 'guest'
        }
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// 4. POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
