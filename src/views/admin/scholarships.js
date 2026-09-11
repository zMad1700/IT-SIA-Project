// Modern Admin Scholarships Management View

import { icon, escapeHtml } from '../../utils/dom.js';
import { formatSchedule } from '../../utils/formatters.js';
import { getScholarshipCatalog } from '../../services/storage.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const adminScholarshipsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const scholarshipCatalog = getScholarshipCatalog();

  app.innerHTML = `<div class="portal admin">
    <div class="sidebar-backdrop"></div>
    ${sidebar(true, 'scholarships')}
    <div class="main">
      ${topbar(true, 'scholarships')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard>
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Scholarship Programs</h1>
            <p class="hero-page-subtitle">Publish grant opportunities and track student enrollment.</p>
          </div>
        </section>

        <!-- Create Form Card -->
        <section class="modern-card profile-editor-card">
          <div class="card-header">
            <div>
              <h2 class="card-title">Create Scholarship Program</h2>
              <p class="card-subtitle">Fill in the grant criteria, budget, and application deadline.</p>
            </div>
          </div>
          <form id="scholarship-form" class="modern-editor-form">
            <div class="two-fields">
              <div class="modern-field">
                <label>Program Title</label>
                <input id="scholarship-title" class="pill-input" placeholder="e.g. Academic Excellence Grant" required>
              </div>
              <div class="modern-field">
                <label>Category</label>
                <input id="scholarship-category" class="pill-input" placeholder="e.g. Merit-based, STEM, Leadership">
              </div>
            </div>
            <div class="modern-field">
              <label>Description &amp; Eligibility</label>
              <textarea id="scholarship-description" class="pill-textarea" maxlength="1000" placeholder="Provide details regarding qualifications, coverage, and requirements..."></textarea>
            </div>
            <div class="two-fields">
              <div class="modern-field">
                <label>Grant Amount (PHP)</label>
                <input id="scholarship-amount" class="pill-input" type="number" min="0" step="0.01" placeholder="₱0.00">
              </div>
              <div class="modern-field">
                <label>Application Deadline</label>
                <input id="scholarship-deadline" class="pill-input" type="datetime-local">
              </div>
            </div>
            <div class="form-submit-row">
              <button class="primary-pill-btn" type="submit">
                ${icon('plus', 16)}
                <span>Publish Program</span>
              </button>
            </div>
          </form>
        </section>

        <!-- Existing Programs Card -->
        <section class="modern-card table-section-card">
          <div class="card-header table-control-bar">
            <div>
              <h2 class="card-title">Active Program Catalog</h2>
              <p class="card-subtitle">${scholarshipCatalog.length} published scholarship programs.</p>
            </div>
          </div>

          <div class="modern-data-table-wrap">
            <div class="table-head-row catalog-table-head">
              <span>PROGRAM TITLE</span>
              <span>CATEGORY</span>
              <span>DEADLINE</span>
              <span>STATUS</span>
            </div>
            <div class="table-body-rows">
              ${
                scholarshipCatalog.length
                  ? scholarshipCatalog
                      .map(
                        item => `<div class="table-data-row catalog-table-row">
                          <div class="program-title-cell">
                            <div class="program-icon-badge">${icon('award', 16)}</div>
                            <strong>${escapeHtml(item.title)}</strong>
                          </div>
                          <span class="category-pill-tag">${escapeHtml(item.category || 'General')}</span>
                          <small class="date-cell">${item.deadline ? escapeHtml(formatSchedule(item.deadline)) : 'Open Admission'}</small>
                          <div>
                            <span class="status-pill ${item.status === 'Open' ? 'status-pill-done' : 'status-pill-warning'}">
                              ${escapeHtml(item.status || 'Open')}
                            </span>
                          </div>
                        </div>`
                      )
                      .join('')
                  : `<div class="empty-state-banner">${icon('book-open', 20)} <span>No scholarship programs published yet.</span></div>`
              }
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>`;

  refresh();
};
