// Reusable modern layout components: Sidebar, Topbar, and Stat cards

import { icon, userAvatar, displayName, escapeHtml } from '../utils/dom.js';
import { getCurrentUser } from '../services/auth.js';
import { getUnreadNotificationsCount } from '../services/storage.js';
import { notificationCenterMarkup } from './notifications.js';

export const sidebar = (admin, page = 'overview') => {
  const mainNav = admin
    ? [
        ['layout-grid', 'Overview', 'overview'],
        ['award', 'Scholarships', 'scholarships'],
        ['users', 'Registered Accounts', 'registered-accounts']
      ]
    : [
        ['layout-grid', 'Overview', 'overview'],
        ['award', 'Scholarships', 'scholarships'],
        ['user', 'My Profile', 'my-profile']
      ];

  const secondaryNav = admin
    ? [
        ['clock-3', 'Pending Review', 'help-requests']
      ]
    : [
        ['help-circle', 'Help Center', 'help-center']
      ];

  return `<aside class="sidebar">
    <div class="side-brand">
      <div class="brand-logo-icon">
        ${icon('graduation-cap', 22)}
      </div>
      <span class="brand-title">Scholar<span>Hub</span></span>
    </div>

    <div class="sidebar-search">
      ${icon('search', 16)}
      <input type="text" placeholder="Search..." aria-label="Quick search" readonly />
      <span class="search-filter-icon">${icon('sliders-horizontal', 13)}</span>
    </div>

    <div class="sidebar-section">
      <span class="sidebar-section-title">Menu</span>
      <nav class="sidebar-nav">
        ${mainNav
          .map(
            ([iconName, label, routeId]) =>
              `<button class="nav-item ${routeId === page ? 'active' : ''}" data-page="${routeId}">
                <span class="nav-icon">${icon(iconName, 18)}</span>
                <span class="nav-label">${label}</span>
              </button>`
          )
          .join('')}
      </nav>
    </div>

    <div class="sidebar-section">
      <span class="sidebar-section-title">Support &amp; Tools</span>
      <nav class="sidebar-nav">
        ${secondaryNav
          .map(
            ([iconName, label, routeId]) =>
              `<button class="nav-item ${routeId === page ? 'active' : ''}" data-page="${routeId}">
                <span class="nav-icon">${icon(iconName, 18)}</span>
                <span class="nav-label">${label}</span>
              </button>`
          )
          .join('')}
      </nav>
    </div>

    <div class="sidebar-bottom">
      <div class="sidebar-status-card">
        <div class="status-card-header">
          <div class="status-badge-icon">${icon('sparkles', 16)}</div>
          <span class="status-pill-badge">A.Y. 2026-2027</span>
        </div>
        <strong>Scholarship Portal</strong>
        <p>Operational &amp; Accepting Submissions</p>
      </div>

      <button class="nav-item logout-btn logout" aria-label="Sign out">
        <span class="nav-icon">${icon('log-out', 17)}</span>
        <span class="nav-label">Sign out</span>
      </button>
    </div>
  </aside>`;
};

export const topbar = (admin, currentRoute = 'overview') => {
  const user = admin ? { name: 'Administrator' } : getCurrentUser();
  const section =
    currentRoute === 'my-profile'
      ? 'My Profile'
      : currentRoute === 'help-center'
        ? 'Help Center'
        : currentRoute === 'help-requests'
          ? 'Pending Review'
          : currentRoute === 'registered-accounts'
            ? 'Registered Accounts'
            : currentRoute === 'scholarships'
              ? 'Scholarships'
              : currentRoute === 'scholars'
                ? 'New Scholars'
                : currentRoute === 'active-scholars'
                  ? 'Active Scholars'
                  : 'Dashboard';

  return `<header class="topbar">
    <div class="topbar-left">
      <button class="hamburger" aria-label="Open menu">${icon('menu', 20)}</button>
      <div class="nav-history-pills">
        <button class="history-pill" data-back-dashboard aria-label="Back">${icon('arrow-left', 15)}</button>
      </div>
      <div class="breadcrumb-pill">
        <span class="bc-root">ScholarHub</span>
        <span class="bc-sep">›</span>
        <span class="bc-active">${section}</span>
      </div>
    </div>

    <div class="topbar-right">
      <button class="round-action-btn theme-toggle" aria-label="Toggle appearance theme" title="Switch theme">
        <span class="theme-icon-sun">${icon('sun', 17)}</span>
        <span class="theme-icon-moon">${icon('moon', 17)}</span>
      </button>

      <div class="notifications-trigger-wrap">
        <button class="round-action-btn notif-bell-btn" type="button" data-toggle-notifications aria-label="Notifications" title="Notifications &amp; Updates">
          ${icon('bell', 17)}
          ${
            getUnreadNotificationsCount(user) > 0
              ? `<span class="notification-badge-count">${getUnreadNotificationsCount(user) > 9 ? '9+' : getUnreadNotificationsCount(user)}</span>`
              : ''
          }
        </button>
        ${notificationCenterMarkup(user)}
      </div>

      <div class="user-chip-modern ${admin ? '' : 'open-profile'}" ${admin ? '' : 'role="button" tabindex="0"'} title="View profile">
        <div class="user-avatar-wrap">
          ${userAvatar(user, 'modern-avatar')}
        </div>
        <div class="user-meta-text">
          <strong>${displayName(user)}</strong>
          <small>${admin ? 'System Admin' : escapeHtml(user?.course || 'Scholar')}</small>
        </div>
      </div>
    </div>
  </header>`;
};

export const stat = (label, value, trend, iconName, color, detail) => {
  const clickable = detail !== 'applicants';
  const tag = clickable ? 'button' : 'article';
  const isUp = trend && trend[0] === '+';
  const trendText = trend || '+3.2%';

  return `<${tag} class="stat-card modern-stat-card ${clickable ? 'stat-link' : 'total-card'}" ${
    clickable ? `data-admin-detail="${detail}" aria-label="View ${label}"` : ''
  }>
    <div class="stat-card-header">
      <div class="stat-icon-box ${color}">
        ${icon(iconName, 20)}
      </div>
      <div class="stat-trend-badge ${isUp ? 'trend-up' : 'trend-down'}">
        ${isUp ? icon('arrow-up-right', 13) : icon('arrow-down-right', 13)}
        <span>${trendText}</span>
      </div>
    </div>

    <div class="stat-card-body">
      <h3 class="stat-metric-value">${value}</h3>
      <p class="stat-metric-label">${label}</p>
    </div>

    <div class="stat-card-footer">
      <span>View details</span>
      <span class="stat-arrow-icon">${icon('arrow-right', 14)}</span>
    </div>
  </${tag}>`;
};
