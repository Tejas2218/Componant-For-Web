/* ==========================================================================
   AUTHENTICATION ROUTES (routes/auth.js)
   --------------------------------------------------------------------------
   Role-Based Authentication with strictly TWO roles:
   - ADMIN (Shop Owner)
   - STAFF (Cashier)
   Collections: users (codeathon_db)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getCollection, ObjectId } = require('../mongodb');
const { seedDatabase } = require('../services/seedData');

function usersCol() {
  return getCollection('users');
}

// Simple & safe zero-dependency password hash helper
function hashPassword(password) {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

// 1. POST /api/auth/register
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

    // Strictly enforce TWO roles: ADMIN or STAFF
    const sanitizedRole = (role && String(role).toUpperCase() === 'ADMIN') ? 'ADMIN' : 'STAFF';

    const newUser = {
      name: name ? name.trim() : (sanitizedRole === 'ADMIN' ? 'Shop Admin' : 'Cashier Staff'),
      email: normalizedEmail,
      password: hashPassword(password),
      role: sanitizedRole,
      createdAt: new Date()
    };

    const result = await usersCol().insertOne(newUser);
    const token = `token_${Date.now()}_${result.insertedId.toString()}`;

    return res.status(201).json({
      success: true,
      message: `${sanitizedRole} account registered successfully in MongoDB!`,
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
router.post('/signup', handleRegister); // Backwards compatibility alias

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

    // Ensure role is strictly standardized
    const role = (user.role && String(user.role).toUpperCase() === 'ADMIN') ? 'ADMIN' : 'STAFF';
    const token = `token_${Date.now()}_${user._id.toString()}`;

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
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

    // Fallback to default user if no token provided
    if (!user) {
      user = await usersCol().findOne({ role: 'STAFF' }) || await usersCol().findOne({});
    }

    if (!user) {
      return res.json({
        success: true,
        user: {
          id: 'guest',
          name: 'Guest User',
          email: 'guest@shop.com',
          role: 'STAFF'
        }
      });
    }

    const role = (user.role && String(user.role).toUpperCase() === 'ADMIN') ? 'ADMIN' : 'STAFF';

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// 4. POST /api/auth/seed - Trigger DB Seed on demand
router.post('/seed', async (req, res, next) => {
  try {
    const result = await seedDatabase();
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// 5. GET /api/auth/demo-accounts - Fast-fill accounts for evaluation
router.get('/demo-accounts', (req, res) => {
  return res.json({
    success: true,
    accounts: [
      { role: 'ADMIN', email: 'admin@shop.com', password: 'admin123', label: 'Shop Owner (Admin)' },
      { role: 'STAFF', email: 'staff@shop.com', password: 'staff123', label: 'Cashier Sunil (Staff)' }
    ]
  });
});

// 6. POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
