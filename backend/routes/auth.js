/* ==========================================================================
   AUTHENTICATION ROUTES (routes/auth.js)
   Copy-paste ready auth endpoints for Signup, Login, Logout, Session Me
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const existingUser = db.findOne('users', u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User with this email already exists.' });
  }

  const newUser = db.create('users', {
    name: name || email.split('@')[0],
    email,
    password,
    role: 'Member',
    avatar: (name || email).substring(0, 2).toUpperCase()
  });

  // Mock Session Token
  const token = `token_${Date.now()}_${newUser.id}`;

  return res.status(201).json({
    success: true,
    message: 'Account created successfully!',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar
    }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
  }

  const user = db.findOne('users', u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your email and password.' });
  }

  const token = `token_${Date.now()}_${user.id}`;

  return res.json({
    success: true,
    message: 'Welcome back!',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  });
});

// GET /api/auth/me (Active User Profile)
router.get('/me', (req, res) => {
  const user = db.get('users')[0]; // Default mock active user
  return res.json({ success: true, user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
