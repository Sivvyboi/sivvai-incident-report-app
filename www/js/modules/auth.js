/**
 * Citizen Report - Authentication & Authorization Module
 * Powered by Firebase Authentication with direct WordPress Backend Sync.
 * Author: SivvAI
 */

/**
 * Initialize Firebase if not already initialized
 */
function initFirebaseAuth() {
  if (typeof firebase === 'undefined') return false;
  if (!firebase.apps.length) {
    const config = (window.APP_CONFIG && window.APP_CONFIG.FIREBASE_CONFIG) || (AppState.firebaseConfig) || null;
    if (config && config.apiKey) {
      try {
        firebase.initializeApp(config);
      } catch (e) {
        console.warn('Firebase initialization error:', e);
      }
    }
  }
  return firebase.apps.length > 0;
}

/**
 * Synchronize authenticated Firebase/Google user with WordPress backend
 */
async function syncUserWithWordPress(idToken) {
  try {
    const url = `${WP_CONFIG.baseUrl}${WP_CONFIG.apiPath}/auth/sync`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ id_token: idToken })
    });
    const data = await res.json();
    if (res.ok && data.success && data.user) {
      return data.user;
    }
  } catch (err) {
    console.warn('WordPress user sync failed, using fallback:', err);
  }
  return null;
}

/**
 * Handle Standard Login Form Submission
 */
