/**
 * Citizen Report - Application State & Configuration Module
 * Author: SivvAI
 */

const WP_CONFIG = {
  // Configured via js/config.js (defaults to Cloud Preview build)
  baseUrl: (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'https://sivvyboi-yvxpm-studio.wp.build',
  apiPath: (window.APP_CONFIG && window.APP_CONFIG.API_NAMESPACE) || '/wp-json/citizen-report/v1',
  pollIntervalMs: (window.APP_CONFIG && window.APP_CONFIG.POLL_INTERVAL_MS) || 20000,
  googleWebClientId: (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_WEB_CLIENT_ID) || '',
  firebaseConfig: (window.APP_CONFIG && window.APP_CONFIG.FIREBASE_CONFIG) || null
};

const INITIAL_NOTIFICATIONS = [];

const AppState = {
  currentUser: null,
  activeView: 'home',
  selectedFilter: 'All',
  incidents: [],
  notifications: [...INITIAL_NOTIFICATIONS],
  currentIncidentDetail: null,
  previousView: 'home',
  uploadedImageData: null,
  isLoading: false,
  knownIncidentIds: new Set(),
  pollTimer: null,
  googleClientId: null,
  googleSignInEnabled: false,
  map: null,
  markersLayer: null,
  userLocationMarker: null
};
