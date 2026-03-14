/* ============================================================
   COLLEGE WEBSITE - SHARED JAVASCRIPT  v2 (FAST LOADING)
   KEY FIXES:
   - Header/footer render INSTANTLY with static defaults (no API wait)
   - localStorage caching (10 min TTL) so repeated visits are instant
   - fetchWithTimeout(3s) — never hangs waiting for slow/dead server
   - All dynamic sections show fallback content, API data updates silently
   ============================================================ */

// API_BASE comes from config.js (loaded before this script in every HTML file)
// On localhost  → http://localhost:3000/api
// On live site  → https://www.bhsrccollege.edu.in/api  (set in config.js)
const API_BASE = (typeof CONFIG !== 'undefined') ? CONFIG.API_BASE : 'http://localhost:3000/api';
const SERVER_ROOT = (typeof CONFIG !== 'undefined') ? CONFIG.SERVER_ROOT : 'http://localhost:3000';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ===== STATIC DEFAULTS — renders instantly without any API call =====
const DEFAULTS = {
  college_name: 'BHSRC Degree & Junior College',
  college_short_name: 'BHSRC',
  tagline: 'Shaping Futures, Building Leaders',
  affiliation: 'Osmania University & Board of Intermediate Education',
  phone1: '+91 98765 43210', phone2: '+91 40-2345-6789',
  email1: 'info@bhsrccollege.edu.in', email2: 'admissions@bhsrccollege.edu.in',
  address: '123 Education Street, Knowledge Nagar, Hyderabad - 500001',
  principal_name: 'Dr. K. Venkata Rao',
  vice_principal_name: 'Dr. S. Lakshmi Devi',
  principal_message: 'Welcome to BHSRC College. Our institution is committed to providing quality education and holistic development to every student who walks through our doors.',
  vice_principal_message: 'Education is the most powerful tool to change the world. We strive to create an environment where students can discover their potential and achieve academic excellence.',
  naac_grade: 'A+', established: '1980',
  years_excellence: '45+', total_students: '3500+', total_faculty: '120+', placement_percent: '95%',
  facebook: '', instagram: '', twitter: '', youtube: '',
};

// ===== CACHE HELPERS =====
function cacheSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch(e) {}
}
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch(e) { return null; }
}

// ===== FETCH WITH 3-SECOND TIMEOUT =====
async function apiFetch(endpoint, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: ctrl.signal, ...options
    });
    clearTimeout(timer);
    return await res.json();
  } catch(e) {
    clearTimeout(timer);
    return { success: false, data: [] };
  }
}

// ===== COLLEGE INFO (cache-first) =====
let _info = null;
async function getCollegeInfo() {
  if (_info) return _info;
  const cached = cacheGet('college_info');
  if (cached) { _info = cached; return _info; }
  const res = await apiFetch('/info');
  _info = (res.success && res.data) ? { ...DEFAULTS, ...res.data } : { ...DEFAULTS };
  if (res.success) cacheSet('college_info', _info);
  return _info;
}

// ===== NAV LINKS (static — no API) =====
const NAV = [
  { label:'Home', href:'index.html' },
  { label:'About Us', href:'about.html', sub:[
    {label:'About the College',href:'about.html'},
    {label:"Principal's Message",href:'about.html#principal'},
    {label:"Vice Principal's Message",href:'about.html#vice-principal'},
    {label:'Vision & Mission',href:'about.html#vision'},
    {label:'Our History',href:'about.html#history'},
  ]},
  { label:'Academics', href:'academics.html', sub:[
    {label:'Intermediate (Junior)',href:'academics.html#intermediate'},
    {label:'Degree Courses',href:'academics.html#degree'},
    {label:'All Departments',href:'departments.html'},
    {label:'Faculty & Staff',href:'staff.html'},
  ]},
  { label:'Admissions', href:'admissions.html', sub:[
    {label:'Admission Process',href:'admissions.html#process'},
    {label:'Fee Structure',href:'admissions.html#fees'},
    {label:'Scholarships',href:'admissions.html#scholarships'},
    {label:'Apply Online',href:'admissions.html#apply'},
  ]},
  { label:'Placements', href:'placements.html', sub:[
    {label:'Placement Overview',href:'placements.html'},
    {label:'Placed Students',href:'placements.html#students'},
    {label:'Recruiters',href:'placements.html#companies'},
    {label:'Statistics',href:'placements.html#stats'},
  ]},
  { label:'Facilities', href:'facilities.html', sub:[
    {label:'Library',href:'facilities.html#library'},
    {label:'Laboratories',href:'facilities.html#labs'},
    {label:'Sports & Gym',href:'facilities.html#sports'},
    {label:'Transport',href:'facilities.html#transport'},
    {label:'Hostel',href:'facilities.html#hostel'},
  ]},
  { label:'Gallery', href:'gallery.html', sub:[
    {label:'All Photos',href:'gallery.html'},
    {label:'Campus',href:'gallery.html?cat=campus'},
    {label:'Events',href:'gallery.html?cat=events'},
    {label:'Sports',href:'gallery.html?cat=sports'},
  ]},
  { label:'News & Events', href:'news.html' },
  { label:'Contact Us', href:'contact.html' },
];

