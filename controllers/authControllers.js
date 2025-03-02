const pool = require('../config/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Nodemailer transporter
const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',   // e.g. 'smtp.gmail.com' for Gmail
          port: 587,                  // or 465 if using SSL
          secure: false,              // true if port 465, false if 587
          auth: {
            user: 'USER@EMAIL.COM',
            pass: 'USERPASSWORD'
          },
          tls: {
            rejectUnauthorized: false
          }
        });

async function requestPasswordReset(req, res) {
  const { email } = req.body;
  
  try {
    // Check if user exists
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 mins

    // Store token in database
    await pool.query(
      "INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token = ?, expires_at = ?",
      [email, resetToken, expiresAt, resetToken, expiresAt]
    );

    // Send reset link via email
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: '"Elderly Care Portal" <elderlycareportal@gmail.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`
    };
    // console.log("Transporter config: ", transporter.options);
    await transporter.sendMail(mailOptions);
    return res.json({ message: "Password reset email sent." });

  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  try {
    // Validate token
    const [tokens] = await pool.query("SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()", [token]);
    if (tokens.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const email = tokens[0].email;

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [hashedPassword, email]);

    // Delete the token after successful reset
    await pool.query("DELETE FROM password_reset_tokens WHERE email = ?", [email]);

    res.json({ message: "Password reset successful." });

  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { requestPasswordReset, resetPassword };
