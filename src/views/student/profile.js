// Modern Student Profile and Settings View

import { icon, userAvatar, escapeHtml } from '../../utils/dom.js';
import { getCurrentUser } from '../../services/auth.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const profilePage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const user = getCurrentUser() || {};
  const isLegacySocialAccount = Boolean(user.provider && !user.password);

  app.innerHTML = `<div class="portal">
    <div class="sidebar-backdrop"></div>
    ${sidebar(false, 'my-profile')}
    <div class="main">
      ${topbar(false, 'my-profile')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-page="overview">
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Account Settings</h1>
            <p class="hero-page-subtitle">Manage your personal profile, academic information, and security credentials.</p>
          </div>
        </section>

        <!-- Two Column Profile Settings Grid -->
        <div class="profile-settings-modern-grid">
          <!-- Profile Editor Card -->
          <section class="modern-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Personal Information</h2>
                <p class="card-subtitle">Public details associated with your student records.</p>
              </div>
            </div>
            <form id="profile-form" class="modern-editor-form">
              <div class="modern-avatar-editor">
                ${userAvatar(user, 'editable-avatar-modern')}
                <div class="avatar-upload-col">
                  <label class="upload-photo-pill" for="profile-photo">
                    ${icon('camera', 15)}
                    <span>Change Picture</span>
                  </label>
                  <input id="profile-photo" type="file" accept="image/*">
                  <small>JPG, PNG, or WebP. Stored locally on this device.</small>
                </div>
              </div>

              <div class="modern-field">
                <label>Full Legal Name</label>
                <input id="profile-name" class="pill-input" value="${escapeHtml(user.name)}" required>
              </div>

              <div class="two-fields">
                <div class="modern-field">
                  <label>Mobile Number</label>
                  <input id="profile-phone" class="pill-input" type="tel" value="${escapeHtml(user.phone)}" placeholder="09XX XXX XXXX">
                </div>
                <div class="modern-field">
                  <label>Email Address</label>
                  <input class="pill-input disabled-input" value="${escapeHtml(user.email)}" disabled>
                </div>
              </div>

              <div class="modern-field">
                <label>Academic Bio &amp; Goals</label>
                <textarea id="profile-bio" class="pill-textarea" maxlength="300" placeholder="A brief summary of your academic objectives and background...">${escapeHtml(user.bio)}</textarea>
              </div>

              <div class="form-submit-row">
                <button class="primary-pill-btn" type="submit">
                  ${icon('save', 15)}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </section>

          <!-- Security Card -->
          <section class="modern-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Security &amp; Password</h2>
                <p class="card-subtitle">${isLegacySocialAccount ? 'Migrate your account to a local password.' : 'Ensure your account has a strong password.'}</p>
              </div>
            </div>
            <form id="password-form" class="modern-editor-form">
              ${isLegacySocialAccount ? '' : `
                <div class="modern-field">
                  <label>Current Password</label>
                  <input id="current-password" class="pill-input" type="password" required>
                </div>
              `}
              <div class="modern-field">
                <label>New Password</label>
                <input id="new-password" class="pill-input" type="password" minlength="6" required>
              </div>
              <div class="modern-field">
                <label>Confirm New Password</label>
                <input id="confirm-password" class="pill-input" type="password" minlength="6" required>
              </div>
              <div class="form-submit-row">
                <button class="secondary-pill-btn" type="submit">
                  ${icon('key-round', 15)}
                  <span>${isLegacySocialAccount ? 'Set Password' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  </div>`;

  refresh();
};