// ===== BUILD HEADER (pure, synchronous) =====
function _buildHeader(info) {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const navHtml = NAV.map(l => {
    const active = page === l.href ? 'active' : '';
    if (l.sub) {
      return `<li><a href="${l.href}" class="${active}">${l.label} <span class="arrow">▾</span></a>
        <div class="dropdown">${l.sub.map(s=>`<a href="${s.href}">${s.label}</a>`).join('')}</div></li>`;
    }
    return `<li><a href="${l.href}" class="${active}">${l.label}</a></li>`;
  }).join('');

  const phones = [info.phone1, info.phone2].filter(Boolean).join(' | ');
  const ab = (info.college_short_name || 'SV').substring(0,2);

  return `
  <div class="naac-banner">🏆 NAAC Accredited ${info.naac_grade||'A+'} &nbsp;|&nbsp; ${(info.affiliation||'').substring(0,65)}</div>
  <div class="top-bar"><div class="container">
    <div class="contact-info">📞 ${phones} &nbsp;|&nbsp; ✉️ ${info.email1||''}</div>
    <div class="social-links">
      ${info.facebook?`<a href="${info.facebook}" target="_blank" rel="noopener">📘</a>`:''}
      ${info.instagram?`<a href="${info.instagram}" target="_blank" rel="noopener">📷</a>`:''}
      ${info.twitter?`<a href="${info.twitter}" target="_blank" rel="noopener">🐦</a>`:''}
      ${info.youtube?`<a href="${info.youtube}" target="_blank" rel="noopener">▶️</a>`:''}
    </div>
  </div></div>
  <header class="site-header"><div class="container"><div class="header-inner">
    <a href="index.html" class="logo-wrap">
      <div class="logo-icon">${info.logo_url?`<img src="${info.logo_url}" alt="Logo">`:`<span>${ab}</span>`}</div>
      <div class="logo-text">
        <div class="college-name">${info.college_name||DEFAULTS.college_name}</div>
        <div class="college-tagline">${info.tagline||DEFAULTS.tagline}</div>
        <div class="college-affiliation">${(info.affiliation||'').substring(0,55)}</div>
      </div>
    </a>
    <nav class="main-nav" id="mainNav"><ul>${navHtml}</ul></nav>
    <button class="hamburger" id="hamburger" aria-label="Toggle menu"><span></span><span></span><span></span></button>
  </div></div></header>
  <div class="nav-overlay" id="navOverlay"></div>`;
}

