/* ============================================================
   BHSRC COLLEGE WEBSITE — CONFIG
   Frontend : https://bhsrccollege1980.netlify.app  (Netlify)
   Backend  : https://bhsrc-college-api.onrender.com (Render)
   ============================================================ */

const CONFIG = (() => {
  const isLocal =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname.startsWith('192.168.');

  // Live Netlify frontend domain
  const NETLIFY_DOMAIN = 'https://bhsrccollege1980.netlify.app';

  // Live Render.com backend API
  // ⚠️ After deploying backend to Render, paste your Render URL here
  const RENDER_API = 'https://bhsrc-college-api.onrender.com';

  return {
    API_BASE: isLocal
      ? 'http://localhost:3000/api'
      : `${RENDER_API}/api`,

    SERVER_ROOT: isLocal
      ? 'http://localhost:3000'
      : RENDER_API,

    HEALTH_URL: isLocal
      ? 'http://localhost:3000/health'
      : `${RENDER_API}/health`,

    SITE_URL: isLocal
      ? 'http://localhost:5500'
      : NETLIFY_DOMAIN,

    isLocal,
  };
})();
