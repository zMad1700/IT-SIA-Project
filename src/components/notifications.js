// Notification Center dropdown and notification items markup
import { icon, escapeHtml } from '../utils/dom.js';
import { getUserNotifications, getUnreadNotificationsCount } from '../services/storage.js';

const formatTimeAgo = isoDate => {
  if (!isoDate) return 'Recently';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getNotifIconInfo = type => {
  switch (type) {
    case 'deadline':
      return { iconName: 'calendar-clock', colorClass: 'blue-icon' };
    case 'schedule':
      return { iconName: 'calendar-check', colorClass: 'cyan-icon' };
    case 'requirement':
      return { iconName: 'alert-triangle', colorClass: 'amber-icon' };
    case 'verified':
      return { iconName: 'check-circle-2', colorClass: 'emerald-icon' };
    case 'announcement':
    default:
      return { iconName: 'megaphone', colorClass: 'purple-icon' };
  }
};

export const notificationCenterMarkup = user => {
  const notifs = getUserNotifications(user);
  const unreadCount = getUnreadNotificationsCount(user);

  return `<div class="notifications-panel-card" id="notifications-panel" role="dialog" aria-label="Notifications Panel">
    <div class="notifs-header">
      <div class="notifs-header-title">
        <h3>Notifications &amp; Updates</h3>
        ${unreadCount > 0 ? `<span class="notifs-count-pill">${unreadCount} new</span>` : ''}
      </div>
      <div class="notifs-header-actions">
        ${
          unreadCount > 0
            ? `<button type="button" class="notifs-mark-read-btn" data-mark-all-read title="Mark all as read">
                ${icon('check-check', 14)} <span>Mark all read</span>
              </button>`
            : ''
        }
      </div>
    </div>

    <div class="notifs-scroll-area">
      ${
        notifs.length
          ? notifs
              .map(item => {
                const isRead = Array.isArray(item.readBy) && user?.email && item.readBy.includes(user.email);
                const { iconName, colorClass } = getNotifIconInfo(item.type);
                const isUrgent = item.priority === 'urgent' || item.priority === 'high';

                return `<article class="notif-item ${isRead ? 'read' : 'unread'} ${isUrgent ? 'urgent' : ''}" data-notif-id="${escapeHtml(item.id)}">
                  <div class="notif-icon-badge ${colorClass}">
                    ${icon(iconName, 16)}
                  </div>
                  <div class="notif-content-wrap">
                    <div class="notif-title-row">
                      <strong class="notif-title">${escapeHtml(item.title)}</strong>
                      ${!isRead ? '<span class="notif-unread-dot" title="Unread"></span>' : ''}
                    </div>
                    <p class="notif-message-text">${escapeHtml(item.message)}</p>
                    <div class="notif-meta-row">
                      <span class="notif-time-tag">${icon('clock', 12)} ${formatTimeAgo(item.createdAt)}</span>
                      ${item.targetSchool ? `<span class="notif-school-tag">${escapeHtml(item.targetSchool)}</span>` : ''}
                    </div>
                  </div>
                </article>`;
              })
              .join('')
          : `<div class="notifs-empty-state">
              <div class="empty-bell-icon">${icon('bell-off', 24)}</div>
              <p>No new notifications right now.</p>
              <small>Updates on renewal deadlines and appointment schedules will appear here.</small>
            </div>`
      }
    </div>

    <div class="notifs-footer">
      <small>${user?.role === 'admin' ? 'Broadcasting system active' : 'Live updates synchronized with scholarship office'}</small>
    </div>
  </div>`;
};
