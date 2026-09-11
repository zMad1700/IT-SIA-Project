// Announcements components styled in modern SaaS theme

import { icon, escapeHtml } from '../utils/dom.js';
import { postTime } from '../utils/formatters.js';
import { getCurrentUser } from '../services/auth.js';
import { getAnnouncements } from '../services/storage.js';

export const reactionIdentity = user => user?.id || user?.email;

export const announcementFeed = (student = false) => {
  const user = getCurrentUser();
  const posts = getAnnouncements().slice().reverse();
  if (!posts.length) return `<div class="empty-state-banner">${icon('megaphone', 18)} <span>No administrative announcements posted yet.</span></div>`;

  return posts
    .map(post => {
      const reactions = post.reactions || { like: [], heart: [] };
      const liked = reactions.like.includes(reactionIdentity(user));
      const hearted = reactions.heart.includes(reactionIdentity(user));
      return `<article class="announcement-item-modern ${student ? 'student-announcement' : 'admin-announcement'}">
        <div class="announcement-avatar-circle">
          ${icon('shield-alert', 16)}
        </div>
        <div class="announcement-body-wrap">
          <div class="announcement-author-row">
            <strong>Scholarship Administration</strong>
            <span class="announcement-time">${postTime(post.createdAt)}</span>
          </div>
          <p class="announcement-text-content">${escapeHtml(post.message)}</p>
          ${
            student
              ? `<div class="announcement-reactions-row">
                  <button class="reaction-pill-btn ${liked ? 'active-reaction' : ''}" data-react="like" data-post-id="${escapeHtml(post.id)}">
                    ${icon('thumbs-up', 14)}
                    <span>Like</span>
                    <b>${reactions.like.length}</b>
                  </button>
                  <button class="reaction-pill-btn heart-btn ${hearted ? 'active-reaction-heart' : ''}" data-react="heart" data-post-id="${escapeHtml(post.id)}">
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
    </div>
    <div class="composer-box-modern">
      <form id="announcement-form">
        <textarea id="announcement-message" class="pill-textarea" maxlength="1000" placeholder="Write an announcement for all students..." required></textarea>
        <div class="composer-action-bar">
          <small class="composer-hint">${icon('info', 13)} Instantly visible to all registered students.</small>
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
        <p class="card-subtitle">Recent advisories and circulars from the scholarship office.</p>
      </div>
      <span class="status-pill status-pill-info">${icon('megaphone', 13)} Admin Bulletins</span>
    </div>
    <div class="announcements-feed-container">${announcementFeed(true)}</div>
  </section>`;