async function handleLoginSubmit(e) {
  e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const loginBtn = document.getElementById('btn-login');

  const emailOrUser = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!emailOrUser || !password) {
    showToast('Please enter both username/email and password.', 'error');
    return;
  }

  const origBtnText = loginBtn.innerHTML;
  loginBtn.disabled = true;
  loginBtn.innerHTML = 'Signing In...';
  showLoading('Signing in...');

  try {
    let idToken = null;
    let userCredential = null;

    // 1. Try Firebase Auth (Email/Password)
    if (initFirebaseAuth()) {
      try {
        userCredential = await firebase.auth().signInWithEmailAndPassword(emailOrUser, password);
        idToken = await userCredential.user.getIdToken();
      } catch (fbErr) {
        if (fbErr.code !== 'auth/invalid-email') {
          console.warn('Firebase login attempt:', fbErr.message);
        }
      }
    }

    // 2. If Firebase login succeeded, sync with WordPress
    if (idToken) {
      showLoading('Verifying account with server...');
      const wpUser = await syncUserWithWordPress(idToken);
      if (!wpUser || !wpUser.id) {
        hideLoading();
        showToast('Could not verify account with server. Please check your connection.', 'error');
        if (typeof firebase !== 'undefined' && firebase.auth) {
          try { firebase.auth().signOut(); } catch (e) {}
        }
        return;
      }

      const fbUser = userCredential.user;
      AppState.currentUser = {
        id: wpUser.id,
        name: wpUser.name || wpUser.username || fbUser.displayName || fbUser.email,
        email: wpUser.email || fbUser.email || '',
        username: wpUser.username || (fbUser.email ? fbUser.email.split('@')[0] : 'citizen'),
        roles: wpUser.roles || ['subscriber'],
        token: idToken,
        loginMethod: 'firebase'
      };

      const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
      localStorage.setItem(storageKey, JSON.stringify(AppState.currentUser));
      localStorage.setItem('cr_firebase_token', idToken);

      hideLoading();
      switchScreen('app');
      switchView('home');
      renderNotifications();
      showToast(`Welcome back, ${AppState.currentUser.name}!`, 'success');
      fetchIncidentsFromWP();
      return;
    }

    // 3. Fallback: Direct WordPress REST login (e.g. for admin user)
    const url = `${WP_CONFIG.baseUrl}${WP_CONFIG.apiPath}/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: emailOrUser, password: password })
    });
    const data = await response.json();

    if (response.ok && data.success && data.user) {
      AppState.currentUser = {
        id: data.user.id,
        name: data.user.name || data.user.username,
        email: data.user.email,
        username: data.user.username,
        roles: data.user.roles || ['subscriber'],
        token: data.token,
        loginMethod: 'direct'
      };

      const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
      localStorage.setItem(storageKey, JSON.stringify(AppState.currentUser));
      localStorage.setItem('cr_firebase_token', data.token);

      hideLoading();
      switchScreen('app');
      switchView('home');
      renderNotifications();
      showToast(`Welcome back, ${AppState.currentUser.name}!`, 'success');
      fetchIncidentsFromWP();
    } else {
      hideLoading();
      const errMsg = (data && data.message) || 'Invalid credentials. Please verify your email and password.';
      showToast(errMsg, 'error');
    }
  } catch (err) {
    hideLoading();
    console.error('Login error:', err);
    showToast(err.message ? `Login failed: ${err.message}` : 'Could not reach server. Please check your connection.', 'error');
  } finally {
    hideLoading();
    loginBtn.disabled = false;
    loginBtn.innerHTML = origBtnText;
  }
}

/**
 * Handle user clicking the "Sign in with Google" button
 */
async function handleGoogleButtonClick() {
  initFirebaseAuth();

  // 1. Cordova Native Environment with cordova-plugin-googleplus
  if (window.cordova && window.plugins && window.plugins.googleplus) {
    const webClientId = WP_CONFIG.googleWebClientId || (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_WEB_CLIENT_ID) || '';
    if (!webClientId) {
      showToast('Google Sign-In requires GOOGLE_WEB_CLIENT_ID to be set in .env.local.', 'error');
      return;
    }
    showLoading('Connecting to Google...');
    window.plugins.googleplus.login(
      {
        webClientId: webClientId,
        offline: false
      },
      async function (obj) {
        if (obj.idToken) {
          try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
              showLoading('Authenticating with Google...');
              const credential = firebase.auth.GoogleAuthProvider.credential(obj.idToken);
              const result = await firebase.auth().signInWithCredential(credential);
              const fbToken = await result.user.getIdToken();
              await handleAuthenticatedTokenSuccess(fbToken, 'google');
              return;
            }
          } catch (e) {
            console.warn('Firebase credential login error:', e);
          }
          await handleAuthenticatedTokenSuccess(obj.idToken, 'google');
        } else {
          hideLoading();
          showToast('Google did not return an ID token.', 'error');
        }
      },
      function (err) {
        hideLoading();
        console.warn('Native Google Sign-In error:', err);
        const errMsg = (typeof err === 'object') ? (err.message || JSON.stringify(err)) : String(err);
        showToast(`Google Sign-In error: ${errMsg}`, 'error');
      }
    );
    return;
  }

  // 2. Web Browser / In-App with Firebase SDK
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      showLoading('Opening Google Sign-In...');
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await firebase.auth().signInWithPopup(provider);
      const idToken = await result.user.getIdToken();
      await handleAuthenticatedTokenSuccess(idToken, 'google');
      return;
    } catch (fbErr) {
      hideLoading();
      console.warn('Firebase Google sign-in error:', fbErr);
      if (fbErr.code !== 'auth/popup-closed-by-user') {
        showToast(fbErr.message || 'Google Sign-In failed.', 'error');
      }
      return;
    }
  }

  hideLoading();
  showToast('Google Sign-In is not currently available.', 'error');
}

/**
 * Handle authenticated Firebase / Google token success
 */
async function handleAuthenticatedTokenSuccess(idToken, method = 'firebase') {
  showLoading('Verifying account with server...');
  try {
    const wpUser = await syncUserWithWordPress(idToken);
    if (!wpUser || !wpUser.id) {
      hideLoading();
      showToast('Could not verify account with server. Please check your connection.', 'error');
      if (typeof firebase !== 'undefined' && firebase.auth) {
        try { firebase.auth().signOut(); } catch (e) {}
      }
      return;
    }

    let fbUser = null;
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      fbUser = firebase.auth().currentUser;
    }

    AppState.currentUser = {
      id: wpUser.id,
      name: wpUser.name || (fbUser && fbUser.displayName) || wpUser.username || 'Citizen User',
      email: wpUser.email || (fbUser && fbUser.email) || '',
      username: wpUser.username || (fbUser && fbUser.email ? fbUser.email.split('@')[0] : 'citizen'),
      roles: wpUser.roles || ['subscriber'],
      token: idToken,
      loginMethod: method
    };

    const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
    localStorage.setItem(storageKey, JSON.stringify(AppState.currentUser));
    localStorage.setItem('cr_firebase_token', idToken);

    hideLoading();
    switchScreen('app');
    switchView('home');
    renderNotifications();
    showToast(`Welcome, ${AppState.currentUser.name}!`, 'success');
    fetchIncidentsFromWP();
  } catch (err) {
    hideLoading();
    console.error('Account verification error:', err);
    showToast('Failed to complete sign-in. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

/**
 * Handle Register form submission
 */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const confirmPassword = document.getElementById('reg-confirm-password').value.trim();
  const submitBtn = document.getElementById('btn-register');

  if (!email || !password) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }
  if (password !== confirmPassword) {
    showToast('Passwords do not match.', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'error');
    return;
  }

  const origText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Creating Account...';
  showLoading('Creating Account...');

  try {
    let idToken = null;

    // 1. Try Firebase Auth Registration
    if (initFirebaseAuth()) {
      try {
        const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
        idToken = await userCred.user.getIdToken();
      } catch (fbErr) {
        console.warn('Firebase registration error:', fbErr);
        if (fbErr.code === 'auth/email-already-in-use') {
          showToast('An account with this email already exists. Please log in.', 'error');
          return;
        } else if (fbErr.code === 'auth/weak-password') {
          showToast('Password should be at least 6 characters.', 'error');
          return;
        } else if (fbErr.code === 'auth/invalid-email') {
          showToast('Invalid email address format.', 'error');
          return;
        }
      }
    }

    if (idToken) {
      showLoading('Syncing account with server...');
      const wpUser = await syncUserWithWordPress(idToken);
      if (!wpUser || !wpUser.id) {
        hideLoading();
        showToast('Account registered with Firebase, but server sync failed. Please try logging in.', 'error');
        return;
      }

      AppState.currentUser = {
        id: wpUser.id,
        name: wpUser.name || email.split('@')[0],
        email: email,
        username: wpUser.username || email.split('@')[0],
        roles: wpUser.roles || ['subscriber'],
        token: idToken,
        loginMethod: 'firebase'
      };

      const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
      localStorage.setItem(storageKey, JSON.stringify(AppState.currentUser));
      localStorage.setItem('cr_firebase_token', idToken);

      hideLoading();
      switchScreen('app');
      switchView('home');
      renderNotifications();
      showToast(`Account created! Welcome, ${AppState.currentUser.name}!`, 'success');
      fetchIncidentsFromWP();
      return;
    }

    // 2. Fallback: Direct WordPress REST registration
    const url = `${WP_CONFIG.baseUrl}${WP_CONFIG.apiPath}/register`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if ((response.ok || response.status === 201) && data.success) {
      AppState.currentUser = {
        id: data.user.id,
        name: data.user.name || data.user.username,
        email: data.user.email,
        username: data.user.username,
        roles: data.user.roles || ['subscriber'],
        token: data.token,
        loginMethod: 'direct'
      };

      const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
      localStorage.setItem(storageKey, JSON.stringify(AppState.currentUser));
      localStorage.setItem('cr_firebase_token', data.token);

      hideLoading();
      switchScreen('app');
      switchView('home');
      renderNotifications();
      showToast(data.message || `Account created! Welcome, ${AppState.currentUser.name}!`, 'success');
      fetchIncidentsFromWP();
    } else {
      hideLoading();
      const msg = (data && (data.message || (data.data && data.data.message))) || 'Registration failed. Please try again.';
      showToast(msg, 'error');
    }
  } catch (err) {
    hideLoading();
    console.error('Register error:', err);
    showToast(err.message ? `Registration failed: ${err.message}` : 'Could not reach server. Please check your connection.', 'error');
  } finally {
    hideLoading();
    submitBtn.disabled = false;
    submitBtn.innerHTML = origText;
  }
}

/**
 * Check and restore stored session or Firebase state
 */
async function tryAutoLogin() {
  if (initFirebaseAuth()) {
    return new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(checkStoredLocalSession());
        }
      }, 2500);

      const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
        unsubscribe();
        clearTimeout(timeout);
        if (resolved) return;
        resolved = true;

        if (user) {
          try {
            const idToken = await user.getIdToken();
            const wpUser = await syncUserWithWordPress(idToken);
            if (wpUser && wpUser.id) {
              AppState.currentUser = {
                id: wpUser.id,
                name: wpUser.name || user.displayName || user.email,
                email: user.email || '',
                username: wpUser.username || (user.email ? user.email.split('@')[0] : 'citizen'),
                roles: wpUser.roles || ['subscriber'],
                token: idToken,
                loginMethod: 'firebase'
              };
              const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
              localStorage.setItem(storageKey, JSON.stringify(AppState.currentUser));
              localStorage.setItem('cr_firebase_token', idToken);
              resolve(true);
              return;
            }
          } catch (e) {
            console.warn('Firebase session restore error:', e);
          }
        }
        resolve(checkStoredLocalSession());
      });
    });
  }

  return checkStoredLocalSession();
}

function checkStoredLocalSession() {
  const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
  const saved = localStorage.getItem(storageKey);
  const token = localStorage.getItem('cr_firebase_token');
  if (saved && token) {
    try {
      AppState.currentUser = JSON.parse(saved);
      AppState.currentUser.token = token;
      return true;
    } catch (e) {}
  }
  return false;
}

function handleLogout() {
  showLoading('Signing out...');
  setTimeout(() => {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      try { firebase.auth().signOut(); } catch (e) {}
    }

    AppState.currentUser = null;
    AppState.uploadedImageData = null;

    const storageKey = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ? 'cr_user_session' : 'cr_web_session';
    localStorage.removeItem(storageKey);
    localStorage.removeItem('cr_firebase_token');

    AppState.incidents.forEach(inc => { inc.isUserReport = false; });

    const form = document.getElementById('form-login');
    if (form) form.reset();

    hideLoading();
    switchScreen('login');
    showToast('You have been signed out.', 'info');
  }, 250);
}
