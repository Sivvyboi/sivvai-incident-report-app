/**
 * Citizen Report - Mobile Application
 * BinCom Academy Mobile App Development Assessment
 * Simple, Clean Vanilla JavaScript Implementation
 */

// ==========================================================================
// 1. Initial Mock Data
// ==========================================================================

// Inline SVG helper to produce crisp category banners offline
function createCategorySvg(category, title) {
  const colors = {
    'Accident': { bg: '#D97706', accent: '#B45309', icon: '⚠️' },
    'Fighting': { bg: '#7C3AED', accent: '#6D28D9', icon: '⚔️' },
    'Rioting': { bg: '#DC2626', accent: '#B91C1C', icon: '🚨' },
    'Fire': { bg: '#EA580C', accent: '#C2410C', icon: '🔥' },
    'Other': { bg: '#2563EB', accent: '#1D4ED8', icon: '📢' }
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

const INITIAL_INCIDENTS = [
  {
    id: 'inc-1',
    category: 'Accident',
    title: 'Road Accident — Ring Road',
    description: 'Collision involving two commercial buses and a private saloon car near Mobil Junction. Traffic building up rapidly, emergency towing requested.',
    datetime: 'Today, 10:45 AM',
    location: 'Ring Road (Near Mobil Junction), Ibadan',
    latitude: 7.3592,
    longitude: 3.8741,
    reporter: 'Tunde Bakare',
    status: 'Investigating',
    isUserReport: false,
    image: createCategorySvg('Accident', 'Road Accident — Ring Road')
  },
  {
    id: 'inc-2',
    category: 'Fighting',
    title: 'Fighting — Dugbe',
    description: 'Public altercation between transport union members near Dugbe Commercial Area. Police patrol team has been alerted and is en route.',
    datetime: 'Today, 08:30 AM',
    location: 'Dugbe Commercial Area, Ibadan',
    latitude: 7.3891,
    longitude: 3.8967,
    reporter: 'Adebayo Olawale',
    status: 'Pending Review',
    isUserReport: true, // Mock user's initial report
    image: createCategorySvg('Fighting', 'Fighting — Dugbe')
  },
  {
    id: 'inc-3',
    category: 'Rioting',
    title: 'Rioting — Challenge',
    description: 'Youth protest and roadblock along Challenge roundabout. Motorists are advised to take alternative routes through Molete or Ring Road.',
    datetime: 'Yesterday, 04:15 PM',
    location: 'Challenge Roundabout, Ibadan',
    latitude: 7.3486,
    longitude: 3.8795,
    reporter: 'Ibrahim Sani',
    status: 'Verified',
    isUserReport: false,
    image: createCategorySvg('Rioting', 'Rioting — Challenge')
  },
  {
    id: 'inc-4',
    category: 'Fire',
    title: 'Fire Incident — Bodija',
    description: 'Electrical fire detected in a row of market stalls along Bodija Market main gate. Fire service personnel currently on scene combating blaze.',
    datetime: 'Yesterday, 01:20 PM',
    location: 'Bodija Market Main Gate, Ibadan',
    latitude: 7.4343,
    longitude: 3.9112,
    reporter: 'Chidinma Okeke',
    status: 'Resolved',
    isUserReport: false,
    image: createCategorySvg('Fire', 'Fire Incident — Bodija')
  },
  {
    id: 'inc-5',
    category: 'Other',
    title: 'Flooding & Blocked Drainage — Iwo Road',
    description: 'Severe water overflow across the expressway following heavy early morning downpour. Slow vehicular movement.',
    datetime: 'Oct 04, 2026',
    location: 'Iwo Road Interchange, Ibadan',
    latitude: 7.4069,
    longitude: 3.9458,
    reporter: 'Adebayo Olawale',
    status: 'Verified',
    isUserReport: true,
    image: createCategorySvg('Other', 'Flooding & Blocked Drainage')
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: '🚨 Emergency Alert: Bodija Market',
    message: 'Oyo State Fire Service team is deployed to Bodija Market.',
    time: '2 hours ago',
    alert: true
  },
  {
    id: 'notif-2',
    title: '✅ Report Status Updated',
    message: 'Your report "Fighting — Dugbe" is currently under review by authorities.',
    time: '4 hours ago',
    alert: false
  },
  {
    id: 'notif-3',
    title: '📢 Community Safety Advisory',
    message: 'Heavy traffic reported along Ring Road due to a vehicle collision.',
    time: '5 hours ago',
    alert: false
  }
];

// ==========================================================================
// 2. Application State
// ==========================================================================

const AppState = {
  currentUser: null,
  activeView: 'home',
  selectedFilter: 'All',
  incidents: [...INITIAL_INCIDENTS],
  notifications: [...INITIAL_NOTIFICATIONS],
  currentIncidentDetail: null,
  previousView: 'home',
  uploadedImageData: null
};

// ==========================================================================
// 3. Navigation & Screen Management
// ==========================================================================

function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`screen-${screenName}`);
  if (target) {
    target.classList.add('active');
  }
}