// ===== BUILD FOOTER (pure, synchronous) =====
function _buildFooter(info) {
  const ab = (info.college_short_name||'SV').substring(0,2);
  return `
  <footer class="site-footer">
    <div class="accreditation-strip">
      <div class="acc-label">Recognized & Affiliated</div>
      <div class="acc-badges">
        <div class="acc-badge">NAAC Grade <span class="grade">${info.naac_grade||'A+'}</span></div>
        <div class="acc-badge">Est. <strong>${info.established||'1980'}</strong></div>
        <div class="acc-badge">Osmania University Affiliated</div>
        <div class="acc-badge">ISO 9001:2015 Certified</div>
      </div>
    </div>
    <div class="container"><div class="footer-grid">
      <div class="footer-brand">
        <div class="logo-wrap">
          <div class="logo-icon"><span>${ab}</span></div>
          <div class="logo-text">
            <div class="college-name">${info.college_name||DEFAULTS.college_name}</div>
            <div class="college-tagline" style="color:rgba(255,255,255,0.5)">${info.tagline||''}</div>
          </div>
        </div>
        <p class="footer-desc">${info.college_name||DEFAULTS.college_name} — a premier institution dedicated to excellence in education since ${info.established||'1980'}.</p>
        <div class="footer-social">
          ${info.facebook?`<a href="${info.facebook}" target="_blank" rel="noopener">📘</a>`:''}
          ${info.instagram?`<a href="${info.instagram}" target="_blank" rel="noopener">📷</a>`:''}
          ${info.twitter?`<a href="${info.twitter}" target="_blank" rel="noopener">🐦</a>`:''}
          ${info.youtube?`<a href="${info.youtube}" target="_blank" rel="noopener">▶️</a>`:''}
        </div>
      </div>
      <div>
        <div class="footer-heading">Quick Links</div>
        <div class="footer-links">
          <a href="index.html">Home</a><a href="about.html">About Us</a>
          <a href="academics.html">Academics</a><a href="admissions.html">Admissions</a>
          <a href="placements.html">Placements</a><a href="gallery.html">Gallery</a>
          <a href="news.html">News & Events</a><a href="contact.html">Contact Us</a>
        </div>
      </div>
      <div>
        <div class="footer-heading">Courses</div>
        <div class="footer-links">
          <a href="academics.html#intermediate">Intermediate MPC</a>
          <a href="academics.html#intermediate">Intermediate BiPC</a>
          <a href="academics.html#intermediate">CEC / MEC</a>
          <a href="academics.html#degree">B.Sc Mathematics</a>
          <a href="academics.html#degree">B.Com General</a>
          <a href="academics.html#degree">BCA</a>
          <a href="academics.html#degree">BA</a>
          <a href="departments.html">All Departments</a>
        </div>
      </div>
      <div>
        <div class="footer-heading">Contact Us</div>
        <p style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.7;margin-bottom:12px;">
          📍 ${info.address||DEFAULTS.address}<br><br>
          📞 ${info.phone1||DEFAULTS.phone1}<br>
          ${info.phone2?`📞 ${info.phone2}<br>`:''}
          ✉️ ${info.email1||DEFAULTS.email1}
        </p>
        <a href="admissions.html" class="btn btn-primary btn-sm">Apply Now →</a>
      </div>
    </div></div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} <span>${info.college_name||DEFAULTS.college_name}</span>. All Rights Reserved.</p>
    </div>
  </footer>
  <button class="scroll-top" id="scrollTop" aria-label="Scroll to top">↑</button>`;
}

function _attachNav() {
  const h = document.getElementById('hamburger');
  const n = document.getElementById('mainNav');
  const o = document.getElementById('navOverlay');
  h?.addEventListener('click', () => { h.classList.toggle('open'); n.classList.toggle('open'); o.classList.toggle('active'); });
  o?.addEventListener('click', () => { h.classList.remove('open'); n.classList.remove('open'); o.classList.remove('active'); });
}

function _attachScroll() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
}

// ===== INJECT HEADER — INSTANT then update =====
function injectHeader() {
  const t = document.getElementById('site-header');
  if (!t) return;
  // Step 1: render instantly with defaults
  t.innerHTML = _buildHeader(DEFAULTS);
  _attachNav();
  // Step 2: apply cache immediately if available (no flash)
  const cached = cacheGet('college_info');
  if (cached) { t.innerHTML = _buildHeader({ ...DEFAULTS, ...cached }); _attachNav(); }
  // Step 3: fetch in background, silently update
  getCollegeInfo().then(info => { t.innerHTML = _buildHeader(info); _attachNav(); });
}

// ===== INJECT FOOTER — same pattern =====
function injectFooter() {
  const t = document.getElementById('site-footer');
  if (!t) return;
  t.innerHTML = _buildFooter(DEFAULTS);
  _attachScroll();
  const cached = cacheGet('college_info');
  if (cached) { t.innerHTML = _buildFooter({ ...DEFAULTS, ...cached }); _attachScroll(); }
  getCollegeInfo().then(info => { t.innerHTML = _buildFooter(info); _attachScroll(); });
}

