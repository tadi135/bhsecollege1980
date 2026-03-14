const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../models/db');
const authMiddleware = require('../middleware/auth');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// All admin routes require auth
router.use(authMiddleware);

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', (req, res) => {
  const stats = {
    sliders: db.prepare('SELECT COUNT(*) as count FROM sliders WHERE active=1').get().count,
    news: db.prepare('SELECT COUNT(*) as count FROM news WHERE active=1').get().count,
    staff: db.prepare('SELECT COUNT(*) as count FROM staff WHERE active=1').get().count,
    placements: db.prepare('SELECT COUNT(*) as count FROM placements WHERE active=1').get().count,
    companies: db.prepare('SELECT COUNT(*) as count FROM companies WHERE active=1').get().count,
    gallery: db.prepare('SELECT COUNT(*) as count FROM gallery WHERE active=1').get().count,
    enquiries: db.prepare('SELECT COUNT(*) as count FROM enquiries').get().count,
    newEnquiries: db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE status='new'").get().count,
  };
  res.json({ success: true, data: stats });
});

// ========== COLLEGE INFO ==========
router.get('/college-info', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM college_info').all();
  const info = {};
  rows.forEach(r => { info[r.key] = r.value; });
  res.json({ success: true, data: info });
});

router.put('/college-info', (req, res) => {
  const updates = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO college_info (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(key, value);
    }
  });
  tx();
  res.json({ success: true, message: 'College info updated' });
});

// ========== SLIDERS ==========
router.get('/sliders', (req, res) => {
  const sliders = db.prepare('SELECT * FROM sliders ORDER BY order_index ASC').all();
  res.json({ success: true, data: sliders });
});

router.post('/sliders', upload.single('image'), (req, res) => {
  const { title, subtitle, link, order_index } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;
  if (!image_url) return res.status(400).json({ success: false, message: 'Image required' });
  const result = db.prepare('INSERT INTO sliders (title, subtitle, image_url, link, order_index) VALUES (?, ?, ?, ?, ?)').run(title || '', subtitle || '', image_url, link || '', order_index || 0);
  res.json({ success: true, message: 'Slider added', id: result.lastInsertRowid });
});

router.put('/sliders/:id', upload.single('image'), (req, res) => {
  const { title, subtitle, link, order_index, active } = req.body;
  const existing = db.prepare('SELECT * FROM sliders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || existing.image_url);
  db.prepare('UPDATE sliders SET title=?, subtitle=?, image_url=?, link=?, order_index=?, active=? WHERE id=?').run(title || existing.title, subtitle || existing.subtitle, image_url, link || existing.link, order_index ?? existing.order_index, active ?? existing.active, req.params.id);
  res.json({ success: true, message: 'Slider updated' });
});

router.delete('/sliders/:id', (req, res) => {
  db.prepare('DELETE FROM sliders WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Slider deleted' });
});

// ========== NEWS ==========
router.get('/news', (req, res) => {
  const news = db.prepare('SELECT * FROM news ORDER BY created_at DESC').all();
  res.json({ success: true, data: news });
});

router.post('/news', upload.single('image'), (req, res) => {
  const { title, content, category, event_date } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title required' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || '');
  const result = db.prepare('INSERT INTO news (title, content, category, image_url, event_date) VALUES (?, ?, ?, ?, ?)').run(title, content || '', category || 'news', image_url, event_date || '');
  res.json({ success: true, message: 'News added', id: result.lastInsertRowid });
});

router.put('/news/:id', upload.single('image'), (req, res) => {
  const { title, content, category, event_date, active } = req.body;
  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || existing.image_url);
  db.prepare('UPDATE news SET title=?, content=?, category=?, image_url=?, event_date=?, active=? WHERE id=?').run(title || existing.title, content ?? existing.content, category || existing.category, image_url, event_date || existing.event_date, active ?? existing.active, req.params.id);
  res.json({ success: true, message: 'News updated' });
});

router.delete('/news/:id', (req, res) => {
  db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'News deleted' });
});

// ========== STAFF ==========
router.get('/staff', (req, res) => {
  const staff = db.prepare('SELECT * FROM staff ORDER BY order_index ASC').all();
  res.json({ success: true, data: staff });
});

