// Modern Student Scholarships Explorer View

import { icon, escapeHtml } from '../../utils/dom.js';
import { formatSchedule, postTime } from '../../utils/formatters.js';
import { scholarships } from '../../config/constants.js';
import { getCurrentUser } from '../../services/auth.js';
import { getScholarshipCatalog, getApplicationsCache } from '../../services/storage.js';
import { sidebar, topbar } from '../../components/layout.js';
import { refresh } from '../../events.js';

export const scholarshipsPage = () => {
  const app = document.querySelector('#app');
  if (!app) return;

  const user = getCurrentUser();
  const catalog = getScholarshipCatalog();
  const programs = catalog.length
    ? catalog
    : scholarships.map((item, index) => ({
        id: `demo-${index}`,
        title: item[0],
        category: item[1],
        deadline: item[2],
        amount: Number(String(item[3]).replace(/[^0-9.]/g, '')),
        status: 'Open'
      }));

  const applications = getApplicationsCache().filter(
    application => (user?.id && String(application.student_id) === String(user.id)) || application.student_id === user?.email
  );

  const categories = Array.from(
    new Set(programs.map(p => p.category).filter(Boolean))
  );

  app.innerHTML = `<div class="portal">
    <div class="sidebar-backdrop"></div>
    ${sidebar(false, 'scholarships')}
    <div class="main">
      ${topbar(false, 'scholarships')}
      <main class="content">
        <!-- Hero Header -->
        <section class="dashboard-hero-header">
          <div class="hero-header-text">
            <button class="pill-back-btn" data-back-dashboard data-page="overview">
              ${icon('arrow-left', 14)} <span>Back to dashboard</span>
            </button>
            <h1 class="hero-page-title">Explore Scholarships</h1>
            <p class="hero-page-subtitle">Find and apply for financial grants tailored to your educational goals.</p>
          </div>
        </section>

        <!-- My Applications Tracking Hub -->
        ${
          applications.length
            ? `<section class="modern-card my-applications-hub">
                <div class="card-header">
                  <div>
                    <h2 class="card-title">My Applications Tracker</h2>
                    <p class="card-subtitle">Real-time status and review feedback on your submitted grant applications.</p>
                  </div>
                  <span class="status-pill status-pill-info">
                    ${icon('clipboard-check', 14)}
                    <span>${applications.length} Active Application${applications.length === 1 ? '' : 's'}</span>
                  </span>
                </div>
                <div class="my-applications-grid">
                  ${applications
                    .map(appItem => {
                      const program = programs.find(p => String(p.id) === String(appItem.scholarship_id));
                      const status = appItem.status || 'Submitted';
                      const statusClass =
                        status === 'Approved'
                          ? 'status-pill-done'
                          : status === 'Rejected'
                            ? 'status-pill-danger'
                            : status === 'Under review'
                              ? 'status-pill-info'
                              : 'status-pill-pending';

                      return `<article class="application-tracking-card">
                        <div class="app-tracking-header">
                          <div>
                            <span class="category-pill-tag">${escapeHtml(program?.category || 'Scholarship Grant')}</span>
                            <h3 class="app-tracking-title">${escapeHtml(program?.title || 'Scholarship Program')}</h3>
                          </div>
                          <span class="status-pill ${statusClass}">
                            ${icon(status === 'Approved' ? 'check-circle' : status === 'Rejected' ? 'alert-circle' : 'clock-3', 13)}
                            <span>${escapeHtml(status)}</span>
                          </span>
                        </div>

                        <div class="app-tracking-meta-grid">
                          <div class="app-meta-col">
                            <small>Submitted On</small>
                            <strong>${appItem.submitted_at ? postTime(appItem.submitted_at) : 'Recently'}</strong>
                          </div>
                          <div class="app-meta-col">
                            <small>Declared GWA</small>
                            <strong>${escapeHtml(appItem.gwa || '1.25')}</strong>
                          </div>
                          <div class="app-meta-col">
                            <small>Income Bracket</small>
                            <strong>${escapeHtml(appItem.household_income || 'Recorded')}</strong>
                          </div>
                        </div>

                        ${
                          appItem.statement
                            ? `<p class="app-tracking-statement">"${escapeHtml(appItem.statement)}"</p>`
                            : ''
                        }

                        ${
                          appItem.reviewer_notes
                            ? `<div class="reviewer-feedback-box">
                                <strong>${icon('message-square', 14)} Reviewer Feedback:</strong>
                                <p>${escapeHtml(appItem.reviewer_notes)}</p>
                              </div>`
                            : ''
                        }
                      </article>`;
                    })
                    .join('')}
                </div>
              </section>`
            : ''
        }

        <!-- Catalog Toolbar: Search & Category Pills -->
        <section class="scholarship-catalog-toolbar">
          <div class="table-search-pill scholarship-search-pill">
            ${icon('search', 16)}
            <input id="scholarship-search-input" type="search" placeholder="Search by scholarship title, category, or description..." aria-label="Search scholarships">
          </div>
          <div class="category-filter-pills" role="group" aria-label="Filter programs by category">
            <button type="button" class="category-filter-pill active" data-category-filter="all">All Programs</button>
            ${categories
              .map(
                cat =>
                  `<button type="button" class="category-filter-pill" data-category-filter="${escapeHtml(cat.toLowerCase())}">${escapeHtml(cat)}</button>`
              )
              .join('')}
          </div>
        </section>

        <!-- Scholarship Cards Grid -->
        <section class="scholarship-cards-grid" id="scholarship-cards-container">
          ${
            programs.length
              ? programs
                  .map(program => {
                    const application = applications.find(
                      item => String(item.scholarship_id) === String(program.id)
                    );
                    const closed = program.status && program.status !== 'Open';
                    const programCategory = (program.category || 'Scholarship').toLowerCase();
                    const programTitle = program.title.toLowerCase();
                    const programDesc = (program.description || '').toLowerCase();

                    return `<article class="modern-card scholarship-grant-card"
                      data-scholarship-id="${escapeHtml(program.id)}"
                      data-category="${escapeHtml(programCategory)}"
                      data-search="${escapeHtml(`${programTitle} ${programCategory} ${programDesc}`)}">
                      <div class="grant-card-top">
                        <span class="category-pill-tag">${escapeHtml(program.category || 'Scholarship')}</span>
                        <div class="grant-status-indicator ${closed ? 'closed' : 'open'}">
                          <span class="pulse-dot"></span>
                          <span>${closed ? 'Closed' : 'Accepting Applications'}</span>
                        </div>
                      </div>

                      <h2 class="grant-title">${escapeHtml(program.title)}</h2>
                      <p class="grant-description">${escapeHtml(program.description || 'Verified financial support program for qualified university and college scholars.')}</p>

                      <div class="grant-meta-row">
                        <div class="grant-meta-item">
                          <span class="meta-label">Grant Value</span>
                          <strong class="meta-value">${program.amount ? `₱${Number(program.amount).toLocaleString()}` : 'Variable Grant'}</strong>
                        </div>
                        <div class="grant-meta-item">
                          <span class="meta-label">Submission Deadline</span>
                          <span class="meta-value-deadline">${program.deadline ? escapeHtml(formatSchedule(program.deadline)) : 'Rolling'}</span>
                        </div>
                      </div>

                      <div class="grant-card-actions">
                        ${
                          application
                            ? `<span class="status-pill ${application.status === 'Approved' ? 'status-pill-done' : application.status === 'Rejected' ? 'status-pill-danger' : 'status-pill-info'} full-width-pill">
                                ${icon(application.status === 'Approved' ? 'check-circle' : 'clock-3', 14)}
                                <span>Application: ${escapeHtml(application.status)}</span>
                              </span>`
                            : `<button class="primary-pill-btn full-width-btn" data-apply-scholarship="${escapeHtml(program.id)}" ${closed ? 'disabled' : ''}>
                                ${icon('send', 15)}
                                <span>${closed ? 'Applications Closed' : 'Apply for Scholarship'}</span>
                              </button>`
                        }
                      </div>
                    </article>`;
                  })
                  .join('')
              : `
                <div class="empty-state-card" style="grid-column: 1 / -1;">
                  <div class="empty-state-icon-wrap">${icon('book-open', 26)}</div>
                  <h3 class="empty-state-title">No Scholarship Programs Available</h3>
                  <p class="empty-state-desc">There are no open scholarship programs at this time. Please check back soon or consult the scholarship office.</p>
                  <div class="empty-state-cta-wrap">
                    <button type="button" class="primary-pill-btn" data-page="help-center">
                      ${icon('help-circle', 14)} <span>Contact Scholarship Office</span>
                    </button>
                  </div>
                </div>
              `
          }
        </section>
        <div id="scholarship-filter-empty" class="empty-state-card" hidden>
          <div class="empty-state-icon-wrap warning">${icon('search-x', 26)}</div>
          <h3 class="empty-state-title">No Scholarships Match Filter</h3>
          <p class="empty-state-desc">No scholarship programs match your search or selected category filter.</p>
          <div class="empty-state-cta-wrap">
            <button type="button" class="secondary-pill-btn" data-reset-student-scholarships>
              ${icon('rotate-ccw', 14)} <span>Reset Search &amp; Filters</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>`;

  refresh();
};
