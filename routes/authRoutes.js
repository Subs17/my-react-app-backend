const express = require('express');
const { requestPasswordReset, resetPassword } = require('../controllers/authControllers');

const router = express.Router();

// Request password reset
router.post('/forgot-password', requestPasswordReset);

// Reset password using token
router.post('/reset-password', resetPassword);

router.post('/logout', (req, res) => {
    // If your JWT is stored in a cookie named "access_token"
    res.clearCookie('access_token', {
      httpOnly: true,
      signed: true,
      secure: false, // or true in production with HTTPS
      sameSite: 'Lax'
    });
    return res.status(200).json({ message: 'Logged out' });
  });

module.exports = router;