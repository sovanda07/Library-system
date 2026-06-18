const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Request password reset - sends reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      user.resetToken = resetToken;
      await user.save();

      // For testing only - remove in production
      console.log('Reset token:', resetToken);
    }

    return res.status(200).json({
      message: 'If this email exists, a reset link has been sent'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset password - validate token and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({
      _id: decoded.userId,
      resetToken: token
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetToken = null;
    await user.save();

    res.status(200).json({
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;