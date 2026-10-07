/**
 * Citizen Report - Incidents Presentation, Listing & Filtering Module
 * Author: SivvAI
 */

function renderIncidentsList() {
  const container = document.getElementById('incidents-list');
  const countEl = document.getElementById('feed-count');
  if (!container) return;

  const filter = AppState.selectedFilter;
  const filtered = filter === 'All'
    ? AppState.incidents
    : AppState.incidents.filter(inc => (inc.category || '').toLowerCase() === filter.toLowerCase());

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
        <button class="btn btn-secondary btn-sm" onclick="switchView('report')">Submit a Report</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(inc => {
    const imgSrc = inc.image || createCategorySvg(inc.category, inc.title);
    return `
      <div class="incident-card" onclick="openIncidentDetails('${inc.id}')">
        <div class="card-thumb">
          <img src="${imgSrc}" alt="${escapeHtml(inc.category)}" loading="lazy" onerror="this.src='${createCategorySvg(inc.category, inc.title)}'" />
        </div>
        <div class="card-info">
          <div class="card-top">
            <span class="badge ${getCategoryBadgeClass(inc.category)}">${escapeHtml(inc.category)}</span>
            <span class="card-time">${formatDisplayDate(inc.datetime || inc.post_date)}</span>
          </div>
          <h4 class="card-title">${escapeHtml(inc.title)}</h4>
          <p class="card-desc">${escapeHtml(inc.description)}</p>
          <div class="card-location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${escapeHtml(inc.location || 'Reported Location')}</span>
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

  const myIncidents = AppState.incidents.filter(inc => {
    if (inc.isUserReport) return true;
    if (AppState.currentUser) {
      if (inc.author_id && Number(inc.author_id) === Number(AppState.currentUser.id)) return true;
      if (inc.reporter && inc.reporter.toLowerCase() === AppState.currentUser.name.toLowerCase()) return true;
    }
    return false;
  });

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
          <span class="badge ${getCategoryBadgeClass(inc.category)}">${escapeHtml(inc.category)}</span>
          <span class="badge ${statusClass}">${escapeHtml(inc.status || 'Pending Review')}</span>
        </div>
        <h4 class="my-report-title">${escapeHtml(inc.title)}</h4>
        <div class="my-report-bottom">
          <span>${escapeHtml(inc.location || 'Reported Location')}</span>
          <span>${formatDisplayDate(inc.datetime || inc.post_date)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function openIncidentDetails(id) {
  const incident = AppState.incidents.find(item => String(item.id) === String(id));
  if (!incident) return;

  AppState.currentIncidentDetail = incident;

  const heroImg = document.getElementById('detail-hero-img');
  if (heroImg) {
    heroImg.src = incident.image || createCategorySvg(incident.category, incident.title);
    heroImg.onerror = function () {
      this.src = createCategorySvg(incident.category, incident.title);
    };
  }

  const categoryBadge = document.getElementById('detail-category');
  if (categoryBadge) {
    categoryBadge.textContent = incident.category;
    categoryBadge.className = `badge ${getCategoryBadgeClass(incident.category)}`;
  }

  const statusBadge = document.getElementById('detail-status');
  if (statusBadge) {
    statusBadge.textContent = incident.status || 'Pending Review';
    statusBadge.className = `badge ${incident.status === 'Verified' ? 'badge-status-verified' : 'badge-status-pending'}`;
  }

  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = incident.title;

  const descEl = document.getElementById('detail-description');
  if (descEl) descEl.textContent = incident.description;

  const locEl = document.getElementById('detail-location');
  if (locEl) locEl.textContent = incident.location || 'Reported Location';

  const dateEl = document.getElementById('detail-datetime');
  if (dateEl) dateEl.textContent = formatDisplayDate(incident.datetime || incident.post_date);

  const reporterEl = document.getElementById('detail-reporter');
  if (reporterEl) reporterEl.textContent = incident.reporter || 'Citizen Reporter';

  const latEl = document.getElementById('detail-latitude');
  if (latEl) latEl.textContent = incident.latitude != null ? Number(incident.latitude).toFixed(4) : 'N/A';

  const lngEl = document.getElementById('detail-longitude');
  if (lngEl) lngEl.textContent = incident.longitude != null ? Number(incident.longitude).toFixed(4) : 'N/A';

  switchView('details');
}

function handleGetLocation() {
  const btn = document.getElementById('btn-get-location');
  if (!btn) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = `Acquiring GPS...`;
  btn.disabled = true;

  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your device. Enter coordinates manually.', 'info');
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const latInput = document.getElementById('report-lat');
      const lngInput = document.getElementById('report-lng');
      if (latInput) latInput.value = lat.toFixed(5);
      if (lngInput) lngInput.value = lng.toFixed(5);

      const locationField = document.getElementById('report-location');
      if (locationField && !locationField.value) {
        locationField.value = 'Current GPS Location';
      }

      showToast('Coordinates retrieved successfully!', 'success');
      btn.innerHTML = originalText;
      btn.disabled = false;
    },
    (error) => {
      showToast('Could not retrieve GPS location automatically. Enter coordinates manually.', 'info');
      btn.innerHTML = originalText;
      btn.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function handleImageSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    AppState.uploadedImageData = e.target.result;

    const previewContainer = document.getElementById('photo-preview-container');
    const previewImg = document.getElementById('photo-preview-img');
    const uploadPrompt = document.getElementById('photo-upload-prompt');

    if (previewImg) previewImg.src = AppState.uploadedImageData;
    if (previewContainer) previewContainer.style.display = 'block';
    if (uploadPrompt) uploadPrompt.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeSelectedImage() {
  AppState.uploadedImageData = null;
  const fileInput = document.getElementById('report-image-input');
  if (fileInput) fileInput.value = '';

  const previewContainer = document.getElementById('photo-preview-container');
  if (previewContainer) previewContainer.style.display = 'none';

  const uploadPrompt = document.getElementById('photo-upload-prompt');
  if (uploadPrompt) uploadPrompt.style.display = 'flex';
}