// ===== STATS =====
async function loadStats(el) {
  if (!el) return;
  const render = (i) => el.innerHTML = [
    { num: i.years_excellence||DEFAULTS.years_excellence, label:'Years of Excellence' },
    { num: i.total_students||DEFAULTS.total_students, label:'Students Enrolled' },
    { num: i.total_faculty||DEFAULTS.total_faculty, label:'Expert Faculty' },
    { num: i.placement_percent||DEFAULTS.placement_percent, label:'Placement Rate' },
  ].map(s=>`<div class="stat-item"><div class="num">${s.num}</div><div class="label">${s.label}</div></div>`).join('');
  render(DEFAULTS);
  render(await getCollegeInfo());
}

// ===== SLIDERS =====
async function loadSliders(el) {
  if (!el) return;
  const cached = cacheGet('sliders');
  if (cached && cached.length) { _renderSlider(el, cached); }
  else { el.innerHTML = _staticSlider(); initSlider(el); }
  const res = await apiFetch('/sliders');
  if (res.success && res.data?.length) { cacheSet('sliders', res.data); _renderSlider(el, res.data); }
}

function _renderSlider(el, list) {
  const base = SERVER_ROOT;
  el.innerHTML = list.map((s,i)=>`
    <div class="slide ${i===0?'active':''}">
      <img src="${s.image_url?.startsWith('/')?base+s.image_url:s.image_url||''}" alt="${s.title||''}" class="slide-img" loading="${i===0?'eager':'lazy'}" onerror="this.style.opacity='0'">
      <div class="slide-overlay"><div class="container"><div class="slide-content">
        ${s.title?`<h2>${s.title}</h2>`:''}
        ${s.subtitle?`<p>${s.subtitle}</p>`:''}
        <div class="btn-group">
          <a href="admissions.html" class="btn btn-primary">Apply Now →</a>
          <a href="about.html" class="btn btn-outline">Learn More</a>
        </div>
      </div></div></div>
    </div>`).join('')
  + list.map((_,i)=>`<button class="slider-dot ${i===0?'active':''}"></button>`).join('').replace(/^(.*)$/,`<button class="slider-prev">‹</button>$1<button class="slider-next">›</button><div class="slider-dots">$1</div>`.replace('$1',''));

  // rebuild properly
  const slides = list.map((s,i)=>`
    <div class="slide ${i===0?'active':''}">
      <img src="${s.image_url?.startsWith('/')?base+s.image_url:s.image_url||''}" alt="${s.title||''}" class="slide-img" loading="${i===0?'eager':'lazy'}" onerror="this.style.opacity='0'">
      <div class="slide-overlay"><div class="container"><div class="slide-content">
        ${s.title?`<h2>${s.title}</h2>`:''}${s.subtitle?`<p>${s.subtitle}</p>`:''}
        <div class="btn-group">
          <a href="admissions.html" class="btn btn-primary">Apply Now →</a>
          <a href="about.html" class="btn btn-outline">Learn More</a>
        </div>
      </div></div></div>
    </div>`).join('');
  const dots = list.map((_,i)=>`<button class="slider-dot ${i===0?'active':''}"></button>`).join('');
  el.innerHTML = `${slides}<button class="slider-prev">‹</button><button class="slider-next">›</button><div class="slider-dots">${dots}</div>`;
  initSlider(el);
}

function _staticSlider() {
  const s = [
    {title:'Welcome to Excellence in Education', sub:'Empowering Students Since 1995 — NAAC A+ Accredited'},
    {title:'Admissions Open 2024–25', sub:'Apply for Intermediate & Degree Courses — Limited Seats'},
    {title:'95% Placement Record', sub:'TCS, Infosys, Wipro, Amazon & 50+ Top Companies Recruit Here'},
  ];
  const slides = s.map((x,i)=>`
    <div class="slide ${i===0?'active':''}" style="background:linear-gradient(135deg,#0c1b33,#1a3a5c)">
      <div class="slide-overlay" style="background:transparent"><div class="container"><div class="slide-content">
        <h2>${x.title}</h2><p>${x.sub}</p>
        <div class="btn-group">
          <a href="admissions.html" class="btn btn-primary">Apply Now →</a>
          <a href="about.html" class="btn btn-outline">Learn More</a>
        </div>
      </div></div></div>
    </div>`).join('');
  const dots = s.map((_,i)=>`<button class="slider-dot ${i===0?'active':''}"></button>`).join('');
  return `${slides}<button class="slider-prev">‹</button><button class="slider-next">›</button><div class="slider-dots">${dots}</div>`;
}

