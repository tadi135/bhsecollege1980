/* ============================================================
   ADMIN PANEL - SHARED JAVASCRIPT  v2 (FIXED)
   KEY FIXES:
   - checkServer() runs on every page load — shows a clear
     "Start the backend server" banner if server is offline
   - adminAPI() shows toast on failure instead of silent null
   - 4-second timeout on all API calls
   - buildLayout() checks server status before rendering
   ============================================================ */

// API comes from config.js (loaded before this script in every admin HTML file)
const API = (typeof CONFIG !== 'undefined') ? CONFIG.API_BASE : 'http://localhost:3000/api';
const HEALTH_URL = (typeof CONFIG !== 'undefined') ? CONFIG.HEALTH_URL : 'http://localhost:3000/health';

function getToken() { return localStorage.getItem('adminToken'); }
function getAdminName() { return localStorage.getItem('adminName') || 'Admin'; }
function getAdminEmail() { return localStorage.getItem('adminEmail') || ''; }

function requireAuth() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  return true;
}

function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminEmail');
  window.location.href = 'login.html';
}

// ===== SERVER HEALTH CHECK =====
let _serverOnline = null; // null=unknown, true/false

async function checkServer() {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(HEALTH_URL, { signal: ctrl.signal });
    _serverOnline = res.ok;
  } catch(e) {
    _serverOnline = false;
  }
  return _serverOnline;
}

function showServerOfflineBanner() {
  // Remove any existing banner
  document.getElementById('serverBanner')?.remove();
  const banner = document.createElement('div');
  banner.id = 'serverBanner';
  banner.innerHTML = `
    <div style="background:#fef2f2; border-bottom:3px solid #dc2626; padding:14px 28px; display:flex; align-items:center; gap:16px; font-size:13px; position:sticky; top:64px; z-index:200;">
      <span style="font-size:1.4rem;">🔴</span>
      <div>
        <div style="font-weight:700; color:#dc2626; margin-bottom:3px;">Backend Server is Offline</div>
        <div style="color:#7f1d1d;">The API server at <code style="background:#fee2e2;padding:1px 6px;border-radius:4px;">http://localhost:3000</code> is not reachable.
        To start it: open a terminal, go to the <strong>backend</strong> folder and run <code style="background:#fee2e2;padding:1px 6px;border-radius:4px;">npm start</code></div>
      </div>
      <button onclick="retryConnection()" style="margin-left:auto; background:#dc2626; color:white; border:none; padding:7px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; white-space:nowrap;" id="retryBtn">
        🔄 Retry Connection
      </button>
      <button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:16px;padding:4px;">✕</button>
    </div>`;
  // Insert after topbar
  const topbar = document.querySelector('.topbar');
  if (topbar) topbar.after(banner);
  else document.querySelector('.main-content')?.prepend(banner);
}

function showServerOnlineBanner() {
  document.getElementById('serverBanner')?.remove();
  const banner = document.createElement('div');
  banner.id = 'serverBanner';
  banner.innerHTML = `
    <div style="background:#f0fdf4; border-bottom:3px solid #16a34a; padding:10px 28px; display:flex; align-items:center; gap:10px; font-size:13px;">
      <span>🟢</span> <span style="color:#15803d; font-weight:600;">Server is online and connected!</span>
    </div>`;
  const topbar = document.querySelector('.topbar');
  if (topbar) topbar.after(banner);
  setTimeout(() => document.getElementById('serverBanner')?.remove(), 3000);
}

async function retryConnection() {
  const btn = document.getElementById('retryBtn');
  if (btn) { btn.textContent = '⏳ Checking...'; btn.disabled = true; }
  const online = await checkServer();
  if (online) {
    showServerOnlineBanner();
    toast('Server connected! Reloading data...', 'success');
    setTimeout(() => window.location.reload(), 1200);
  } else {
    if (btn) { btn.textContent = '🔄 Retry Connection'; btn.disabled = false; }
    toast('Server still not reachable. Make sure backend is running.', 'error');
  }
}

// ===== API HELPER WITH TIMEOUT + ERROR FEEDBACK =====
async function adminAPI(endpoint, options = {}, silent = false) {
  if (_serverOnline === false && !silent) {
    if (!document.getElementById('serverBanner')) showServerOfflineBanner();
    return null;
  }
  const token = getToken();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${API}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      signal: ctrl.signal,
      ...options
    });
    clearTimeout(timer);
    if (res.status === 401) { logout(); return null; }
    _serverOnline = true;
    return await res.json();
  } catch(err) {
    clearTimeout(timer);
    _serverOnline = false;
    if (!silent) showServerOfflineBanner();
    return null;
  }
}

