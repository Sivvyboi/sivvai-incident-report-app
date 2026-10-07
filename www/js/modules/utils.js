/**
 * Citizen Report - Utilities & UI Helpers Module
 * Author: SivvAI
 */

// Category SVG placeholder generator (used if incident has no photo attached)
function createCategorySvg(category, title) {
  const colors = {
    'Accident': { bg: '#D97706', accent: '#B45309', icon: '⚠️' },
    'Fighting': { bg: '#7C3AED', accent: '#6D28D9', icon: '⚔️' },
    'Rioting':  { bg: '#DC2626', accent: '#B91C1C', icon: '🚨' },
    'Fire':     { bg: '#EA580C', accent: '#C2410C', icon: '🔥' },
    'Other':    { bg: '#2563EB', accent: '#1D4ED8', icon: '📢' }
  };

  const theme = colors[category] || colors['Other'];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
    <defs>
      <linearGradient id="grad_${category}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bg}"/>
        <stop offset="100%" stop-color="${theme.accent}"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad_${category})"/>
    <circle cx="300" cy="150" r="85" fill="rgba(255,255,255,0.15)"/>
    <text x="300" y="165" font-size="64" text-anchor="middle" dominant-baseline="middle">${theme.icon}</text>
    <text x="300" y="270" font-family="-apple-system, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">${category} Report</text>
  </svg>`;

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDisplayDate(dateInput) {
  if (!dateInput) return 'Recently';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return String(dateInput);
  }
}

function getCategoryBadgeClass(category) {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'accident': return 'badge-accident';
    case 'fighting': return 'badge-fighting';
    case 'rioting':  return 'badge-rioting';
    case 'fire':     return 'badge-fire';
    default:         return 'badge-other';
  }
}

let toastTimeout = null;
function showToast(message, type = 'info') {
  const toast = document.getElementById('app-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

/**
 * Global Loading Bar & Overlay Management
 */
function showLoading(message = 'Processing...') {
  if (typeof AppState !== 'undefined') AppState.isLoading = true;
  const bar = document.getElementById('app-loading-bar');
  if (bar) bar.classList.add('active');

  const overlay = document.getElementById('app-loading-overlay');
  const textEl = document.getElementById('loading-status-text');
  if (textEl && message) textEl.textContent = message;
  if (overlay) overlay.classList.add('active');
}

function hideLoading() {
  if (typeof AppState !== 'undefined') AppState.isLoading = false;
  const bar = document.getElementById('app-loading-bar');
  if (bar) bar.classList.remove('active');

  const overlay = document.getElementById('app-loading-overlay');
  if (overlay) overlay.classList.remove('active');
}

function showLoadingBar() {
  const bar = document.getElementById('app-loading-bar');
  if (bar) bar.classList.add('active');
}

function hideLoadingBar() {
  const bar = document.getElementById('app-loading-bar');
  if (bar) bar.classList.remove('active');
}

/**
 * Initializes password visibility eye toggles across all password fields
 */
function initPasswordToggles() {
  document.querySelectorAll('.btn-toggle-password').forEach(btn => {
    if (btn._hasToggleListener) return;
    btn._hasToggleListener = true;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eyeShow = btn.querySelector('.eye-show');
      const eyeHide = btn.querySelector('.eye-hide');
      if (eyeShow && eyeHide) {
        eyeShow.style.display = isPassword ? 'none' : 'block';
        eyeHide.style.display = isPassword ? 'block' : 'none';
      }
      input.focus();
    });
  });
}

/**
 * Network Connectivity Monitoring
 */
function updateNetworkStatus(isOnline) {
  const banner = document.getElementById('app-network-banner');
  if (!banner) return;
  if (isOnline) {
    banner.classList.remove('show');
  } else {
    banner.classList.add('show');
  }
}

function initNetworkMonitoring() {
  updateNetworkStatus(navigator.onLine);

  window.addEventListener('online', () => {
    updateNetworkStatus(true);
    showToast('Internet connection restored.', 'success');
    if (typeof fetchIncidentsFromWP === 'function') {
      fetchIncidentsFromWP(true);
    }
  });

  window.addEventListener('offline', () => {
    updateNetworkStatus(false);
    showToast('No internet connection. Working in offline mode.', 'info');
  });
}
