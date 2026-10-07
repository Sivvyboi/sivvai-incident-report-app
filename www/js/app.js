/**
 * Citizen Report - Mobile Application Main Orchestrator
 * Connects all modules, wires event listeners, and boots the application.
 * Author: SivvAI
 */

function initApp() {
  // Dismiss native splashscreen immediately so user is never stuck
  if (navigator.splashscreen && typeof navigator.splashscreen.hide === 'function') {
    navigator.splashscreen.hide();
  }

  // Initialize network connectivity monitoring
  if (typeof initNetworkMonitoring === 'function') {
    initNetworkMonitoring();
  }

  // Initialize password visibility toggles on all password fields
  initPasswordToggles();

  // Initialize Firebase Authentication immediately from local bundle
  if (typeof initFirebaseAuth === 'function') {
    initFirebaseAuth();
  }

  // Load public backend configuration without blocking startup
  if (typeof loadAppConfig === 'function') {
    loadAppConfig();
  }

  // Fast auto-login race: auto-login or 1000ms timeout so startup is instantaneous offline
  const autoLoginPromise = (typeof tryAutoLogin === 'function') ? tryAutoLogin() : Promise.resolve(false);
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(false), 1000));

  Promise.race([autoLoginPromise, timeoutPromise])
    .then(autoLoggedIn => {
      if (!autoLoggedIn) {
        try {
          const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            AppState.currentUser = JSON.parse(saved);
          }
        } catch (e) {}
      }
      _finishInit();
    })
    .catch(() => {
      _finishInit();
    });
}

function _finishInit() {
  // Standard Login form
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', handleLoginSubmit);
  }

  // Google Sign-In button on Login screen
  const btnGoogleLogin = document.getElementById('btn-google-auth-login');
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', handleGoogleButtonClick);
  }

  // Google Sign-In button on Register screen
  const btnGoogleReg = document.getElementById('btn-google-auth-reg');
  if (btnGoogleReg) {
    btnGoogleReg.addEventListener('click', handleGoogleButtonClick);
  }

  // Show Register screen
  const btnShowRegister = document.getElementById('btn-show-register');
  if (btnShowRegister) {
    btnShowRegister.addEventListener('click', () => switchScreen('register'));
  }

  // Back to Login from Register
  const btnRegisterToLogin = document.getElementById('btn-register-to-login');
  if (btnRegisterToLogin) {
    btnRegisterToLogin.addEventListener('click', () => switchScreen('login'));
  }

  // Register form submission
  const formRegister = document.getElementById('form-register');
  if (formRegister) {
    formRegister.addEventListener('submit', handleRegisterSubmit);
  }

  // Logout button
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

  // Photo upload trigger & selection
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

  // Initial screen & view determination
  if (AppState.currentUser) {
    switchScreen('app');
    switchView('home');
  } else {
    switchScreen('login');
  }
  renderNotifications();

  // Dismiss native splashscreen if still active
  if (navigator.splashscreen && typeof navigator.splashscreen.hide === 'function') {
    navigator.splashscreen.hide();
  }

  // Check offline status on startup
  if (!navigator.onLine && typeof updateNetworkStatus === 'function') {
    updateNetworkStatus(false);
  }

  // Initial incidents fetch (loads cached data if offline)
  fetchIncidentsFromWP();

  // Background polling for automatic post refresh
  if (AppState.pollTimer) clearInterval(AppState.pollTimer);
  AppState.pollTimer = setInterval(() => {
    fetchIncidentsFromWP(true);
  }, WP_CONFIG.pollIntervalMs);
}

// Cordova initialization hook
document.addEventListener('deviceready', () => {
  initApp();
}, false);

// Fallback for browser preview / direct DOM readiness
window.addEventListener('DOMContentLoaded', () => {
  if (!window.cordova) {
    initApp();
  }
});
