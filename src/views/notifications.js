// Dedicated Notifications Center view for Admin and Student portals

import { icon, escapeHtml } from '../utils/dom.js';
import { sidebar, topbar } from '../components/layout.js';
import { getCurrentUser, isAdminSession } from '../services/auth.js';
import { getUserNotifications, getUnreadNotificationsCount } from '../services/storage.js';
import { refresh } from '../events.js';

const formatDetailedTime = isoDate => {
  if (!isoDate) return 'Recently';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getNotifIconAndTag = type => {
  switch (type) {
    case 'deadline':
      return { iconName: 'calendar-clock', colorClass: 'blue-icon', label: 'Deadline Alert' };
    case 'schedule':
      return { iconName: 'calendar-check', colorClass: 'cyan-icon', label: 'Appointment Schedule' };
    case 'application':
      return { iconName: 'award', colorClass: 'emerald-icon', label: 'Application Update' };
    case 'help':
      return { iconName: 'message-square', colorClass: 'purple-icon', label: 'Support Inquiries' };
    case 'requirement':
    case 'status':
      return { iconName: 'shield-alert', colorClass: 'rose-icon', label: 'Compliance & Roster' };
    case 'announcement':
    default:
      return { iconName: 'megaphone', colorClass: 'amber-icon', label: 'Campus Bulletin' };
  }
};

export const notificationsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const isAdmin = isAdminSession();
  const user = getCurrentUser();
  const notifs = getUserNotifications(user);
  const unreadCount = getUnreadNotificationsCount(user);

  app.innerHTML = `<div class="portal ${isAdmin ? 'admin' : 'student'}">
    <div class="sidebar-backdrop"></div>
    ${sidebar(isAdmin, 'notifications')}
    <div class="main">
      ${topbar(isAdmin, 'notifications')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard>
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Notification Center</h1>
            <p class="hero-page-subtitle">Review administrative advisories, appointment schedules, renewal deadlines, and ticket responses.</p>
          </div>
          <div class="hero-header-actions">
            ${
              unreadCount > 0
                ? `<button class="primary-pill-btn" type="button" data-notifications-page-mark-read>
                    ${icon('check-check', 16)}
                    <span>Mark all as read</span>
                  </button>`
                : ''
            }
            ${
              notifs.some(n => Array.isArray(n.readBy) && user?.email && n.readBy.includes(user.email))
                ? `<button class="secondary-pill-btn" type="button" data-notifications-page-clear-read>
                    ${icon('trash-2', 16)}
                    <span>Clear read</span>
                  </button>`
                : ''
            }
            <div class="stat-trend-badge ${unreadCount > 0 ? 'trend-up' : ''}" style="font-size: 13px; padding: 8px 16px;">
              ${icon('bell', 16)}
              <span>${unreadCount} Unread · ${notifs.length} Total</span>
            </div>
          </div>
        </section>

        <!-- Notification List Card -->
        <section class="modern-card table-section-card">
          <div class="card-header table-control-bar">
            <div>
              <h2 class="card-title">All Notifications &amp; Alerts</h2>
              <p class="card-subtitle">Showing updates synchronized for ${escapeHtml(user?.name || user?.email || 'your account')}.</p>
            </div>
            <div class="table-control-actions">
              <div class="table-search-pill">
                ${icon('search', 15)}
                <input id="notif-page-search" type="search" placeholder="Search notification title or message..." />
              </div>
              <div class="select-pill-wrapper">
                <select id="notif-page-filter" class="pill-select compact-select" aria-label="Filter notifications">
                  <option value="all">All notifications</option>
                  <option value="unread">Unread only</option>
                  <option value="deadline">Deadlines</option>
                  <option value="schedule">Schedules</option>
                  <option value="application">Applications</option>
                  <option value="help">Support Tickets</option>
                  <option value="announcement">Bulletins</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Notification Items List -->
          <div class="notifications-page-list-wrap">
            <div id="notifications-master-list" class="notifications-master-list">
              ${
                notifs.length
                  ? notifs
                      .map(item => {
                        const isRead = Array.isArray(item.readBy) && user?.email && item.readBy.includes(user.email);
                        const { iconName, colorClass, label } = getNotifIconAndTag(item.type);
                        const isUrgent = item.priority === 'urgent' || item.priority === 'high';

                        let destinationRoute = 'overview';
                        let destinationLabel = 'View on Dashboard';
                        let destinationIcon = 'arrow-right';

                        if (item.type === 'deadline' || item.type === 'schedule') {
                          destinationRoute = 'overview';
                          destinationLabel = 'View Schedule & Deadlines';
                          destinationIcon = 'calendar-clock';
                        } else if (item.type === 'application') {
                          destinationRoute = isAdmin ? 'applications' : 'scholarships';
                          destinationLabel = isAdmin ? 'Open Applications Queue' : 'Track My Application';
                          destinationIcon = 'award';
                        } else if (item.type === 'help') {
                          destinationRoute = isAdmin ? 'help-requests' : 'help-center';
                          destinationLabel = isAdmin ? 'Review Support Requests' : 'View Support Ticket';
                          destinationIcon = 'message-square';
                        } else if (item.type === 'announcement') {
                          destinationRoute = 'overview';
                          destinationLabel = 'View Campus Bulletins';
                          destinationIcon = 'megaphone';
                        } else if (item.type === 'status' || item.type === 'requirement') {
                          destinationRoute = isAdmin ? 'scholars' : 'my-profile';
                          destinationLabel = isAdmin ? 'View Scholar Roster' : 'View Profile Records';
                          destinationIcon = 'shield';
                        }

                        return `<article class="notif-card-master ${isRead ? 'read' : 'unread'} ${isUrgent ? 'urgent' : ''}"
                          data-notif-id="${escapeHtml(item.id)}"
                          data-notif-type="${escapeHtml(item.type)}"
                          data-notif-status="${isRead ? 'read' : 'unread'}"
                          data-search="${escapeHtml(`${item.title} ${item.message} ${label} ${item.targetSchool || ''}`.toLowerCase())}">
                          
                          <div class="notif-card-main-col">
                            <div class="notif-icon-badge ${colorClass}">
                              ${icon(iconName, 18)}
                            </div>
                            
                            <div class="notif-card-content">
                              <div class="notif-card-header-row">
                                <div class="notif-card-title-wrap">
                                  <strong class="notif-card-title">${escapeHtml(item.title)}</strong>
                                  ${!isRead ? '<span class="notif-unread-dot" title="Unread notification"></span>' : ''}
                                </div>
                                <span class="notif-card-date">${formatDetailedTime(item.createdAt)}</span>
                              </div>

                              <p class="notif-card-message">${escapeHtml(item.message)}</p>

                              <div class="notif-card-tags-row">
                                <span class="notif-category-tag">${icon('tag', 11)} ${escapeHtml(label)}</span>
                                ${item.targetSchool ? `<span class="notif-school-tag">${icon('building-2', 11)} ${escapeHtml(item.targetSchool)}</span>` : ''}
                                ${isUrgent ? `<span class="notif-urgent-tag">${icon('alert-circle', 11)} High Priority</span>` : ''}
                                <span class="status-pill ${isRead ? 'status-pill-info' : 'status-pill-done'}" style="font-size:10.5px;padding:2px 8px;">
                                  ${isRead ? 'Read' : 'New'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div class="notif-card-actions-col">
                            <button type="button" class="primary-pill-btn notif-destination-btn"
                              data-notif-destination="${destinationRoute}"
                              data-notif-id="${escapeHtml(item.id)}"
                              title="Go to ${destinationLabel}">
                              ${icon(destinationIcon, 14)}
                              <span>${destinationLabel}</span>
                            </button>
                            <div class="notif-secondary-actions">
                              <button type="button" class="secondary-pill-btn"
                                data-toggle-notif-read="${escapeHtml(item.id)}"
                                style="padding:6px 10px;font-size:11.5px;"
                                title="${isRead ? 'Mark as unread' : 'Mark as read'}">
                                ${icon(isRead ? 'rotate-ccw' : 'check', 13)}
                                <span>${isRead ? 'Unread' : 'Read'}</span>
                              </button>
                              <button type="button" class="table-delete-btn"
                                data-delete-notif="${escapeHtml(item.id)}"
                                style="padding:6px 9px;"
                                title="Delete this notification">
                                ${icon('trash-2', 13)}
                              </button>
                            </div>
                          </div>
                        </article>`;
                      })
                      .join('')
                  : `
                    <div class="empty-state-card">
                      <div class="empty-state-icon-wrap">${icon('bell-off', 26)}</div>
                      <h3 class="empty-state-title">No Notifications Yet</h3>
                      <p class="empty-state-desc">You are all caught up! When new announcements, renewal dates, or application updates are released, they will appear here.</p>
                      <div class="empty-state-cta-wrap">
                        <button type="button" class="primary-pill-btn" data-back-dashboard>
                          ${icon('arrow-left', 14)} <span>Back to Dashboard</span>
                        </button>
                      </div>
                    </div>
                  `
              }
            </div>

            <!-- Empty Search Results Placeholder -->
            <div id="notif-search-empty" class="empty-state-card" hidden>
              <div class="empty-state-icon-wrap warning">${icon('search-x', 26)}</div>
              <h3 class="empty-state-title">No Matching Notifications</h3>
              <p class="empty-state-desc">No notifications matched your search keywords or category filter.</p>
              <div class="empty-state-cta-wrap">
                <button type="button" class="secondary-pill-btn" data-reset-notif-filter>
                  ${icon('rotate-ccw', 14)} <span>Clear Filters &amp; Search</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
