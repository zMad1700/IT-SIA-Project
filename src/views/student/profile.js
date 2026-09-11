// Modern Student Profile and Settings View with Academic Credentials and Demographic Management

import { icon, userAvatar, escapeHtml } from '../../utils/dom.js';
import { getCurrentUser } from '../../services/auth.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const profilePage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const user = getCurrentUser() || {};
  const isLegacySocialAccount = Boolean(user.provider && !user.password);
  const currentYear = user.yearLevel || user.year || '1st Year';
  const requirementsStatus = user.requirementsStatus || 'Complete';
  const scholarStatus = user.scholarStatus || 'Active';

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
            <h1 class="hero-page-title">Account &amp; Academic Settings</h1>
            <p class="hero-page-subtitle">View official scholarship records, manage residential contact details, and update security credentials.</p>
          </div>
        </section>

        <!-- Official Academic Credentials Card -->
        <section class="modern-card academic-records-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="header-icon-pill primary">${icon('graduation-cap', 18)}</div>
              <div>
                <h2 class="card-title">Official Academic Records</h2>
                <p class="card-subtitle">Verified institutional credentials recorded by the scholarship coordinator office.</p>
              </div>
            </div>
            <div class="card-header-actions">
              <button class="primary-pill-btn" type="button" data-request-academic-update>
                ${icon('file-pen-line', 15)}
                <span>Request Year Advancement / Program Update</span>
              </button>
            </div>
          </div>

          <div class="academic-credentials-grid">
            <div class="academic-credential-cell">
              <small class="credential-label">${icon('building-2', 13)} Partner University / College</small>
              <strong class="credential-value">${escapeHtml(user.school || 'Not assigned')}</strong>
            </div>

            <div class="academic-credential-cell">
              <small class="credential-label">${icon('book-open', 13)} Enrolled Degree Program</small>
              <strong class="credential-value">${escapeHtml(user.course || 'Not specified')}</strong>
            </div>

            <div class="academic-credential-cell">
              <small class="credential-label">${icon('calendar-days', 13)} Enrolled Year Level</small>
              <strong class="credential-value highlight-year">${escapeHtml(currentYear)}</strong>
            </div>

            <div class="academic-credential-cell">
              <small class="credential-label">${icon('award', 13)} Scholar Classification</small>
              <strong class="credential-value">${escapeHtml(user.scholarType || 'Active Scholar')}</strong>
            </div>

            <div class="academic-credential-cell">
              <small class="credential-label">${icon('shield-check', 13)} Roster Status</small>
              <span class="status-pill ${scholarStatus === 'Active' ? 'status-pill-done' : 'status-pill-pending'}">
                ${escapeHtml(scholarStatus)}
              </span>
            </div>

            <div class="academic-credential-cell">
              <small class="credential-label">${icon('file-check-2', 13)} Requirements Status</small>
              <span class="status-pill ${requirementsStatus === 'Complete' ? 'status-pill-done' : 'status-pill-warning'}">
                ${requirementsStatus === 'Complete' ? `${icon('check', 12)} Complete` : `${icon('clock', 12)} Lacking`}
              </span>
            </div>
          </div>
        </section>

        <!-- Two Column Profile Settings Grid -->
        <div class="profile-settings-modern-grid">
          <!-- Profile Editor Card -->
          <section class="modern-card">
            <div class="card-header">
              <div>
                <h2 class="card-title">Personal &amp; Residential Information</h2>
                <p class="card-subtitle">Update your profile, contact details, and registered home address.</p>
              </div>
            </div>

            <div id="profile-feedback"></div>

            <form id="profile-form" class="modern-editor-form">
              <!-- Avatar Section -->
              <div class="modern-avatar-editor">
                <div class="profile-avatar-wrapper">
                  ${userAvatar(user, 'editable-avatar-modern')}
                </div>
                <div class="avatar-upload-col">
                  <label class="upload-photo-pill" for="profile-photo">
                    ${icon('camera', 15)}
                    <span>Change Picture</span>
                  </label>
                  <input id="profile-photo" type="file" accept="image/*" hidden>
                  <small>JPG, PNG, or WebP. Automatically optimized for fast loading.</small>
                </div>
              </div>

              <div class="profile-form-section-title">
                ${icon('user', 14)} <span>Basic Information</span>
              </div>

              <div class="modern-field">
                <label for="profile-name">Full Legal Name</label>
                <input id="profile-name" class="pill-input" value="${escapeHtml(user.name)}" required>
              </div>

              <div class="two-fields">
                <div class="modern-field">
                  <label for="profile-phone">Mobile Contact Number</label>
                  <input id="profile-phone" class="pill-input" type="tel" value="${escapeHtml(user.phone)}" placeholder="09XX XXX XXXX">
                </div>
                <div class="modern-field">
                  <label>Email Address</label>
                  <input class="pill-input disabled-input" value="${escapeHtml(user.email)}" disabled title="Email is your primary login ID and cannot be changed">
                </div>
              </div>

              <div class="two-fields">
                <div class="modern-field">
                  <label for="profile-sex">Sex</label>
                  <div class="select-pill-wrapper">
                    <select id="profile-sex" class="pill-select">
                      <option value="" disabled ${!user.sex ? 'selected' : ''}>Select sex...</option>
                      <option value="Male" ${user.sex === 'Male' ? 'selected' : ''}>Male</option>
                      <option value="Female" ${user.sex === 'Female' ? 'selected' : ''}>Female</option>
                    </select>
                  </div>
                </div>
                <div class="modern-field">
                  <label for="profile-birthdate">Birth Date</label>
                  <input id="profile-birthdate" class="pill-input" type="date" value="${escapeHtml(user.birthDate || '')}">
                </div>
              </div>

              <div class="profile-form-section-title">
                ${icon('map-pin', 14)} <span>Residential Address</span>
              </div>

              <div class="two-fields">
                <div class="modern-field">
                  <label for="profile-purok">Purok / Street</label>
                  <input id="profile-purok" class="pill-input" value="${escapeHtml(user.purok || '')}" placeholder="e.g. Purok 3">
                </div>
                <div class="modern-field">
                  <label for="profile-barangay">Barangay</label>
                  <input id="profile-barangay" class="pill-input" value="${escapeHtml(user.barangay || '')}" placeholder="e.g. Zone 1">
                </div>
              </div>

              <div class="modern-field">
                <label for="profile-municipality">City / Municipality</label>
                <input id="profile-municipality" class="pill-input" value="${escapeHtml(user.municipality || '')}" placeholder="e.g. Digos City">
              </div>

              <div class="profile-form-section-title">
                ${icon('sparkles', 14)} <span>About You</span>
              </div>

              <div class="modern-field">
                <label for="profile-bio">Academic Bio &amp; Goals</label>
                <textarea id="profile-bio" class="pill-textarea" maxlength="300" placeholder="A brief summary of your academic objectives and background...">${escapeHtml(user.bio || '')}</textarea>
              </div>

              <div class="form-submit-row">
                <button class="primary-pill-btn" type="submit">
                  ${icon('save', 15)}
                  <span>Save Profile Changes</span>
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
                  <label for="current-password">Current Password</label>
                  <input id="current-password" class="pill-input" type="password" required>
                </div>
              `}
              <div class="modern-field">
                <label for="new-password">New Password</label>
                <div class="input-with-icon password-wrap">
                  <input id="new-password" class="pill-input" type="password" minlength="6" required>
                  <button type="button" class="show-pass modern-show-pass" aria-label="Show password">${icon('eye', 16)}</button>
                </div>
                <div class="password-strength-container" id="profile-password-strength" hidden>
                  <div class="strength-bar-track">
                    <div class="strength-bar-fill" id="profile-strength-fill"></div>
                  </div>
                  <div class="strength-label-row">
                    <span class="strength-label-text">Strength:</span>
                    <span class="strength-score-text" id="profile-strength-score">Weak</span>
                  </div>
                </div>
              </div>
              <div class="modern-field">
                <label for="confirm-password">Confirm New Password</label>
                <div class="input-with-icon password-wrap">
                  <input id="confirm-password" class="pill-input" type="password" minlength="6" required>
                  <button type="button" class="show-pass modern-show-pass" aria-label="Show password">${icon('eye', 16)}</button>
                </div>
                <div class="password-match-hint" id="profile-match-hint"></div>
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
