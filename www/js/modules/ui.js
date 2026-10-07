/**
 * Citizen Report - Screen & View Navigation, Modals & Profile UI Module
 * Author: SivvAI
 */

function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`screen-${screenName}`);
  if (target) {
    target.classList.add('active');
  }
}

function switchView(viewName) {
  if (viewName === 'details') {
    AppState.previousView = AppState.activeView === 'details' ? 'home' : AppState.activeView;
  }

  AppState.activeView = viewName;

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
    targetView.scrollTop = 0;
  }

  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (viewName === 'home') {
    renderIncidentsList();
  } else if (viewName === 'my-reports') {
    renderMyReportsList();
  } else if (viewName === 'profile') {
    renderProfileView();
  }
}

function renderProfileView() {
  if (!AppState.currentUser) return;

  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = AppState.currentUser.name;

  const emailEl = document.getElementById('profile-email');
  if (emailEl) emailEl.textContent = AppState.currentUser.email || 'Citizen User';

  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) avatarEl.textContent = getInitials(AppState.currentUser.name);

  const myReportsCount = AppState.incidents.filter(inc => {
    return inc.isUserReport || (inc.author_id && Number(inc.author_id) === Number(AppState.currentUser.id));
  }).length;

  const totalEl = document.getElementById('profile-total-reports');
  if (totalEl) totalEl.textContent = myReportsCount;
}

function getInitials(name) {
  if (!name) return 'CR';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
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