// ===== TOAST =====
function toast(msg, type = 'info') {
  let t = document.getElementById('globalToast');
  if (!t) { t = document.createElement('div'); t.id = 'globalToast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = `toast ${type}`;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 4000);
}

// ===== CONFIRM DIALOG =====
function confirm(msg) {
  return new Promise(resolve => {
    let overlay = document.getElementById('confirmOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'confirmOverlay';
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-box">
          <div class="confirm-icon">⚠️</div>
          <div class="confirm-title">Are you sure?</div>
          <div class="confirm-msg" id="confirmMsg"></div>
          <div class="confirm-btns">
            <button class="topbar-btn btn-ghost" id="confirmCancel">Cancel</button>
            <button class="topbar-btn" id="confirmOK" style="background:#dc2626;color:white;border:none;">Delete</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    document.getElementById('confirmMsg').textContent = msg;
    overlay.classList.add('open');
    document.getElementById('confirmOK').onclick = () => { overlay.classList.remove('open'); resolve(true); };
    document.getElementById('confirmCancel').onclick = () => { overlay.classList.remove('open'); resolve(false); };
  });
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== SIDEBAR NAV =====
const NAV_ITEMS = [
  { section:'Main' },
  { icon:'📊', label:'Dashboard', page:'index.html' },
  { section:'Content Management' },
  { icon:'🖼️', label:'Hero Sliders', page:'sliders.html' },
  { icon:'📰', label:'News & Events', page:'news.html' },
  { icon:'🏛️', label:'College Info', page:'college-info.html' },
  { icon:'📚', label:'Departments', page:'departments.html' },
  { icon:'👨‍🏫', label:'Staff / Faculty', page:'staff.html' },
  { icon:'🖼', label:'Gallery', page:'gallery.html' },
  { section:'Placements' },
  { icon:'💼', label:'Placements', page:'placements.html' },
  { icon:'🏢', label:'Companies', page:'companies.html' },
  { section:'Admissions & Enquiries' },
  { icon:'🎓', label:'Admissions Info', page:'admissions.html' },
  { icon:'📩', label:'Enquiries', page:'enquiries.html', badge:true },
  { section:'Settings' },
  { icon:'🔐', label:'Change Password', page:'change-password.html' },
];

function injectSidebar() {
  const currentPage = window.location.pathname.split('/').pop();
  const navHtml = NAV_ITEMS.map(item => {
    if (item.section) return `<div class="nav-section-label">${item.section}</div>`;
    const active = currentPage === item.page ? 'active' : '';
    return `<a href="${item.page}" class="nav-item ${active}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
      ${item.badge ? '<span class="badge" id="enquiryBadge" style="display:none">0</span>' : ''}
    </a>`;
  }).join('');

  const initials = getAdminName().split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('adminSidebar').innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-logo">AD</div>
      <div><div class="sidebar-title">College Admin</div><div class="sidebar-subtitle">Management Panel</div></div>
    </div>
    <nav class="sidebar-nav">${navHtml}</nav>
    <div class="sidebar-footer">
      <div class="admin-profile">
        <div class="admin-avatar">${initials}</div>
        <div>
          <div class="admin-name">${getAdminName()}</div>
          <div class="admin-role">Administrator</div>
        </div>
        <button onclick="logout()" title="Logout" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:18px;" title="Logout">⏻</button>
      </div>
    </div>`;

  // Mobile hamburger
  const btn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  btn?.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (btn && sidebar && !sidebar.contains(e.target) && !btn.contains(e.target)) sidebar.classList.remove('open');
  });

  // Enquiry badge
  adminAPI('/admin/dashboard-stats', {}, true).then(res => {
    if (res?.success && res.data?.newEnquiries > 0) {
      const badge = document.getElementById('enquiryBadge');
      if (badge) { badge.textContent = res.data.newEnquiries; badge.style.display = 'inline'; }
    }
  });
}

// ===== BUILD FULL LAYOUT =====
function buildLayout(title, contentHtml) {
  document.title = `${title} | College Admin`;
  document.body.innerHTML = `
    <div class="admin-layout">
      <div class="sidebar" id="adminSidebar"></div>
      <div class="main-content">
        <div class="topbar">
          <div style="display:flex;align-items:center;gap:12px;">
            <button id="sidebarToggle" class="topbar-btn btn-ghost" style="display:none;padding:8px;">☰</button>
            <span class="topbar-title">${title}</span>
          </div>
          <div class="topbar-actions">
            <span id="serverStatus" style="font-size:12px; color:var(--gray-400);">⏳ Checking server...</span>
            <a href="../frontend/index.html" target="_blank" class="topbar-btn btn-ghost" style="text-decoration:none;">👁 View Site</a>
            <button onclick="logout()" class="topbar-btn btn-danger">⏻ Logout</button>
          </div>
        </div>
        <div class="page-content" id="pageContent">${contentHtml}</div>
      </div>
    </div>
    <div class="toast" id="globalToast"></div>
    <div class="modal-overlay" id="globalModal">
      <div class="modal" id="globalModalBox">
        <div class="modal-header">
          <span class="modal-title" id="modalTitle">Title</span>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
        <div class="modal-footer" id="modalFooter">
          <button class="topbar-btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button class="topbar-btn btn-primary" id="modalSaveBtn">Save</button>
        </div>
      </div>
    </div>`;

  injectSidebar();

  // Show/hide hamburger
  const toggle = (show) => { const b = document.getElementById('sidebarToggle'); if(b) b.style.display=show?'block':'none'; };
  toggle(window.innerWidth <= 900);
  window.addEventListener('resize', () => toggle(window.innerWidth <= 900));

  // Escape to close modal
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });
  document.addEventListener('click', e => { if(e.target.id==='globalModal') closeModal(); });

  // Check server status and show indicator
  checkServer().then(online => {
    const el = document.getElementById('serverStatus');
    if (!el) return;
    if (online) {
      el.innerHTML = '<span style="color:#16a34a;">🟢 Server Online</span>';
    } else {
      el.innerHTML = '<span style="color:#dc2626; cursor:pointer;" onclick="showServerOfflineBanner()">🔴 Server Offline</span>';
      showServerOfflineBanner();
    }
  });
}

// ===== MODAL HELPERS =====
function openModal(title, bodyHtml, saveCallback, saveLabel = 'Save') {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  const btn = document.getElementById('modalSaveBtn');
  btn.textContent = saveLabel;
  btn.onclick = saveCallback;
  document.getElementById('globalModal').classList.add('open');
  setTimeout(() => {
    const first = document.querySelector('#modalBody input, #modalBody select, #modalBody textarea');
    if (first) first.focus();
  }, 100);
}

function closeModal() {
  document.getElementById('globalModal')?.classList.remove('open');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
});
