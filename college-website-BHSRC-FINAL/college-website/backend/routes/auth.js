const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');

// Configure Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getExpiryTime(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

async function sendOTPEmail(email, otp, type = 'login') {
  const collegeInfo = db.prepare('SELECT key, value FROM college_info WHERE key IN (?, ?)').all('college_name', 'college_short_name');
  const info = {};
  collegeInfo.forEach(r => { info[r.key] = r.value; });
  const collegeName = info['college_name'] || 'College';

  const subject = type === 'login' ? `Login OTP - ${collegeName} Admin` : `Password Reset OTP - ${collegeName} Admin`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0c1b33, #1a3a5c); color: white; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px;">${collegeName}</h2>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">Admin Panel ${type === 'login' ? 'Login' : 'Password Reset'} OTP</p>
      </div>
      <div style="padding: 30px 24px;">
        <p style="color: #333;">Hello Admin,</p>
        <p style="color: #555;">Your One-Time Password (OTP) is:</p>
        <div style="background: #f0f4ff; border: 2px dashed #0c1b33; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0c1b33;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 13px;">⏱️ This OTP is valid for <strong>10 minutes</strong> only.</p>
        <p style="color: #888; font-size: 13px;">🔒 Do not share this OTP with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">This is an automated email from ${collegeName} Admin System.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${collegeName} Admin" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html: body,
  });
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const validPass = bcrypt.compareSync(password, admin.password);
  if (!validPass) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  // Invalidate old OTPs
  db.prepare('UPDATE otps SET used = 1 WHERE email = ? AND type = ?').run(email, 'login');

  const otp = generateOTP();
  db.prepare('INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)').run(email, otp, 'login', getExpiryTime(10));

  try {
    await sendOTPEmail(email, otp, 'login');
    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Check Gmail configuration.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

  const record = db.prepare('SELECT * FROM otps WHERE email = ? AND otp = ? AND type = ? AND used = 0 ORDER BY id DESC LIMIT 1').get(email, otp, 'login');
  if (!record) return res.status(401).json({ success: false, message: 'Invalid OTP' });

  if (new Date(record.expires_at) < new Date()) {
    return res.status(401).json({ success: false, message: 'OTP expired. Please request a new one.' });
  }

  db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(record.id);

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  const token = jwt.sign({ id: admin.id, email: admin.email, name: admin.name }, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({ success: true, message: 'Login successful', token, admin: { name: admin.name, email: admin.email } });
});

// POST /api/auth/forgot-password - Send reset OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin) return res.status(404).json({ success: false, message: 'Email not found in admin records' });

  // Invalidate old reset OTPs
  db.prepare('UPDATE otps SET used = 1 WHERE email = ? AND type = ?').run(email, 'reset');

  const otp = generateOTP();
  db.prepare('INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)').run(email, otp, 'reset', getExpiryTime(15));

  try {
    await sendOTPEmail(email, otp, 'reset');
    res.json({ success: true, message: `Password reset OTP sent to ${email}` });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP email' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'All fields required' });

  if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

  const record = db.prepare('SELECT * FROM otps WHERE email = ? AND otp = ? AND type = ? AND used = 0 ORDER BY id DESC LIMIT 1').get(email, otp, 'reset');
  if (!record) return res.status(401).json({ success: false, message: 'Invalid OTP' });

  if (new Date(record.expires_at) < new Date()) {
    return res.status(401).json({ success: false, message: 'OTP expired. Please request a new one.' });
  }

  db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(record.id);

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password = ? WHERE email = ?').run(hash, email);

  res.json({ success: true, message: 'Password reset successful. Please login with new password.' });
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { email, type = 'login' } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

  db.prepare('UPDATE otps SET used = 1 WHERE email = ? AND type = ?').run(email, type);

  const otp = generateOTP();
  db.prepare('INSERT INTO otps (email, otp, type, expires_at) VALUES (?, ?, ?, ?)').run(email, otp, type, getExpiryTime(10));

  try {
    await sendOTPEmail(email, otp, type);
    res.json({ success: true, message: `OTP resent to ${email}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

module.exports = router;
