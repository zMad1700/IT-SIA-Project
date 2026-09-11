// Announcements components styled in modern SaaS theme

import { icon, escapeHtml } from '../utils/dom.js';
import { postTime } from '../utils/formatters.js';
import { getCurrentUser } from '../services/auth.js';
import { getAnnouncements } from '../services/storage.js';

export const reactionIdentity = user => user?.id || user?.email;

export const announcementFeed = (student = false) => {
  const user = getCurrentUser();
  const allPosts = getAnnouncements();
  const posts = allPosts
    .filter(post => {
      if (!student || !post.targetSchool) return true;
      return !user?.school || post.targetSchool === user.school;
    })
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
        new Date(b.createdAt) - new Date(a.createdAt)
    );

  if (!posts.length) {
    return `<div class="empty-state-card" style="padding:32px 16px;">
      <div class="empty-state-icon-wrap" style="width:44px;height:44px;">${icon('megaphone', 20)}</div>
      <h4 class="empty-state-title" style="font-size:14.5px;">No Campus Announcements</h4>
      <p class="empty-state-desc" style="font-size:12.5px;margin-bottom:0;">There are currently no active administrative notices or schedule bulletins posted.</p>
    </div>`;
  }

  return posts
    .map(post => {
      const reactions = post.reactions || { like: [], heart: [] };
      const liked = reactions.like.includes(reactionIdentity(user));
      const hearted = reactions.heart.includes(reactionIdentity(user));
      const category = post.category || 'General Advisory';
      return `<article class="announcement-item-modern ${student ? 'student-announcement' : 'admin-announcement'} ${post.pinned ? 'is-pinned' : ''}" data-announcement-id="${escapeHtml(post.id)}">
        <div class="announcement-avatar-circle ${post.pinned ? 'pinned-avatar' : ''}">
          ${icon(post.pinned ? 'pin' : 'shield-alert', 16)}
        </div>
        <div class="announcement-body-wrap">
          <div class="announcement-tags-row">
            ${post.pinned ? `<span class="pinned-notice-badge">${icon('pin', 11)} PINNED ADVISORY</span>` : ''}
            <span class="announcement-category-tag">${escapeHtml(category)}</span>
            ${post.targetSchool ? `<span class="announcement-campus-tag">${icon('building', 11)} ${escapeHtml(post.targetSchool)}</span>` : '<span class="announcement-broadcast-tag">All Campuses</span>'}
          </div>
          <div class="announcement-author-row">
            <strong>Scholarship Administration</strong>
            <span class="announcement-time">${postTime(post.createdAt)}</span>
          </div>
          <p class="announcement-text-content">${escapeHtml(post.message)}</p>
          ${
            !student
              ? `<div class="announcement-admin-actions">
                  <button type="button" class="announcement-action-btn" data-edit-announcement="${escapeHtml(post.id)}">${icon('edit-2', 12)} Edit</button>
                  <button type="button" class="announcement-action-btn" data-pin-announcement="${escapeHtml(post.id)}">${icon('pin', 12)} ${post.pinned ? 'Unpin' : 'Pin'}</button>
                  <button type="button" class="announcement-action-btn danger" data-delete-announcement="${escapeHtml(post.id)}">${icon('trash-2', 12)} Delete</button>
                </div>`
              : ''
          }
          ${
            student
              ? `<div class="announcement-reactions-row">
                  <button class="reaction-pill-btn ${liked ? 'active-reaction' : ''}" data-react="like" data-post-id="${escapeHtml(post.id)}" title="Like this advisory">
                    ${icon('thumbs-up', 14)}
                    <span>Like</span>
                    <b>${reactions.like.length}</b>
                  </button>
                  <button class="reaction-pill-btn heart-btn ${hearted ? 'active-reaction-heart' : ''}" data-react="heart" data-post-id="${escapeHtml(post.id)}" title="Heart this advisory">
                    ${icon('heart', 14)}
                    <span>Heart</span>
                    <b>${reactions.heart.length}</b>
                  </button>
                </div>`
              : ''
          }
        </div>
      </article>`;
    })
    .join('');
};

export const adminUpdatesMarkup = () =>
  `<section class="modern-card announcements-card-modern" id="admin-updates">
    <div class="card-header">
      <div>
        <h2 class="card-title">Campus Announcements</h2>
        <p class="card-subtitle">Broadcast critical deadlines, grant notices, and updates to all enrolled students.</p>
      </div>
      <span class="status-pill status-pill-info">${icon('radio', 13)} Broadcast Center</span>
    </div>
    <div class="composer-box-modern">
      <form id="announcement-form">
        <div class="composer-meta-controls">
          <div class="composer-select-group">
            <label for="announcement-category">Category</label>
            <select id="announcement-category" class="pill-select compact-select">
              <option value="General Advisory">General Advisory</option>
              <option value="Urgent Notice">Urgent Notice</option>
              <option value="Renewal Deadline">Renewal Deadline</option>
              <option value="Disbursement Notice">Disbursement Notice</option>
              <option value="Document Verification">Document Verification</option>
            </select>
          </div>
          <div class="composer-select-group">
            <label for="announcement-target-school">Target Campus</label>
            <select id="announcement-target-school" class="pill-select compact-select">
              <option value="">All Campuses (Global Broadcast)</option>
              <option value="Cor Jesu College">Cor Jesu College</option>
              <option value="UM Digos College">UM Digos College</option>
              <option value="Davao del Sur State College">Davao del Sur State College</option>
              <option value="Holy Cross of Davao College">Holy Cross of Davao College</option>
              <option value="University of Southeastern Philippines">University of Southeastern Philippines</option>
            </select>
          </div>
          <label class="composer-checkbox-label">
            <input type="checkbox" id="announcement-pinned" />
            <span>Pin notice to top</span>
          </label>
        </div>
        <textarea id="announcement-message" class="pill-textarea" maxlength="1000" placeholder="Write an announcement for all students..." required></textarea>
        <div class="composer-action-bar">
          <small class="composer-hint">${icon('info', 13)} Instantly visible in matching students' feeds and notifications.</small>
          <button class="primary-pill-btn" type="submit">
            ${icon('send', 15)}
            <span>Publish Notice</span>
          </button>
        </div>
      </form>
    </div>
    <div class="announcements-feed-container">${announcementFeed()}</div>
  </section>`;

export const studentUpdatesMarkup = () =>
  `<section class="modern-card student-announcements-card" id="student-updates">
    <div class="card-header">
      <div>
        <h2 class="card-title">Official Announcements</h2>
        <p class="card-subtitle">Recent advisories, circulars, and updates from the scholarship office.</p>
      </div>
      <span class="status-pill status-pill-info">${icon('megaphone', 13)} Official Bulletins</span>
    </div>
    <div class="announcements-feed-container">${announcementFeed(true)}</div>
  </section>`;