router.post('/staff', upload.single('image'), (req, res) => {
  const { name, designation, department, qualification, experience, role, email, order_index } = req.body;
  if (!name || !designation) return res.status(400).json({ success: false, message: 'Name and designation required' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || '');
  const result = db.prepare('INSERT INTO staff (name, designation, department, qualification, experience, image_url, role, email, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(name, designation, department || '', qualification || '', experience || '', image_url, role || 'faculty', email || '', order_index || 0);
  res.json({ success: true, message: 'Staff added', id: result.lastInsertRowid });
});

router.put('/staff/:id', upload.single('image'), (req, res) => {
  const { name, designation, department, qualification, experience, role, email, order_index, active } = req.body;
  const existing = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || existing.image_url);
  db.prepare('UPDATE staff SET name=?, designation=?, department=?, qualification=?, experience=?, image_url=?, role=?, email=?, order_index=?, active=? WHERE id=?').run(name || existing.name, designation || existing.designation, department ?? existing.department, qualification ?? existing.qualification, experience ?? existing.experience, image_url, role || existing.role, email ?? existing.email, order_index ?? existing.order_index, active ?? existing.active, req.params.id);
  res.json({ success: true, message: 'Staff updated' });
});

router.delete('/staff/:id', (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Staff deleted' });
});

// ========== PLACEMENTS ==========
router.get('/placements', (req, res) => {
  const placements = db.prepare('SELECT * FROM placements ORDER BY created_at DESC').all();
  res.json({ success: true, data: placements });
});

router.post('/placements', upload.single('image'), (req, res) => {
  const { student_name, company, package: pkg, batch, course } = req.body;
  if (!student_name || !company) return res.status(400).json({ success: false, message: 'Student name and company required' });
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || '');
  const result = db.prepare('INSERT INTO placements (student_name, company, package, batch, course, image_url) VALUES (?, ?, ?, ?, ?, ?)').run(student_name, company, pkg || '', batch || '', course || '', image_url);
  res.json({ success: true, message: 'Placement record added', id: result.lastInsertRowid });
});

router.put('/placements/:id', upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM placements WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const { student_name, company, package: pkg, batch, course, active } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || existing.image_url);
  db.prepare('UPDATE placements SET student_name=?, company=?, package=?, batch=?, course=?, image_url=?, active=? WHERE id=?').run(student_name || existing.student_name, company || existing.company, pkg ?? existing.package, batch ?? existing.batch, course ?? existing.course, image_url, active ?? existing.active, req.params.id);
  res.json({ success: true, message: 'Placement updated' });
});

router.delete('/placements/:id', (req, res) => {
  db.prepare('DELETE FROM placements WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Placement deleted' });
});

// ========== COMPANIES ==========
router.get('/companies', (req, res) => {
  const companies = db.prepare('SELECT * FROM companies ORDER BY order_index ASC').all();
  res.json({ success: true, data: companies });
});

router.post('/companies', upload.single('logo'), (req, res) => {
  const { name, website, order_index } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Company name required' });
  const logo_url = req.file ? `/uploads/${req.file.filename}` : (req.body.logo_url || '');
  const result = db.prepare('INSERT INTO companies (name, logo_url, website, order_index) VALUES (?, ?, ?, ?)').run(name, logo_url, website || '', order_index || 0);
  res.json({ success: true, message: 'Company added', id: result.lastInsertRowid });
});

router.put('/companies/:id', upload.single('logo'), (req, res) => {
  const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const { name, website, order_index, active } = req.body;
  const logo_url = req.file ? `/uploads/${req.file.filename}` : (req.body.logo_url || existing.logo_url);
  db.prepare('UPDATE companies SET name=?, logo_url=?, website=?, order_index=?, active=? WHERE id=?').run(name || existing.name, logo_url, website ?? existing.website, order_index ?? existing.order_index, active ?? existing.active, req.params.id);
  res.json({ success: true, message: 'Company updated' });
});

router.delete('/companies/:id', (req, res) => {
  db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Company deleted' });
});

