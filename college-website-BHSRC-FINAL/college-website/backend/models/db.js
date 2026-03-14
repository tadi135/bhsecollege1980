const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'college.db');
const db = new Database(DB_PATH);

// Enable WAL for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    -- Admin users table
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- OTP table
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'login',
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Password reset tokens
    CREATE TABLE IF NOT EXISTS reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- College info/settings
    CREATE TABLE IF NOT EXISTS college_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sliders/banners
    CREATE TABLE IF NOT EXISTS sliders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      subtitle TEXT,
      image_url TEXT NOT NULL,
      link TEXT,
      order_index INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- News and events
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT DEFAULT 'news',
      image_url TEXT,
      event_date TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Staff/Faculty
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT,
      qualification TEXT,
      experience TEXT,
      image_url TEXT,
      role TEXT DEFAULT 'faculty',
      email TEXT,
      order_index INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      hod TEXT,
      intake INTEGER,
      duration TEXT,
      icon TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Placements
    CREATE TABLE IF NOT EXISTS placements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      company TEXT NOT NULL,
      package TEXT,
      batch TEXT,
      course TEXT,
      image_url TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Companies (recruiters)
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_url TEXT,
      website TEXT,
      order_index INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Gallery
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image_url TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Admissions
    CREATE TABLE IF NOT EXISTS admissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course TEXT NOT NULL,
      type TEXT NOT NULL,
      eligibility TEXT,
      seats INTEGER,
      fee_structure TEXT,
      process TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Testimonials
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      course TEXT,
      batch TEXT,
      message TEXT NOT NULL,
      image_url TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Messages/Enquiries
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin
  const adminExists = db.prepare('SELECT id FROM admins WHERE email = ?').get('admin@bhsrccollege.edu.in');
  if (!adminExists) {
    const hash = bcrypt.hashSync('Bhsrc@1980', 10);
    db.prepare('INSERT INTO admins (email, password, name) VALUES (?, ?, ?)').run('admin@bhsrccollege.edu.in', hash, 'BHSRC Admin');
    console.log('✅ Default admin created: admin@bhsrccollege.edu.in / Bhsrc@1980');
  }

  // Seed default college info
  const defaultInfo = [
    ['college_name', 'BHSRC Degree & Junior College'],
    ['college_short_name', 'BHSRC'],
    ['tagline', 'Shaping Futures, Building Leaders'],
    ['address', '123 Education Street, Knowledge Nagar, Hyderabad - 500001, Telangana'],
    ['phone1', '+91 98765 43210'],
    ['phone2', '+91 40-2345-6789'],
    ['email1', 'info@bhsrccollege.edu.in'],
    ['email2', 'admissions@bhsrccollege.edu.in'],
    ['established', '1980'],
    ['principal_name', 'Dr. K. Venkata Rao'],
    ['principal_message', 'Welcome to BHSRC Degree & Junior College. Our institution is committed to providing quality education and holistic development to every student. We believe in nurturing talent and shaping responsible citizens for tomorrow.'],
    ['principal_image', 'assets/images/principal.jpg'],
    ['vice_principal_name', 'Dr. S. Lakshmi Devi'],
    ['vice_principal_message', 'Education is the most powerful tool to change the world. At BHSRC, we strive to create an environment where students can discover their potential and achieve academic excellence.'],
    ['vice_principal_image', 'assets/images/vice-principal.jpg'],
    ['facebook', 'https://facebook.com/bhsrccollege'],
    ['instagram', 'https://instagram.com/bhsrccollege'],
    ['twitter', 'https://twitter.com/bhsrccollege'],
    ['youtube', 'https://youtube.com/bhsrccollege'],
    ['map_embed', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.8!2d78.4867!3d17.3850!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDIzJzA2LjAiTiA3OMKwMjknMTIuMiJF!5e0!3m2!1sen!2sin!4v1234567890'],
    ['naac_grade', 'A+'],
    ['affiliation', 'Osmania University & Board of Intermediate Education, Telangana'],
    ['total_students', '3500+'],
    ['total_faculty', '120+'],
    ['placement_percent', '95%'],
    ['years_excellence', '45+'],
  ];

  const insertInfo = db.prepare('INSERT OR IGNORE INTO college_info (key, value) VALUES (?, ?)');
  for (const [key, value] of defaultInfo) {
    insertInfo.run(key, value);
  }

  // Seed departments
  const deptExists = db.prepare('SELECT id FROM departments LIMIT 1').get();
  if (!deptExists) {
    const insertDept = db.prepare('INSERT INTO departments (name, type, description, hod, intake, duration) VALUES (?, ?, ?, ?, ?, ?)');
    const depts = [
      ['MPC (Maths, Physics, Chemistry)', 'intermediate', 'Strong foundation for Engineering & Technology aspirants', 'Dr. M. Ramesh', 120, '2 Years'],
      ['BiPC (Biology, Physics, Chemistry)', 'intermediate', 'Gateway to Medical, Pharmacy & Life Sciences careers', 'Dr. P. Sailaja', 120, '2 Years'],
      ['MEC (Maths, Economics, Commerce)', 'intermediate', 'Ideal for Commerce, Economics & Business studies', 'Dr. T. Vijaya Kumar', 80, '2 Years'],
      ['CEC (Civics, Economics, Commerce)', 'intermediate', 'Foundation for Commerce, CA, and Law studies', 'Prof. R. Anitha', 80, '2 Years'],
      ['B.Sc (Mathematics)', 'degree', 'Advanced Mathematics with Statistics & Computer Science', 'Dr. A. Prasad', 60, '3 Years'],
      ['B.Sc (Physics)', 'degree', 'Physics with Mathematics & Electronics', 'Dr. N. Reddy', 60, '3 Years'],
      ['B.Com (General)', 'degree', 'Commerce with Accounting, Finance & Business Studies', 'Prof. K. Madhavi', 120, '3 Years'],
      ['B.Com (Computers)', 'degree', 'Commerce integrated with Computer Applications', 'Dr. S. Rao', 60, '3 Years'],
      ['BA (History & Economics)', 'degree', 'Arts with History, Economics & Political Science', 'Prof. V. Ranjani', 60, '3 Years'],
      ['BCA (Bachelor of Computer Applications)', 'degree', 'Computer Science, Programming & Application Development', 'Dr. R. Chandra', 60, '3 Years'],
    ];
    for (const d of depts) insertDept.run(...d);
  }

  // Seed sample companies
  const compExists = db.prepare('SELECT id FROM companies LIMIT 1').get();
  if (!compExists) {
    const insertComp = db.prepare('INSERT INTO companies (name, logo_url, order_index) VALUES (?, ?, ?)');
    const companies = [
      ['TCS', 'assets/images/companies/tcs.png', 1],
      ['Infosys', 'assets/images/companies/infosys.png', 2],
      ['Wipro', 'assets/images/companies/wipro.png', 3],
      ['HCL Technologies', 'assets/images/companies/hcl.png', 4],
      ['Cognizant', 'assets/images/companies/cognizant.png', 5],
      ['Tech Mahindra', 'assets/images/companies/techmahindra.png', 6],
      ['Accenture', 'assets/images/companies/accenture.png', 7],
      ['Amazon', 'assets/images/companies/amazon.png', 8],
      ['Deloitte', 'assets/images/companies/deloitte.png', 9],
      ['KPMG', 'assets/images/companies/kpmg.png', 10],
      ['ICICI Bank', 'assets/images/companies/icici.png', 11],
      ['HDFC Bank', 'assets/images/companies/hdfc.png', 12],
    ];
    for (const c of companies) insertComp.run(...c);
  }

  // Seed sample sliders
  const sliderExists = db.prepare('SELECT id FROM sliders LIMIT 1').get();
  if (!sliderExists) {
    const insertSlider = db.prepare('INSERT INTO sliders (title, subtitle, image_url, order_index) VALUES (?, ?, ?, ?)');
    const sliders = [
      ['Welcome to Sri Vidya College', 'Empowering Students Since 1995', 'assets/images/slider1.jpg', 1],
      ['Quality Education & Excellence', 'NAAC Accredited A+ Institution', 'assets/images/slider2.jpg', 2],
      ['Admissions Open 2024-25', 'Apply Now for Intermediate & Degree Courses', 'assets/images/slider3.jpg', 3],
      ['95% Placement Record', 'Top Companies Visit Our Campus Every Year', 'assets/images/slider4.jpg', 4],
    ];
    for (const s of sliders) insertSlider.run(...s);
  }

  // Seed sample news
  const newsExists = db.prepare('SELECT id FROM news LIMIT 1').get();
  if (!newsExists) {
    const insertNews = db.prepare('INSERT INTO news (title, content, category, event_date) VALUES (?, ?, ?, ?)');
    const newsData = [
      ['Admissions Open for 2024-25 Academic Year', 'Applications are now being accepted for all Intermediate and Degree programs. Limited seats available. Apply early to secure your spot.', 'news', '2024-06-01'],
      ['Annual Cultural Fest "UTSAV 2024"', 'Join us for 3 days of cultural extravaganza featuring dance, music, drama and art competitions. All students are welcome to participate.', 'event', '2024-08-15'],
      ['Placement Drive by TCS & Infosys', 'Major recruitment drive scheduled on campus. Final year students are requested to register through the placement cell.', 'placement', '2024-09-10'],
      ['National Science Day Celebrations', 'The college celebrated National Science Day with exhibitions, quizzes and lectures by eminent scientists.', 'event', '2024-02-28'],
      ['College Basketball Team Wins State Championship', 'Our college basketball team has won the State Inter-Collegiate Championship. Congratulations to all players!', 'sports', '2024-03-05'],
    ];
    for (const n of newsData) insertNews.run(...n);
  }

  console.log('✅ Database initialized successfully');
}

initDB();

module.exports = db;