function switchView(viewName) {
  // If navigating to details, remember where we came from
  if (viewName === 'details') {
    AppState.previousView = AppState.activeView === 'details' ? 'home' : AppState.activeView;
  }
  
  AppState.activeView = viewName;
  
  // Update view containers
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
    targetView.scrollTop = 0;
  }

  // Update bottom navigation active tab
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Re-render specific views when displayed
  if (viewName === 'home') {
    renderIncidentsList();
  } else if (viewName === 'my-reports') {
    renderMyReportsList();
  } else if (viewName === 'profile') {
    renderProfileView();
  }
}

// ==========================================================================
// 4. UI Rendering Functions
// ==========================================================================

function getCategoryBadgeClass(category) {
  switch (category) {
    case 'Accident': return 'badge-accident';
    case 'Fighting': return 'badge-fighting';
    case 'Rioting': return 'badge-rioting';
    case 'Fire': return 'badge-fire';
    default: return 'badge-other';
  }
}

function renderIncidentsList() {
  const container = document.getElementById('incidents-list');
  const countEl = document.getElementById('feed-count');
  if (!container) return;

  const filter = AppState.selectedFilter;
  const filtered = filter === 'All' 
    ? AppState.incidents 
    : AppState.incidents.filter(inc => inc.category.toLowerCase() === filter.toLowerCase());

  if (countEl) {
    countEl.textContent = `${filtered.length} reported`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h4>No incidents found</h4>
        <p>There are no ${filter === 'All' ? '' : filter} incidents reported at this time.</p>
        <button class="btn btn-outline btn-sm" onclick="switchView('report')">Submit a Report</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(inc => {
    return `
      <div class="incident-card" onclick="openIncidentDetails('${inc.id}')">
        <div class="card-thumb">
          <img src="${inc.image || createCategorySvg(inc.category, inc.title)}" alt="${inc.category}" loading="lazy" />
        </div>
        <div class="card-info">
          <div class="card-top">
            <span class="badge ${getCategoryBadgeClass(inc.category)}">${inc.category}</span>
            <span class="card-time">${inc.datetime}</span>
          </div>
          <h4 class="card-title">${escapeHtml(inc.title)}</h4>
          <p class="card-desc">${escapeHtml(inc.description)}</p>
          <div class="card-location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${escapeHtml(inc.location)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderMyReportsList() {
  const container = document.getElementById('my-reports-list');
  const countEl = document.getElementById('my-reports-total-count');
  if (!container) return;

  const myIncidents = AppState.incidents.filter(inc => inc.isUserReport);

  if (countEl) {
    countEl.textContent = myIncidents.length;
  }

  if (myIncidents.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h4>No reports submitted yet</h4>
        <p>You haven't submitted any incident reports. Keep your community safe by reporting what you observe.</p>
        <button class="btn btn-primary btn-sm" onclick="switchView('report')">Report an Incident</button>
      </div>
    `;
    return;
  }

  container.innerHTML = myIncidents.map(inc => {
    const statusClass = inc.status === 'Verified' ? 'badge-status-verified' : 'badge-status-pending';
    return `
      <div class="my-report-item" onclick="openIncidentDetails('${inc.id}')">
        <div class="my-report-top">
          <span class="badge ${getCategoryBadgeClass(inc.category)}">${inc.category}</span>
          <span class="badge ${statusClass}">${inc.status || 'Pending Review'}</span>
        </div>
        <h4 class="my-report-title">${escapeHtml(inc.title)}</h4>
        <div class="my-report-bottom">
          <span>${escapeHtml(inc.location)}</span>
          <span>${inc.datetime}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openIncidentDetails(id) {
  const incident = AppState.incidents.find(item => item.id === id);
  if (!incident) return;

  AppState.currentIncidentDetail = incident;

  // Populate details screen
  document.getElementById('detail-hero-img').src = incident.image || createCategorySvg(incident.category, incident.title);
  
  const categoryBadge = document.getElementById('detail-category');
  categoryBadge.textContent = incident.category;
  categoryBadge.className = `badge ${getCategoryBadgeClass(incident.category)}`;

  const statusBadge = document.getElementById('detail-status');
  statusBadge.textContent = incident.status || 'Pending Review';
  statusBadge.className = `badge ${incident.status === 'Verified' ? 'badge-status-verified' : 'badge-status-pending'}`;

  document.getElementById('detail-title').textContent = incident.title;
  document.getElementById('detail-description').textContent = incident.description;
  document.getElementById('detail-location').textContent = incident.location;
  document.getElementById('detail-datetime').textContent = incident.datetime;
  document.getElementById('detail-reporter').textContent = incident.reporter || 'Anonymous Citizen';
  
  document.getElementById('detail-latitude').textContent = incident.latitude != null ? incident.latitude.toFixed(4) : 'N/A';
  document.getElementById('detail-longitude').textContent = incident.longitude != null ? incident.longitude.toFixed(4) : 'N/A';

  switchView('details');
}

function renderProfileView() {
  if (!AppState.currentUser) return;
  
  document.getElementById('profile-name').textContent = AppState.currentUser.name;
  document.getElementById('profile-email').textContent = AppState.currentUser.email;
  document.getElementById('profile-avatar').textContent = getInitials(AppState.currentUser.name);

  const myReportsCount = AppState.incidents.filter(inc => inc.isUserReport).length;
  document.getElementById('profile-total-reports').textContent = myReportsCount;
}

function renderNotifications() {
  const container = document.getElementById('notification-list');
  const badge = document.getElementById('notif-badge');
  if (!container) return;

  const count = AppState.notifications.length;
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  if (count === 0) {
    container.innerHTML = `<p style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 13px;">No new notifications</p>`;
    return;
  }

  container.innerHTML = AppState.notifications.map(n => `
    <div class="notification-card ${n.alert ? 'alert' : ''}">
      <h5>${escapeHtml(n.title)}</h5>
      <p>${escapeHtml(n.message)}</p>
      <span>${n.time}</span>
    </div>
  `).join('');
}

// ==========================================================================
// 5. Geolocation Functionality
// ==========================================================================

function handleGetLocation() {
  const btn = document.getElementById('btn-get-location');
  const originalText = btn.innerHTML;
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg> Acquiring GPS...
  `;
  btn.disabled = true;

  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by this device. You can type coordinates manually.', 'info');
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      document.getElementById('report-lat').value = lat.toFixed(5);
      document.getElementById('report-lng').value = lng.toFixed(5);

      const locationField = document.getElementById('report-location');
      if (!locationField.value) {
        locationField.value = 'Current GPS Location';
      }

      showToast('Coordinates retrieved successfully!', 'success');
      btn.innerHTML = originalText;
      btn.disabled = false;
    },
    (error) => {
      // Friendly message as required
      console.warn('Geolocation error:', error);
      let errorMsg = 'Could not retrieve GPS location automatically. You can enter the location and coordinates manually.';
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = 'Location permission was denied. You can enter the location manually.';
      }
      showToast(errorMsg, 'info');
      btn.innerHTML = originalText;
      btn.disabled = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 9000,
      maximumAge: 10000
    }
  );
}

// ==========================================================================
// 6. Picture Selection & Preview
// ==========================================================================

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    AppState.uploadedImageData = e.target.result;
    
    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview-img');
    const uploadPrompt = document.getElementById('photo-upload-prompt');

    previewImg.src = AppState.uploadedImageData;
    previewContainer.style.display = 'block';
    uploadPrompt.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeSelectedImage() {
  AppState.uploadedImageData = null;
  document.getElementById('report-image-input').value = '';
  document.getElementById('photo-preview-container').style.display = 'none';
  document.getElementById('photo-upload-prompt').style.display = 'flex';
}

// ==========================================================================
// 7. Report Submission
// ==========================================================================

function handleReportSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('report-title').value.trim();
  const category = document.getElementById('report-category').value;
  const description = document.getElementById('report-desc').value.trim();
  const location = document.getElementById('report-location').value.trim();
  const latStr = document.getElementById('report-lat').value.trim();
  const lngStr = document.getElementById('report-lng').value.trim();

  // Validation
  if (!title) {
    showToast('Please provide an incident title.', 'error');
    return;
  }
  if (!category) {
    showToast('Please select an incident category.', 'error');
    return;
  }
  if (!description) {
    showToast('Please provide a description of the incident.', 'error');
    return;
  }
  if (!location) {
    showToast('Please enter the location of the incident.', 'error');
    return;
  }

  const lat = latStr ? parseFloat(latStr) : 7.3775;
  const lng = lngStr ? parseFloat(lngStr) : 3.9470;

  const newIncident = {
    id: 'inc-' + Date.now(),
    category: category,
    title: title,
    description: description,
    datetime: 'Just now',
    location: location,
    latitude: isNaN(lat) ? 7.3775 : lat,
    longitude: isNaN(lng) ? 3.9470 : lng,
    reporter: AppState.currentUser ? AppState.currentUser.name : 'Citizen Reporter',
    status: 'Pending Review',
    isUserReport: true,
    image: AppState.uploadedImageData || createCategorySvg(category, title)
  };

  // Prepend to incidents list
  AppState.incidents.unshift(newIncident);

  // Add notification
  AppState.notifications.unshift({
    id: 'notif-' + Date.now(),
    title: `📢 New Incident: ${title}`,
    message: `Submitted for ${location}. Status: Pending Review.`,
    time: 'Just now',
    alert: category === 'Rioting' || category === 'Fire'
  });

  // Reset form
  document.getElementById('form-report-incident').reset();
  removeSelectedImage();

  showToast('Incident reported successfully!', 'success');
  renderNotifications();
  
  // Transition to Home view to see the new incident
  switchView('home');
}

// ==========================================================================
// 8. Authentication (Mock UI Phase)
// ==========================================================================

function loginUser(name, email) {
  AppState.currentUser = {
    name: name,
    email: email
  };
  switchScreen('app');
  switchView('home');
  renderNotifications();
  showToast(`Welcome, ${name}!`, 'success');
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email) {
    showToast('Please enter your email address.', 'error');
    return;
  }
  if (!password) {
    showToast('Please enter your password.', 'error');
    return;
  }

  const displayName = email.split('@')[0].replace(/[._]/g, ' ') || 'Citizen User';
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  loginUser(formattedName, email);
}

function handleDemoLogin() {
  loginUser('Adebayo Olawale', 'adebayo@citizenreport.ng');
}

function handleLogout() {
  AppState.currentUser = null;
  AppState.uploadedImageData = null;
  document.getElementById('form-login').reset();
  switchScreen('login');
  showToast('You have been logged out.', 'info');
}

// ==========================================================================
// 9. Toast & Notifications Modal
// ==========================================================================

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

function toggleNotificationsModal(show) {
  const modal = document.getElementById('notifications-modal');
  if (!modal) return;
  if (show) {
    renderNotifications();
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
  }
}

// ==========================================================================
// 10. Utilities
// ==========================================================================

function getInitials(name) {
  if (!name) return 'CR';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// 11. Event Listeners & App Initialization
// ==========================================================================

function initApp() {
  // Login events
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', handleLoginSubmit);
  }

  const btnDemoLogin = document.getElementById('btn-demo-login');
  if (btnDemoLogin) {
    btnDemoLogin.addEventListener('click', handleDemoLogin);
  }

  // Logout event
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', handleLogout);
  }

  // Bottom Navigation tabs
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (view) switchView(view);
    });
  });

  // Quick Report Button on Home Banner
  const btnQuickReport = document.getElementById('btn-quick-report');
  if (btnQuickReport) {
    btnQuickReport.addEventListener('click', () => switchView('report'));
  }

  // Back button on Details screen
  const btnBackDetails = document.getElementById('btn-back-details');
  if (btnBackDetails) {
    btnBackDetails.addEventListener('click', () => {
      switchView(AppState.previousView || 'home');
    });
  }

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      AppState.selectedFilter = chip.getAttribute('data-category');
      renderIncidentsList();
    });
  });

  // Report Form submission
  const formReport = document.getElementById('form-report-incident');
  if (formReport) {
    formReport.addEventListener('submit', handleReportSubmit);
  }

  // Location button
  const btnLocation = document.getElementById('btn-get-location');
  if (btnLocation) {
    btnLocation.addEventListener('click', handleGetLocation);
  }

  // Photo upload trigger & change
  const photoBox = document.getElementById('photo-upload-box');
  const fileInput = document.getElementById('report-image-input');
  if (photoBox && fileInput) {
    photoBox.addEventListener('click', (e) => {
      if (e.target.closest('#btn-remove-photo')) return;
      fileInput.click();
    });
    fileInput.addEventListener('change', handleImageSelect);
  }

  const btnRemovePhoto = document.getElementById('btn-remove-photo');
  if (btnRemovePhoto) {
    btnRemovePhoto.addEventListener('click', (e) => {
      e.stopPropagation();
      removeSelectedImage();
    });
  }

  // Notifications modal toggle
  const btnNotif = document.getElementById('btn-notifications');
  if (btnNotif) {
    btnNotif.addEventListener('click', () => toggleNotificationsModal(true));
  }

  const btnCloseNotif = document.getElementById('btn-close-modal');
  if (btnCloseNotif) {
    btnCloseNotif.addEventListener('click', () => toggleNotificationsModal(false));
  }

  const notifOverlay = document.getElementById('notifications-modal');
  if (notifOverlay) {
    notifOverlay.addEventListener('click', (e) => {
      if (e.target === notifOverlay) toggleNotificationsModal(false);
    });
  }

  const btnClearNotif = document.getElementById('btn-clear-notifications');
  if (btnClearNotif) {
    btnClearNotif.addEventListener('click', () => {
      AppState.notifications = [];
      renderNotifications();
      showToast('Notifications marked as read.', 'info');
    });
  }

  // Set default view on start
  switchScreen('login');
  renderNotifications();
}

// Cordova initialization hook
document.addEventListener('deviceready', () => {
  console.log('Cordova device is ready');
  initApp();
}, false);

// Fallback for browser preview / direct DOM readiness
window.addEventListener('DOMContentLoaded', () => {
  if (!window.cordova) {
    console.log('Running in browser (non-Cordova) mode');
    initApp();
  }
});