function initSlider(el) {
  if (!el) return;
  const slides = el.querySelectorAll('.slide');
  const dots = el.querySelectorAll('.slider-dot');
  if (!slides.length) return;
  let cur=0, timer;
  const goTo = n => { slides[cur]?.classList.remove('active'); dots[cur]?.classList.remove('active'); cur=(n+slides.length)%slides.length; slides[cur]?.classList.add('active'); dots[cur]?.classList.add('active'); };
  const next = () => goTo(cur+1);
  const start = () => { timer=setInterval(next,5000); };
  const stop = () => clearInterval(timer);
  el.querySelector('.slider-next')?.addEventListener('click',()=>{stop();next();start();});
  el.querySelector('.slider-prev')?.addEventListener('click',()=>{stop();goTo(cur-1);start();});
  dots.forEach((d,i)=>d.addEventListener('click',()=>{stop();goTo(i);start();}));
  el.addEventListener('mouseenter',stop); el.addEventListener('mouseleave',start);
  goTo(0); start();
}

// ===== COMPANIES MARQUEE =====
const _FALLBACK_COS = ['TCS','Infosys','Wipro','HCL Technologies','Cognizant','Accenture','Tech Mahindra','Amazon','Deloitte','KPMG','ICICI Bank','HDFC Bank'];

async function loadCompanies(el) {
  if (!el) return;
  const _render = (list) => {
    const base = SERVER_ROOT;
    const all = [...list,...list];
    el.innerHTML = `<div class="marquee-track">${all.map(c=>`
      <div class="company-logo-item">
        ${c.logo_url?`<img src="${c.logo_url.startsWith('/')?base+c.logo_url:c.logo_url}" alt="${c.name}" loading="lazy" onerror="this.style.display='none'">`:''}
        <div class="logo-text-fallback" ${c.logo_url?'style="display:none"':''}>${c.name}</div>
      </div>`).join('')}</div>`;
  };
  // Show fallback instantly
  _render(_FALLBACK_COS.map(n=>({name:n})));
  // Update from cache
  const cached = cacheGet('companies');
  if (cached) _render(cached);
  // Fetch and update
  const res = await apiFetch('/companies');
  if (res.success && res.data?.length) { cacheSet('companies', res.data); _render(res.data); }
}

// ===== NEWS TICKER =====
async function loadNewsTicker(el) {
  if (!el) return;
  const cached = cacheGet('ticker');
  if (cached) { el.innerHTML = cached; return; }
  const res = await apiFetch('/news?limit=8');
  const news = res.data || [];
  const text = news.length
    ? news.map(n=>`📢 ${n.title}`).join(' &nbsp;•&nbsp; ')
    : '📢 Admissions Open 2024-25 &nbsp;•&nbsp; NAAC A+ Accredited &nbsp;•&nbsp; 95% Placement Record &nbsp;•&nbsp; Welcome to BHSRC College';
  const html = `<div class="ticker-text">${text} &nbsp;•&nbsp; ${text}</div>`;
  cacheSet('ticker', html);
  el.innerHTML = html;
}

// ===== SCROLL ANIMATION =====
function initScrollAnimation() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.fade-in').forEach(e=>e.classList.add('visible')); return;
  }
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold:0.08, rootMargin:'0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in').forEach(e=>obs.observe(e));
}

// ===== TOAST =====
function showToast(msg, type='info') {
  let t = document.getElementById('globalToast');
  if (!t) { t=document.createElement('div'); t.id='globalToast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent=msg; t.className=`toast ${type}`;
  setTimeout(()=>t.classList.add('show'),10);
  setTimeout(()=>t.classList.remove('show'),4000);
}

// ===== UTILS =====
function formatDate(d) { if(!d) return ''; return new Date(d).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'}); }
function catTag(c) { return {news:'cat-news',event:'cat-event',placement:'cat-placement',sports:'cat-sports'}[c]||'cat-news'; }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // SYNCHRONOUS — renders header/footer before any API call
  injectHeader();
  injectFooter();
  initScrollAnimation();

  const statsEl = document.getElementById('statsGrid');
  if (statsEl) loadStats(statsEl);

  const sliderEl = document.getElementById('heroSlider');
  if (sliderEl) loadSliders(sliderEl);

  const tickerEl = document.getElementById('newsTicker');
  if (tickerEl) loadNewsTicker(tickerEl);

  const cosEl = document.getElementById('companiesMarquee');
  if (cosEl) loadCompanies(cosEl);

  if (typeof pageInit === 'function') pageInit();
});
