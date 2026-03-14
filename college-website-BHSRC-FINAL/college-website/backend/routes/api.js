const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET /api/info - College information
router.get('/info', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM college_info').all();
  const info = {};
  rows.forEach(r => { info[r.key] = r.value; });
  res.json({ success: true, data: info });
});

// GET /api/sliders
router.get('/sliders', (req, res) => {
  const sliders = db.prepare('SELECT * FROM sliders WHERE active = 1 ORDER BY order_index ASC').all();
  res.json({ success: true, data: sliders });
});

// GET /api/news
router.get('/news', (req, res) => {
  const { category, limit = 20 } = req.query;
  let query = 'SELECT * FROM news WHERE active = 1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  const news = db.prepare(query).all(...params);
  res.json({ success: true, data: news });
});

// GET /api/news/:id
router.get('/news/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM news WHERE id = ? AND active = 1').get(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: item });
});

// GET /api/staff
router.get('/staff', (req, res) => {
  const { role } = req.query;
  let query = 'SELECT * FROM staff WHERE active = 1';
  const params = [];
  if (role) { query += ' AND role = ?'; params.push(role); }
  query += ' ORDER BY order_index ASC';
  const staff = db.prepare(query).all(...params);
  res.json({ success: true, data: staff });
});

// GET /api/departments
router.get('/departments', (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM departments WHERE active = 1';
  const params = [];
  if (type) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY id ASC';
  const depts = db.prepare(query).all(...params);
  res.json({ success: true, data: depts });
});

// GET /api/placements
router.get('/placements', (req, res) => {
  const { batch, limit = 50 } = req.query;
  let query = 'SELECT * FROM placements WHERE active = 1';
  const params = [];
  if (batch) { query += ' AND batch = ?'; params.push(batch); }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  const placements = db.prepare(query).all(...params);
  res.json({ success: true, data: placements });
});

// GET /api/companies
router.get('/companies', (req, res) => {
  const companies = db.prepare('SELECT * FROM companies WHERE active = 1 ORDER BY order_index ASC').all();
  res.json({ success: true, data: companies });
});

// GET /api/gallery
router.get('/gallery', (req, res) => {
  const { category } = req.query;
  let query = 'SELECT * FROM gallery WHERE active = 1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY created_at DESC';
  const gallery = db.prepare(query).all(...params);
  res.json({ success: true, data: gallery });
});

// GET /api/admissions
router.get('/admissions', (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM admissions WHERE active = 1';
  const params = [];
  if (type) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY id ASC';
  const admissions = db.prepare(query).all(...params);
  res.json({ success: true, data: admissions });
});

// GET /api/testimonials
router.get('/testimonials', (req, res) => {
  const testimonials = db.prepare('SELECT * FROM testimonials WHERE active = 1 ORDER BY id DESC LIMIT 10').all();
  res.json({ success: true, data: testimonials });
});

// POST /api/enquiry - Contact form submission
router.post('/enquiry', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ success: false, message: 'Name and message are required' });

  db.prepare('INSERT INTO enquiries (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)').run(name, email || '', phone || '', subject || '', message);
  res.json({ success: true, message: 'Your enquiry has been submitted. We will contact you soon!' });
});

module.exports = router;
