/* ==========================================================================
   USER PROFILE ROUTES (routes/profile.js)
   Profile Details, Bio Update & Password Security
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/profile
router.get('/', (req, res) => {
  const user = db.get('users')[0];
  return res.json({
    success: true,
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      company: user.company,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  });
});

// PUT /api/profile/update
router.put('/update', (req, res) => {
  const { name, email, bio, company } = req.body;
  const user = db.get('users')[0];

  const updatedUser = db.update('users', user.id, {
    name: name || user.name,
    email: email || user.email,
    bio: bio || user.bio,
    company: company || user.company
  });

  return res.json({
    success: true,
    message: 'Profile details updated successfully!',
    profile: updatedUser
  });
});

// PUT /api/profile/password
router.put('/password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.get('users')[0];

  if (currentPassword !== user.password) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  db.update('users', user.id, { password: newPassword });

  return res.json({
    success: true,
    message: 'Password updated successfully!'
  });
});

module.exports = router;