// ========== GALLERY ==========
router.get('/gallery', (req, res) => {
  const gallery = db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
  res.json({ success: true, data: gallery });
});

router.post('/gallery', upload.array('images', 10), (req, res) => {
  const { title, category } = req.body;
  if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'Images required' });
  const stmt = db.prepare('INSERT INTO gallery (title, image_url, category) VALUES (?, ?, ?)');
  const tx = db.transaction(() => {
    for (const file of req.files) {
      stmt.run(title || '', `/uploads/${file.filename}`, category || 'general');
    }
  });
  tx();
  res.json({ success: true, message: `${req.files.length} image(s) added to gallery` });
});

router.delete('/gallery/:id', (req, res) => {
  db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Image deleted' });
});

// ========== DEPARTMENTS ==========
router.get('/departments', (req, res) => {
  const depts = db.prepare('SELECT * FROM departments ORDER BY id ASC').all();
  res.json({ success: true, data: depts });
});

router.post('/departments', (req, res) => {
  const { name, type, description, hod, intake, duration } = req.body;
  if (!name || !type) return res.status(400).json({ success: false, message: 'Name and type required' });
  const result = db.prepare('INSERT INTO departments (name, type, description, hod, intake, duration) VALUES (?, ?, ?, ?, ?, ?)').run(name, type, description || '', hod || '', intake || 0, duration || '');
  res.json({ success: true, message: 'Department added', id: result.lastInsertRowid });
});

router.put('/departments/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM departments WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const { name, type, description, hod, intake, duration, active } = req.body;
  db.prepare('UPDATE departments SET name=?, type=?, description=?, hod=?, intake=?, duration=?, active=? WHERE id=?').run(name || existing.name, type || existing.type, description ?? existing.description, hod ?? existing.hod, intake ?? existing.intake, duration ?? existing.duration, active ?? existing.active, req.params.id);
  res.json({ success: true, message: 'Department updated' });
});

router.delete('/departments/:id', (req, res) => {
  db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Department deleted' });
});

// ========== ENQUIRIES ==========
router.get('/enquiries', (req, res) => {
  const enquiries = db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC').all();
  res.json({ success: true, data: enquiries });
});

router.put('/enquiries/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, message: 'Enquiry status updated' });
});

router.delete('/enquiries/:id', (req, res) => {
  db.prepare('DELETE FROM enquiries WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Enquiry deleted' });
});

// ========== ADMISSIONS ==========
router.get('/admissions', (req, res) => {
  const admissions = db.prepare('SELECT * FROM admissions ORDER BY id ASC').all();
  res.json({ success: true, data: admissions });
});

router.post('/admissions', (req, res) => {
  const { course, type, eligibility, seats, fee_structure, process } = req.body;
  if (!course || !type) return res.status(400).json({ success: false, message: 'Course and type required' });
  const result = db.prepare('INSERT INTO admissions (course, type, eligibility, seats, fee_structure, process) VALUES (?, ?, ?, ?, ?, ?)').run(course, type, eligibility || '', seats || 0, fee_structure || '', process || '');
  res.json({ success: true, message: 'Admission info added', id: result.lastInsertRowid });
});

router.put('/admissions/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM admissions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });
  const { course, type, eligibility, seats, fee_structure, process, active } = req.body;
  db.prepare('UPDATE admissions SET course=?, type=?, eligibility=?, seats=?, fee_structure=?, process=?, active=? WHERE id=?').run(course || existing.course, type || existing.type, eligibility ?? existing.eligibility, seats ?? existing.seats, fee_structure ?? existing.fee_structure, process ?? existing.process, active ?? existing.active, req.params.id);
  res.json({ success: true, message: 'Admission info updated' });
});

router.delete('/admissions/:id', (req, res) => {
  db.prepare('DELETE FROM admissions WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Admission record deleted' });
});

// ========== CHANGE ADMIN PASSWORD ==========
router.post('/change-password', (req, res) => {
  const bcrypt = require('bcryptjs');
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords required' });
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(currentPassword, admin.password)) return res.status(401).json({ success: false, message: 'Current password incorrect' });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hash, req.admin.id);
  res.json({ success: true, message: 'Password changed successfully' });
});

module.exports = router;
