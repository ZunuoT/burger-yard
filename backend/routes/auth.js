const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// In-memory admin fallback
const ADMIN = {
  _id: 'admin_001',
  name: 'Admin',
  email: 'admin@burgeryard.com',
  // password: admin123
  password: '$2b$12$ADnvBfK3WXv5F9Irszx5vu/sbAHys5xXLzofwCrLzKa4er0QeA4ee',
  role: 'admin'
};

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

    // Fallback: check hardcoded admin
    if (email !== ADMIN.email) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, ADMIN.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken(ADMIN);
    res.json({ success: true, token, user: { id: ADMIN._id, name: ADMIN.name, email: ADMIN.email, role: ADMIN.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
