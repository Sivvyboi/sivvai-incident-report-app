/**
 * Citizen Report - WordPress REST API Client Module
 * Author: SivvAI
 */

/**
 * Load public app configuration from WordPress REST API (GIS settings, endpoints)
 */
async function loadAppConfig() {
  try {
    const url = `${WP_CONFIG.baseUrl}${WP_CONFIG.apiPath}/config`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) return;
    const config = await response.json();
    AppState.googleSignInEnabled = !!config.google_sign_in_enabled;
    AppState.googleClientId = config.google_client_id || null;
    if (config.firebase && config.firebase.apiKey) {
      AppState.firebaseConfig = config.firebase;
    }
    if (typeof initFirebaseAuth === 'function') {
      initFirebaseAuth();
    }
  } catch (e) {
    console.warn('Could not load app config:', e);
  }
}

/**
 * Fetch all incidents from WordPress REST API
 */
async function fetchIncidentsFromWP(isBackgroundPoll = false) {
  if (!isBackgroundPoll && typeof showLoadingBar === 'function') {
    showLoadingBar();
  }
  try {
    const url = `${WP_CONFIG.baseUrl}${WP_CONFIG.apiPath}/incidents`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch incidents`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      // Check for newly posted incidents by other users
      if (AppState.knownIncidentIds.size > 0) {
        data.forEach(inc => {
          if (!AppState.knownIncidentIds.has(inc.id)) {
            AppState.notifications.unshift({
              id: 'notif-' + inc.id + '-' + Date.now(),
              title: `📢 New Incident: ${inc.title}`,
              message: `Reported at ${inc.location || 'nearby'}. Category: ${inc.category}.`,
              time: 'Just now',
              alert: inc.category === 'Rioting' || inc.category === 'Fire'
            });
            showToast(`New incident: ${inc.title}`, 'info');
          }
        });
      }

      data.forEach(inc => AppState.knownIncidentIds.add(inc.id));

      data.forEach(inc => {
        if (AppState.currentUser) {
          inc.isUserReport = (inc.author_id && Number(inc.author_id) === Number(AppState.currentUser.id)) ||
            (inc.reporter && inc.reporter.toLowerCase() === AppState.currentUser.name.toLowerCase());
        }
      });

      AppState.incidents = data;
      try {
        localStorage.setItem('cr_cached_incidents', JSON.stringify(data));
      } catch (e) {}
      renderNotifications();

      if (AppState.activeView === 'home') {
        renderIncidentsList();
      } else if (AppState.activeView === 'my-reports') {
        renderMyReportsList();
      }

      if (typeof updateMapMarkers === 'function') {
        updateMapMarkers();
      }
    }
  } catch (err) {
    console.warn('WordPress API sync notice:', err.message);
    if (AppState.incidents.length === 0) {
      try {
        const cached = localStorage.getItem('cr_cached_incidents');
        if (cached) {
          AppState.incidents = JSON.parse(cached);
          if (AppState.activeView === 'home') {
            renderIncidentsList();
          } else if (AppState.activeView === 'my-reports') {
            renderMyReportsList();
          }
        } else if (!isBackgroundPoll) {
          renderIncidentsList();
        }
      } catch (e) {
        if (!isBackgroundPoll) renderIncidentsList();
      }
    }
  } finally {
    if (!isBackgroundPoll && typeof hideLoadingBar === 'function') {
      hideLoadingBar();
    }
  }
}

/**
 * Submit New Incident to WordPress REST API
 */
async function handleReportSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('report-title').value.trim();
  const category = document.getElementById('report-category').value;
  const description = document.getElementById('report-desc').value.trim();
  const location = document.getElementById('report-location').value.trim();
  const latStr = document.getElementById('report-lat').value.trim();
  const lngStr = document.getElementById('report-lng').value.trim();
  const submitBtn = document.getElementById('btn-submit-report');

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

  const originalBtnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
    </svg> Submitting to Server...
  `;
  if (typeof showLoading === 'function') {
    showLoading('Publishing report to server...');
  }

  const payload = {
    title: title,
    description: description,
    category: category,
    location: location,
    latitude: isNaN(lat) ? 7.3775 : lat,
    longitude: isNaN(lng) ? 3.9470 : lng,
    datetime: new Date().toISOString().replace('T', ' ').substring(0, 16),
    reporter: AppState.currentUser ? AppState.currentUser.name : 'Citizen Reporter',
    author_id: AppState.currentUser ? AppState.currentUser.id : 1,
    image: AppState.uploadedImageData || null
  };

  try {
    const url = `${WP_CONFIG.baseUrl}${WP_CONFIG.apiPath}/incidents`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(AppState.currentUser && AppState.currentUser.token ? { 'Authorization': `Bearer ${AppState.currentUser.token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const createdIncident = await response.json();
    createdIncident.isUserReport = true;

    AppState.knownIncidentIds.add(createdIncident.id);
    AppState.incidents.unshift(createdIncident);

    AppState.notifications.unshift({
      id: 'notif-' + Date.now(),
      title: `✅ Incident Published: ${title}`,
      message: `Your report has been posted automatically and is visible to other citizens.`,
      time: 'Just now',
      alert: false
    });

    document.getElementById('form-report-incident').reset();
    removeSelectedImage();

    showToast('Incident submitted and published successfully!', 'success');
    renderNotifications();
    switchView('home');

  } catch (err) {
    console.error('Submission error:', err);
    showToast('Could not submit incident to WordPress server. Please verify your connection.', 'error');
  } finally {
    if (typeof hideLoading === 'function') {
      hideLoading();
    }
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
  }
}
