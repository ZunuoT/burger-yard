const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const isDBConnected = () => {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
};

const signToken = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role, name: user.name },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    if (isDBConnected()) {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const token = signToken(user);
      return res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/change-password
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    if (isDBConnected()) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const match = await user.comparePassword(currentPassword);
      if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

      // Hash manually to avoid double-hashing from pre-save hook
      const hashed = await bcrypt.hash(newPassword, 12);
      await User.findByIdAndUpdate(req.user.id, { password: hashed });

      return res.json({ success: true, message: 'Password updated successfully' });
    }

    return res.status(500).json({ success: false, message: 'Database not connected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
