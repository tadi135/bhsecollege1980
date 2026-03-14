require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow Netlify frontend + local dev
const ALLOWED = [
  'https://bhsrccollege1980.netlify.app',   // Netlify live site
  'http://localhost:5500',                   // VS Code Live Server
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);          // curl, Postman, mobile
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(null, true);                       // permissive behind proxy
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Uploaded images (staff photos, gallery, logos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api',      require('./routes/api'));
app.use('/api/admin',require('./routes/admin'));

// Health check — used by admin panel to detect if server is online
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    college: 'BHSRC College',
    timestamp: new Date().toISOString(),
    message: 'BHSRC College API is running!',
  });
});

// 404 fallback
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎓 BHSRC College API Running!`);
  console.log(`📡 Port     : ${PORT}`);
  console.log(`🌍 NODE_ENV : ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Gmail    : ${process.env.GMAIL_USER || '(not set)'}`);
  console.log(`\n🔐 Admin login:`);
  console.log(`   Email    : admin@bhsrccollege.edu.in`);
  console.log(`   Password : Bhsrc@1980\n`);
});

module.exports = app;
